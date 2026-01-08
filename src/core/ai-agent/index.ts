/**
 * AI-Agent模块 - 重构版本
 * 提供功能性Agent和高级Agent作为对外API
 */

// 基础类型和接口
export type { Task, ActionResult, AgentState, MemoryItem } from './base/types';

// 功能性Agent
export { 
  FunctionalAgent, 
  createFunctionalAgent,
  type FunctionalAgentConfig 
} from './base/functional-agent';

// 高级Agent
export { 
  AdvancedAgent, 
  createAdvancedAgent,
  type AdvancedAgentConfig 
} from './base/advanced-agent';

// 模型系统
export {
  ModelFactory,
  ModelConfigManager,
  type ModelInterface,
  type BaseModelConfig as ModelConfig,
  type FunctionalModelConfig,
  type AdvancedModelConfig
} from './base/model-factory';

// 会话系统（模板系统和会话系统协作）
export {
  ChatSession,
  TemplateSession,
  MCPSession,
  createChatSession,
  createTemplateSession,
  createMCPSession,
  createSimpleWorkflow,
  loadWorkflowFromJSON,
  createMCPTool,
  createTemplateWorkflow
} from './session/index';

export type {
  WorkflowTemplate,
  SessionStep,
  StepResult,
  MCPToolDefinition
} from './session/index';

// 记忆系统
export { SimpleMemory } from './memory/simple-memory';

/**
 * 快速创建功能性Agent（推荐用于简单对话）
 * 本质：对话生成器，无Token生态
 */
export function createFunctionalQuickAgent(
  name: string,
  options?: {
    role?: string;
    personality?: string;
    capabilities?: string[];
    systemPrompt?: string;
  }
) {
  const { FunctionalAgent } = require('./base/functional-agent');
  return new FunctionalAgent({
    id: `func-${Date.now()}`,
    name,
    role: options?.role || '助手',
    personality: options?.personality || '友好',
    capabilities: options?.capabilities || ['对话'],
    systemPrompt: options?.systemPrompt
  });
}

/**
 * 快速创建高级Agent（推荐用于复杂任务和工具调用）
 * 本质：拥有完整Token生态，对外仅暴露对话接口
 * Token生态管理由外部组件完成
 */
export function createAdvancedQuickAgent(
  name: string,
  options?: {
    role?: string;
    personality?: string;
    capabilities?: string[];
    token?: string;
    tokenKey?: string;
  }
) {
  const { AdvancedAgent } = require('./base/advanced-agent');
  return new AdvancedAgent({
    id: `adv-${Date.now()}`,
    name,
    role: options?.role || '专家助手',
    personality: options?.personality || '专业',
    capabilities: options?.capabilities || ['复杂推理', '工具调用'],
    token: options?.token,
    tokenKey: options?.tokenKey
  });
}

/**
 * 快速创建模板对话（推荐用于固定流程）
 * 与会话系统协作，提供状态获取和中断能力
 * 不提供流程编程控制API
 */
export function createQuickTemplate(
  name: string,
  steps: Array<{ name: string; prompt: string; variables?: Record<string, any> }>,
  initialVariables?: Record<string, any>
) {
  const { createTemplateWorkflow } = require('./session/index');
  return createTemplateWorkflow(
    `temp-${Date.now()}`,
    steps,
    initialVariables
  );
}

/**
 * 配置管理器（用于环境配置）
 */
export const configManager = {
  /**
   * 从环境变量加载模型配置
   */
  loadModelsFromEnv(): void {
    const { ModelConfigManager } = require('./base/model-factory');
    const modelManager = ModelConfigManager.getInstance();
    modelManager.loadFromEnv();
    console.log('[Config] 模型配置已从环境变量加载');
  },
  
  /**
   * 获取可用模型列表
   */
  getAvailableModels() {
    const { ModelConfigManager } = require('./base/model-factory');
    const modelManager = ModelConfigManager.getInstance();
    return {
      functional: modelManager.getAllFunctionalModels(),
      advanced: modelManager.getAllAdvancedModels()
    };
  }
};

/**
 * 使用示例和说明
 */
export const examples = {
  /**
   * 示例1：功能性Agent - 简单对话
   */
  functionalAgent: async () => {
    const agent = createFunctionalQuickAgent('小助手');
    
    // 单次任务
    const result1 = await agent.execute({ id: 'task-1', input: '你好' });
    console.log('单次任务:', result1.output);
    
    // 连续对话
    await agent.startChat();
    const response = await agent.sendMessage('今天天气如何？');
    console.log('连续对话:', response);
    await agent.stopChat();
  },

  /**
   * 示例2：高级Agent - Token生态（由外部管理）
   */
  advancedAgent: async () => {
    // Token生态管理由外部组件完成
    // 这里只提供Token，工具可见性由Token决定
    const agent = createAdvancedQuickAgent('专家', {
      role: '工具专家',
      token: process.env.MCP_TOKEN || 'your-token'
    });
    
    // 单次任务（支持工具调用）
    const result = await agent.execute({
      id: 'task-1',
      input: '计算 100 + 200'
    });
    console.log('工具调用结果:', result.output);
    
    // 连续对话
    await agent.startChat();
    const response = await agent.sendMessage('@calculate(expression=100+200)');
    console.log('连续对话:', response);
    await agent.stopChat();
  },

  /**
   * 示例3：模板对话 - 状态获取和中断
   */
  templateFlow: async () => {
    const session = createQuickTemplate('数据分析', [
      { name: '读取数据', prompt: '读取文件: {{filename}}' },
      { name: '分析趋势', prompt: '分析数据: {{data}}' },
      { name: '生成报告', prompt: '生成总结' }
    ], { filename: 'sales.csv' });
    
    // 获取状态（只能获取状态，不能控制流程）
    console.log('初始状态:', session.getStatus());
    
    // 开始执行
    await session.start();
    
    // 获取结果
    const results = session.getResults();
    console.log('执行结果:', results.output);
    console.log('步骤详情:', results.stepResults);
    
    // 可以获取工作流信息
    const info = session.getWorkflowInfo();
    console.log('工作流信息:', info);
  },

  /**
   * 示例4：Token生态外部管理
   */
  tokenEcosystem: async () => {
    // 外部组件负责Token生态管理
    // 例如：工具清单、可见性、约束等
    
    const tokenManager = {
      // 获取Token
      getToken: () => process.env.MCP_TOKEN,
      
      // 获取工具清单（由Token决定）
      getTools: (token: string) => {
        // 外部逻辑：根据Token返回可见的工具列表
        return [
          { name: 'calculate', description: '计算器' },
          { name: 'search', description: '搜索工具' }
        ];
      },
      
      // 应用约束
      applyConstraints: (agent: any) => {
        // 外部逻辑：根据策略约束Agent行为
        console.log('应用约束策略');
      }
    };
    
    const token = tokenManager.getToken();
    const agent = createAdvancedQuickAgent('受控专家', { token });
    
    // 外部管理工具可见性
    const visibleTools = tokenManager.getTools(token!);
    console.log('可见工具:', visibleTools);
    
    // 应用外部约束
    tokenManager.applyConstraints(agent);
  }
};
