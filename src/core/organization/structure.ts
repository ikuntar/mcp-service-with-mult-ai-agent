/**
 * 组织结构管理器
 * 管理组织层级结构和成员关系
 */

import { OrganizationMemberImpl } from './member';
import { 
  OrganizationStructure, 
  OrganizationRelationship, 
  OrganizationConfig,
  OrganizationLevel,
  OrganizationRole,
  MemberStatus,
  RelationshipType,
  OrganizationStats,
  OrganizationValidationResult,
  OrganizationEvent,
  OrganizationEventType
} from './types';

export interface StructureManagerConfig {
  id: string;
  name: string;
  level: OrganizationLevel;
  config?: Partial<OrganizationConfig>;
}

/**
 * 组织结构管理器
 * 管理组织层级、成员、关系和配置
 */
export class StructureManager {
  private structure: OrganizationStructure;
  private eventListeners: ((event: OrganizationEvent) => void)[];
  
  constructor(config: StructureManagerConfig) {
    this.structure = {
      id: config.id,
      name: config.name,
      level: config.level,
      members: new Map<string, OrganizationMemberImpl>(),
      subStructures: new Map<string, OrganizationStructure>(),
      relationships: [],
      config: {
        enableRoleHierarchy: true,
        enablePermissionInheritance: true,
        maxTeamSize: 50,
        enableCrossTeamCollaboration: true,
        enableAuditLog: true,
        auditLevel: 'basic',
        maxConcurrency: 10,
        enableCaching: true,
        ...config.config
      }
    };
    
    this.eventListeners = [];
  }
  
  /**
   * 添加成员
   */
  addMember(member: OrganizationMemberImpl): boolean {
    if (this.structure.members.has(member.id)) {
      return false; // 成员已存在
    }
    
    this.structure.members.set(member.id, member);
    
    // 触发事件
    this.emitEvent({
      type: OrganizationEventType.MEMBER_ADDED,
      timestamp: new Date(),
      organizationId: this.structure.id,
      memberId: member.id,
      details: {
        name: member.name,
        role: member.role,
        level: member.level
      }
    });
    
    return true;
  }
  
  /**
   * 移除成员
   */
  removeMember(memberId: string): boolean {
    if (!this.structure.members.has(memberId)) {
      return false;
    }
    
    // 移除相关关系
    this.structure.relationships = this.structure.relationships.filter(
      rel => rel.from !== memberId && rel.to !== memberId
    );
    
    this.structure.members.delete(memberId);
    
    this.emitEvent({
      type: OrganizationEventType.MEMBER_REMOVED,
      timestamp: new Date(),
      organizationId: this.structure.id,
      memberId: memberId
    });
    
    return true;
  }
  
  /**
   * 获取成员
   */
  getMember(memberId: string): OrganizationMemberImpl | undefined {
    return this.structure.members.get(memberId);
  }
  
  /**
   * 获取所有成员
   */
  getAllMembers(): OrganizationMemberImpl[] {
    return Array.from(this.structure.members.values());
  }
  
