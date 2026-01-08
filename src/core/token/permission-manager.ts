/**
 * 统一权限管理器
 * 
 * 集中管理所有角色权限检查，避免权限逻辑分散在各处
 * 支持角色扩展和权限配置
 */

import { TokenValidationResult } from './token-manager.js';

/**
 * 权限配置接口
 */
export interface PermissionConfig {
  /** 工具需要的最小角色 */
  minRole?: 'user' | 'analyst' | 'admin';
  /** 允许的角色列表 */
  allowedRoles?: string[];
  /** 需要的权限组 */
  requiredGroups?: string[];
  /** 自定义权限检查函数 */
  customCheck?: (role: string, tokenInfo: any) => boolean;
}

/**
 * 角色层级配置
 */
export const ROLE_HIERARCHY = {
  user: 1,
  analyst: 2,
  admin: 3
} as const;

/**
 * 工具分组权限映射
 */
export const GROUP_PERMISSIONS: Record<string, string[]> = {
  'public': ['user', 'analyst', 'admin'],
  'basic': ['user', 'analyst', 'admin'],
  'advanced': ['analyst', 'admin'],
  'sensitive': ['analyst', 'admin'],
  'admin-only': ['admin'],
  'analyst-only': ['analyst', 'admin'],
  'token-management': ['admin'],
  'userspace-management': ['admin'],
  'virtualization-management': ['admin'],
  'async-task': ['user', 'analyst', 'admin'],
  'user-message-queue': ['user', 'analyst', 'admin'],
  'executor-demo': ['user', 'analyst', 'admin'],
  'token-based-fetcher': ['user', 'analyst', 'admin'],
  'tool-discovery': ['user', 'analyst', 'admin']
};

/**
 * 统一权限管理器
 */
export class PermissionManager {
  private static instance: PermissionManager;

  /**
   * 获取单例实例
   */
  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * 检查角色是否有权限访问工具
   * @param role 用户角色
   * @param toolGroups 工具分组
   * @returns 是否有权限
   */
  hasPermission(role: string | null, toolGroups: string[]): boolean {
    if (!role) return false;

    // 检查每个分组的权限
    for (const group of toolGroups) {
      const allowedRoles = GROUP_PERMISSIONS[group];
      if (allowedRoles && allowedRoles.includes(role)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查token是否有权限访问工具
   * @param validationResult token验证结果
   * @param toolGroups 工具分组
   * @returns 权限检查结果
   */
  checkTokenPermission(
    validationResult: TokenValidationResult,
    toolGroups: string[]
  ): { allowed: boolean; reason?: string } {
    // 1. 检查token有效性
    if (!validationResult.isValid) {
      return {
        allowed: false,
        reason: `Token无效或已过期: ${validationResult.error}`
      };
    }

    const role = validationResult.role;

    // 2. 检查权限
    if (!this.hasPermission(role, toolGroups)) {
      // 生成友好的错误信息
      const requiredRoles = this.getRequiredRoles(toolGroups);
      return {
        allowed: false,
        reason: `权限不足：需要 ${requiredRoles.join('或')} 角色`
      };
    }

    return { allowed: true };
  }

  /**
   * 获取工具所需的最小角色
   * @param toolGroups 工具分组
   * @returns 所需角色列表
   */
  getRequiredRoles(toolGroups: string[]): string[] {
    const requiredRoles = new Set<string>();

    for (const group of toolGroups) {
      const allowedRoles = GROUP_PERMISSIONS[group];
      if (allowedRoles) {
        allowedRoles.forEach(role => requiredRoles.add(role));
      }
    }

    return Array.from(requiredRoles).sort((a, b) => 
      ROLE_HIERARCHY[a as keyof typeof ROLE_HIERARCHY] - 
      ROLE_HIERARCHY[b as keyof typeof ROLE_HIERARCHY]
    );
  }

  /**
   * 过滤可见工具列表
   * @param tools 所有工具
   * @param role 用户角色
   * @param userSpaceVisible 用户空间可见工具（可选）
   * @returns 过滤后的工具列表
   */
  filterVisibleTools(
    tools: Array<{ name: string; groups?: string[] }>,
    role: string | null,
    userSpaceVisible?: Set<string>
  ): Array<{ name: string; groups?: string[] }> {
    if (!role) return [];

    return tools.filter(tool => {
      // 1. 用户空间可见性检查
      if (userSpaceVisible && userSpaceVisible.size > 0) {
        if (!userSpaceVisible.has(tool.name)) {
          return false;
        }
      }

      // 2. 角色权限检查
      return this.hasPermission(role, tool.groups || []);
    });
  }

  /**
   * 获取角色的权限描述
   * @param role 角色
   * @returns 权限描述
   */
  getRolePermissions(role: string): {
    role: string;
    level: number;
    canAccess: string[];
    cannotAccess: string[];
  } {
    const canAccess: string[] = [];
    const cannotAccess: string[] = [];

    for (const [group, allowedRoles] of Object.entries(GROUP_PERMISSIONS)) {
      if (allowedRoles.includes(role)) {
        canAccess.push(group);
      } else {
        cannotAccess.push(group);
      }
    }

    return {
      role,
      level: ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0,
      canAccess,
      cannotAccess
    };
  }

  /**
   * 注册新的权限组
   * @param groupName 分组名称
   * @param allowedRoles 允许的角色
   */
  registerPermissionGroup(groupName: string, allowedRoles: string[]): void {
    GROUP_PERMISSIONS[groupName] = allowedRoles;
  }

  /**
   * 批量注册权限组
   * @param groups 权限组映射
   */
  registerPermissionGroups(groups: Record<string, string[]>): void {
    Object.assign(GROUP_PERMISSIONS, groups);
  }

  /**
   * 检查是否有权限执行工具调用
   * @param tokenValidation token验证结果
   * @param toolGroups 工具分组
   * @returns 检查结果和错误信息
   */
  validateToolAccess(
    tokenValidation: TokenValidationResult,
    toolGroups: string[]
  ): { allowed: boolean; error?: string } {
    const result = this.checkTokenPermission(tokenValidation, toolGroups);
    
    if (!result.allowed) {
      return {
        allowed: false,
        error: result.reason
      };
    }

    return { allowed: true };
  }
}

/**
 * 全局权限管理器实例
 */
export const globalPermissionManager = PermissionManager.getInstance();