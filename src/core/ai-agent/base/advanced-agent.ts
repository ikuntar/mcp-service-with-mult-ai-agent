/**
 * 高级Agent - 拥有完整Token生态
 * 本质：持有Token，拥有工具调用能力
 * 对外暴露：仅对话接口，隐藏Token生态细节
 */

import { Task, ActionResult, AgentState } from './types';
import { SimpleMemory } from '../memory/simple-memory';
import { ModelInterface, ToolCall } from './model-interface';
import { ModelFactory, ModelConfigManager } from './model-factory';
import { createMCPSession, MCPSession } from '../session/index';

export interface AdvancedAgentConfig {
  id: string;
  name: string;
  role?: string;
  personality?: string;
  capabilities?: string[];
  
  // Token配置 - 外部组件完成Token生态管理
  token?: string;           // 直接提供token
  tokenKey?: string;        // 从环境变量获取token的key
  
  // 模型配置
  modelId?: string;
  
  // 执行参数
  maxRetries?: number;
  baseRetryDelay?: number;
  
  // 记忆配置
  maxMemoryItems?: number;
}

export class AdvancedAgent {
  // 核心组件
  protected id: string;
  protected name: string;
  protected role: string;
  protected personality: string;
  protected capabilities: string[];
  
  // Token生态（内部持有，对外隐藏）
  protected token: string | null = null;
  protected session: MCPSession;
  protected model: ModelInterface;
  protected memory: SimpleMemory;
  
  // 状态管理
  protected state: AgentState = 'initialized';
  protected isRunning: boolean = false;
  protected currentTask: Task | null = null;
  
  // 执行参数
  protected maxRetries: number;
  protected baseRetryDelay: number;

  constructor(config: AdvancedAgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role || '专家助手';
    this.personality = config.personality || '专业';
    this.capabilities = config.capabilities || [];
    
    this.maxRetries = config.maxRetries || 3;
    this.baseRetryDelay = config.baseRetryDelay || 1000;
    
    this.memory = new SimpleMemory(config.maxMemoryItems || 50);
    
    // 内部处理Token（对外隐藏细节）
    this.initializeToken(config);
    
    // 初始化模型
    const modelManager = ModelConfigManager.getInstance();
    const modelConfig = modelManager.getAdvancedConfig(config.modelId || 'advanced-mock');
    if (!modelConfig) {
      throw new Error(`Advanced model config not found: ${config.modelId || 'advanced-mock'}`);
    }
    this.model = ModelFactory.create(modelConfig);
    
    // 初始化会话（使用项目默认MCP，工具由外部Token生态决定）
    this.session = createMCPSession(`${config.id}-session`, {
      mcpEndpoint: 'http://localhost:3000/mcp',
      tools: [], // 不传入工具，由Token生态决定可见性
      initialContext: `你是一个${this.role}，名字叫${this.name}，性格是${this.personality}`
    });
  }

  /**
   * 内部方法：初始化Token（对外隐藏）
   */
  private initializeToken(config: AdvancedAgentConfig): void {
    // 1. 直接提供的token
    if (config.token) {
      this.token = config.token;
      return;
    }
    
    // 2. 从环境变量获取
    if (config.tokenKey) {
      const envToken = process.env[config.tokenKey];
      if (envToken) {
        this.token = envToken;
        return;
      }
    }
    
    // 3. 检查常用环境变量
    const commonKeys = ['AI_AGENT_TOKEN', 'MCP_TOKEN', 'API_TOKEN'];
    for (const key of commonKeys) {
      const token = process.env[key];
      if (token) {
        this.token = token;
        return;
      }
    }
    
    // 4. 未找到Token（对外隐藏，使用模拟模式）
    this.token = null;
  }

