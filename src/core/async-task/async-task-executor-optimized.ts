/**
 * 异步任务执行器 - 优化版本
 * 
 * 简化设计：
 * 1. 无需预先注册工具，直接使用EnhancedToolContainer
 * 2. 支持从用户空间获取工具
 * 3. 保持完整的原始调用数据和返回信息
 */

import { Tool, ToolResult } from '../../types';
import { EnhancedToolContainer } from '../container/enhanced-tool-container';

/**
 * 异步任务状态
 */
export type AsyncTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * 原始调用数据 - 存储完整的调用信息
 */
export interface OriginalCallData {
  token: string;           // 用户Token（明确的用户标识）
  toolName: string;        // 工具名称
  toolArgs: any;           // 工具参数
  metadata?: Record<string, any>; // 元数据
  timestamp: string;       // 调用时间
  requestId?: string;      // 请求ID（可选，用于外部追踪）
}

/**
 * 异步任务接口 - 包含完整信息
 */
export interface AsyncTask {
  id: string;                    // 任务唯一ID
  token: string;                 // 用户Token
  toolName: string;              // 工具名称
  toolArgs: any;                 // 工具参数（原始输入）
  status: AsyncTaskStatus;       // 任务状态
  createdAt: string;             // 创建时间
  startedAt?: string;            // 开始时间
  completedAt?: string;          // 完成时间
  result?: ToolResult;           // 执行结果
  error?: string;                // 错误信息
  metadata?: Record<string, any>; // 任务元数据
  originalCall: OriginalCallData; // ✅ 完整的原始调用数据
  executionTime?: number;        // 执行时间（毫秒）
}

/**
 * 工具提供者接口
 * 用于从用户空间或其他来源获取工具
 */
export interface ToolProvider {
  /**
   * 获取工具
   * @param toolName 工具名称
   * @param token 用户Token（用于权限检查）
   */
  getTool(toolName: string, token?: string): Tool | undefined;
  
  /**
   * 检查是否有权访问工具
   * @param token 用户Token
   * @param toolName 工具名称
   */
  canAccess(token: string, toolName: string): boolean;
}

/**
 * 异步任务执行器 - 优化版
 * 
 * 特点：
 * 1. 无需预先注册工具
 * 2. 通过ToolProvider动态获取工具
 * 3. 支持权限检查
 * 4. 保持完整的原始调用数据
 */
export class OptimizedAsyncTaskExecutor {
  private tasks: Map<string, AsyncTask> = new Map();
  private taskCallbacks: Map<string, (task: AsyncTask) => void> = new Map();
  private toolProvider: ToolProvider;

  constructor(toolProvider: ToolProvider) {
    this.toolProvider = toolProvider;
  }

  /**
   * 提交异步任务 - 无需预先注册
   * @param token 用户Token
   * @param toolName 工具名称
   * @param toolArgs 工具参数
   * @param metadata 任务元数据
   * @param requestId 外部请求ID
   */
  submitTask(
    token: string,
    toolName: string,
    toolArgs: any,
    metadata?: Record<string, any>,
    requestId?: string
  ): AsyncTask {
    // 检查权限
    if (!this.toolProvider.canAccess(token, toolName)) {
      throw new Error(`用户无权访问工具: ${toolName}`);
    }

    // 获取工具
    const tool = this.toolProvider.getTool(toolName, token);
    if (!tool) {
      throw new Error(`MCP工具不存在: ${toolName}`);
    }

    const now = new Date().toISOString();
    const taskId = this.generateTaskId();

    // 构建原始调用数据
    const originalCall: OriginalCallData = {
      token,
      toolName,
      toolArgs,
      metadata,
      timestamp: now,
      requestId
    };

    // 构建任务对象
    const task: AsyncTask = {
      id: taskId,
      token,
      toolName,
      toolArgs,
      status: 'pending',
      createdAt: now,
      metadata,
      originalCall
    };

    this.tasks.set(taskId, task);
    console.log(`[OptimizedAsyncTaskExecutor] 任务提交: ${taskId} (${toolName})`);

    // 立即开始异步执行
    this.executeTask(taskId, tool).catch(error => {
      console.error(`[OptimizedAsyncTaskExecutor] 任务执行异常: ${taskId}`, error);
    });

    return task;
  }

  /**
   * 执行任务（内部方法）
   */
  private async executeTask(taskId: string, tool: Tool): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      // 更新状态为运行中
      task.status = 'running';
      task.startedAt = new Date().toISOString();
      this.tasks.set(taskId, task);

      // 记录开始时间
      const startTime = Date.now();

      // 执行工具（阻塞式调用）
      const result = await tool.execute(task.toolArgs);

      // 计算执行时间
      const executionTime = Date.now() - startTime;

      // 更新状态为完成
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date().toISOString();
      task.executionTime = executionTime;

    } catch (error: any) {
      // 更新状态为失败
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date().toISOString();
      task.executionTime = Date.now() - Date.parse(task.startedAt || task.createdAt);
    }

    this.tasks.set(taskId, task);
    this.notifyCallbacks(task);
  }

  /**
   * 获取任务状态 - 包含完整信息
   */
  getTask(taskId: string): AsyncTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取任务的原始调用数据
   */
  getTaskOriginalCall(taskId: string): OriginalCallData | undefined {
    const task = this.tasks.get(taskId);
    return task?.originalCall;
  }

  /**
   * 获取用户的所有任务
   */
  getUserTasks(token: string): AsyncTask[] {
    return Array.from(this.tasks.values()).filter(task => task.token === token);
  }

  /**
   * 等待任务完成
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

    console.log(`[OptimizedAsyncTaskExecutor] 任务已取消: ${taskId}`);
    return true;
  }

  /**
   * 删除任务
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
    console.log('[OptimizedAsyncTaskExecutor] 所有任务已清空');
  }

  /**
   * 清理用户任务
   */
  cleanupUserTasks(token: string): number {
    const userTasks = this.getUserTasks(token);
    let count = 0;

    for (const task of userTasks) {
      if (this.deleteTask(task.id)) {
        count++;
      }
    }

    console.log(`[OptimizedAsyncTaskExecutor] 清理用户 ${token.substring(0, 8)}... 的 ${count} 个任务`);
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
 * EnhancedToolContainer工具提供者
 * 将EnhancedToolContainer适配为ToolProvider
 */
export class ContainerToolProvider implements ToolProvider {
  constructor(private container: EnhancedToolContainer) {}

  getTool(toolName: string, token?: string): Tool | undefined {
    // 直接从容器获取原始工具
    return this.container.findRaw(toolName);
  }

  canAccess(token: string, toolName: string): boolean {
    // 这里需要根据token获取用户角色
    // 暂时返回true，实际使用时需要集成TokenManager
    // 可以通过用户空间获取角色信息
    return true;
  }
}

/**
 * 用户空间工具提供者
 * 基于用户空间的工具获取
 */
export class UserSpaceToolProvider implements ToolProvider {
  constructor(
    private getContainer: (token: string) => EnhancedToolContainer | undefined,
    private getRole: (token: string) => string
  ) {}

  getTool(toolName: string, token?: string): Tool | undefined {
    if (!token) return undefined;
    
    const container = this.getContainer(token);
    if (!container) return undefined;
    
    return container.findRaw(toolName);
  }

  canAccess(token: string, toolName: string): boolean {
    const role = this.getRole(token);
    if (!role) return false;
    
    const container = this.getContainer(token);
    if (!container) return false;
    
    return container.canAccess(role, toolName);
  }
}