  /**
   * 添加关系
   */
  addRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType,
    strength: number = 1.0,
    metadata?: Record<string, any>
  ): boolean {
    if (!this.structure.members.has(fromId) || !this.structure.members.has(toId)) {
      return false;
    }
    
    // 检查是否已存在相同关系
    const exists = this.structure.relationships.some(
      rel => rel.from === fromId && rel.to === toId && rel.type === type
    );
    
    if (exists) {
      return false;
    }
    
    const relationship: OrganizationRelationship = {
      id: `${fromId}-${toId}-${type}-${Date.now()}`,
      from: fromId,
      to: toId,
      type,
      strength,
      metadata: metadata || {}
    };
    
    this.structure.relationships.push(relationship);
    
    this.emitEvent({
      type: OrganizationEventType.RELATIONSHIP_ADDED,
      timestamp: new Date(),
      organizationId: this.structure.id,
      fromMemberId: fromId,
      toMemberId: toId,
      details: { type, strength }
    });
    
    return true;
  }
  
  /**
   * 移除关系
   */
  removeRelationship(relationshipId: string): boolean {
    const initialLength = this.structure.relationships.length;
    this.structure.relationships = this.structure.relationships.filter(
      rel => rel.id !== relationshipId
    );
    
    const removed = this.structure.relationships.length < initialLength;
    
    if (removed) {
      this.emitEvent({
        type: OrganizationEventType.RELATIONSHIP_REMOVED,
        timestamp: new Date(),
        organizationId: this.structure.id,
        details: { relationshipId }
      });
    }
    
    return removed;
  }
  
  /**
   * 添加子结构
   */
  addSubStructure(structure: OrganizationStructure): boolean {
    if (this.structure.subStructures.has(structure.id)) {
      return false;
    }
    
    this.structure.subStructures.set(structure.id, structure);
    
    this.emitEvent({
      type: OrganizationEventType.STRUCTURE_CHANGED,
      timestamp: new Date(),
      organizationId: this.structure.id,
      details: { 
        action: 'add_substructure',
        subStructureId: structure.id,
        name: structure.name
      }
    });
    
    return true;
  }
  
  /**
   * 查询成员
   */
  queryMembers(query: any): OrganizationMemberImpl[] {
    let results = this.getAllMembers();
    
    if (query.role) {
      results = results.filter(m => m.role === query.role);
    }
    
    if (query.level) {
      results = results.filter(m => m.level === query.level);
    }
    
    if (query.status) {
      results = results.filter(m => m.status === query.status);
    }
    
    if (query.capabilities) {
      results = results.filter(m => 
        query.capabilities.every((cap: string) => m.hasCapability(cap))
      );
    }
    
    if (query.teamId) {
      results = results.filter(m => m.teamId === query.teamId);
    }
    
    if (query.departmentId) {
      results = results.filter(m => m.departmentId === query.departmentId);
    }
    
    if (query.parentId) {
      results = results.filter(m => m.parentId === query.parentId);
    }
    
    return results;
  }
  
  /**
   * 获取关系网络
   */
  getRelationships(memberId?: string, type?: RelationshipType): OrganizationRelationship[] {
    let relationships = this.structure.relationships;
    
    if (memberId) {
      relationships = relationships.filter(
        rel => rel.from === memberId || rel.to === memberId
      );
    }
    
    if (type) {
      relationships = relationships.filter(rel => rel.type === type);
    }
    
    return relationships;
  }
  
  /**
   * 获取直接下属
   */
  getDirectReports(memberId: string): OrganizationMemberImpl[] {
    const reports = this.structure.relationships
      .filter(rel => rel.to === memberId && rel.type === RelationshipType.REPORTING)
      .map(rel => this.structure.members.get(rel.from))
      .filter((m): m is OrganizationMemberImpl => m !== undefined);
    
    return reports;
  }
  
  /**
   * 获取上级
   */
  getSuperiors(memberId: string): OrganizationMemberImpl[] {
    const superiors = this.structure.relationships
      .filter(rel => rel.from === memberId && rel.type === RelationshipType.REPORTING)
      .map(rel => this.structure.members.get(rel.to))
      .filter((m): m is OrganizationMemberImpl => m !== undefined);
    
    return superiors;
  }
  
  /**
   * 获取团队成员
   */
  getTeamMembers(teamId: string): OrganizationMemberImpl[] {
    return this.getAllMembers().filter(m => m.teamId === teamId);
  }
  
  /**
   * 获取部门成员
   */
  getDepartmentMembers(departmentId: string): OrganizationMemberImpl[] {
    return this.getAllMembers().filter(m => m.departmentId === departmentId);
  }
  
  /**
   * 获取统计信息
   */
  getStats(): OrganizationStats {
    const members = this.getAllMembers();
    const activeMembers = members.filter(m => m.isActive());
    
    const memberCountByRole = {} as Record<OrganizationRole, number>;
    const memberCountByLevel = {} as Record<OrganizationLevel, number>;
    
    // 初始化计数器
    Object.values(OrganizationRole).forEach(role => {
      memberCountByRole[role] = 0;
    });
    Object.values(OrganizationLevel).forEach(level => {
      memberCountByLevel[level] = 0;
    });
    
    // 计数
    members.forEach(m => {
      memberCountByRole[m.role]++;
      memberCountByLevel[m.level]++;
    });
    
    // 计算团队统计
    const teamIds = new Set(members.map(m => m.teamId).filter(Boolean));
    const teamSizes = Array.from(teamIds).map(teamId => 
      members.filter(m => m.teamId === teamId).length
    );
    
    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      memberCountByRole,
      memberCountByLevel,
      totalRelationships: this.structure.relationships.length,
      totalTeams: teamIds.size,
      totalDepartments: new Set(members.map(m => m.departmentId).filter(Boolean)).size,
      avgTeamSize: teamSizes.length > 0 ? teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length : 0,
      maxTeamSize: teamSizes.length > 0 ? Math.max(...teamSizes) : 0,
      minTeamSize: teamSizes.length > 0 ? Math.min(...teamSizes) : 0
    };
  }
  
  /**
   * 验证组织结构
   */
  validate(): OrganizationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // 检查成员数量
    const stats = this.getStats();
    if (stats.totalMembers === 0) {
      warnings.push('组织中没有成员');
    }
    
    // 检查团队大小
    if (stats.maxTeamSize > this.structure.config.maxTeamSize) {
      errors.push(`团队大小超过限制: ${stats.maxTeamSize}/${this.structure.config.maxTeamSize}`);
      suggestions.push('考虑拆分过大团队');
    }
    
    // 检查孤立成员（没有关系的成员）
    const allMemberIds = new Set(this.getAllMembers().map(m => m.id));
    const connectedMemberIds = new Set();
    
    this.structure.relationships.forEach(rel => {
      connectedMemberIds.add(rel.from);
      connectedMemberIds.add(rel.to);
    });
    
    const isolatedMembers = Array.from(allMemberIds).filter(id => !connectedMemberIds.has(id));
    if (isolatedMembers.length > 0) {
      warnings.push(`发现 ${isolatedMembers.length} 个孤立成员`);
      suggestions.push('为孤立成员建立组织关系');
    }
    
    // 检查角色分布
    const roleCounts = stats.memberCountByRole;
    const dominantRoles = Object.entries(roleCounts)
      .filter(([_, count]) => count > stats.totalMembers * 0.5)
      .map(([role]) => role);
    
    if (dominantRoles.length > 0) {
      warnings.push(`角色分布不均: ${dominantRoles.join(', ')} 占比超过50%`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
  
  /**
   * 更新配置
   */
  updateConfig(updates: Partial<OrganizationConfig>): void {
    this.structure.config = {
      ...this.structure.config,
      ...updates
    };
  }
  
  /**
   * 获取配置
   */
  getConfig(): OrganizationConfig {
    return this.structure.config;
  }
  
  /**
   * 添加事件监听器
   */
  onEvent(listener: (event: OrganizationEvent) => void): void {
    this.eventListeners.push(listener);
  }
  
  /**
   * 移除事件监听器
   */
  removeEventListener(listener: (event: OrganizationEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }
  
  /**
   * 触发事件
   */
  private emitEvent(event: OrganizationEvent): void {
    if (this.structure.config.enableAuditLog) {
      // 可以在这里记录审计日志
      console.log(`[Organization Audit] ${event.type}`, event);
    }
    
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }
  
  /**
   * 获取内部结构（用于管理器）
   */
  getInternalStructure(): OrganizationStructure {
    return this.structure;
  }
  
  /**
   * 序列化结构
   */
  toJSON(): Record<string, any> {
    return {
      id: this.structure.id,
      name: this.structure.name,
      level: this.structure.level,
      members: Array.from(this.structure.members.entries()).map(([id, member]) => ({
        id,
        name: member.name,
        role: member.role,
        level: member.level,
        status: member.status
      })),
      subStructures: Array.from(this.structure.subStructures.entries()).map(([id, struct]) => ({
        id,
        name: struct.name,
        level: struct.level
      })),
      relationships: this.structure.relationships.length,
      config: this.structure.config,
      stats: this.getStats()
    };
  }
}