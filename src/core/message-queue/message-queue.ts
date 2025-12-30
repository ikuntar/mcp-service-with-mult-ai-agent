/**
 * 用户空间消息队列系统
 * 
 * 为MCP工具提供用户空间内的消息传递能力，支持：
 * - 消息发布和接收（请求-响应模式）
 * - 消息持久化
 * - 消息优先级
 * - 消息过期
 * 
 * 注意：此功能仅对特定MCP工具开放，用户不能直接访问
 * 消息队列隶属于用户空间，不支持跨队列订阅
 */

import { ToolResult } from '../../types';

/**
 * 消息类型
 */
export type MessageType = 'tool-request' | 'tool-response' | 'notification' | 'event' | 'error';

/**
 * 消息优先级
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * 消息接口
 */
export interface Message {
  id: string;
  type: MessageType;
  priority: MessagePriority;
  source: string;
  destination: string;
  content: any;
  timestamp: string;
  ttl?: number; // 消息有效期（秒）
  metadata?: Record<string, any>;
  /**
   * 响应消息ID（用于请求-响应模式）
   */
  responseTo?: string;
}

/**
 * 用户空间消息队列管理器
 * 
 * 注意：此类的所有方法都应通过MCP工具调用，用户不能直接访问
 * 消息队列隶属于用户空间，提供简单的请求-响应模式
 */
export class MessageQueue {
  private queue: Message[] = [];
  private pendingMessages: Map<string, Message[]> = new Map(); // 按目的地分组的待处理消息
  
  /**
   * 发布消息（仅限MCP工具调用）
   * 
   * @param type 消息类型
   * @param source 消息来源（用户Token）
   * @param destination 目标用户Token（或"all"表示广播）
   * @param content 消息内容
   * @param priority 消息优先级
   * @param ttl 消息有效期（秒）
   * @param metadata 元数据
   * @param responseTo 响应的消息ID（用于回复）
   * @returns 消息对象
   */
  publish(
    type: MessageType,
    source: string,
    destination: string,
    content: any,
    priority: MessagePriority = 'normal',
    ttl?: number,
    metadata?: Record<string, any>,
    responseTo?: string
  ): Message {
    const message: Message = {
      id: this.generateMessageId(),
      type,
      priority,
      source,
      destination,
      content,
      timestamp: new Date().toISOString(),
      ttl,
      metadata,
      responseTo
    };
    
    // 添加到队列
    this.queue.push(message);
    
    // 按目的地分组
    if (!this.pendingMessages.has(destination)) {
      this.pendingMessages.set(destination, []);
    }
    this.pendingMessages.get(destination)!.push(message);
    
    // 按优先级排序
    this.sortQueue();
    
    console.log(`[MessageQueue] 消息发布: ${type} from ${source} to ${destination}`);
    
    return message;
  }
  
  /**
   * 发送回复消息（仅限MCP工具调用）
   * 
   * @param originalMessage 原始消息
   * @param source 回复者Token
   * @param content 回复内容
   * @param priority 优先级
   * @param ttl 有效期
   * @param metadata 元数据
   * @returns 回复消息对象
   */
  reply(
    originalMessage: Message,
    source: string,
    content: any,
    priority: MessagePriority = 'normal',
    ttl?: number,
    metadata?: Record<string, any>
  ): Message {
    return this.publish(
      'tool-response',
      source,
      originalMessage.source,
      content,
      priority,
      ttl,
      metadata,
      originalMessage.id
    );
  }
  
  /**
   * 接收消息（从队列中取出）（仅限MCP工具调用）
   * 
   * @param destination 目标用户Token
   * @param filter 过滤器
   * @returns 消息或null
   */
  receiveMessage(destination: string, filter?: (msg: Message) => boolean): Message | null {
    const pending = this.pendingMessages.get(destination);
    if (!pending || pending.length === 0) {
      return null;
    }
    
    // 应用过滤器
    let messages = pending;
    if (filter) {
      messages = messages.filter(filter);
    }
    
    if (messages.length === 0) {
      return null;
    }
    
    // 取优先级最高的消息
    const priorityOrder: Record<MessagePriority, number> = {
      'critical': 4,
      'high': 3,
      'normal': 2,
      'low': 1
    };
    
    messages.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    const message = messages[0];
    
    // 从队列中移除
    this.removeMessage(message.id);
    
    return message;
  }
  
