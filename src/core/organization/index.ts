/**
 * 组织架构管理 - 主入口
 * 组织对象存储的成员对象基类是高级Agent
 */

// 类型定义
export {
  OrganizationRole,
  OrganizationLevel,
  MemberStatus,
  RelationshipType,
  OrganizationEventType
} from './types';

export type {
  OrganizationMember,
  OrganizationStructure,
  OrganizationRelationship,
  OrganizationConfig,
  OrganizationActionResult,
  OrganizationQuery,
  OrganizationEvent,
  OrganizationStats,
  OrganizationValidationResult
} from './types';

// 核心组件
export { OrganizationMemberImpl } from './member';
export type { OrganizationMemberConfig } from './member';

export { StructureManager } from './structure';
export type { StructureManagerConfig } from './structure';

export { OrganizationManager } from './manager';
export type { OrganizationManagerConfig } from './manager';

// 工厂函数
export {
  createOrganizationManager,
  createOrganization,
  createMember,
  createTeam,
  createDepartment
} from './factory';

// 工具函数
export {
  validateOrganizationStructure,
  getOrganizationStats,
  findMemberByRole,
  findMemberByCapability,
  getRelationshipChain
} from './utils';