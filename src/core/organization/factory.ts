/**
 * 工厂函数 - 精简版
 * 支持协作组件接口和组合模式
 */

import { globalOrganizationManager } from './global-manager';
import { CollaborationComponentConfig, ProxyExecutionContext, ProxyExecutionResult } from './types';
import { CollaborationComponent } from './collaboration-component';
import { StandardCollaborationComponent } from './standard-collaboration-component';
import { globalOptimizedUserSpaceManager } from '../user-space/user-space-optimized';

/**
 * 创建协作组件
 * 所有组件都继承Token生态权限
 */
export function createCollaborationComponent(
  id: string,
  name: string,
  options: {
    description?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<CollaborationComponent> {
  const config: CollaborationComponentConfig = {
    id,
    name,
    description: options.description,
    metadata: options.metadata
  };

  return globalOrganizationManager.registerCollaborationComponent(config);
}

/**
 * 创建组织成员
 */
export function createOrganizationMember(
  name: string,
  userToken: string,
  metadata?: Record<string, any>,
  role: 'admin' | 'member' = 'member'
) {
  return globalOrganizationManager.createOrganizationMember(name, userToken, metadata, role);
}

/**
 * 创建代理执行
 */
export function createProxyExecution(
  memberToken: string,
  componentId: string,
  toolName: string,
  args: any,
  context?: Partial<ProxyExecutionContext>
) {
  return globalOrganizationManager.proxyExecute(memberToken, componentId, toolName, args, context);
}

/**
 * 快速创建标准协作组件
 */
export const createStandardCollaborationComponent = {
  // 开发者组件
  developer: (id: string, name: string) => createCollaborationComponent(
    id,
    name,
    {
      description: `开发者组件: ${name}`
    }
  ),

  // 审查者组件
  reviewer: (id: string, name: string) => createCollaborationComponent(
    id,
    name,
    {
      description: `审查者组件: ${name}`
    }
  ),

  // 管理者组件
  manager: (id: string, name: string) => createCollaborationComponent(
    id,
    name,
    {
      description: `管理者组件: ${name}`
    }
  ),

  // 安全组件
  security: (id: string, name: string) => createCollaborationComponent(
    id,
    name,
    {
      description: `安全组件: ${name}`
    }
  ),

  // 自定义组件
  custom: (id: string, name: string, description?: string) => 
    createCollaborationComponent(
      id,
      name,
      {
        description: description || `自定义组件: ${name}`
      }
    )
};

/**
 * 创建自定义协作组件工厂
 * 允许用户创建自己的协作组件实现
 */
export function createCustomCollaborationComponent<T extends CollaborationComponent>(
  factory: (config: CollaborationComponentConfig) => T,
  config: CollaborationComponentConfig
): Promise<T> {
  return globalOrganizationManager.registerCollaborationComponent(config, factory) as Promise<T>;
}
/**
 * 快速创建标准角色成员
 */
export const createStandardMember = {
  // 创建管理员
  admin: (name: string, userToken: string, metadata?: Record<string, any>) => 
    createOrganizationMember(name, userToken, metadata, 'admin'),
  
  // 创建普通成员
  member: (name: string, userToken: string, metadata?: Record<string, any>) => 
    createOrganizationMember(name, userToken, metadata, 'member')
};
