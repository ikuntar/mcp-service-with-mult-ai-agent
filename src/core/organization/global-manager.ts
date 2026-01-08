/**
 * 全局组织管理器 - 精简版
 * 管理协作组件接口对象，通过包装Token模块方法实现协作单元权限管理
 */

import { TokenManager, globalTokenManager } from '../token/token-manager';
import { OptimizedUserSpaceManager, globalOptimizedUserSpaceManager } from '../user-space/user-space-optimized';
import { CollaborationComponent } from './collaboration-component';
import { StandardCollaborationComponent } from './standard-collaboration-component';
import {
  CollaborationComponentConfig,
  OrganizationMember,
  ProxyExecutionContext,
  ProxyExecutionResult,
  OrganizationEventType,
  OrganizationEvent,
  GlobalOrganizationManagerConfig,
  OrganizationStats
} from './types';

export class GlobalOrganizationManager {
  private tokenManager: TokenManager;
  private userSpaceManager: OptimizedUserSpaceManager;
  
  // 核心数据结构：管理协作组件接口对象
  private collaborationComponents: Map<string, CollaborationComponent>;
  private members: Map<string, OrganizationMember>;
  
  // 成员到协作组件的映射（反向索引）
  private memberToComponents: Map<string, Set<string>>;
  
  // 事件监听器
  private eventListeners: ((event: OrganizationEvent) => void)[] = [];
  
  // 配置
  private config: GlobalOrganizationManagerConfig;

  constructor(config?: Partial<GlobalOrganizationManagerConfig>) {
    this.config = {
      tokenManager: config?.tokenManager || globalTokenManager,
      maxCollaborationUnits: config?.maxCollaborationUnits || 100,
      maxMembersPerUnit: config?.maxMembersPerUnit || 1000,
      enableEvents: config?.enableEvents !== false,
      auditLevel: config?.auditLevel || 'basic',
      ...config
    };
    
    this.tokenManager = this.config.tokenManager as TokenManager;
    this.userSpaceManager = globalOptimizedUserSpaceManager;
    
    this.collaborationComponents = new Map();
    this.members = new Map();
    this.memberToComponents = new Map();
    
    console.log('[GlobalOrganizationManager] 初始化全局组织管理器');
  }

  /**
   * 注册协作组件
   * 支持标准协作组件和其他自定义组件
   */
  async registerCollaborationComponent(
    config: CollaborationComponentConfig,
    componentFactory?: (config: CollaborationComponentConfig) => CollaborationComponent
  ): Promise<CollaborationComponent> {
    // 检查数量限制
    if (this.collaborationComponents.size >= this.config.maxCollaborationUnits!) {
      throw new Error(`协作组件数量超过限制: ${this.config.maxCollaborationUnits}`);
    }

    // 检查是否已存在
    if (this.collaborationComponents.has(config.id)) {
      throw new Error(`协作组件已存在: ${config.id}`);
    }

    // 在Token生态中注册
    const unitToken = `collab_${config.id}`;
    const tokenInfo = this.tokenManager.createToken(
      `collaboration_unit_${config.id}`,
      `协作组件: ${config.name}`
    );
    
    try {
      // 创建协作组件实例（使用工厂或默认使用标准组件）
      let component: CollaborationComponent;
      if (componentFactory) {
        component = componentFactory(config);
      } else {
        component = new StandardCollaborationComponent(config, this.userSpaceManager);
      }
      
      // 监听协作组件事件并转发
      component.onEvent((event) => {
        this.emitEvent(event);
      });

      this.collaborationComponents.set(config.id, component);
      
      // 触发注册成功事件
      this.emitEvent({
        type: OrganizationEventType.COLLABORATION_UNIT_CREATED,
        timestamp: new Date().toISOString(),
        data: {
          id: config.id,
          name: config.name,
          token: tokenInfo,
          success: true
        }
      });
      
      console.log(`[GlobalOrganizationManager] 协作组件注册成功: ${config.name} (Token: ${tokenInfo})`);
      return component;
      
    } catch (error) {
      console.error('[GlobalOrganizationManager] 协作组件实例创建失败:', error);
      throw error;
    }
  }

