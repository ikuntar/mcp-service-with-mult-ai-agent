/**
 * 组织成员 - 基于高级Agent的实现
 * 成员对象的基类是高级IntegratedAgent
 */

import { IntegratedAgent, IntegratedAgentConfig } from '../ai-agent/base/integrated-agent';
import { Task, ActionResult } from '../ai-agent/base/types';
import { 
  OrganizationMember, 
  OrganizationRole, 
  OrganizationLevel, 
  MemberStatus,
  OrganizationActionResult 
} from './types';

export interface OrganizationMemberConfig {
  id: string;
  name: string;
  role?: OrganizationRole;
  level?: OrganizationLevel;
  status?: MemberStatus;
  parentId?: string;
  teamId?: string;
  departmentId?: string;
  capabilities?: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
  
  // Agent配置
  modelId: string;
  mcpEndpoint: string;
  mcpHeaders?: Record<string, string>;
  tools?: Array<{
    name: string;
    description: string;
    parameters?: any;
  }>;
  maxRetries?: number;
  baseRetryDelay?: number;
  maxMemoryItems?: number;
  personality?: string;
}

/**
 * 组织成员类 - 继承自高级Agent
 * 这是组织架构中所有成员的基类
 */
export class OrganizationMemberImpl extends IntegratedAgent implements OrganizationMember {
  public id: string;
  public name: string;
  public role: OrganizationRole;
  public level: OrganizationLevel;
  public status: MemberStatus;
  
  // 组织关系
  public parentId?: string;
  public teamId?: string;
  public departmentId?: string;
  
  // 能力和权限
  public capabilities: string[];
  public permissions: string[];
  
  // 元数据
  public metadata: Record<string, any>;
  
  // 时间戳
  public createdAt: Date;
  public updatedAt: Date;
  
  // Agent引用（自身就是Agent）
  public agent: IntegratedAgent;
  
  constructor(config: OrganizationMemberConfig) {
    // 调用父类构造函数
    super({
      id: config.id,
      name: config.name,
      role: config.role || OrganizationRole.MEMBER,
      personality: config.personality,
      capabilities: config.capabilities || [],
      modelId: config.modelId,
      mcpEndpoint: config.mcpEndpoint,
      mcpHeaders: config.mcpHeaders,
      tools: config.tools,
      maxRetries: config.maxRetries,
      baseRetryDelay: config.baseRetryDelay,
      maxMemoryItems: config.maxMemoryItems
    });
    
    // 初始化组织成员属性
    this.id = config.id;
    this.name = config.name;
    this.role = config.role || OrganizationRole.MEMBER;
    this.level = config.level || OrganizationLevel.INDIVIDUAL;
    this.status = config.status || MemberStatus.ACTIVE;
    
    this.parentId = config.parentId;
    this.teamId = config.teamId;
    this.departmentId = config.departmentId;
    
    this.capabilities = config.capabilities || [];
    this.permissions = config.permissions || [];
    this.metadata = config.metadata || {};
    
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Agent引用指向自身
    this.agent = this;
  }
  
  /**
   * 检查成员是否具有指定角色
   */
  hasRole(role: OrganizationRole): boolean {
    return this.role === role;
  }
  
  /**
   * 检查成员是否在指定层级
   */
  hasLevel(level: OrganizationLevel): boolean {
    return this.level === level;
  }
  
  /**
   * 检查成员是否活跃
   */
  isActive(): boolean {
    return this.status === MemberStatus.ACTIVE;
  }
  
