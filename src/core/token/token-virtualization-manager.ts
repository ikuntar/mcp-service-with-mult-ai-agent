/**
 * Token虚拟化管理器
 * 
 * 管理Token与虚拟化对象实例的映射关系
 * 每个Token对应一个独立的虚拟化实例
 */

import { Virtualization, VirtualizationResources } from '../virtualization/virtualization';

export interface TokenVirtualizationInfo {
  token: string;
  virtualization: Virtualization;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

/**
 * Token虚拟化管理器类
 * 
 * @example
 * ```typescript
 * const manager = new TokenVirtualizationManager();
 * 
 * // 为token创建虚拟化实例
 * const virtualization = manager.getVirtualization(token);
 * 
 * // 使用虚拟化实例
 * await virtualization.execute('create', { name: 'vm1' });
 * 
 * // 清理token的虚拟化资源
 * await manager.cleanupToken(token);
 * ```
 */
export class TokenVirtualizationManager {
  private virtualizations: Map<string, TokenVirtualizationInfo> = new Map();

  /**
   * 获取或创建token对应的虚拟化实例
   * @param token 用户Token
   * @returns 虚拟化实例
   */
  getVirtualization(token: string): Virtualization {
    // 检查是否已存在
    const existing = this.virtualizations.get(token);
    if (existing && existing.isActive) {
      existing.lastUsed = new Date().toISOString();
      return existing.virtualization;
    }

    // 创建新的虚拟化实例
    const virtualization = new Virtualization();
    const info: TokenVirtualizationInfo = {
      token,
      virtualization,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      isActive: true
    };

    this.virtualizations.set(token, info);
    console.log(`[TokenVirtualizationManager] 为token ${token.substring(0, 8)}... 创建虚拟化实例`);
    
    return virtualization;
  }

  /**
   * 获取token的虚拟化信息
   * @param token 用户Token
   * @returns 虚拟化信息或null
   */
  getVirtualizationInfo(token: string): TokenVirtualizationInfo | null {
    return this.virtualizations.get(token) || null;
  }

  /**
   * 检查token是否有虚拟化实例
   * @param token 用户Token
   * @returns 是否存在
   */
  hasVirtualization(token: string): boolean {
    const info = this.virtualizations.get(token);
    return !!info && info.isActive;
  }

  /**
   * 停用token的虚拟化实例（软删除）
   * @param token 用户Token
   * @returns 是否操作成功
   */
  deactivateVirtualization(token: string): boolean {
    const info = this.virtualizations.get(token);
    if (!info) return false;

    info.isActive = false;
    console.log(`[TokenVirtualizationManager] 停用token ${token.substring(0, 8)}... 的虚拟化实例`);
    return true;
  }

  /**
   * 激活token的虚拟化实例
   * @param token 用户Token
   * @returns 是否操作成功
   */
  activateVirtualization(token: string): boolean {
    const info = this.virtualizations.get(token);
    if (!info) return false;

    // 检查是否需要重新创建（如果之前被清理）
    if (!info.virtualization) {
      info.virtualization = new Virtualization();
    }

    info.isActive = true;
    info.lastUsed = new Date().toISOString();
    console.log(`[TokenVirtualizationManager] 激活token ${token.substring(0, 8)}... 的虚拟化实例`);
    return true;
  }

  /**
   * 清理token的虚拟化资源
   * @param token 用户Token
   * @returns 是否操作成功
   */
  async cleanupToken(token: string): Promise<boolean> {
    const info = this.virtualizations.get(token);
    if (!info) return false;

    try {
      await info.virtualization.cleanup();
      info.isActive = false;
      console.log(`[TokenVirtualizationManager] 清理token ${token.substring(0, 8)}... 的虚拟化资源`);
      return true;
    } catch (error) {
      console.error(`[TokenVirtualizationManager] 清理虚拟化资源失败:`, error);
      return false;
    }
  }

  /**
   * 删除token的虚拟化实例（完全删除）
   * @param token 用户Token
   * @returns 是否操作成功
   */
  async deleteVirtualization(token: string): Promise<boolean> {
    const info = this.virtualizations.get(token);
    if (!info) return false;

    try {
      await info.virtualization.cleanup();
    } catch (error) {
      console.warn(`[TokenVirtualizationManager] 清理虚拟化资源时出错:`, error);
    }

    const deleted = this.virtualizations.delete(token);
    if (deleted) {
      console.log(`[TokenVirtualizationManager] 删除token ${token.substring(0, 8)}... 的虚拟化实例`);
    }
    return deleted;
  }

  /**
   * 清理所有虚拟化实例
   */
  async clearAll(): Promise<void> {
    const tokens = Array.from(this.virtualizations.keys());
    for (const token of tokens) {
      await this.cleanupToken(token);
    }
    this.virtualizations.clear();
    console.log('[TokenVirtualizationManager] 所有虚拟化实例已清空');
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    active: number;
    inactive: number;
  } {
    let total = 0;
    let active = 0;
    let inactive = 0;

    for (const info of this.virtualizations.values()) {
      total++;
      if (info.isActive) {
        active++;
      } else {
        inactive++;
      }
    }

    return { total, active, inactive };
  }

  /**
   * 列出所有虚拟化实例
   * @param includeInactive 是否包含无效的实例
   * @returns 虚拟化信息数组
   */
  listVirtualizations(includeInactive: boolean = false): TokenVirtualizationInfo[] {
    const instances = Array.from(this.virtualizations.values());
    
    if (includeInactive) {
      return instances;
    }

    return instances.filter(info => info.isActive);
  }

  /**
   * 获取token对应的虚拟化资源
   * @param token 用户Token
   * @returns 虚拟化资源
   */
  getResources(token: string): VirtualizationResources | null {
    const info = this.virtualizations.get(token);
    if (!info || !info.isActive) return null;

    return info.virtualization.getResources();
  }

  /**
   * 为token的虚拟化实例设置资源
   * @param token 用户Token
   * @param resources 虚拟化资源
   * @returns 是否操作成功
   */
  setResources(token: string, resources: VirtualizationResources): boolean {
    const info = this.virtualizations.get(token);
    if (!info || !info.isActive) return false;

    info.virtualization.setResources(resources);
    return true;
  }

  /**
   * 执行token虚拟化实例的操作
   * @param token 用户Token
   * @param action 操作名称
   * @param args 操作参数
   * @returns 操作结果
   */
  async execute(token: string, action: string, args?: any): Promise<any> {
    const info = this.virtualizations.get(token);
    if (!info || !info.isActive) {
      throw new Error(`Token ${token.substring(0, 8)}... 没有有效的虚拟化实例`);
    }

    return await info.virtualization.execute(action, args);
  }
}

/**
 * 全局Token虚拟化管理器实例
 */
export const globalTokenVirtualizationManager = new TokenVirtualizationManager();