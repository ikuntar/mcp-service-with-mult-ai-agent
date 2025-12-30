/**
 * 组织架构管理 - 类型定义
 * 组织对象存储的成员对象基类是高级Agent
 */

import { IntegratedAgent } from '../ai-agent/base/integrated-agent';
import { Task, ActionResult } from '../ai-agent/base/types';

// 组织角色类型
export enum OrganizationRole {
  // 基础角色
  MEMBER = 'member',
  ADMIN = 'admin',
  MANAGER = 'manager',
  
  // 高级角色
  LEAD_ENGINEER = 'lead_engineer',
  TECH_LEAD = 'tech_lead',
  ARCHITECT = 'architect',
  
  // 特殊角色
  COORDINATOR = 'coordinator',  // 协调者
  REVIEWER = 'reviewer',        // 审查者
  EXECUTOR = 'executor',        // 执行者
  
  // 系统角色
  SYSTEM_ADMIN = 'system_admin',
  SECURITY_OFFICER = 'security_officer'
}

// 组织层级类型
export enum OrganizationLevel {
  INDIVIDUAL = 'individual',      // 个人层
  TEAM = 'team',                  // 团队层
  DEPARTMENT = 'department',      // 部门层
  DIVISION = 'division',          // 事业群层
  ORGANIZATION = 'organization'   // 组织层
}

// 成员状态
export enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

// 组织关系类型
export enum RelationshipType {
  HIERARCHICAL = 'hierarchical',    // 层级关系
  COLLABORATIVE = 'collaborative',  // 协作关系
  REPORTING = 'reporting',          // 汇报关系
  PEER = 'peer',                    // 同级关系
  CROSS_FUNCTIONAL = 'cross_functional'  // 跨职能关系
}

// 组织成员基类（基于高级Agent）
export interface OrganizationMember {
  id: string;
  name: string;
  role: OrganizationRole;
  level: OrganizationLevel;
  status: MemberStatus;
  
  // Agent能力
  agent: IntegratedAgent;
  
  // 组织关系
  parentId?: string;              // 上级ID
  teamId?: string;                // 团队ID
  departmentId?: string;          // 部门ID
  
  // 权限和能力
  capabilities: string[];         // 能力列表
  permissions: string[];          // 权限列表
  
  // 元数据
  metadata: Record<string, any>;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  
  // 方法签名
  hasRole(role: OrganizationRole): boolean;
  hasLevel(level: OrganizationLevel): boolean;
  isActive(): boolean;
  hasCapability(capability: string): boolean;
  hasPermission(permission: string): boolean;
  addCapability(capability: string): void;
  addPermission(permission: string): void;
  removeCapability(capability: string): boolean;
  removePermission(permission: string): boolean;
  updateRole(newRole: OrganizationRole): void;
  updateLevel(newLevel: OrganizationLevel): void;
  updateStatus(newStatus: MemberStatus): void;
  setOrganizationRelationship(parentId?: string, teamId?: string, departmentId?: string): void;
  updateMetadata(key: string, value: any): void;
  getMetadata(key: string): any;
  canPerformAction(action: string, context?: any): boolean;
  toJSON(): Record<string, any>;
}

// 组织结构定义
export interface OrganizationStructure {
  id: string;
  name: string;
  level: OrganizationLevel;
  
  // 成员列表 (使用具体实现类)
  members: Map<string, any>;
  
  // 子结构（层级嵌套）
  subStructures: Map<string, any>;
  
  // 关系网络
  relationships: OrganizationRelationship[];
  
  // 配置
  config: OrganizationConfig;
}

// 组织关系
export interface OrganizationRelationship {
  id: string;
  from: string;      // 源成员ID
  to: string;        // 目标成员ID
  type: RelationshipType;
  strength: number;  // 关系强度 0-1
  metadata?: Record<string, any>;
}

// 组织配置
export interface OrganizationConfig {
  // 权限配置
  enableRoleHierarchy: boolean;
  enablePermissionInheritance: boolean;
  
  // 协作配置
  maxTeamSize: number;
  enableCrossTeamCollaboration: boolean;
  
  // 审计配置
  enableAuditLog: boolean;
  auditLevel: 'none' | 'basic' | 'detailed' | 'full';
  
  // 性能配置
  maxConcurrency: number;
  enableCaching: boolean;
}

// 组织操作结果
export interface OrganizationActionResult extends ActionResult {
  organizationId?: string;
  memberId?: string;
  affectedMembers?: string[];
  relationshipChanges?: number;
}

// 组织查询条件
export interface OrganizationQuery {
  role?: OrganizationRole;
  level?: OrganizationLevel;
  status?: MemberStatus;
  capabilities?: string[];
  teamId?: string;
  departmentId?: string;
  parentId?: string;
}

// 组织事件类型
export enum OrganizationEventType {
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  ROLE_CHANGED = 'role_changed',
  RELATIONSHIP_ADDED = 'relationship_added',
  RELATIONSHIP_REMOVED = 'relationship_removed',
  STRUCTURE_CHANGED = 'structure_changed',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_REVOKED = 'permission_revoked'
}

// 组织事件
export interface OrganizationEvent {
  type: OrganizationEventType;
  timestamp: Date;
  organizationId: string;
  memberId?: string;
  fromMemberId?: string;
  toMemberId?: string;
  details?: Record<string, any>;
}

// 组织统计信息
export interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  memberCountByRole: Record<OrganizationRole, number>;
  memberCountByLevel: Record<OrganizationLevel, number>;
  totalRelationships: number;
  totalTeams: number;
  totalDepartments: number;
  avgTeamSize: number;
  maxTeamSize: number;
  minTeamSize: number;
}

// 组织验证结果
export interface OrganizationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}