  /**
   * 创建组织成员
   */
  createOrganizationMember(
    name: string,
    userToken: string,
    metadata?: Record<string, any>,
    role: 'admin' | 'member' = 'member'
  ): OrganizationMember {
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 获取或创建用户空间
    const userSpace = this.userSpaceManager.getUserSpace(userToken, 'member') as any;

    const member: OrganizationMember = {
      id: memberId,
      name,
      userToken,
      userSpace,
      collaborationComponents: new Set(),
      role,
      status: 'active',
      joinedAt: new Date().toISOString(),
      metadata
    };
    
    this.members.set(memberId, member);
    this.memberToComponents.set(memberId, new Set());
    
    // 触发成员创建事件
    this.emitEvent({
      type: OrganizationEventType.MEMBER_CREATED,
      timestamp: new Date().toISOString(),
      data: {
        id: memberId,
        name,
        userToken,
        role
      },
      actor: memberId
    });
    
    console.log(`[GlobalOrganizationManager] 创建组织成员: ${name} (${memberId}) [角色: ${role}]`);
    return member;
  }

  /**
   * 将成员添加到协作组件
   */
  addMemberToComponent(memberId: string, componentId: string): boolean {
    const member = this.members.get(memberId);
    const component = this.collaborationComponents.get(componentId);
    
    if (!member || !component) {
      return false;
    }
    
    // 添加到协作组件
    const success = component.addMember(member);
    if (!success) {
      console.log(`[GlobalOrganizationManager] 协作组件拒绝添加成员`);
      return false;
    }
    
    // 更新反向索引
    const componentSet = this.memberToComponents.get(memberId) || new Set();
    componentSet.add(componentId);
    this.memberToComponents.set(memberId, componentSet);
    
    console.log(`[GlobalOrganizationManager] 成员 ${member.name} 加入组件 ${componentId} 成功`);
    return true;
  }

  /**
   * 从协作组件移除成员
   */
  removeMemberFromComponent(memberId: string, componentId: string): boolean {
    const component = this.collaborationComponents.get(componentId);
    if (!component) {
      return false;
    }
    
    const success = component.removeMember(memberId);
    if (!success) {
      return false;
    }
    
    // 更新反向索引
    const componentSet = this.memberToComponents.get(memberId);
    if (componentSet) {
      componentSet.delete(componentId);
      if (componentSet.size === 0) {
        this.memberToComponents.delete(memberId);
      } else {
        this.memberToComponents.set(memberId, componentSet);
      }
    }
    
    return true;
  }

  /**
   * 代理执行（新架构）
   * 成员通过协作组件执行，获得协作组件的职权
   */
  async proxyExecute(
    memberToken: string,
    componentId: string,
    toolName: string,
    args: any,
    context: Partial<ProxyExecutionContext> = {}
  ): Promise<ProxyExecutionResult> {
    const component = this.collaborationComponents.get(componentId);
    if (!component) {
      return {
        success: false,
        error: `协作组件不存在: ${componentId}`
      };
    }

    // 查找成员
    const member = this.findMemberByToken(memberToken);
    if (!member) {
      return {
        success: false,
        error: '成员不存在'
      };
    }

    // 检查成员是否在该协作组件中
    if (!member.collaborationComponents.has(componentId)) {
      return {
        success: false,
        error: `成员未加入协作组件: ${componentId}`
      };
    }

    // 构建执行上下文
    const fullContext: ProxyExecutionContext = {
      memberToken,
      collaborationUnitId: componentId,
      requestedTool: toolName,
      requestedAction: context.requestedAction || 'execute',
      resource: context.resource,
      metadata: context.metadata
    };

    // 通过协作组件代理执行
    return await component.proxyExecute(memberToken, toolName, args, fullContext);
  }

  /**
   * 查找成员（通过Token）
   */
  findMemberByToken(token: string): OrganizationMember | undefined {
    for (const member of this.members.values()) {
      if (member.userToken === token) {
        return member;
      }
    }
    return undefined;
  }

  /**
   * 获取协作组件
   */
  getCollaborationComponent(componentId: string): CollaborationComponent | undefined {
    return this.collaborationComponents.get(componentId);
  }

  /**
   * 获取成员所在的协作组件
   */
  getMemberComponents(memberId: string): string[] {
    const componentSet = this.memberToComponents.get(memberId);
    return componentSet ? Array.from(componentSet) : [];
  }

