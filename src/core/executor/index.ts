/**
 * 执行器框架模块
 * 
 * 提供统一的执行器层和容器集成，支持：
 * - 统一执行器层
 * - 执行器工厂
 * - 简单执行器
 * - 接口定义
 */

// 统一执行器层
export { UnifiedExecutorLayer } from './unified-executor-layer';
export { ExecutorFactory } from './executor-factory';

// 简单执行器实现
export {
  BasicBlockingExecutor,
  SimpleExecutorManager,
  EnhancedExecutorManager,
  ToolFinder,
  ExecutorError,
  TokenValidatorFactory,
  ExecutorConfigBuilder
} from './simple-executor/implementation';

// 简单执行器接口
export type {
  IExecutor,
  BlockingExecutor,
  ExecutorConfig,
  TokenValidationResult,
  ExecutionContext,
  WrappedExecutionResult,
  ExecutorEventListener,
  TokenValidator,
  ExecutorManager
} from './simple-executor/interface';

// 接口定义
export type { IExecutorFactory } from './interfaces/executor-factory';
export type { ExecutorInstance } from './interfaces/executor-instance';

// 重新导出类型
export type { Tool, ToolResult } from '../../types';