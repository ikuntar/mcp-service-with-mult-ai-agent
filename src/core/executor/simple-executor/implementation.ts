/**
 * 简化执行器实现 - 阻塞式执行
 */

import type { Tool, ToolResult } from '../../../types';
import type { 
  IExecutor, 
  ExecutorConfig, 
  TokenValidationResult,
  ExecutionContext,
  WrappedExecutionResult,
  BlockingExecutor,
  ExecutorEventListener
} from './interface';

/**
 * 执行器错误类型
 */
export class ExecutorError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: ExecutionContext,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ExecutorError';
  }
  
  static TOKEN_INVALID = 'TOKEN_INVALID';
  static TIMEOUT = 'TIMEOUT';
  static EXECUTION_FAILED = 'EXECUTION_FAILED';
  static PERMISSION_DENIED = 'PERMISSION_DENIED';
  static TOOL_NOT_FOUND = 'TOOL_NOT_FOUND';
}

/**
 * 执行器配置构建器
 */
export class ExecutorConfigBuilder {
  private config: ExecutorConfig = {};
  
  withTimeout(timeout: number): this {
    this.config.timeout = timeout;
    return this;
  }
  
  withAuth(needAuth: boolean = true): this {
    this.config.needAuth = needAuth;
    return this;
  }
  
  withMetadata(key: string, value: any): this {
    if (!this.config.metadata) {
      this.config.metadata = {};
    }
    this.config.metadata[key] = value;
    return this;
  }
  
  build(): ExecutorConfig {
    return { ...this.config };
  }
  
  static default(): ExecutorConfig {
    return {
      timeout: 30000,
      needAuth: true
    };
  }
  
  static quick(timeout: number = 5000): ExecutorConfig {
    return {
      timeout,
      needAuth: true
    };
  }
}

/**
 * Token验证器工厂
 */
export class TokenValidatorFactory {
  static createRoleBasedValidator(
    roleMap: Record<string, string>
  ): (token: string) => Promise<TokenValidationResult> {
    return async (token: string): Promise<TokenValidationResult> => {
      const role = roleMap[token];
      
      if (!role) {
        return {
          valid: false,
          error: 'Token无效或未授权'
        };
      }
      
      return {
        valid: true,
        role,
        metadata: {
          token,
          role,
          timestamp: Date.now()
        }
      };
    };
  }
  
  static createPrefixValidator(
    prefixRoleMap: Record<string, string>
  ): (token: string) => Promise<TokenValidationResult> {
    return async (token: string): Promise<TokenValidationResult> => {
      for (const [prefix, role] of Object.entries(prefixRoleMap)) {
        if (token.startsWith(prefix)) {
          return {
            valid: true,
            role,
            metadata: {
              token,
              role,
              prefix,
              timestamp: Date.now()
            }
          };
        }
      }
      
      return {
        valid: false,
        error: 'Token前缀不匹配'
      };
    };
  }
  
  static createAlwaysValidValidator(
    defaultRole: string = 'user'
  ): (token: string) => Promise<TokenValidationResult> {
    return async (token: string): Promise<TokenValidationResult> => {
      return {
        valid: true,
        role: defaultRole,
        metadata: {
          token,
          role: defaultRole,
          timestamp: Date.now(),
          alwaysValid: true
        }
      };
    };
  }
}

/**
 * 基础阻塞执行器
 */
export class BasicBlockingExecutor implements IExecutor, BlockingExecutor {
  private listeners: ExecutorEventListener[] = [];
  
  constructor(
    private tokenValidator?: (token: string) => Promise<TokenValidationResult>
  ) {}
  
  async execute(
    tool: Tool,
    args: any,
    token: string,
    config?: ExecutorConfig
  ): Promise<ToolResult> {
    const context: ExecutionContext = {
      toolName: tool.name,
      args,
      token,
      config,
      timestamp: Date.now(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // 1. 验证token
    if (config?.needAuth !== false) {
      const validation = await this.validateToken(token);
      if (!validation.valid) {
        const error = new ExecutorError(
          `Token验证失败: ${validation.error}`,
          ExecutorError.TOKEN_INVALID,
          context
        );
        this.notifyError(error);
        throw error;
      }
      context.role = validation.role;
    }
    
    // 2. 通知开始
    this.notifyStart(context);
    
    try {
      // 3. 执行工具（阻塞式）
      const startTime = Date.now();
      const result = await this.executeBlocking(tool, args, token, config);
      const duration = Date.now() - startTime;
      
      // 4. 包装结果
      const wrappedResult: WrappedExecutionResult = {
        success: true,
        result,
        duration,
        context
      };
      
      // 5. 通知完成
      this.notifyComplete(wrappedResult);
      
      return result;
      
    } catch (error) {
      const executorError = new ExecutorError(
        error instanceof Error ? error.message : String(error),
        ExecutorError.EXECUTION_FAILED,
        context,
        error
      );
      
      this.notifyError(executorError);
      throw executorError;
    }
  }
  
  async blockingExecute(
    toolName: string,
    args: any,
    token: string
  ): Promise<ToolResult> {
    throw new Error('需要重写blockingExecute或提供tool查找逻辑');
  }
  
  async validateToken(token: string): Promise<TokenValidationResult> {
    if (this.tokenValidator) {
      return await this.tokenValidator(token);
    }
    
    if (!token || token.trim() === '') {
      return {
        valid: false,
        error: 'Token为空'
      };
    }
    
    return {
      valid: true,
      role: 'default',
      metadata: {
        token,
        timestamp: Date.now()
      }
    };
  }
  
  protected async executeBlocking(
    tool: Tool,
    args: any,
    token: string,
    config?: ExecutorConfig
  ): Promise<ToolResult> {
    const timeout = config?.timeout || 30000;
    
    return await Promise.race([
      tool.execute(args),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`执行超时: ${timeout}ms`));
        }, timeout);
      })
    ]);
  }
  
  addListener(listener: ExecutorEventListener): void {
    this.listeners.push(listener);
  }
  
  removeListener(listener: ExecutorEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  private notifyStart(context: ExecutionContext): void {
    this.listeners.forEach(listener => {
      if (listener.onExecuteStart) {
        listener.onExecuteStart(context);
      }
    });
  }
  
  private notifyComplete(result: WrappedExecutionResult): void {
    this.listeners.forEach(listener => {
      if (listener.onExecuteComplete) {
        listener.onExecuteComplete(result);
      }
    });
  }
  
  private notifyError(error: ExecutorError): void {
    this.listeners.forEach(listener => {
      if (listener.onExecuteError) {
        listener.onExecuteError(error);
      }
    });
  }
}

