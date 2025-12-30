/**
 * 集成Agent - 将会话和模型推理整合到智能体中
 * 智能体持有会话作为记忆，持有模型作为推理引擎
 */

import { Task, ActionResult, AgentState } from './types';
import { SimpleMemory } from '../memory/simple-memory';
import { ModelInterface, ToolCall } from './model-interface';
import { ModelFactory, ModelConfigManager } from './model-factory';
import { MCPSession, createMCPSession, createMCPTool } from '../session/index';
import { MCPToolDefinition } from '../session/types';

export interface IntegratedAgentConfig {
  id: string;
  name: string;
  role: string;
  personality?: string;
  capabilities?: string[];
  
  // 模型配置
  modelId: string;
  
  // MCP会话配置
  mcpEndpoint: string;
  mcpHeaders?: Record<string, string>;
  
  // 工具配置（可选，如果提供则自动转换为MCP工具）
  tools?: Array<{
    name: string;
    description: string;
    parameters?: any;
  }>;
  
  // 执行参数
  maxRetries?: number;
  baseRetryDelay?: number;
  
  // 记忆配置
  maxMemoryItems?: number;
}

export class IntegratedAgent {
  // 核心组件
  protected id: string;
  protected name: string;
  protected role: string;
  protected personality: string;
  protected capabilities: string[];
  
  // 持有会话作为记忆和工具接口
  protected session: MCPSession;
  
  // 持有模型作为推理引擎
  protected model: ModelInterface;
  
  // 内部记忆（用于Agent自身的学习和状态）
  protected memory: SimpleMemory;
  
  // 状态管理
  protected state: AgentState = 'initialized';
  protected isRunning: boolean = false;
  protected currentTask: Task | null = null;
  
  // 执行参数
  protected maxRetries: number;
  protected baseRetryDelay: number;

  constructor(config: IntegratedAgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.personality = config.personality || 'helpful';
    this.capabilities = config.capabilities || [];
    
    // 初始化内部记忆
    this.memory = new SimpleMemory(config.maxMemoryItems || 50);
    
    // 执行参数
    this.maxRetries = config.maxRetries || 3;
    this.baseRetryDelay = config.baseRetryDelay || 1000;
    
    // 初始化模型（推理引擎）
    const modelManager = ModelConfigManager.getInstance();
    const modelConfig = modelManager.getAdvancedConfig(config.modelId);
    
    if (!modelConfig) {
      throw new Error(`Model config not found: ${config.modelId}`);
    }
    
    this.model = ModelFactory.create(modelConfig);
    
    // 初始化会话（记忆 + 工具接口）
    const tools = config.tools ? 
      config.tools.map(t => createMCPTool(t.name, t.description, t.parameters)) : 
      [];
    
    this.session = createMCPSession(`${config.id}-session`, {
      mcpEndpoint: config.mcpEndpoint,
      mcpHeaders: config.mcpHeaders,
      tools: tools,
      initialContext: `你是一个${this.role}，名字叫${this.name}，性格是${this.personality}`
    });
  }

