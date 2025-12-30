/**
 * 简单记忆系统 - MVP版本
 * 使用数组存储，支持基本的记忆存储和检索
 */

import { MemoryItem } from '../base/types';

export class SimpleMemory {
  private memories: MemoryItem[] = [];
  private maxItems: number;

  constructor(maxItems: number = 50) {
    this.maxItems = maxItems;
  }

  /**
   * 存储记忆
   */
  async store(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<MemoryItem> {
    const memoryItem: MemoryItem = {
      id: this.generateId(),
      type: item.type,
      content: item.content,
      timestamp: new Date().toISOString(),
      metadata: item.metadata
    };

    this.memories.push(memoryItem);

    // 保持内存可控
    if (this.memories.length > this.maxItems) {
      this.memories = this.memories.slice(-this.maxItems);
    }

    return memoryItem;
  }

  /**
   * 检索记忆
   */
  async recall(query: string, type?: MemoryItem['type']): Promise<MemoryItem[]> {
    let results = this.memories;

    // 按类型过滤
    if (type) {
      results = results.filter(m => m.type === type);
    }

    // 按内容匹配
    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(m => 
        m.content.toLowerCase().includes(lowerQuery) ||
        (m.metadata && JSON.stringify(m.metadata).toLowerCase().includes(lowerQuery))
      );
    }

    return results;
  }

  /**
   * 获取最近的记忆
   */
  async getRecent(count: number = 5, type?: MemoryItem['type']): Promise<MemoryItem[]> {
    let results = this.memories;

    if (type) {
      results = results.filter(m => m.type === type);
    }

    return results.slice(-count).reverse();
  }

  /**
   * 清理记忆
   */
  async clear(pattern?: string): Promise<number> {
    if (!pattern) {
      const count = this.memories.length;
      this.memories = [];
      return count;
    }

    const before = this.memories.length;
    this.memories = this.memories.filter(m => 
      !m.content.includes(pattern) && 
      !JSON.stringify(m.metadata).includes(pattern)
    );
    return before - this.memories.length;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    recent: number;
  }> {
    const byType: Record<string, number> = {};
    
    this.memories.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = this.memories.filter(m => new Date(m.timestamp) > oneDayAgo).length;

    return {
      total: this.memories.length,
      byType,
      recent
    };
  }

  /**
   * 导出所有记忆
   */
  async export(): Promise<MemoryItem[]> {
    return [...this.memories];
  }

  /**
   * 从数据恢复
   */
  async import(data: MemoryItem[]): Promise<void> {
    this.memories = data.slice(-this.maxItems);
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}