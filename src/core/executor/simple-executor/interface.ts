/**
 * 执行器接口定义
 */

import type { Tool, ToolResult } from '../../../types';

/**
 * 执行器配置接口
 */
export interface ExecutorConfig {
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否需要权限验证 */
  needAuth?: boolean;
  /** 额外的元数据 */
  metadata?: Record<string, any>;
}

/**
 * Token验证结果
 */
export interface TokenValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 关联的角色 */
  role?: string;
  /** 错误信息（如果无效） */
  error?: string;
  /** Token元数据 */
  metadata?: Record<string, any>;
}

/**
 * 执行器接口
 */
export interface IExecutor {
  execute(
    tool: Tool, 
    args: any, 
    token: string, 
    config?: ExecutorConfig
  ): Promise<ToolResult>;
  
  validateToken(token: string): Promise<TokenValidationResult>;
}

/**
 * 阻塞式执行器接口
 */
export interface BlockingExecutor {
  blockingExecute(
    toolName: string,
    args: any,
    token: string
  ): Promise<ToolResult>;
  
  batchExecute?(
    tasks: Array<{
      toolName: string;
      args: any;
      token: string;
    }>
  ): Promise<ToolResult[]>;
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  toolName: string;
  args: any;
  token: string;
  role?: string;
  config?: ExecutorConfig;
  timestamp: number;
  requestId?: string;
}

/**
 * 执行结果包装器
 */
export interface WrappedExecutionResult {
  success: boolean;
  result?: ToolResult;
  error?: string;
  duration: number;
  context: ExecutionContext;
}

/**
 * Token验证器接口
 */
export interface TokenValidator {
  validate(token: string): Promise<TokenValidationResult>;
  refreshToken?(token: string): Promise<string>;
}

/**
 * 执行器工厂接口
 */
export interface ExecutorFactory {
  createExecutor(type: string, config?: ExecutorConfig): IExecutor;
}

/**
 * 执行器管理器接口
 */
export interface ExecutorManager {
  registerExecutor(type: string, executor: IExecutor): void;
  getExecutor(type: string): IExecutor | undefined;
  executeTool(
    tool: Tool,
    args: any,
    token: string,
    config?: ExecutorConfig
  ): Promise<ToolResult>;
}

/**
 * 执行器事件监听器
 */
export interface ExecutorEventListener {
  onExecuteStart?(context: ExecutionContext): void;
  onExecuteComplete?(result: WrappedExecutionResult): void;
  onExecuteError?(error: any): void;
  onTokenInvalid?(token: string, error: string): void;
}