/**
 * AI-Agent系统 - 主入口
 */

// 集成Agent（推荐使用）
import {
  IntegratedAgent,
  FunctionalIntegratedAgent,
  AdvancedIntegratedAgent,
  createIntegratedAgent
} from './base/integrated-agent';

// 模型系统
import { ModelFactory, ModelConfigManager } from './base/model-factory';
import { ProviderConfigManager } from './base/provider-config-manager';
import { RealModel } from './base/real-model';

// 记忆系统
import { SimpleMemory } from './memory/simple-memory';

// 提示词工程（集成）
import {
  PromptManager,
  SystemPromptFactory,
  AppendPromptFactory,
  PromptComposition,
  SimplePrompt,
  AgentPromptEngine,
  createPromptManager
} from './prompt-engine/index';

// 会话系统
import {
  BaseSession,
  TemplateSession,
  ChatSession,
  MCPSession,
  createTemplateSession,
  createChatSession,
  createMCPSession,
  createSimpleWorkflow,
  loadWorkflowFromJSON,
  createMCPTool
} from './session/index';

// 提示词引擎集成
import {
  PromptEngineIntegration,
  createPromptIntegration,
  AIAgentWithPromptEngine
} from './prompts-engine-integration';

// 导出所有组件
export { IntegratedAgent, FunctionalIntegratedAgent, AdvancedIntegratedAgent, createIntegratedAgent };
export { ModelFactory, ProviderConfigManager as ModelConfigManager, RealModel };
export { SimpleMemory };
export {
  PromptManager,
  SystemPromptFactory,
  AppendPromptFactory,
  PromptComposition,
  SimplePrompt,
  AgentPromptEngine,
  createPromptManager
};
export {
  BaseSession,
  TemplateSession,
  ChatSession,
  MCPSession,
  createTemplateSession,
  createChatSession,
  createMCPSession,
  createSimpleWorkflow,
  loadWorkflowFromJSON,
  createMCPTool
};
export {
  PromptEngineIntegration,
  createPromptIntegration,
  AIAgentWithPromptEngine
};

// 类型定义
export type {
  Task,
  ActionResult,
  AgentState,
  MemoryItem
} from './base/types';

export type {
  SystemPromptConfig,
  AppendPromptConfig,
  PromptFormat,
  VariableDefinition,
  RenderOptions,
  RenderResult,
  ValidationResult
} from './prompt-engine/types';

export type {
  SessionStatus,
  SessionMessage,
  SessionStep,
  WorkflowTemplate,
  SessionConfig,
  SessionResult,
  SessionEvent,
  EventHandler,
  TemplateSessionConfig,
  ChatSessionConfig,
  MCPSessionConfig,
  StepResult,
  SessionSnapshot,
  MCPToolDefinition,
  MCPToolCall
} from './session/types';

/**
 * 快速创建Agent（使用集成Agent）
 */
export function createAgent(
  type: 'functional' | 'advanced',
  config: any
) {
  if (type === 'functional') {
    return new FunctionalIntegratedAgent(config);
  } else {
    return new AdvancedIntegratedAgent(config);
  }
}

/**
 * 快速创建带提示词的Agent
 */
export function createAgentWithPrompt(
  type: 'functional' | 'advanced',
  agentConfig: any,
  promptConfig: {
    role: string;
    task?: string;
    format?: 'json' | 'markdown' | 'text';
  }
) {
  const agent = createAgent(type, agentConfig);
  const engine = new AgentPromptEngine();
  
  const prompt = engine.quickAgentPrompt(
    promptConfig.role,
    promptConfig.task || '执行任务',
    promptConfig.format || 'json'
  );

  return {
    agent,
    prompt,
    execute: async (taskInput: string) => {
      return await agent.execute({
        id: 'task-' + Date.now(),
        input: prompt + '\n\n任务：' + taskInput
      });
    }
  };
}

/**
 * 快速创建功能性Agent（使用集成Agent）
 */
export function createFunctionalAgent(
  config: any,
  memory?: SimpleMemory,
  modelConfigManager?: any
) {
  return new FunctionalIntegratedAgent({
    ...config,
    modelId: config.modelId || 'functional-mock'
  });
}

/**
 * 快速创建高级Agent（使用集成Agent）
 */
export function createAdvancedAgent(
  config: any,
  memory?: SimpleMemory,
  modelConfigManager?: any
) {
  return new AdvancedIntegratedAgent({
    ...config,
    modelId: config.modelId || 'advanced-mock'
  });
}

/**
 * 创建默认功能性Agent
 */
export function createDefaultFunctionalAgent() {
  const manager = ProviderConfigManager.getInstance();
  manager.loadFromEnv();
  
  // 使用ModelConfigManager来管理模型配置
  const modelManager = ModelConfigManager.getInstance();
  modelManager.loadFromEnv();
  
  return new FunctionalIntegratedAgent({
    id: 'default-functional',
    name: '默认功能助手',
    role: '助手',
    modelId: 'functional-mock',
    mcpEndpoint: 'http://localhost:3000/mcp'
  });
}

/**
 * 创建默认高级Agent
 */
export function createDefaultAdvancedAgent() {
  const manager = ProviderConfigManager.getInstance();
  manager.loadFromEnv();
  
  // 使用ModelConfigManager来管理模型配置
  const modelManager = ModelConfigManager.getInstance();
  modelManager.loadFromEnv();
  
  return new AdvancedIntegratedAgent({
    id: 'default-advanced',
    name: '默认智能助手',
    role: '专家助手',
    modelId: 'advanced-mock',
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: []
  });
}

