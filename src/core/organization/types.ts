/**
 * 组织架构 - 精简类型定义
 * 
 * 核心概念：
 * - 协作组件：通过组合用户空间实现职权，作为代理中间件
 * - 组织成员：可以同时在多个协作组件中
 * - 代理执行：协作组件作为中间件，代理成员执行并赋予权限
 */

import { UserSpace } from '../user-space/user-space';

/**
 * 协作组件配置
 */
export interface CollaborationComponentConfig {
  id: string;
  name: string;
  description?: string;
  
  // 元数据
  metadata?: Record<string, any>;
}

/**
 * 组织成员（基于用户空间）
 */
export interface OrganizationMember {
  id: string;
  name: string;
  userToken: string;           // 用户的原始Token
  userSpace: UserSpace;        // 继承的用户空间
  
  // 协作组件成员关系
  collaborationComponents: Set<string>;  // 所在的协作组件ID列表
  
  // 成员角色（新增）
  role: 'admin' | 'member';   // 管理员或普通成员
  
  // 成员状态
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  lastActive?: string;
  
  // 元数据
  metadata?: Record<string, any>;
}

/**
 * 代理执行上下文
 */
export interface ProxyExecutionContext {
  memberToken: string;      // 成员原始Token
  collaborationUnitId: string; // 协作单元ID
  requestedTool: string;    // 请求的工具
  requestedAction: string;  // 请求的动作
  resource?: string;        // 操作的资源
  metadata?: Record<string, any>;
}

/**
 * 代理执行结果
 */
export interface ProxyExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime?: number;
  metadata?: Record<string, any>;
}

/**
 * 全局组织管理器配置
 */
export interface GlobalOrganizationManagerConfig {
  // Token生态集成
  tokenManager: any;  // TokenManager实例
  
  // 默认配置
  maxCollaborationUnits?: number;
  maxMembersPerUnit?: number;
  
  // 事件配置
  enableEvents?: boolean;
  auditLevel?: 'none' | 'basic' | 'detailed' | 'full';
}

/**
 * 组织事件类型
 */
export enum OrganizationEventType {
  // 成员事件
  MEMBER_CREATED = 'member_created',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MEMBER_SUSPENDED = 'member_suspended',
  
  // 协作单元事件
  COLLABORATION_UNIT_CREATED = 'collaboration_unit_created',
  COLLABORATION_UNIT_UPDATED = 'collaboration_unit_updated',
  COLLABORATION_UNIT_DELETED = 'collaboration_unit_deleted',
  
  // 代理执行事件
  PROXY_EXECUTION = 'proxy_execution',
  PROXY_EXECUTION_FAILED = 'proxy_execution_failed',
}

/**
 * 组织事件
 */
export interface OrganizationEvent {
  type: OrganizationEventType;
  timestamp: string;
  data: any;
  actor?: string;  // 触发者
  target?: string; // 目标
}

/**
 * 统计信息
 */
export interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  totalCollaborationUnits: number;
  activeUnits: number;
  executionStats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  };
}

/**
 * 解析后的工具名称
 */
export interface ParsedToolName {
  componentId: string;
  toolName: string;
}