  /**
   * 对外API：执行单次任务（推理 + 工具调用）
   * 隐藏Token生态细节，只暴露对话能力
   */
  async execute(task: Task): Promise<ActionResult> {
    this.currentTask = task;
    this.isRunning = true;

    try {
      await this.transition('planning');
      
      // 思考和推理
      const thought = await this.think(task.input);
      
      // 存储思考过程
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
      
      // 检查是否需要工具调用
      let result: ActionResult;
      if (thought.toolCalls && thought.toolCalls.length > 0) {
        // 通过会话执行工具调用（Token生态内部处理）
        result = await this.executeWithTools(thought.toolCalls);
      } else {
        // 普通执行
        result = await this.simulateExecution(thought);
      }
      
      // 存储执行结果
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
   * 对外API：开始连续对话
   * 全权处理连续对话，隐藏内部细节
   */
  async startChat(): Promise<void> {
    if (this.state !== 'initialized' && this.state !== 'idle') {
      throw new Error(`Cannot start chat with state: ${this.state}`);
    }
    
    await this.transition('idle');
    await this.session.start();
  }

  /**
   * 对外API：发送消息（连续对话）
   * 自动处理工具调用，对外透明
   */
  async sendMessage(content: string): Promise<string> {
    if (this.state !== 'idle') {
      throw new Error(`Cannot send message with state: ${this.state}`);
    }
    
    this.isRunning = true;
    
    try {
      // 通过会话发送消息（自动处理工具调用）
      const response = await this.session.sendMessage(content);
      
      // 存储到内部记忆
      await this.memory.store({
        type: 'ai_response',
        content: `User: ${content}\nAssistant: ${response}`,
        metadata: { timestamp: Date.now() }
      });
      
      return response;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 对外API：停止对话
   */
  async stopChat(): Promise<void> {
    if (this.state === 'idle') {
      await this.session.cancel();
      await this.transition('stopped');
    }
  }

  /**
   * 对外API：重置对话
   */
  async resetChat(): Promise<void> {
    await this.session.reset();
  }

  /**
   * 对外API：撤销上一条消息
   */
  async undo(): Promise<void> {
    await this.session.undo();
  }

  /**
   * 对外API：修改最后一条消息
   */
  async modifyLastMessage(content: string, role?: 'user' | 'assistant' | 'system'): Promise<void> {
    this.session.modifyLastMessage(content, role);
  }

  /**
   * 思考（内部方法）
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
    
    // 检测工具调用
    const toolCalls = responseAny.toolCalls && responseAny.toolCalls.length > 0
      ? responseAny.toolCalls
      : this.detectToolCalls(input, reasoning);
    
    return { reasoning, confidence, toolCalls };
  }

  /**
   * 检测工具调用（内部方法）
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
   * 解析值类型（内部方法）
   */
  protected parseValue(value: string): any {
    value = value.replace(/^["']|["']$/g, '');
    
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    return value;
  }

  /**
   * 通过会话执行工具调用（内部方法）
   * Token生态内部处理，对外透明
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
   * 模拟执行（内部方法）
   */
  protected async simulateExecution(thought: any): Promise<ActionResult> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      output: `高级Agent执行: ${thought.reasoning}`,
      duration: 100,
      metadata: {
        simulated: true,
        model: this.model.model
      }
    };
  }

  /**
   * 带重试的执行（内部方法）
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
          console.log(`[AdvancedAgent] 重试第 ${attempt + 1} 次，等待 ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 状态转换（内部方法）
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

  // ==================== 对外访问接口 ====================

  /**
   * 获取当前状态
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * 获取Agent信息（对外暴露必要信息）
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
      hasToken: this.token !== null
    };
  }

  /**
   * 获取对话状态
   */
  getChatStatus() {
    return {
      isRunning: this.isRunning,
      state: this.state,
      messageCount: this.session.getMessageCount(),
      lastMessage: this.session.getLastAssistantResponse()
    };
  }

  /**
   * 获取对话历史
   */
  getConversationHistory() {
    return this.session.getConversationHistory();
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
   * 导出对话历史
   */
  exportHistory() {
    return this.session.exportHistory();
  }

  /**
   * 导入对话历史
   */
  async importHistory(history: any): Promise<void> {
    await this.session.importHistory(history);
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
}

/**
 * 快速创建高级Agent
 */
export function createAdvancedAgent(config: AdvancedAgentConfig): AdvancedAgent {
  return new AdvancedAgent(config);
}