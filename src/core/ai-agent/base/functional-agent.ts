/**
 * 功能性Agent - 只能对话生成，没有Token生态
 * 本质：简单的对话生成器
 * 对外暴露：仅对话接口
 */

import { Task, ActionResult, AgentState } from './types';
import { SimpleMemory } from '../memory/simple-memory';
import { ModelInterface } from './model-interface';
import { ModelFactory, ModelConfigManager } from './model-factory';

export interface FunctionalAgentConfig {
  id: string;
  name: string;
  role?: string;
  personality?: string;
  capabilities?: string[];
  systemPrompt?: string;
  
  // 模型配置
  modelId?: string;
  
  // 记忆配置
  maxMemoryItems?: number;
}

export class FunctionalAgent {
  // 核心组件
  protected id: string;
  protected name: string;
  protected role: string;
  protected personality: string;
  protected capabilities: string[];
  protected systemPrompt: string;
  
  // 对话引擎（没有Token生态）
  protected model: ModelInterface;
  protected memory: SimpleMemory;
  
  // 状态管理
  protected state: AgentState = 'initialized';
  protected isRunning: boolean = false;
  protected currentTask: Task | null = null;
  
  // 对话历史（用于连续对话）
  protected conversationHistory: Array<{ role: string; content: string }>;

  constructor(config: FunctionalAgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role || '助手';
    this.personality = config.personality || '友好';
    this.capabilities = config.capabilities || ['对话'];
    this.systemPrompt = config.systemPrompt || `你是一个${this.role}，名字叫${this.name}，性格是${this.personality}`;
    
    // 初始化记忆
    this.memory = new SimpleMemory(config.maxMemoryItems || 50);
    
    // 初始化模型（使用功能性模型）
    const modelManager = ModelConfigManager.getInstance();
    const modelConfig = modelManager.getFunctionalConfig(config.modelId || 'functional-mock');
    
    if (!modelConfig) {
      throw new Error(`Functional model config not found: ${config.modelId || 'functional-mock'}`);
    }
    
    this.model = ModelFactory.create(modelConfig);
    
    // 初始化对话历史
    this.conversationHistory = [];
  }

  /**
   * 对外API：执行单次任务（仅对话生成）
   */
  async execute(task: Task): Promise<ActionResult> {
    this.currentTask = task;
    this.isRunning = true;

    try {
      await this.transition('executing');
      
      // 生成对话响应
      const response = await this.generateResponse(task.input);
      
      // 存储到记忆
      await this.memory.store({
        type: 'ai_response',
        content: `Task: ${task.input}\nResponse: ${response}`,
        metadata: { 
          taskId: task.id, 
          model: this.model.model,
          timestamp: Date.now()
        }
      });
      
      await this.transition('idle');
      
      return {
        success: true,
        output: response,
        duration: 100,
        metadata: {
          taskId: task.id,
          model: this.model.model
        }
      };
      
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
   */
  async startChat(): Promise<void> {
    if (this.state !== 'initialized' && this.state !== 'idle') {
      throw new Error(`Cannot start chat with state: ${this.state}`);
    }
    
    await this.transition('idle');
    this.conversationHistory = [{ role: 'system', content: this.systemPrompt }];
    
    console.log(`[FunctionalAgent] ${this.name} 已准备好进行连续对话`);
  }

  /**
   * 对外API：发送消息（连续对话）
   */
  async sendMessage(content: string): Promise<string> {
    if (this.state !== 'idle') {
      throw new Error(`Cannot send message with state: ${this.state}`);
    }
    
    this.isRunning = true;
    
    try {
      // 添加用户消息到历史
      this.conversationHistory.push({ role: 'user', content });
      
      // 生成响应
      const response = await this.generateResponseFromHistory();
      
      // 添加助手消息到历史
      this.conversationHistory.push({ role: 'assistant', content: response });
      
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
      await this.transition('stopped');
      this.conversationHistory = [];
      console.log(`[FunctionalAgent] ${this.name} 已停止对话`);
    }
  }

  /**
   * 对外API：重置对话
   */
  async resetChat(): Promise<void> {
    this.conversationHistory = [{ role: 'system', content: this.systemPrompt }];
    console.log(`[FunctionalAgent] ${this.name} 对话已重置`);
  }

  /**
   * 对外API：撤销上一条消息
   */
  async undo(): Promise<void> {
    // 移除最后一条用户消息和助手回复
    while (this.conversationHistory.length > 0) {
      const last = this.conversationHistory[this.conversationHistory.length - 1];
      if (last.role === 'assistant') {
        this.conversationHistory.pop();
      } else if (last.role === 'user') {
        this.conversationHistory.pop();
        break;
      } else {
        break;
      }
    }
  }

  /**
   * 对外API：修改最后一条消息
   */
  async modifyLastMessage(content: string, role?: 'user' | 'assistant' | 'system'): Promise<void> {
    if (this.conversationHistory.length === 0) return;
    
    // 找到最后一条指定角色的消息
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      if (!role || this.conversationHistory[i].role === role) {
        this.conversationHistory[i].content = content;
        break;
      }
    }
  }

  /**
   * 生成响应（内部方法）
   */
  protected async generateResponse(input: string): Promise<string> {
    const response = await this.model.think(input, {
      temperature: 0.7,
      maxTokens: 1000
    });
    
    const responseAny = response as any;
    return responseAny.content || responseAny.reasoning || '我理解了你的意思。';
  }

  /**
   * 从历史生成响应（内部方法）
   */
  protected async generateResponseFromHistory(): Promise<string> {
    // 将历史转换为提示词
    const prompt = this.conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const response = await this.model.think(prompt, {
      temperature: 0.7,
      maxTokens: 1000
    });
    
    const responseAny = response as any;
    return responseAny.content || responseAny.reasoning || '我理解了你的意思。';
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
      hasToken: false  // 功能性Agent没有Token
    };
  }

  /**
   * 获取对话状态
   */
  getChatStatus() {
    return {
      isRunning: this.isRunning,
      state: this.state,
      messageCount: this.conversationHistory.length,
      lastMessage: this.conversationHistory.length > 0 
        ? this.conversationHistory[this.conversationHistory.length - 1].content 
        : null
    };
  }

  /**
   * 获取对话历史
   */
  getConversationHistory() {
    return [...this.conversationHistory];
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
    return {
      agentId: this.id,
      agentName: this.name,
      history: this.conversationHistory,
      memoryStats: this.memory.getStats()
    };
  }

  /**
   * 导入对话历史
   */
  async importHistory(history: any): Promise<void> {
    if (history.history && Array.isArray(history.history)) {
      this.conversationHistory = history.history;
    }
  }

  /**
   * 设置上下文
   */
  setContext(context: string): void {
    // 功能性Agent的上下文就是系统提示
    this.systemPrompt = context;
  }

  /**
   * 获取上下文
   */
  getContext(): string {
    return this.systemPrompt;
  }

  /**
   * 清空上下文
   */
  clearContext(): void {
    this.systemPrompt = `你是一个${this.role}，名字叫${this.name}，性格是${this.personality}`;
  }
}

/**
 * 快速创建功能性Agent
 */
export function createFunctionalAgent(config: FunctionalAgentConfig): FunctionalAgent {
  return new FunctionalAgent(config);
}
