/**
 * 基于用户空间的统一执行器层
 * 
 * 简化的执行流程：直接通过用户空间管理器处理所有操作
 */

import { Tool, ToolResult } from '../../types';
import { UserSpaceManager } from './user-space';
import { UserSpaceExecutorFactory } from './user-space-executor-factory';

export class UserSpaceUnifiedExecutor {
  private userSpaceManager: UserSpaceManager;
  private executorFactory: UserSpaceExecutorFactory;

  constructor() {
    this.userSpaceManager = new UserSpaceManager();
    this.executorFactory = new UserSpaceExecutorFactory(this.userSpaceManager);
  }

  /**
   * 执行工具（统一入口）
   * 
   * 流程：
   * 1. 验证Token并获取/创建用户空间
   * 2. 检查工具可见性
   * 3. 创建执行器实例
   * 4. 执行工具
   * 
   * @param tool 工具对象
   * @param args 执行参数
   * @param token 用户Token
   * @param role 用户角色（如果用户空间不存在，将使用此角色创建）
   * @returns 执行结果
   */
  async executeTool(
    tool: Tool, 
    args: any, 
    token: string, 
    role?: string
  ): Promise<ToolResult> {
    try {
      // 1. 获取或创建用户空间
      let userSpace = this.userSpaceManager.getUserSpaceIfExists(token);
      
      if (!userSpace) {
        if (!role) {
          return {
            content: [{ type: 'text', text: '错误: 用户空间不存在，请提供role参数创建' }],
            isError: true
          };
        }
        userSpace = this.userSpaceManager.getUserSpace(token, role);
      }

      // 2. 检查工具可见性
      if (!this.userSpaceManager.isToolVisible(token, tool.name)) {
        return {
          content: [{ type: 'text', text: `错误: 工具 "${tool.name}" 对当前用户不可见` }],
          isError: true
        };
      }

      // 3. 创建执行器实例
      const executor = await this.executorFactory.create(tool, token);

      // 4. 执行工具
      const result = await executor.execute(args);

      return result;
    } catch (error: any) {
      return {
        content: [{ 
          type: 'text', 
          text: `执行错误: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  /**
   * 快速执行（不检查可见性）
   * 用于内部工具或已验证的场景
   */
  async quickExecute(
    tool: Tool, 
    args: any, 
    token: string, 
    role: string
  ): Promise<ToolResult> {
    try {
      // 确保用户空间存在
      if (!this.userSpaceManager.hasUserSpace(token)) {
        this.userSpaceManager.getUserSpace(token, role);
      }

      // 创建执行器并执行
      const executor = await this.executorFactory.create(tool, token);
      return await executor.execute(args);
    } catch (error: any) {
      return {
        content: [{ 
          type: 'text', 
          text: `执行错误: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  /**
   * 获取用户空间管理器
   */
  getUserSpaceManager(): UserSpaceManager {
    return this.userSpaceManager;
  }

  /**
   * 获取执行器工厂
   */
  getExecutorFactory(): UserSpaceExecutorFactory {
    return this.executorFactory;
  }

  /**
   * 批量执行工具
   */
  async executeBatch(
    tasks: Array<{ tool: Tool; args: any; token: string; role?: string }>
  ): Promise<Array<{ index: number; result: ToolResult }>> {
    const results: Array<{ index: number; result: ToolResult }> = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      try {
        const result = await this.executeTool(task.tool, task.args, task.token, task.role);
        results.push({ index: i, result });
      } catch (error: any) {
        results.push({
          index: i,
          result: {
            content: [{ type: 'text' as const, text: `批量执行错误: ${error.message}` }],
            isError: true
          }
        });
      }
    }

    return results;
  }

  /**
   * 获取执行统计
   */
  getStats() {
    return this.userSpaceManager.getStats();
  }

  /**
   * 清理所有资源
   */
  async cleanup(): Promise<void> {
    await this.userSpaceManager.clearAll();
    console.log('[UserSpaceUnifiedExecutor] 所有资源已清理');
  }
}