  /**
   * 检查成员是否具有指定能力
   */
  hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }
  
  /**
   * 检查成员是否具有指定权限
   */
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
  
  /**
   * 添加能力
   */
  addCapability(capability: string): void {
    if (!this.capabilities.includes(capability)) {
      this.capabilities.push(capability);
      this.updatedAt = new Date();
    }
  }
  
  /**
   * 添加权限
   */
  addPermission(permission: string): void {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
      this.updatedAt = new Date();
    }
  }
  
  /**
   * 移除能力
   */
  removeCapability(capability: string): boolean {
    const index = this.capabilities.indexOf(capability);
    if (index > -1) {
      this.capabilities.splice(index, 1);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }
  
  /**
   * 移除权限
   */
  removePermission(permission: string): boolean {
    const index = this.permissions.indexOf(permission);
    if (index > -1) {
      this.permissions.splice(index, 1);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }
  
  /**
   * 更新角色
   */
  updateRole(newRole: OrganizationRole): void {
    this.role = newRole;
    this.updatedAt = new Date();
  }
  
  /**
   * 更新层级
   */
  updateLevel(newLevel: OrganizationLevel): void {
    this.level = newLevel;
    this.updatedAt = new Date();
  }
  
  /**
   * 更新状态
   */
  updateStatus(newStatus: MemberStatus): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }
  
  /**
   * 设置组织关系
   */
  setOrganizationRelationship(parentId?: string, teamId?: string, departmentId?: string): void {
    this.parentId = parentId;
    this.teamId = teamId;
    this.departmentId = departmentId;
    this.updatedAt = new Date();
  }
  
  /**
   * 更新元数据
   */
  updateMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.updatedAt = new Date();
  }
  
  /**
   * 获取元数据
   */
  getMetadata(key: string): any {
    return this.metadata[key];
  }
  
  /**
   * 执行组织任务（使用父类的execute方法）
   */
  async executeOrganizationTask(task: Task): Promise<OrganizationActionResult> {
    try {
      // 调用父类的execute方法
      const result = await this.execute(task);
      
      // 转换为组织操作结果
      const orgResult: OrganizationActionResult = {
        ...result,
        organizationId: this.teamId || this.departmentId,
        memberId: this.id,
        success: result.success
      };
      
      return orgResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        organizationId: this.teamId || this.departmentId,
        memberId: this.id
      };
    }
  }
  
  /**
   * 检查成员是否可以执行指定操作
   */
  canPerformAction(action: string, context?: any): boolean {
    // 基础检查：成员必须活跃
    if (!this.isActive()) {
      return false;
    }
    
    // 检查是否有特定权限
    const requiredPermission = `action:${action}`;
    if (this.hasPermission(requiredPermission)) {
      return true;
    }
    
    // 检查角色是否有默认权限
    const rolePermissions = this.getRoleDefaultPermissions();
    if (rolePermissions.includes(action)) {
      return true;
    }
    
    // 检查能力是否匹配
    if (context && context.requiredCapability) {
      if (this.hasCapability(context.requiredCapability)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 获取角色默认权限
   */
  private getRoleDefaultPermissions(): string[] {
    const roleDefaults: Record<OrganizationRole, string[]> = {
      [OrganizationRole.MEMBER]: ['read', 'execute'],
      [OrganizationRole.ADMIN]: ['read', 'write', 'execute', 'manage'],
      [OrganizationRole.MANAGER]: ['read', 'write', 'execute', 'manage', 'delegate'],
      [OrganizationRole.LEAD_ENGINEER]: ['read', 'write', 'execute', 'review', 'design'],
      [OrganizationRole.TECH_LEAD]: ['read', 'write', 'execute', 'review', 'design', 'delegate'],
      [OrganizationRole.ARCHITECT]: ['read', 'write', 'execute', 'review', 'design', 'architect'],
      [OrganizationRole.COORDINATOR]: ['read', 'write', 'execute', 'coordinate'],
      [OrganizationRole.REVIEWER]: ['read', 'execute', 'review'],
      [OrganizationRole.EXECUTOR]: ['read', 'execute'],
      [OrganizationRole.SYSTEM_ADMIN]: ['read', 'write', 'execute', 'manage', 'admin'],
      [OrganizationRole.SECURITY_OFFICER]: ['read', 'execute', 'audit', 'security']
    };
    
    return roleDefaults[this.role] || [];
  }
  
  /**
   * 序列化为JSON
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      level: this.level,
      status: this.status,
      parentId: this.parentId,
      teamId: this.teamId,
      departmentId: this.departmentId,
      capabilities: this.capabilities,
      permissions: this.permissions,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Agent配置（不包含敏感信息）
      agentConfig: {
        modelId: this.model?.model || 'unknown',
        capabilities: this.capabilities
      }
    };
  }
  
  /**
   * 从JSON反序列化
   */
  static fromJSON(json: any): OrganizationMemberImpl {
    const config: OrganizationMemberConfig = {
      id: json.id,
      name: json.name,
      role: json.role,
      level: json.level,
      status: json.status,
      parentId: json.parentId,
      teamId: json.teamId,
      departmentId: json.departmentId,
      capabilities: json.capabilities,
      permissions: json.permissions,
      metadata: json.metadata,
      // Agent配置需要从其他地方获取
      modelId: json.agentConfig?.modelId || 'default',
      mcpEndpoint: json.agentConfig?.mcpEndpoint || 'http://localhost:3000'
    };
    
    return new OrganizationMemberImpl(config);
  }
}