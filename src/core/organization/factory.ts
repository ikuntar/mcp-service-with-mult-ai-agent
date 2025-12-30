/**
 * 组织架构工厂函数
 * 提供便捷的创建方法
 */

import { OrganizationManager } from './manager';
import { StructureManager } from './structure';
import { OrganizationMemberImpl } from './member';
import { 
  OrganizationRole, 
  OrganizationLevel, 
  MemberStatus,
  OrganizationStructure 
} from './types';

/**
 * 创建组织管理器
 */
export function createOrganizationManager(config?: any): OrganizationManager {
  return OrganizationManager.getInstance(config);
}

/**
 * 创建组织
 */
export function createOrganization(
  id: string,
  name: string,
  level: OrganizationLevel,
  config?: any
): StructureManager {
  const manager = OrganizationManager.getInstance();
  return manager.createOrganization(id, name, level, config);
}

/**
 * 创建成员
 */
export function createMember(
  name: string,
  role: OrganizationRole,
  level: OrganizationLevel,
  options: {
    modelId?: string;
    mcpEndpoint?: string;
    capabilities?: string[];
    permissions?: string[];
    metadata?: Record<string, any>;
    parentId?: string;
    teamId?: string;
    departmentId?: string;
    status?: MemberStatus;
    personality?: string;
  } = {}
): OrganizationMemberImpl {
  const manager = OrganizationManager.getInstance();
  return manager.createMember(name, role, level, options);
}

/**
 * 创建团队
 */
export function createTeam(
  id: string,
  name: string,
  config?: any
): StructureManager {
  return new StructureManager({
    id,
    name,
    level: OrganizationLevel.TEAM,
    config: {
      maxTeamSize: 50,
      ...config
    }
  });
}

/**
 * 创建部门
 */
export function createDepartment(
  id: string,
  name: string,
  config?: any
): StructureManager {
  return new StructureManager({
    id,
    name,
    level: OrganizationLevel.DEPARTMENT,
    config: {
      maxTeamSize: 200,
      ...config
    }
  });
}

/**
 * 快速创建默认组织结构
 */
export function createDefaultOrganizationStructure(): {
  org: StructureManager;
  team1: StructureManager;
  team2: StructureManager;
  members: OrganizationMemberImpl[];
} {
  const manager = OrganizationManager.getInstance();
  const org = manager.createDefaultOrganization();
  
  // 获取团队
  const team1 = org.getInternalStructure().subStructures.get('team-alpha');
  const team2 = org.getInternalStructure().subStructures.get('team-beta');
  
  // 创建一些示例成员
  const members = [];
  
  if (team1) {
    const member1 = createMember('张三', OrganizationRole.TECH_LEAD, OrganizationLevel.TEAM, {
      teamId: 'team-alpha',
      capabilities: ['typescript', 'nodejs', 'architecture'],
      permissions: ['read', 'write', 'execute', 'review']
    });
    
    const member2 = createMember('李四', OrganizationRole.MEMBER, OrganizationLevel.TEAM, {
      teamId: 'team-alpha',
      capabilities: ['typescript', 'react'],
      permissions: ['read', 'execute']
    });
    
    members.push(member1, member2);
  }
  
  if (team2) {
    const member3 = createMember('王五', OrganizationRole.LEAD_ENGINEER, OrganizationLevel.TEAM, {
      teamId: 'team-beta',
      capabilities: ['python', 'ml', 'data'],
      permissions: ['read', 'write', 'execute', 'review', 'design']
    });
    
    const member4 = createMember('赵六', OrganizationRole.MEMBER, OrganizationLevel.TEAM, {
      teamId: 'team-beta',
      capabilities: ['python', 'database'],
      permissions: ['read', 'execute']
    });
    
    members.push(member3, member4);
  }
  
  // 添加成员到团队
  const team1Manager = team1 ? new StructureManager({
    id: team1.id,
    name: team1.name,
    level: team1.level,
    config: team1.config
  }) : null;
  
  const team2Manager = team2 ? new StructureManager({
    id: team2.id,
    name: team2.name,
    level: team2.level,
    config: team2.config
  }) : null;
  
  // 注意：这里需要通过manager的importMembers方法添加成员
  // 简化版本，直接返回成员供后续使用
  
  return {
    org,
    team1: team1Manager!,
    team2: team2Manager!,
    members
  };
}