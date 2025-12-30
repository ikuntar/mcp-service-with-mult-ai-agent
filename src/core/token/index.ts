/**
 * Token管理模块
 * 
 * 提供Token和角色管理，支持：
 * - Token创建和验证
 * - 规则管理
 * - 虚拟化管理
 */

export { TokenManager, globalTokenManager } from './token-manager';
export { TokenRuleManager } from './token-rule-manager';
export { TokenVirtualizationManager, globalTokenVirtualizationManager } from './token-virtualization-manager';

export type { TokenInfo } from './token-manager';
export type { ExecutorRules } from './token-rule-manager';
export type { TokenVirtualizationInfo } from './token-virtualization-manager';