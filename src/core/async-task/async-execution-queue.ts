/**
 * 异步执行队列 - 基于对象的执行器
 * 
 * 为MCP工具提供异步任务执行能力，支持：
 * - 任务队列管理
 * - 基于对象的执行器
 * - 任务状态跟踪
 * - 结果缓存
 * 
 * 注意：此功能仅对特定MCP工具开放，用户不能直接访问
 */

import { Tool, ToolResult } from '../../types';

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
 * 执行器对象接口
 */
export interface ExecutorObject {
  id: string;
  name: string;
  description: string;
  execute: (args: any) => Promise<ToolResult>;
  metadata?: Record<string, any>;
}

/**
 * 异步执行队列管理器
 * 
 * 注意：此类的所有方法都应通过MCP工具调用，用户不能直接访问
 */
export class AsyncExecutionQueue {
  private tasks: Map<string, AsyncTask> = new Map();
  private executors: Map<string, ExecutorObject> = new Map();
  private taskCallbacks: Map<string, (task: AsyncTask) => void> = new Map();
  
  /**
   * 注册执行器对象（仅限MCP工具调用）
   */
  registerExecutor(executor: ExecutorObject): void {
    this.executors.set(executor.id, executor);
    console.log(`[AsyncExecutionQueue] 注册执行器: ${executor.name} (${executor.id})`);
  }
  
  /**
   * 注销执行器（仅限MCP工具调用）
   */
  unregisterExecutor(executorId: string): boolean {
    const removed = this.executors.delete(executorId);
    if (removed) {
      console.log(`[AsyncExecutionQueue] 注销执行器: ${executorId}`);
    }
    return removed;
  }
  
  /**
   * 获取所有执行器（仅限MCP工具调用）
   */
  getExecutors(): ExecutorObject[] {
    return Array.from(this.executors.values());
  }
  
  /**
   * 获取执行器（仅限MCP工具调用）
   */
  getExecutor(executorId: string): ExecutorObject | undefined {
    return this.executors.get(executorId);
  }
  
  /**
   * 提交异步任务（仅限MCP工具调用）
   */
  submitTask(
    token: string,
    executorId: string,
    args: any,
    metadata?: Record<string, any>
  ): AsyncTask {
    const executor = this.executors.get(executorId);
    if (!executor) {
      throw new Error(`执行器不存在: ${executorId}`);
    }
    
    const task: AsyncTask = {
      id: this.generateTaskId(),
      token,
      toolName: executor.name,
      args,
      status: 'pending',
      createdAt: new Date().toISOString(),
      metadata
    };
    
    this.tasks.set(task.id, task);
    console.log(`[AsyncExecutionQueue] 任务提交: ${task.id} (${executor.name})`);
    
    // 立即开始执行
    this.executeTask(task.id).catch(error => {
      console.error(`[AsyncExecutionQueue] 任务执行异常: ${task.id}`, error);
    });
    
    return task;
  }
  
  /**
   * 执行任务（内部方法）
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    const executor = this.executors.get(task.toolName);
    if (!executor) {
      task.status = 'failed';
      task.error = '执行器未找到';
      task.completedAt = new Date().toISOString();
      this.notifyCallbacks(task);
      return;
    }
    
    try {
      // 更新状态为运行中
      task.status = 'running';
      task.startedAt = new Date().toISOString();
      this.tasks.set(taskId, task);
      
      // 执行任务
      const result = await executor.execute(task.args);
      
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
   * 获取任务状态（仅限MCP工具调用）
   */
  getTask(taskId: string): AsyncTask | undefined {
    return this.tasks.get(taskId);
  }
  
  /**
   * 获取用户的所有任务（仅限MCP工具调用）
   */
  getUserTasks(token: string): AsyncTask[] {
    return Array.from(this.tasks.values()).filter(task => task.token === token);
  }
  
  /**
   * 取消任务（仅限MCP工具调用）
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
    
    console.log(`[AsyncExecutionQueue] 任务已取消: ${taskId}`);
    return true;
  }
  
  /**
   * 等待任务完成（仅限MCP工具调用）
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
   * 删除任务（仅限MCP工具调用）
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
   * 清理用户任务（内部方法）
   */
  cleanupUserTasks(token: string): number {
    const userTasks = this.getUserTasks(token);
    let count = 0;
    
    for (const task of userTasks) {
      if (this.deleteTask(task.id)) {
        count++;
      }
    }
    
    console.log(`[AsyncExecutionQueue] 清理用户 ${token.substring(0, 8)}... 的 ${count} 个任务`);
    return count;
  }
  
  /**
   * 获取任务统计（仅限MCP工具调用）
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
   * 清空所有任务（内部方法）
   */
  clearAll(): void {
    this.tasks.clear();
    this.taskCallbacks.clear();
    console.log('[AsyncExecutionQueue] 所有任务已清空');
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
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 全局异步执行队列实例
 */
export const globalAsyncExecutionQueue = new AsyncExecutionQueue();