/**
 * 定义工具
 */
export function defineTool(name: string, description: string, parameters: any) {
  return {
    name,
    description,
    parameters
  };
}

/**
 * 兼容旧API - 工厂函数（使用集成Agent）
 */
export const AgentFactory = {
  /**
   * 创建功能性Agent
   */
  createFunctional(config: any) {
    return new FunctionalIntegratedAgent(config);
  },

  /**
   * 创建高级Agent
   */
  createAdvanced(config: any) {
    return new AdvancedIntegratedAgent(config);
  },

  /**
   * 创建带提示词的功能性Agent
   */
  createFunctionalWithPrompt(config: any, prompt: { role: string; task?: string }) {
    return createAgentWithPrompt('functional', config, {
      role: prompt.role,
      task: prompt.task,
      format: 'text'
    });
  },

  /**
   * 创建带提示词的高级Agent
   */
  createAdvancedWithPrompt(config: any, prompt: { role: string; task?: string; format?: 'json' | 'markdown' | 'text' }) {
    return createAgentWithPrompt('advanced', config, prompt);
  }
};

/**
 * MCP会话工厂 - 快速创建MCP会话
 */
export const MCPSessionFactory = {
  /**
   * 创建MCP会话
   */
  create(id: string, config: {
    mcpEndpoint: string;
    mcpHeaders?: Record<string, string>;
    tools?: Array<{
      name: string;
      description: string;
      parameters?: {
        type: 'object';
        properties: Record<string, {
          type: 'string' | 'number' | 'boolean';
          description?: string;
          enum?: string[];
        }>;
        required?: string[];
      };
    }>;
    initialContext?: string;
    timeout?: number;
  }): MCPSession {
    return createMCPSession(id, config);
  },

  /**
   * 从工具定义创建MCP会话
   */
  createFromToolDefinitions(id: string, endpoint: string, tools: any[], headers?: Record<string, string>) {
    return createMCPSession(id, {
      mcpEndpoint: endpoint,
      mcpHeaders: headers,
      tools: tools,
      initialContext: 'MCP工具会话'
    });
  },

  /**
   * 创建带系统提示的MCP会话
   */
  createWithSystemPrompt(id: string, config: {
    mcpEndpoint: string;
    systemPrompt: string;
    tools?: any[];
    mcpHeaders?: Record<string, string>;
  }): MCPSession {
    const session = createMCPSession(id, {
      mcpEndpoint: config.mcpEndpoint,
      mcpHeaders: config.mcpHeaders,
      tools: config.tools || [],
      initialContext: config.systemPrompt
    });
    return session;
  }
};

/**
 * 集成Agent工厂 - 快速创建集成Agent
 */
export const IntegratedAgentFactory = {
  /**
   * 创建集成Agent
   */
  create(id: string, config: {
    name: string;
    role: string;
    personality?: string;
    capabilities?: string[];
    modelId: string;
    mcpEndpoint: string;
    mcpHeaders?: Record<string, string>;
    tools?: Array<{
      name: string;
      description: string;
      parameters?: any;
    }>;
    maxRetries?: number;
    baseRetryDelay?: number;
    maxMemoryItems?: number;
  }): IntegratedAgent {
    return createIntegratedAgent({
      id,
      ...config
    });
  },

  /**
   * 创建功能性集成Agent
   */
  createFunctional(id: string, config: {
    name: string;
    role: string;
    mcpEndpoint: string;
    mcpHeaders?: Record<string, string>;
    tools?: Array<{
      name: string;
      description: string;
      parameters?: any;
    }>;
  }): FunctionalIntegratedAgent {
    return new FunctionalIntegratedAgent({
      id,
      ...config,
      modelId: 'functional-mock'
    });
  },

  /**
   * 创建高级集成Agent
   */
  createAdvanced(id: string, config: {
    name: string;
    role: string;
    modelId?: string;
    mcpEndpoint: string;
    mcpHeaders?: Record<string, string>;
    tools?: Array<{
      name: string;
      description: string;
      parameters?: any;
    }>;
  }): AdvancedIntegratedAgent {
    return new AdvancedIntegratedAgent({
      id,
      ...config,
      modelId: config.modelId || 'advanced-mock'
    });
  },

  /**
   * 创建带系统提示的集成Agent
   */
  createWithSystemPrompt(id: string, config: {
    name: string;
    role: string;
    systemPrompt: string;
    modelType: 'functional' | 'advanced';
    mcpEndpoint: string;
    mcpHeaders?: Record<string, string>;
    tools?: Array<{
      name: string;
      description: string;
      parameters?: any;
    }>;
  }): IntegratedAgent {
    const agentConfig = {
      id,
      name: config.name,
      role: config.role,
      modelId: config.modelType === 'functional' ? 'functional-mock' : 'advanced-mock',
      mcpEndpoint: config.mcpEndpoint,
      mcpHeaders: config.mcpHeaders,
      tools: config.tools,
      initialContext: config.systemPrompt
    };

    return config.modelType === 'functional'
      ? new FunctionalIntegratedAgent(agentConfig)
      : new AdvancedIntegratedAgent(agentConfig);
  }
};