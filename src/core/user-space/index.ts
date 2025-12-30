/**
 * 用户空间模块
 * 
 * 提供用户隔离的运行时环境，支持：
 * - 异步任务执行器
 * - 消息队列
 * - 虚拟化资源
 * - 执行器规则
 * - 工具可见性控制
 */

// 优化版本 - 推荐使用
export {
  OptimizedUserSpaceManager,
  globalOptimizedUserSpaceManager
} from './user-space-optimized';

// 原始版本（保留兼容性）
export {
  UserSpace,
  UserSpaceManager,
  globalUserSpaceManager
} from './user-space';

// 统一执行器
export { UserSpaceUnifiedExecutor } from './user-space-unified-executor';
export { UserSpaceExecutorFactory } from './user-space-executor-factory';