  /**
   * 查询成员
   */
  queryMembers(query: {
    name?: string;
    componentId?: string;
    status?: 'active' | 'inactive' | 'suspended';
  }): OrganizationMember[] {
    let results = Array.from(this.members.values());

    if (query.name) {
      results = results.filter(m => m.name.includes(query.name));
    }

    if (query.componentId) {
      results = results.filter(m => m.collaborationComponents.has(query.componentId));
    }

    if (query.status) {
      results = results.filter(m => m.status === query.status);
    }

    return results;
  }

  /**
   * 查询协作组件
   */
  queryComponents(query: {
    name?: string;
    hasMember?: string;
  }): CollaborationComponent[] {
    let results = Array.from(this.collaborationComponents.values());

    if (query.name) {
      results = results.filter(c => c.name.includes(query.name));
    }

    if (query.hasMember) {
      results = results.filter(c => c.getMembers().has(query.hasMember));
    }

    return results;
  }

  /**
   * 获取全局统计
   */
  getGlobalStats(): OrganizationStats {
    const totalMembers = this.members.size;
    const activeMembers = Array.from(this.members.values()).filter(m => m.status === 'active').length;
    const totalUnits = this.collaborationComponents.size;
    const activeUnits = Array.from(this.collaborationComponents.values()).filter(c => c.isActive).length;

    return {
      totalMembers,
      activeMembers,
      totalCollaborationUnits: totalUnits,
      activeUnits,
      executionStats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0
      }
    };
  }

  /**
   * 监听全局事件
   */
  onEvent(listener: (event: OrganizationEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * 触发事件
   */
  private emitEvent(event: OrganizationEvent): void {
    if (!this.config.enableEvents) {
      return;
    }

    // 审计日志
    if (this.config.auditLevel === 'full') {
      console.log(`[GlobalOrganizationManager Audit]`, event);
    }

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[GlobalOrganizationManager] 事件监听器错误:', error);
      }
    });
  }

  /**
   * 删除协作组件
   */
  async deleteCollaborationComponent(componentId: string): Promise<boolean> {
    const component = this.collaborationComponents.get(componentId);
    if (!component) {
      return false;
    }

    // 清理所有成员关系
    for (const member of component.getMembers().values()) {
      this.removeMemberFromComponent(member.id, componentId);
    }

    // 清理协作组件资源
    await component.cleanup();

    // 从Token生态移除
    const unitToken = `collab_${componentId}`;
    this.tokenManager.deactivateToken(unitToken);

    this.collaborationComponents.delete(componentId);

    // 触发删除事件
    this.emitEvent({
      type: OrganizationEventType.COLLABORATION_UNIT_DELETED,
      timestamp: new Date().toISOString(),
      data: {
        id: componentId,
        name: component.name
      }
    });

    console.log(`[GlobalOrganizationManager] 协作组件已删除: ${componentId}`);
    return true;
  }

  /**
   * 删除成员
   */
  async deleteMember(memberId: string): Promise<boolean> {
    const member = this.members.get(memberId);
    if (!member) {
      return false;
    }

    // 从所有协作组件中移除
    const componentIds = this.memberToComponents.get(memberId);
    if (componentIds) {
      for (const componentId of componentIds) {
        await this.removeMemberFromComponent(memberId, componentId);
      }
    }

    // 清理用户空间
    await this.userSpaceManager.cleanupUserSpace(member.userToken);

    this.members.delete(memberId);
    this.memberToComponents.delete(memberId);

    console.log(`[GlobalOrganizationManager] 成员已删除: ${memberId}`);
    return true;
  }

  /**
   * 清理所有资源
   */
  async cleanup(): Promise<void> {
    // 删除所有协作组件
    const componentIds = Array.from(this.collaborationComponents.keys());
    for (const componentId of componentIds) {
      await this.deleteCollaborationComponent(componentId);
    }

    // 删除所有成员
    const memberIds = Array.from(this.members.keys());
    for (const memberId of memberIds) {
      await this.deleteMember(memberId);
    }

    this.eventListeners = [];
    console.log('[GlobalOrganizationManager] 所有资源已清理');
  }

  /**
   * 获取管理器信息
   */
  getInfo() {
    return {
      version: '4.0.0',
      architecture: '精简组合模式',
      collaborationComponents: this.collaborationComponents.size,
      members: this.members.size,
      config: this.config
    };
  }
}

/**
 * 全局组织管理器实例
 */
export const globalOrganizationManager = new GlobalOrganizationManager();