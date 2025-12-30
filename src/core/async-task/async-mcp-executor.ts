/**
 * 异步MCP执行器
 * 
 * 将异步执行队列改造成异步MCP工具，用户可以全权处理
 * 支持：
 * - 异步MCP工具注册
 * - 异步任务执行
 * - 任务状态管理
 */

import { Tool, ToolResult } from '../../types';

/**
 * 异步MCP工具接口
 */
export interface AsyncMCPTool {
  name: string;
  description: string;
  inputSchema: any;
  execute: (args: any) => Promise<ToolResult>;
  metadata?: Record<string, any>;
}

/**
 * 异步任务状态
 */
export type AsyncTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * 异步任务接口
 */
export interface AsyncTask {
  id: string;
  token: string;
  toolName: string;
  args: any;
  status: AsyncTaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: ToolResult;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * 异步MCP执行器
 * 用户可以全权处理，支持异步MCP工具
 */
export class AsyncMCPExecutor {
  private tasks: Map<string, AsyncTask> = new Map();
  private tools: Map<string, AsyncMCPTool> = new Map();
  private taskCallbacks: Map<string, (task: AsyncTask) => void> = new Map();

  /**
   * 注册异步MCP工具
   * @param tool 异步MCP工具
   */
  registerTool(tool: AsyncMCPTool): void {
    this.tools.set(tool.name, tool);
    console.log(`[AsyncMCPExecutor] 注册异步MCP工具: ${tool.name}`);
  }

  /**
   * 注销异步MCP工具
   * @param toolName 工具名称
   */
  unregisterTool(toolName: string): boolean {
    const removed = this.tools.delete(toolName);
    if (removed) {
      console.log(`[AsyncMCPExecutor] 注销异步MCP工具: ${toolName}`);
    }
    return removed;
  }

  /**
   * 获取所有异步MCP工具
   */
  getTools(): AsyncMCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取异步MCP工具
   * @param toolName 工具名称
   */
  getTool(toolName: string): AsyncMCPTool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * 异步执行MCP工具
   * @param token 用户Token
   * @param toolName 工具名称
   * @param args 参数
   * @param metadata 元数据
   * @returns 任务对象
   */
  async executeAsync(
    token: string,
    toolName: string,
    args: any,
    metadata?: Record<string, any>
  ): Promise<AsyncTask> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`异步MCP工具不存在: ${toolName}`);
    }

    const task: AsyncTask = {
      id: this.generateTaskId(),
      token,
      toolName,
      args,
      status: 'pending',
      createdAt: new Date().toISOString(),
      metadata
    };

    this.tasks.set(task.id, task);
    console.log(`[AsyncMCPExecutor] 异步任务提交: ${task.id} (${toolName})`);

    // 立即开始异步执行
    this.executeTask(task.id).catch(error => {
      console.error(`[AsyncMCPExecutor] 任务执行异常: ${task.id}`, error);
    });

    return task;
  }

  /**
   * 执行任务（内部方法）
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const tool = this.tools.get(task.toolName);
    if (!tool) {
      task.status = 'failed';
      task.error = '工具未找到';
      task.completedAt = new Date().toISOString();
      this.notifyCallbacks(task);
      return;
    }

    try {
      // 更新状态为运行中
      task.status = 'running';
      task.startedAt = new Date().toISOString();
      this.tasks.set(taskId, task);

      // 异步执行工具
      const result = await tool.execute(task.args);

      // 更新状态为完成
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date().toISOString();

    } catch (error: any) {
      // 更新状态为失败
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date().toISOString();
    }

    this.tasks.set(taskId, task);
    this.notifyCallbacks(task);
  }

  /**
   * 获取任务状态
   * @param taskId 任务ID
   */
  getTask(taskId: string): AsyncTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取用户的所有任务
   * @param token 用户Token
   */
  getUserTasks(token: string): AsyncTask[] {
    return Array.from(this.tasks.values()).filter(task => task.token === token);
  }

  /**
   * 等待任务完成
   * @param taskId 任务ID
   * @param timeout 超时时间（毫秒）
   */
  waitForTask(taskId: string, timeout: number = 30000): Promise<AsyncTask> {
    return new Promise((resolve, reject) => {
      const task = this.tasks.get(taskId);
      if (!task) {
        reject(new Error('任务不存在'));
        return;
      }

      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        resolve(task);
        return;
      }

      const callback = (completedTask: AsyncTask) => {
        if (completedTask.id === taskId) {
          clearTimeout(timer);
          this.taskCallbacks.delete(taskId);
          resolve(completedTask);
        }
      };

      this.taskCallbacks.set(taskId, callback);

      const timer = setTimeout(() => {
        this.taskCallbacks.delete(taskId);
        reject(new Error('任务等待超时'));
      }, timeout);
    });
  }

  /**
   * 取消任务
   * @param taskId 任务ID
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'pending' && task.status !== 'running') {
      return false;
    }

    task.status = 'cancelled';
    task.completedAt = new Date().toISOString();
    this.tasks.set(taskId, task);
    this.notifyCallbacks(task);

    console.log(`[AsyncMCPExecutor] 任务已取消: ${taskId}`);
    return true;
  }

  /**
   * 删除任务
   * @param taskId 任务ID
   */
  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // 只能删除已完成、失败或取消的任务
    if (task.status === 'running' || task.status === 'pending') {
      return false;
    }

    this.tasks.delete(taskId);
    this.taskCallbacks.delete(taskId);
    return true;
  }

  /**
   * 获取任务统计
   * @param token 用户Token（可选）
   */
  getStats(token?: string): {
    total: number;
    byStatus: Record<string, number>;
    userTasks?: number;
  } {
    const tasks = token ? this.getUserTasks(token) : Array.from(this.tasks.values());

    const byStatus: Record<string, number> = {};
    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    }

    const result: any = {
      total: tasks.length,
      byStatus
    };

    if (token) {
      result.userTasks = tasks.length;
    }

    return result;
  }

  /**
   * 清空所有任务
   */
  clearAll(): void {
    this.tasks.clear();
    this.taskCallbacks.clear();
    console.log('[AsyncMCPExecutor] 所有任务已清空');
  }

  /**
   * 清理用户任务
   * @param token 用户Token
   */
  cleanupUserTasks(token: string): number {
    const userTasks = this.getUserTasks(token);
    let count = 0;

    for (const task of userTasks) {
      if (this.deleteTask(task.id)) {
        count++;
      }
    }

    console.log(`[AsyncMCPExecutor] 清理用户 ${token.substring(0, 8)}... 的 ${count} 个任务`);
    return count;
  }

  /**
   * 通知回调
   */
  private notifyCallbacks(task: AsyncTask): void {
    const callback = this.taskCallbacks.get(task.id);
    if (callback) {
      callback(task);
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `async_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 全局异步MCP执行器实例
 */
export const globalAsyncMCPExecutor = new AsyncMCPExecutor();