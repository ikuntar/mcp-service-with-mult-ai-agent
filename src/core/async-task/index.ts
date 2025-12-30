/**
 * 异步任务执行器模块
 * 
 * 提供异步任务执行能力，支持：
 * - 优化的异步任务执行器（无需预先注册工具）
 * - 完整的原始调用数据存储
 * - 丰富的任务状态和返回信息
 */

// 优化版本 - 推荐使用
export { 
  OptimizedAsyncTaskExecutor,
  ContainerToolProvider,
  UserSpaceToolProvider,
  ToolProvider
} from './async-task-executor-optimized';

// 类型定义
export type {
  AsyncTask,
  AsyncTaskStatus,
  OriginalCallData
} from './async-task-executor-optimized';

// 旧版本（保留兼容性）
export { AsyncTaskExecutor } from './async-task-executor';
export { SimpleAsyncTaskExecutor, globalSimpleAsyncTaskExecutor } from './async-task-executor-simple';
export { AsyncMCPExecutor, globalAsyncMCPExecutor } from './async-mcp-executor';
export { AsyncExecutionQueue, globalAsyncExecutionQueue } from './async-execution-queue';