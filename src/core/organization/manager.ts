/**
 * 组织管理器 - 主控制器
 * 统一管理多个组织结构和成员
 */

import { StructureManager } from './structure';
import { OrganizationMemberImpl } from './member';
import { 
  OrganizationLevel, 
  OrganizationRole, 
  MemberStatus,
  OrganizationEvent,
  OrganizationEventType
} from './types';

export interface OrganizationManagerConfig {
  // 全局配置
  enableMultiTenancy?: boolean;
  maxOrganizations?: number;
  defaultConfig?: any;
  
  // 事件配置
  enableGlobalEventBus?: boolean;
}

/**
 * 组织管理器
 * 管理多个组织结构，提供统一的访问接口
 */
export class OrganizationManager {
  private static instance: OrganizationManager;
  
  private organizations: Map<string, StructureManager>;
  private globalEventListeners: ((event: OrganizationEvent) => void)[];
  private config: OrganizationManagerConfig;
  
  private constructor(config: OrganizationManagerConfig = {}) {
    this.organizations = new Map();
    this.globalEventListeners = [];
    this.config = {
      enableMultiTenancy: true,
      maxOrganizations: 100,
      enableGlobalEventBus: true,
      ...config
    };
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(config?: OrganizationManagerConfig): OrganizationManager {
    if (!OrganizationManager.instance) {
      OrganizationManager.instance = new OrganizationManager(config);
    }
    return OrganizationManager.instance;
  }
  
  /**
   * 创建组织
   */
  createOrganization(
    id: string,
    name: string,
    level: OrganizationLevel,
    config?: any
  ): StructureManager {
    // 检查数量限制
    if (this.organizations.size >= this.config.maxOrganizations!) {
      throw new Error(`Maximum organizations reached: ${this.config.maxOrganizations}`);
    }
    
    // 检查是否已存在
    if (this.organizations.has(id)) {
      throw new Error(`Organization already exists: ${id}`);
    }
    
    const structure = new StructureManager({
      id,
      name,
      level,
      config
    });
    
    // 监听组织事件并转发到全局
    if (this.config.enableGlobalEventBus) {
      structure.onEvent((event) => {
        this.emitGlobalEvent(event);
      });
    }
    
    this.organizations.set(id, structure);
    
    console.log(`[OrganizationManager] Created organization: ${name} (${id})`);
    
    return structure;
  }
  
  /**
   * 获取组织
   */
  getOrganization(id: string): StructureManager | undefined {
    return this.organizations.get(id);
  }
  
  /**
   * 删除组织
   */
  deleteOrganization(id: string): boolean {
    const organization = this.organizations.get(id);
    if (!organization) {
      return false;
    }
    
    // 清理事件监听器
    if (this.config.enableGlobalEventBus) {
      // 需要从structure中移除监听器，但StructureManager没有提供移除方法
      // 这里假设在实际使用中会处理
    }
    
    this.organizations.delete(id);
    console.log(`[OrganizationManager] Deleted organization: ${id}`);
    return true;
  }
  
  /**
   * 获取所有组织
   */
  getAllOrganizations(): StructureManager[] {
    return Array.from(this.organizations.values());
  }
  
  /**
   * 跨组织查询成员
   */
  findMemberAcrossOrganizations(memberId: string): { organization: StructureManager; member: OrganizationMemberImpl } | null {
    const orgs = Array.from(this.organizations.values());
    for (const org of orgs) {
      const member = org.getMember(memberId);
      if (member) {
        return { organization: org, member };
      }
    }
    return null;
  }
  
  /**
   * 跨组织搜索
   */
  searchMembersAcrossOrganizations(query: any): Array<{ organization: StructureManager; member: OrganizationMemberImpl }> {
    const results: Array<{ organization: StructureManager; member: OrganizationMemberImpl }> = [];
    
    const orgs = Array.from(this.organizations.values());
    for (const org of orgs) {
      const members = org.queryMembers(query);
      members.forEach(member => {
        results.push({ organization: org, member });
      });
    }
    
    return results;
  }
  
  /**
   * 创建默认组织结构
   */
  createDefaultOrganization(): StructureManager {
    const orgId = 'default-org';
    
    if (this.organizations.has(orgId)) {
      return this.organizations.get(orgId)!;
    }
    
    const org = this.createOrganization(
      orgId,
      '默认组织',
      OrganizationLevel.ORGANIZATION
    );
    
    // 创建默认团队
    const team1 = new StructureManager({
      id: 'team-alpha',
      name: 'Alpha团队',
      level: OrganizationLevel.TEAM,
      config: {
        maxTeamSize: 10
      }
    });
    
    const team2 = new StructureManager({
      id: 'team-beta',
      name: 'Beta团队',
      level: OrganizationLevel.TEAM,
      config: {
        maxTeamSize: 10
      }
    });
    
    org.addSubStructure(team1.getInternalStructure());
    org.addSubStructure(team2.getInternalStructure());
    
    return org;
  }
  
  /**
   * 批量导入成员
   */
  importMembers(organizationId: string, members: OrganizationMemberImpl[]): number {
    const org = this.organizations.get(organizationId);
    if (!org) {
      throw new Error(`Organization not found: ${organizationId}`);
    }
    
    let count = 0;
    for (const member of members) {
      if (org.addMember(member)) {
        count++;
      }
    }
    
    console.log(`[OrganizationManager] Imported ${count} members to ${organizationId}`);
    return count;
  }
  
  /**
   * 创建成员工厂方法
   */
  createMember(
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
    const id = `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const config = {
      id,
      name,
      role,
      level,
      status: options.status || MemberStatus.ACTIVE,
      modelId: options.modelId || 'default',
      mcpEndpoint: options.mcpEndpoint || 'http://localhost:3000',
      capabilities: options.capabilities || [],
      permissions: options.permissions || [],
      metadata: options.metadata || {},
      parentId: options.parentId,
      teamId: options.teamId,
      departmentId: options.departmentId,
      personality: options.personality
    };
    
    return new OrganizationMemberImpl(config);
  }
  
  /**
   * 添加全局事件监听器
   */
  onGlobalEvent(listener: (event: OrganizationEvent) => void): void {
    this.globalEventListeners.push(listener);
  }
  
  /**
   * 移除全局事件监听器
   */
  removeGlobalEventListener(listener: (event: OrganizationEvent) => void): void {
    this.globalEventListeners = this.globalEventListeners.filter(l => l !== listener);
  }
  
  /**
   * 触发全局事件
   */
  private emitGlobalEvent(event: OrganizationEvent): void {
    this.globalEventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Global event listener error:', error);
      }
    });
  }
  
  /**
   * 获取统计信息
   */
  getGlobalStats() {
    const orgStats = Array.from(this.organizations.entries()).map(([id, org]) => ({
      id,
      name: org.toJSON().name,
      stats: org.getStats()
    }));
    
    return {
      totalOrganizations: this.organizations.size,
      organizations: orgStats,
      totalMembers: orgStats.reduce((sum, org) => sum + org.stats.totalMembers, 0),
      totalActiveMembers: orgStats.reduce((sum, org) => sum + org.stats.activeMembers, 0)
    };
  }
  
  /**
   * 清理所有组织
   */
  clearAll(): void {
    this.organizations.clear();
    this.globalEventListeners = [];
    console.log('[OrganizationManager] Cleared all organizations');
  }
  
  /**
   * 获取管理器信息
   */
  getInfo(): Record<string, any> {
    return {
      version: '1.0.0',
      organizations: this.organizations.size,
      maxOrganizations: this.config.maxOrganizations,
      multiTenancyEnabled: this.config.enableMultiTenancy,
      globalEventBusEnabled: this.config.enableGlobalEventBus
    };
  }
}