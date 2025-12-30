/**
 * 会话基类 - 提供通用会话功能
 */

import { 
  SessionStatus, 
  SessionMessage, 
  SessionConfig, 
  SessionResult, 
  SessionEvent, 
  EventHandler,
  SessionSnapshot 
} from './types';

export abstract class BaseSession {
  protected id: string;
  protected status: SessionStatus;
  protected messages: SessionMessage[];
  protected config: Required<SessionConfig>;
  protected startTime: number;
  protected lastUpdate: number;
  protected eventHandlers: EventHandler[];
  protected timeoutId: NodeJS.Timeout | null;
  protected resolvePromise: ((result: SessionResult) => void) | null;
  protected rejectPromise: ((error: any) => void) | null;

  constructor(id: string, config?: SessionConfig) {
    this.id = id;
    this.status = SessionStatus.PENDING;
    this.messages = [];
    this.config = {
      timeout: config?.timeout ?? 300000, // 5分钟
      maxMessages: config?.maxMessages ?? 50,
      saveHistory: config?.saveHistory ?? true,
      autoCleanup: config?.autoCleanup ?? false,
      cleanupThreshold: config?.cleanupThreshold ?? 40,
      cleanup保留: config?.cleanup保留 ?? 10
    };
    this.startTime = 0;
    this.lastUpdate = 0;
    this.eventHandlers = [];
    this.timeoutId = null;
    this.resolvePromise = null;
    this.rejectPromise = null;
  }

  /**
   * 获取会话ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * 获取当前状态
   */
  getStatus(): SessionStatus {
    return this.status;
  }

  /**
   * 获取消息历史
   */
  getMessages(): SessionMessage[] {
    return [...this.messages];
  }

  /**
   * 添加事件处理器
   */
  on(handler: EventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * 移除事件处理器
   */
  off(handler: EventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * 发布事件
   */
  protected async emit(type: SessionEvent['type'], data?: any): Promise<void> {
    const event: SessionEvent = {
      type,
      data,
      timestamp: Date.now()
    };

    for (const handler of this.eventHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    }
  }

  /**
   * 添加消息
   */
  protected addMessage(role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>): void {
    if (!this.config.saveHistory) return;

    const message: SessionMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      metadata
    };

    this.messages.push(message);
    this.lastUpdate = Date.now();

    // 自动清理旧消息
    if (this.config.autoCleanup && this.messages.length > this.config.cleanupThreshold) {
      this.messages = this.messages.slice(-this.config.cleanup保留);
    }

    // 限制最大消息数
    if (this.messages.length > this.config.maxMessages) {
      this.messages = this.messages.slice(-this.config.maxMessages);
    }

    this.emit('message', message);
  }

  /**
   * 开始会话
   */
  async start(): Promise<SessionResult> {
    if (this.status !== SessionStatus.PENDING) {
      throw new Error(`Cannot start session with status: ${this.status}`);
    }

    this.status = SessionStatus.RUNNING;
    this.startTime = Date.now();
    this.lastUpdate = Date.now();

    // 设置超时
    this.setupTimeout();

    await this.emit('start', { id: this.id });

    return new Promise<SessionResult>((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      // 执行具体逻辑
      this.execute().catch(error => {
        this.handleError(error);
      });
    });
  }

  /**
   * 发送消息（用于连续对话）
   */
  async sendMessage(content: string): Promise<string> {
    if (this.status !== SessionStatus.RUNNING) {
      throw new Error(`Cannot send message with status: ${this.status}`);
    }

    this.addMessage('user', content);
    const response = await this.handleMessage(content);
    this.addMessage('assistant', response);

    return response;
  }

  /**
   * 等待会话结束（阻塞）
   */
  async waitUntilEnd(): Promise<SessionResult> {
    if (this.status === SessionStatus.COMPLETED || 
        this.status === SessionStatus.TIMEOUT || 
        this.status === SessionStatus.ERROR ||
        this.status === SessionStatus.CANCELLED) {
      return this.getResult();
    }

    return new Promise<SessionResult>((resolve) => {
      const handler: EventHandler = async (event) => {
        if (['end', 'timeout', 'error'].includes(event.type)) {
          this.off(handler);
          resolve(this.getResult());
        }
      };
      this.on(handler);
    });
  }

  /**
   * 取消会话
   */
  async cancel(): Promise<SessionResult> {
    if (this.status === SessionStatus.COMPLETED || 
        this.status === SessionStatus.TIMEOUT ||
        this.status === SessionStatus.ERROR ||
        this.status === SessionStatus.CANCELLED) {
      return this.getResult();
    }

    this.status = SessionStatus.CANCELLED;
    this.clearTimeout();
    
    await this.emit('end', { reason: 'cancelled' });
    
    return this.getResult();
  }

  /**
   * 获取结果
   */
  getResult(): SessionResult {
    const duration = this.startTime ? Date.now() - this.startTime : 0;
    
    return {
      status: this.status,
      messages: this.getMessages(),
      output: this.getOutput(),
      error: this.getError(),
      duration,
      metadata: {
        id: this.id,
        startTime: this.startTime,
        lastUpdate: this.lastUpdate
      }
    };
  }

  /**
   * 获取快照
   */
  getSnapshot(): SessionSnapshot {
    return {
      id: this.id,
      status: this.status,
      messages: this.getMessages(),
      currentStep: this.getCurrentStep?.(),
      variables: this.getVariables?.(),
      startTime: this.startTime,
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.clearTimeout();
    this.eventHandlers = [];
    this.resolvePromise = null;
    this.rejectPromise = null;
  }

  /**
   * 抽象方法：执行会话逻辑
   */
  protected abstract execute(): Promise<void>;

  /**
   * 抽象方法：处理消息（用于连续对话）
   */
  protected abstract handleMessage(content: string): Promise<string>;

  /**
   * 抽象方法：获取输出
   */
  protected abstract getOutput(): string | undefined;

  /**
   * 抽象方法：获取错误
   */
  protected abstract getError(): string | undefined;

  /**
   * 可选方法：获取当前步骤（模板会话用）
   */
  protected getCurrentStep?(): string | undefined;

  /**
   * 可选方法：获取变量（模板会话用）
   */
  protected getVariables?(): Record<string, any>;

  /**
   * 设置超时
   */
  protected setupTimeout(): void {
    if (this.config.timeout > 0) {
      this.timeoutId = setTimeout(() => {
        this.handleTimeout();
      }, this.config.timeout);
    }
  }

  /**
   * 清除超时
   */
  protected clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * 处理超时
   */
  protected async handleTimeout(): Promise<void> {
    if (this.status !== SessionStatus.RUNNING) return;

    this.status = SessionStatus.TIMEOUT;
    this.clearTimeout();

    await this.emit('timeout', { timeout: this.config.timeout });
    await this.emit('end', { reason: 'timeout' });

    if (this.resolvePromise) {
      this.resolvePromise(this.getResult());
    }
  }

  /**
   * 处理错误
   */
  protected async handleError(error: any): Promise<void> {
    this.status = SessionStatus.ERROR;
    this.clearTimeout();

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await this.emit('error', { error: errorMessage });
    await this.emit('end', { reason: 'error', error: errorMessage });

    if (this.rejectPromise) {
      this.rejectPromise(error);
    }
  }

  /**
   * 完成会话
   */
  protected async complete(): Promise<void> {
    if (this.status !== SessionStatus.RUNNING) return;

    this.status = SessionStatus.COMPLETED;
    this.clearTimeout();

    await this.emit('end', { reason: 'completed' });

    if (this.resolvePromise) {
      this.resolvePromise(this.getResult());
    }
  }
}