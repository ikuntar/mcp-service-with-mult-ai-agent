/**
 * MCP框架 - 统一执行器架构
 * 导出所有核心组件
 */

// 类型定义
export * from './types';

// 核心组件 - 模块化导出

// 异步任务执行器模块
export {
  OptimizedAsyncTaskExecutor,
  ContainerToolProvider,
  UserSpaceToolProvider,
  AsyncTaskExecutor,
  SimpleAsyncTaskExecutor,
  globalSimpleAsyncTaskExecutor,
  AsyncMCPExecutor,
  globalAsyncMCPExecutor,
  AsyncExecutionQueue,
  globalAsyncExecutionQueue
} from './core/async-task';

export type {
  AsyncTask,
  AsyncTaskStatus,
  OriginalCallData
} from './core/async-task';

// 消息队列模块
export {
  MessageQueue,
  globalMessageQueue
} from './core/message-queue';

export type {
  Message,
  MessageType,
  MessagePriority
} from './core/message-queue';

// 用户空间模块
export {
  OptimizedUserSpaceManager,
  globalOptimizedUserSpaceManager,
  UserSpace,
  UserSpaceManager,
  globalUserSpaceManager,
  UserSpaceUnifiedExecutor,
  UserSpaceExecutorFactory
} from './core/user-space';

// 执行器框架模块
export {
  UnifiedExecutorLayer,
  ExecutorFactory,
  BasicBlockingExecutor,
  SimpleExecutorManager,
  EnhancedExecutorManager,
  ToolFinder,
  ExecutorError,
  TokenValidatorFactory,
  ExecutorConfigBuilder
} from './core/executor';

export type {
  IExecutor,
  BlockingExecutor,
  ExecutorConfig,
  TokenValidationResult,
  ExecutionContext,
  WrappedExecutionResult,
  ExecutorEventListener,
  TokenValidator,
  ExecutorManager,
  IExecutorFactory,
  ExecutorInstance
} from './core/executor';

// Token管理模块
export {
  TokenManager,
  globalTokenManager,
  TokenRuleManager,
  TokenVirtualizationManager,
  globalTokenVirtualizationManager
} from './core/token';

export type {
  TokenInfo,
  ExecutorRules,
  TokenVirtualizationInfo
} from './core/token';

// 容器模块
export {
  EnhancedToolContainer,
  RoleBasedToolGroup,
  RoleBasedExtendedToolSet,
  ToolsetConfigManager,
  globalToolsetConfigManager,
  ConfigValidator,
  ToolsetConfigBuilder,
  ToolsetTemplates,
  TOOLSET_CONFIGS,
  initializeToolsetConfigs,
  getToolsetConfig,
  setToolsetDisplayMode,
  DEFAULT_TOOLSET_CONFIG
} from './core/container';

export type {
  Role,
  ContainerConfig
} from './core/container';

// 虚拟化模块
export {
  Virtualization
} from './core/virtualization';

export type {
  VirtualizationResources
} from './core/virtualization';

// 存储模块
export {
  RuleStorage,
  FileRuleStorage
} from './core/storage';

// 工具集 - 保持原有导出
export { ruleManagementTools } from './tools/executor-rule-management';
export { setRuleManager } from './tools/executor-rule-management';
export { tokenManagementTools } from './tools/token-management';
export { userSpaceManagementTools } from './tools/user-space-tools';
export { virtualizationManagementTools } from './tools/token-virtualization-tools';

// 新增异步任务和消息队列工具
export { asyncTaskTools } from './tools/async-task-tools';
export { userMessageQueueTools } from './tools/user-message-queue-tools';

// AI-Agent模块
export {
  AgentCore,
  SimpleMemory,
  createAgent
} from './core/ai-agent';

export type {
  Task,
  ActionResult,
  MemoryItem,
  AgentState
} from './core/ai-agent';