  /**
   * 执行任务 - 核心接口
   * 流程：思考 → 规划 → 执行工具 → 返回结果
   */
  async execute(task: Task): Promise<ActionResult> {
    this.currentTask = task;
    this.isRunning = true;

    try {
      await this.transition('planning');
      
      // 1. 使用模型进行思考和推理
      const thought = await this.think(task.input);
      
      // 2. 存储思考过程
      await this.memory.store({
        type: 'thought',
        content: `Task: ${task.input}\nReasoning: ${thought.reasoning}`,
        metadata: { 
          taskId: task.id, 
          confidence: thought.confidence,
          model: this.model.model 
        }
      });
      
      await this.transition('executing');
      
      // 3. 检查是否需要工具调用
      let result: ActionResult;
      if (thought.toolCalls && thought.toolCalls.length > 0) {
        // 4. 通过会话执行工具调用
        result = await this.executeWithTools(thought.toolCalls);
      } else {
        // 5. 普通执行（模拟）
        result = await this.simulateExecution(thought);
      }
      
      // 6. 存储执行结果
      await this.memory.store({
        type: 'experience',
        content: `Task: ${task.input}\nResult: ${result.output || result.error}`,
        metadata: {
          success: result.success,
          duration: result.duration,
          taskId: task.id
        }
      });
      
      await this.transition('idle');
      
      return result;
      
    } catch (error) {
      await this.transition('error');
      
      const errorResult: ActionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { taskId: task.id }
      };

      await this.memory.store({
        type: 'experience',
        content: `Error in task: ${task.input}\nError: ${errorResult.error}`,
        metadata: { success: false, timestamp: Date.now() }
      });

      await this.transition('idle');
      
      return errorResult;
    } finally {
      this.isRunning = false;
      this.currentTask = null;
    }
  }

  /**
   * 思考 - 使用模型进行推理
   */
  protected async think(input: string): Promise<{
    reasoning: string;
    confidence: number;
    toolCalls?: ToolCall[];
  }> {
    const response = await this.executeWithRetry(
      () => this.model.think(input, {
        temperature: 0.7,
        maxTokens: 2000
      })
    );
    
    const responseAny = response as any;
    const reasoning = responseAny.reasoning || responseAny.content;
    const confidence = responseAny.confidence || 0.8;
    
    // 检查模型是否返回工具调用，否则使用关键词检测
    const toolCalls = responseAny.toolCalls && responseAny.toolCalls.length > 0
      ? responseAny.toolCalls
      : this.detectToolCalls(input, reasoning);
    
    return { reasoning, confidence, toolCalls };
  }

  /**
   * 检测工具调用 - 从输入和推理中提取工具调用
   */
  protected detectToolCalls(input: string, reasoning: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    
    // 检测 @toolName 格式
    const atPattern = /@(\w+)\(([^)]*)\)/g;
    let match;
    while ((match = atPattern.exec(input)) !== null) {
      const toolName = match[1];
      const argsStr = match[2];
      
      const args: Record<string, any> = {};
      const argPairs = argsStr.split(',').map(s => s.trim());
      
      argPairs.forEach(pair => {
        const [key, value] = pair.split('=').map(s => s.trim());
        if (key && value) {
          // 尝试解析值类型
          const parsedValue = this.parseValue(value);
          args[key] = parsedValue;
        }
      });
      
      toolCalls.push({
        id: `tool-${Date.now()}-${Math.random()}`,
        name: toolName,
        arguments: args
      });
    }
    
    // 检测关键词触发
    if (input.includes('计算') || input.includes('calculate')) {
      const expressionMatch = input.match(/(\d+[\+\-\*\/]\d+)/);
      if (expressionMatch) {
        toolCalls.push({
          id: `tool-${Date.now()}-${Math.random()}`,
          name: 'calculate',
          arguments: { expression: expressionMatch[1] }
        });
      }
    }
    
    return toolCalls;
  }

  /**
   * 解析值类型
   */
  protected parseValue(value: string): any {
    // 去除引号
    value = value.replace(/^["']|["']$/g, '');
    
    // 尝试解析为数字
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    
    // 尝试解析为布尔值
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // 返回字符串
    return value;
  }

  /**
   * 通过会话执行工具调用
   */
  protected async executeWithTools(toolCalls: ToolCall[]): Promise<ActionResult> {
    const results: string[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        // 通过会话发送工具调用消息
        const toolMessage = `@${toolCall.name}(${Object.entries(toolCall.arguments).map(([k, v]) => `${k}=${v}`).join(', ')})`;
        await this.session.sendMessage(toolMessage);
        
        // 获取会话结果
        const result = this.session.getResult();
        const output = result.output || '完成';
        
        results.push(`工具 ${toolCall.name} 执行成功: ${output}`);
      } catch (error) {
        results.push(`工具 ${toolCall.name} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
    return {
      success: true,
      output: `工具调用结果:\n${results.join('\n')}`,
      duration: 100,
      metadata: {
        toolCalls: toolCalls.length,
        results: results
      }
    };
  }

  /**
   * 模拟执行（当没有工具调用时）
   */
  protected async simulateExecution(thought: any): Promise<ActionResult> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      output: `执行完成: ${thought.reasoning}`,
      duration: 100,
      metadata: {
        simulated: true,
        model: this.model.model
      }
    };
  }

  /**
   * 带重试的执行
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    baseDelay?: number
  ): Promise<T> {
    const actualMaxRetries = maxRetries || this.maxRetries;
    const actualBaseDelay = baseDelay || this.baseRetryDelay;
    
    let lastError: any;
    
    for (let attempt = 0; attempt < actualMaxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < actualMaxRetries - 1) {
          const delay = actualBaseDelay * Math.pow(2, attempt);
          console.log(`[IntegratedAgent] 重试第 ${attempt + 1} 次，等待 ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 状态转换
   */
  protected async transition(to: AgentState): Promise<boolean> {
    const validTransitions: Record<AgentState, AgentState[]> = {
      'initialized': ['idle'],
      'idle': ['planning', 'executing', 'learning', 'stopped'],
      'planning': ['idle', 'executing', 'error'],
      'executing': ['idle', 'learning', 'error'],
      'learning': ['idle'],
      'error': ['idle', 'stopped'],
      'stopped': ['initialized']
    };

    if (validTransitions[this.state]?.includes(to)) {
      this.state = to;
      return true;
    }

    console.warn(`Invalid state transition: ${this.state} -> ${to}`);
    return false;
  }

  // ==================== 外部访问接口 ====================

  /**
   * 获取当前状态
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * 获取Agent信息
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      personality: this.personality,
      capabilities: this.capabilities,
      state: this.state,
      isRunning: this.isRunning,
      currentTask: this.currentTask,
      model: this.model.model,
      modelType: this.model.type,
      sessionTools: this.session.getTools().length
    };
  }

  /**
   * 停止Agent
   */
  async stop(): Promise<void> {
    if (this.isRunning) {
      await this.transition('stopped');
      this.isRunning = false;
      this.currentTask = null;
    }
    await this.session.cancel();
  }

  /**
   * 获取记忆统计
   */
  async getMemoryStats() {
    return await this.memory.getStats();
  }

  /**
   * 获取最近的记忆
   */
  async getRecentMemories(count: number = 5) {
    return await this.memory.getRecent(count);
  }

  /**
   * 获取会话历史
   */
  getSessionHistory() {
    return this.session.getContext();
  }

  /**
   * 获取可用工具
   */
  getTools() {
    return this.session.getTools();
  }

  /**
   * 添加工具
   */
  addTool(tool: MCPToolDefinition): void {
    this.session.addTool(tool);
  }

  /**
   * 批量添加工具
   */
  addTools(tools: MCPToolDefinition[]): void {
    tools.forEach(tool => this.addTool(tool));
  }

  /**
   * 设置上下文
   */
  setContext(context: string): void {
    this.session.setContext(context);
  }

  /**
   * 获取上下文
   */
  getContext(): string {
    return this.session.getContext();
  }

  /**
   * 清空上下文
   */
  clearContext(): void {
    this.session.clearContext();
  }

  /**
   * 导出会话历史
   */
  exportHistory() {
    return this.session.exportHistory();
  }

  /**
   * 导入会话历史
   */
  async importHistory(history: any): Promise<void> {
    await this.session.importHistory(history);
  }

  /**
   * 撤销上一条消息
   */
  async undo(): Promise<void> {
    await this.session.undo();
  }

  /**
   * 修改最后一条消息
   */
  async modifyLastMessage(newContent: string, role?: 'user' | 'assistant' | 'system'): Promise<void> {
    this.session.modifyLastMessage(newContent, role);
  }

  /**
   * 重置会话
   */
  async reset(): Promise<void> {
    await this.session.reset();
  }

  /**
   * 监听事件
   */
  on(handler: (event: any) => void): void {
    this.session.on(handler);
  }

  /**
   * 更新MCP端点
   */
  updateMCPEndpoint(endpoint: string, headers?: Record<string, string>): void {
    this.session.updateMCPEndpoint(endpoint, headers);
  }
}

/**
 * 快速创建集成Agent
 */
export function createIntegratedAgent(config: IntegratedAgentConfig): IntegratedAgent {
  return new IntegratedAgent(config);
}

/**
 * 功能性Agent（简化版，使用功能模型）
 */
export class FunctionalIntegratedAgent extends IntegratedAgent {
  constructor(config: Omit<IntegratedAgentConfig, 'modelId'> & { modelId?: string }) {
    super({
      ...config,
      modelId: config.modelId || 'functional-mock'
    });
  }

  /**
   * 简化版思考 - 功能性Agent使用更少的token
   */
  protected async think(input: string): Promise<{
    reasoning: string;
    confidence: number;
    toolCalls?: ToolCall[];
  }> {
    const response = await this.executeWithRetry(
      () => this.model.think(input, {
        temperature: 0.7,
        maxTokens: 1000
      })
    );
    
    return {
      reasoning: response.reasoning || response.content,
      confidence: response.confidence || 0.8,
      toolCalls: this.detectToolCalls(input, response.reasoning || response.content)
    };
  }

  /**
   * 简化版执行 - 功能性Agent执行更快
   */
  protected async simulateExecution(thought: any): Promise<ActionResult> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      success: true,
      output: `功能性Agent执行: ${thought.reasoning}`,
      duration: 50,
      metadata: {
        simulated: true,
        model: this.model.model,
        type: 'functional'
      }
    };
  }
}

/**
 * 高级Agent（完整版，使用高级模型）
 */
export class AdvancedIntegratedAgent extends IntegratedAgent {
  constructor(config: IntegratedAgentConfig) {
    super({
      ...config,
      modelId: config.modelId || 'advanced-mock'
    });
  }

  /**
   * 高级思考 - 支持原生工具调用
   */
  protected async think(input: string): Promise<{
    reasoning: string;
    confidence: number;
    toolCalls?: ToolCall[];
  }> {
    const response = await this.executeWithRetry(
      () => this.model.think(input, {
        temperature: 0.7,
        maxTokens: 2000
      })
    );
    
    const responseAny = response as any;
    const reasoning = responseAny.reasoning || responseAny.content;
    const confidence = responseAny.confidence || 0.8;
    
    // 优先使用模型返回的工具调用，否则使用关键词检测
    const toolCalls = responseAny.toolCalls && responseAny.toolCalls.length > 0
      ? responseAny.toolCalls
      : this.detectToolCalls(input, reasoning);
    
    return { reasoning, confidence, toolCalls };
  }

  /**
   * 高级执行 - 带工具可用性检查
   */
  protected async executeWithTools(toolCalls: ToolCall[]): Promise<ActionResult> {
    const results: string[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        // 检查工具是否可用
        const availableTools = this.getTools();
        const toolExists = availableTools.some(t => t.name === toolCall.name);
        
        if (!toolExists) {
          results.push(`工具 ${toolCall.name} 不可用`);
          continue;
        }
        
        // 通过会话执行
        const toolMessage = `@${toolCall.name}(${Object.entries(toolCall.arguments).map(([k, v]) => `${k}=${v}`).join(', ')})`;
        await this.session.sendMessage(toolMessage);
        
        // 获取会话结果
        const result = this.session.getResult();
        const output = result.output || '完成';
        
        results.push(`工具 ${toolCall.name} 执行成功: ${output}`);
      } catch (error) {
        results.push(`工具 ${toolCall.name} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
    return {
      success: true,
      output: `高级工具调用结果:\n${results.join('\n')}`,
      duration: 150,
      metadata: {
        toolCalls: toolCalls.length,
        results: results,
        type: 'advanced'
      }
    };
  }
}