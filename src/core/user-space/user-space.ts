/**
 * 用户空间核心组件
 * 
 * 将Token绑定的所有资源集中管理，提供统一的用户运行时环境
 */

import { Virtualization, VirtualizationResources } from '../virtualization/virtualization';
import { ExecutorRules } from '../token/token-rule-manager';
import { ContainerConfig } from '../container/enhanced-tool-container';
import { AsyncTaskExecutor, globalAsyncTaskExecutor } from '../async-task/async-task-executor';
import { MessageQueue, globalMessageQueue } from '../message-queue/message-queue';

/**
 * 用户空间接口
 * 包含Token绑定的所有资源和配置
 */
export interface UserSpace {
  token: string;
  role: string;
  
  // 虚拟化资源
  virtualization: Virtualization;
  
  // 执行器规则
  executorRules: Record<string, ExecutorRules>;
  
  // 可见性配置
  visibleTools: Set<string>;
  containerConfig?: ContainerConfig;
  
  // 异步任务执行器（每个用户空间独立实例）
  asyncTaskExecutor: AsyncTaskExecutor;
  
  // 消息队列（共享实例，但提供用户隔离接口）
  messageQueue: MessageQueue;
  
  // 元数据
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

/**
 * 用户空间管理器
 * 管理所有用户的运行时空间
 */
export class UserSpaceManager {
  private userSpaces: Map<string, UserSpace> = new Map();

  /**
   * 获取或创建用户空间
   * @param token 用户Token
   * @param role 用户角色
   * @returns 用户空间实例
   */
  getUserSpace(token: string, role: string): UserSpace {
    // 检查是否已存在
    const existing = this.userSpaces.get(token);
    if (existing && existing.isActive) {
      existing.lastUsed = new Date().toISOString();
      return existing;
    }

    // 创建新的用户空间
    const userSpace: UserSpace = {
      token,
      role,
      virtualization: new Virtualization(),
      executorRules: {},
      visibleTools: new Set<string>(),
      // 为每个用户创建独立的异步任务执行器
      asyncTaskExecutor: new AsyncTaskExecutor(),
      // 使用全局消息队列
      messageQueue: globalMessageQueue,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      isActive: true
    };

    this.userSpaces.set(token, userSpace);
    console.log(`[UserSpaceManager] 为token ${token.substring(0, 8)}... 创建用户空间 (角色: ${role})`);
    
    return userSpace;
  }

  /**
   * 获取用户空间（不创建）
   * @param token 用户Token
   * @returns 用户空间或null
   */
  getUserSpaceIfExists(token: string): UserSpace | null {
    const space = this.userSpaces.get(token);
    if (!space || !space.isActive) return null;
    
    space.lastUsed = new Date().toISOString();
    return space;
  }

  /**
   * 检查用户空间是否存在
   * @param token 用户Token
   * @returns 是否存在
   */
  hasUserSpace(token: string): boolean {
    const space = this.userSpaces.get(token);
    return !!space && space.isActive;
  }

  /**
   * 设置执行器规则
   * @param token 用户Token
   * @param executorId 执行器ID
   * @param rules 规则
   */
  setExecutorRules(token: string, executorId: string, rules: ExecutorRules): void {
    const space = this.getUserSpaceIfExists(token);
    if (space) {
      space.executorRules[executorId] = rules;
    }
  }

  /**
   * 获取执行器规则
   * @param token 用户Token
   * @param executorId 执行器ID
   * @returns 规则
   */
  getExecutorRules(token: string, executorId: string): ExecutorRules | null {
    const space = this.getUserSpaceIfExists(token);
    if (!space) return null;
    
    return space.executorRules[executorId] || null;
  }

  /**
   * 获取所有执行器规则
   * @param token 用户Token
   * @returns 所有规则
   */
  getAllExecutorRules(token: string): Record<string, ExecutorRules> {
    const space = this.getUserSpaceIfExists(token);
    if (!space) return {};
    
    return space.executorRules;
  }

  /**
   * 设置可见工具
   * @param token 用户Token
   * @param toolNames 工具名称列表
   */
  setVisibleTools(token: string, toolNames: string[]): void {
    const space = this.getUserSpaceIfExists(token);
    if (space) {
      space.visibleTools = new Set(toolNames);
    }
  }

  /**
   * 添加可见工具
   * @param token 用户Token
   * @param toolName 工具名称
   */
  addVisibleTool(token: string, toolName: string): void {
    const space = this.getUserSpaceIfExists(token);
    if (space) {
      space.visibleTools.add(toolName);
    }
  }

  /**
   * 检查工具是否可见
   * @param token 用户Token
   * @param toolName 工具名称
   * @returns 是否可见
   */
  isToolVisible(token: string, toolName: string): boolean {
    const space = this.getUserSpaceIfExists(token);
    if (!space) return false;
    
    // 如果visibleTools为空，表示所有工具都可见
    if (space.visibleTools.size === 0) return true;
    
    return space.visibleTools.has(toolName);
  }

  /**
   * 获取可见工具列表
   * @param token 用户Token
   * @returns 可见工具列表
   */
  getVisibleTools(token: string): string[] {
    const space = this.getUserSpaceIfExists(token);
    if (!space) return [];
    
    return Array.from(space.visibleTools);
  }

  /**
   * 设置容器配置
   * @param token 用户Token
   * @param config 容器配置
   */
  setContainerConfig(token: string, config: ContainerConfig): void {
    const space = this.getUserSpaceIfExists(token);
    if (space) {
      space.containerConfig = config;
    }
  }

  /**
   * 获取容器配置
   * @param token 用户Token
   * @returns 容器配置
   */
  getContainerConfig(token: string): ContainerConfig | undefined {
    const space = this.getUserSpaceIfExists(token);
    return space?.containerConfig;
  }