/**
 * 工具查找器接口
 */
export interface ToolFinder {
  findTool(name: string): Tool | undefined;
}

/**
 * 执行器管理器实现
 */
export class SimpleExecutorManager implements BlockingExecutor {
  protected executors: Map<string, IExecutor> = new Map();
  protected tokenValidator?: (token: string) => Promise<TokenValidationResult>;
  protected listeners: ExecutorEventListener[] = [];
  
  constructor(tokenValidator?: (token: string) => Promise<TokenValidationResult>) {
    this.tokenValidator = tokenValidator;
    this.registerExecutor('basic', new BasicBlockingExecutor(tokenValidator));
  }
  
  registerExecutor(type: string, executor: IExecutor): void {
    this.executors.set(type, executor);
    
    if (executor instanceof BasicBlockingExecutor) {
      this.listeners.forEach(listener => executor.addListener(listener));
    }
  }
  
  getExecutor(type: string): IExecutor | undefined {
    return this.executors.get(type);
  }
  
  async executeTool(
    tool: Tool,
    args: any,
    token: string,
    config?: ExecutorConfig
  ): Promise<ToolResult> {
    // 获取执行器类型，简化执行器框架只使用basic
    const executor = this.executors.get("basic");
    
    if (!executor) {
      throw new Error("执行器不存在: basic");
    }
    
    return await executor.execute(tool, args, token, config);
  }
  
  async blockingExecute(
    toolName: string,
    args: any,
    token: string
  ): Promise<ToolResult> {
    throw new Error('需要提供tool查找逻辑');
  }
  
  async batchExecute(
    tasks: Array<{
      toolName: string;
      args: any;
      token: string;
    }>
  ): Promise<ToolResult[]> {
    throw new Error('批量执行需要实现tool查找逻辑');
  }
  
  async validateToken(token: string): Promise<TokenValidationResult> {
    if (this.tokenValidator) {
      return await this.tokenValidator(token);
    }
    
    if (!token || token.trim() === '') {
      return { valid: false, error: 'Token为空' };
    }
    
    return {
      valid: true,
      role: 'default',
      metadata: { token, timestamp: Date.now() }
    };
  }
  
  addListener(listener: ExecutorEventListener): void {
    this.listeners.push(listener);
    this.executors.forEach(executor => {
      if (executor instanceof BasicBlockingExecutor) {
        executor.addListener(listener);
      }
    });
  }
  
  removeListener(listener: ExecutorEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
    this.executors.forEach(executor => {
      if (executor instanceof BasicBlockingExecutor) {
        executor.removeListener(listener);
      }
    });
  }
}

/**
 * 增强的执行器管理器（支持工具查找）
 */
export class EnhancedExecutorManager extends SimpleExecutorManager {
  private toolFinder?: ToolFinder;
  
  constructor(
    tokenValidator?: (token: string) => Promise<TokenValidationResult>,
    toolFinder?: ToolFinder
  ) {
    super(tokenValidator);
    this.toolFinder = toolFinder;
  }
  
  setToolFinder(finder: ToolFinder): void {
    this.toolFinder = finder;
  }
  
  async blockingExecute(
    toolName: string,
    args: any,
    token: string,
    config?: ExecutorConfig
  ): Promise<ToolResult> {
    if (!this.toolFinder) {
      throw new Error('未设置工具查找器');
    }
    
    const tool = this.toolFinder.findTool(toolName);
    if (!tool) {
      throw new ExecutorError(
        `工具不存在: ${toolName}`,
        ExecutorError.TOOL_NOT_FOUND
      );
    }
    
    return await this.executeTool(tool, args, token, config);
  }
  
  async batchExecute(
    tasks: Array<{
      toolName: string;
      args: any;
      token: string;
      config?: ExecutorConfig;
    }>
  ): Promise<ToolResult[]> {
    if (!this.toolFinder) {
      throw new Error('未设置工具查找器');
    }
    
    const results: ToolResult[] = [];
    
    for (const task of tasks) {
      const tool = this.toolFinder.findTool(task.toolName);
      if (!tool) {
        throw new ExecutorError(
          `工具不存在: ${task.toolName}`,
          ExecutorError.TOOL_NOT_FOUND
        );
      }
      
      const result = await this.executeTool(tool, task.args, task.token, task.config);
      results.push(result);
    }
    
    return results;
  }
}