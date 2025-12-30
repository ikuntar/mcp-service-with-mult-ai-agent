/**
 * 连续对话会话 - 支持多轮对话的会话
 */

import { BaseSession } from './base-session';
import { SessionStatus, ChatSessionConfig, SessionResult } from './types';

export class ChatSession extends BaseSession {
  private systemPrompt: string;
  private memoryWindow: number;
  private context: string;

  constructor(id: string, config: ChatSessionConfig = {}) {
    super(id, config);
    
    this.systemPrompt = config.systemPrompt || '你是一个有用的助手';
    this.memoryWindow = config.memoryWindow || 10;
    this.context = config.initialContext || '';
  }

  /**
   * 执行会话（连续对话模式）
   */
  protected async execute(): Promise<void> {
    // 连续对话会话在启动时不会自动结束
    // 会一直运行直到超时或手动取消
    
    await this.emit('step', { 
      type: 'chat-ready', 
      message: '会话已准备就绪，可以开始对话' 
    });

    // 添加系统提示词
    if (this.systemPrompt) {
      this.addMessage('system', this.systemPrompt);
    }

    // 会话保持运行状态，等待用户消息
    // 不会自动调用 complete()，直到超时或取消
  }

  /**
   * 处理用户消息
   */
  protected async handleMessage(content: string): Promise<string> {
    // 重置超时（每次消息都重置）
    this.clearTimeout();
    this.setupTimeout();

    // 构建上下文
    const context = this.buildContext();
    
    // 调用AI生成回复（子类可重写）
    const response = await this.generateResponse(content, context);

    // 更新上下文
    this.context += `\n用户: ${content}\n助手: ${response}`;

    return response;
  }

  /**
   * 构建上下文（包含历史消息）
   */
  private buildContext(): string {
    if (this.messages.length === 0) return this.context;

    // 获取最近的消息
    const recentMessages = this.messages.slice(-this.memoryWindow);
    
    const contextParts: string[] = [];
    
    if (this.context) {
      contextParts.push(`背景信息: ${this.context}`);
    }

    recentMessages.forEach(msg => {
      const role = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? '助手' : '系统';
      contextParts.push(`${role}: ${msg.content}`);
    });

    return contextParts.join('\n');
  }

  /**
   * 生成AI回复（可重写）
   */
  protected async generateResponse(input: string, context: string): Promise<string> {
    // 默认实现：模拟AI响应
    // 实际使用时，这里应该调用真实的AI模型
    
    const prompt = `上下文:\n${context}\n\n用户输入: ${input}\n\n请给出回复:`;
    
    // 模拟思考过程
    await this.emit('step', { 
      type: 'thinking', 
      message: '正在思考...' 
    });

    // 简单的响应生成逻辑
    if (input.includes('你好') || input.includes('hi') || input.includes('hello')) {
      return '你好！有什么我可以帮助你的吗？';
    }

    if (input.includes('时间')) {
      return `现在是 ${new Date().toLocaleString('zh-CN')}`;
    }

    if (input.toLowerCase().includes('code') || input.includes('代码')) {
      return '我可以帮你编写代码。请告诉我你需要什么功能的代码，以及使用什么编程语言。';
    }

    return `我收到了你的消息: "${input}"\n\n这是一个模拟的AI回复。在实际使用中，这里会调用真实的AI模型来生成回复。`;
  }

  /**
   * 获取输出
   */
  protected getOutput(): string | undefined {
    // 返回最后一条助手消息
    const lastAssistant = [...this.messages].reverse().find(m => m.role === 'assistant');
    return lastAssistant?.content;
  }

  /**
   * 获取错误
   */
  protected getError(): string | undefined {
    // 连续对话通常没有单个错误，返回最后一条系统消息
    const lastSystem = [...this.messages].reverse().find(m => m.role === 'system');
    return lastSystem?.content;
  }

  /**
   * 获取上下文
   */
  getContext(): string {
    return this.context;
  }

  /**
   * 设置上下文
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * 清空上下文
   */
  clearContext(): void {
    this.context = '';
  }

  /**
   * 获取对话历史（格式化）
   */
  getConversationHistory(): string {
    return this.messages
      .map(msg => {
        const role = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? '助手' : '系统';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  }

  /**
   * 获取最近的助手回复
   */
  getLastAssistantResponse(): string | undefined {
    const lastAssistant = [...this.messages].reverse().find(m => m.role === 'assistant');
    return lastAssistant?.content;
  }

  /**
   * 获取最近的用户消息
   */
  getLastUserMessage(): string | undefined {
    const lastUser = [...this.messages].reverse().find(m => m.role === 'user');
    return lastUser?.content;
  }

  /**
   * 统计消息数量
   */
  getMessageCount(): number {
    return this.messages.length;
  }

  /**
   * 导出对话历史
   */
  exportHistory(): {
    systemPrompt: string;
    context: string;
    messages: Array<{ role: string; content: string; timestamp: number }>;
    metadata: any;
  } {
    return {
      systemPrompt: this.systemPrompt,
      context: this.context,
      messages: this.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })),
      metadata: {
        id: this.id,
        startTime: this.startTime,
        lastUpdate: this.lastUpdate,
        messageCount: this.messages.length
      }
    };
  }

  /**
   * 导入对话历史
   */
  importHistory(history: {
    systemPrompt?: string;
    context?: string;
    messages?: Array<{ role: string; content: string; timestamp?: number }>;
  }): void {
    if (history.systemPrompt) {
      this.systemPrompt = history.systemPrompt;
    }

    if (history.context) {
      this.context = history.context;
    }

    if (history.messages) {
      this.messages = history.messages.map(m => ({
        id: `${m.timestamp || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: m.role as any,
        content: m.content,
        timestamp: m.timestamp || Date.now()
      }));
      this.lastUpdate = Date.now();
    }
  }

  /**
   * 重置会话（保留系统提示词）
   */
  reset(): void {
    this.messages = [];
    this.context = '';
    this.lastUpdate = Date.now();
  }

  /**
   * 撤销最后一条消息
   */
  undo(): void {
    if (this.messages.length > 0) {
      this.messages.pop();
      this.lastUpdate = Date.now();
    }
  }

  /**
   * 修改最后一条消息
   */
  modifyLastMessage(content: string, role?: 'user' | 'assistant'): void {
    if (this.messages.length > 0) {
      const lastMsg = this.messages[this.messages.length - 1];
      if (role && lastMsg.role !== role) return;
      
      lastMsg.content = content;
      lastMsg.timestamp = Date.now();
      this.lastUpdate = Date.now();
    }
  }
}