  /**
   * 获取虚拟化资源
   * @param token 用户Token
   * @returns 虚拟化资源
   */
  getVirtualizationResources(token: string): VirtualizationResources | null {
    const space = this.getUserSpaceIfExists(token);
    if (!space) return null;
    
    return space.virtualization.getResources();
  }

  /**
   * 设置虚拟化资源
   * @param token 用户Token
   * @param resources 虚拟化资源
   */
  setVirtualizationResources(token: string, resources: VirtualizationResources): void {
    const space = this.getUserSpaceIfExists(token);
    if (space) {
      space.virtualization.setResources(resources);
    }
  }

  /**
   * 执行虚拟化操作
   * @param token 用户Token
   * @param action 操作名称
   * @param args 操作参数
   * @returns 操作结果
   */
  async executeVirtualization(token: string, action: string, args?: any): Promise<any> {
    const space = this.getUserSpaceIfExists(token);
    if (!space) {
      throw new Error(`用户空间不存在: ${token.substring(0, 8)}...`);
    }
    
    return await space.virtualization.execute(action, args);
  }

  /**
   * 停用用户空间
   * @param token 用户Token
   * @returns 是否成功
   */
  deactivateUserSpace(token: string): boolean {
    const space = this.userSpaces.get(token);
    if (!space) return false;

    space.isActive = false;
    console.log(`[UserSpaceManager] 停用用户空间: ${token.substring(0, 8)}...`);
    return true;
  }

  /**
   * 激活用户空间
   * @param token 用户Token
   * @returns 是否成功
   */
  activateUserSpace(token: string): boolean {
    const space = this.userSpaces.get(token);
    if (!space) return false;

    space.isActive = true;
    space.lastUsed = new Date().toISOString();
    console.log(`[UserSpaceManager] 激活用户空间: ${token.substring(0, 8)}...`);
    return true;
  }

  /**
   * 清理用户空间资源
   * @param token 用户Token
   * @returns 是否成功
   */
  async cleanupUserSpace(token: string): Promise<boolean> {
    const space = this.userSpaces.get(token);
    if (!space) return false;

    try {
      await space.virtualization.cleanup();
      
      // 清理异步任务
      space.asyncTaskExecutor.clearAll();
      
      // 清理用户消息
      space.messageQueue.cleanupUserMessages(token);
      
      space.isActive = false;
      console.log(`[UserSpaceManager] 清理用户空间资源: ${token.substring(0, 8)}...`);
      return true;
    } catch (error) {
      console.error(`[UserSpaceManager] 清理用户空间失败:`, error);
      return false;
    }
  }

  /**
   * 删除用户空间
   * @param token 用户Token
   * @returns 是否成功
   */
  async deleteUserSpace(token: string): Promise<boolean> {
    const space = this.userSpaces.get(token);
    if (!space) return false;

    try {
      await space.virtualization.cleanup();
      
      // 清理异步任务
      space.asyncTaskExecutor.clearAll();
      
      // 清理用户消息
      space.messageQueue.cleanupUserMessages(token);
      
    } catch (error) {
      console.warn(`[UserSpaceManager] 清理虚拟化资源时出错:`, error);
    }

    const deleted = this.userSpaces.delete(token);
    if (deleted) {
      console.log(`[UserSpaceManager] 删除用户空间: ${token.substring(0, 8)}...`);
    }
    return deleted;
  }

  /**
   * 清理所有用户空间
   */
  async clearAll(): Promise<void> {
    const tokens = Array.from(this.userSpaces.keys());
    for (const token of tokens) {
      await this.cleanupUserSpace(token);
    }
    this.userSpaces.clear();
    console.log('[UserSpaceManager] 所有用户空间已清空');
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  } {
    let total = 0;
    let active = 0;
    let inactive = 0;
    const byRole: Record<string, number> = {};

    for (const space of this.userSpaces.values()) {
      total++;
      byRole[space.role] = (byRole[space.role] || 0) + 1;
      
      if (space.isActive) {
        active++;
      } else {
        inactive++;
      }
    }

    return { total, active, inactive, byRole };
  }

  /**
   * 列出用户空间
   * @param includeInactive 是否包含无效的
   * @returns 用户空间列表
   */
  listUserSpaces(includeInactive: boolean = false): UserSpace[] {
    const spaces = Array.from(this.userSpaces.values());
    
    if (includeInactive) {
      return spaces;
    }

    return spaces.filter(space => space.isActive);
  }

  /**
   * 更新用户角色
   * @param token 用户Token
   * @param newRole 新角色
   */
  updateUserRole(token: string, newRole: string): void {
    const space = this.getUserSpaceIfExists(token);
    if (space) {
      const oldRole = space.role;
      space.role = newRole;
      console.log(`[UserSpaceManager] 用户角色更新: ${oldRole} → ${newRole} (${token.substring(0, 8)}...)`);
    }
  }

  /**
   * 获取用户异步任务执行器
   * @param token 用户Token
   * @returns 异步任务执行器
   */
  getAsyncTaskExecutor(token: string): AsyncTaskExecutor | null {
    const space = this.getUserSpaceIfExists(token);
    return space?.asyncTaskExecutor || null;
  }

  /**
   * 获取用户消息队列接口
   * @param token 用户Token
   * @returns 消息队列
   */
  getMessageQueue(token: string): MessageQueue | null {
    const space = this.getUserSpaceIfExists(token);
    return space?.messageQueue || null;
  }
}

/**
 * 全局用户空间管理器实例
 */
export const globalUserSpaceManager = new UserSpaceManager();