  /**
   * 批量接收消息（仅限MCP工具调用）
   */
  receiveMessages(destination: string, count: number = 10, filter?: (msg: Message) => boolean): Message[] {
    const result: Message[] = [];
    
    for (let i = 0; i < count; i++) {
      const msg = this.receiveMessage(destination, filter);
      if (!msg) break;
      result.push(msg);
    }
    
    return result;
  }
  
  /**
   * 获取待处理消息（仅限MCP工具调用）
   */
  getPendingMessages(destination: string): Message[] {
    return this.pendingMessages.get(destination) || [];
  }
  
  /**
   * 删除消息（内部方法）
   */
  private removeMessage(messageId: string): boolean {
    // 从主队列中移除
    const index = this.queue.findIndex(msg => msg.id === messageId);
    if (index === -1) return false;
    
    const message = this.queue[index];
    this.queue.splice(index, 1);
    
    // 从待处理消息中移除
    const pending = this.pendingMessages.get(message.destination);
    if (pending) {
      const pendingIndex = pending.findIndex(msg => msg.id === messageId);
      if (pendingIndex !== -1) {
        pending.splice(pendingIndex, 1);
        if (pending.length === 0) {
          this.pendingMessages.delete(message.destination);
        }
      }
    }
    
    return true;
  }
  
  /**
   * 清理过期消息（内部方法）
   */
  cleanupExpiredMessages(): number {
    const now = new Date();
    let count = 0;
    
    const expired = this.queue.filter(msg => {
      if (!msg.ttl) return false;
      
      const messageTime = new Date(msg.timestamp);
      const expiresAt = new Date(messageTime.getTime() + msg.ttl * 1000);
      
      return expiresAt < now;
    });
    
    for (const msg of expired) {
      if (this.removeMessage(msg.id)) {
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`[MessageQueue] 清理过期消息: ${count} 条`);
    }
    
    return count;
  }
  
  /**
   * 清理用户消息（内部方法）
   */
  cleanupUserMessages(user: string): number {
    let count = 0;
    
    const userMessages = this.queue.filter(msg => 
      msg.source === user || msg.destination === user
    );
    
    for (const msg of userMessages) {
      if (this.removeMessage(msg.id)) {
        count++;
      }
    }
    
    console.log(`[MessageQueue] 清理用户 ${user} 的 ${count} 条消息`);
    return count;
  }
  
  /**
   * 获取消息统计（仅限MCP工具调用）
   */
  getStats(destination?: string): {
    total: number;
    pending: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    pendingByDestination?: Record<string, number>;
  } {
    const messages = destination ? this.getPendingMessages(destination) : this.queue;
    
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    for (const msg of messages) {
      byType[msg.type] = (byType[msg.type] || 0) + 1;
      byPriority[msg.priority] = (byPriority[msg.priority] || 0) + 1;
    }
    
    const result: any = {
      total: this.queue.length,
      pending: messages.length,
      byType,
      byPriority
    };
    
    if (!destination) {
      const pendingByDestination: Record<string, number> = {};
      for (const [dest, msgs] of this.pendingMessages) {
        pendingByDestination[dest] = msgs.length;
      }
      result.pendingByDestination = pendingByDestination;
    }
    
    return result;
  }
  
  /**
   * 按优先级排序队列（内部方法）
   */
  private sortQueue(): void {
    const priorityOrder: Record<MessagePriority, number> = {
      'critical': 4,
      'high': 3,
      'normal': 2,
      'low': 1
    };
    
    this.queue.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }
  
  /**
   * 清空所有消息（内部方法）
   */
  clearAll(): void {
    this.queue = [];
    this.pendingMessages.clear();
    console.log('[MessageQueue] 所有消息已清空');
  }
  
  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 全局消息队列实例
 */
export const globalMessageQueue = new MessageQueue();