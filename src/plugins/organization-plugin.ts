/**
 * 组织架构插件 - 支持基于用户token的权限控制
 * 根据用户持有的token动态显示有权使用的MCP工具
 */

import type { Tool, ToolResult, PluginContext } from '../types';
import { EnhancedPluginBase, PluginTemplates } from '../core/container/enhanced-plugin';
import { globalOrganizationManager } from '../core/organization/global-manager';
import { getAllCollaborationTools, executeCollaborationTool } from '../core/organization/global-tool-provider';

/**
 * 组织架构插件
 * 支持两种显示模式，并根据用户token动态过滤工具
 */
export class OrganizationPlugin extends EnhancedPluginBase {
  constructor() {
    // 使用展开模式配置
    const config = PluginTemplates.expanded(
      '组织架构',
      '管理协作组件和成员的工具集，支持基于角色的权限控制'
    );
    
    super('organization-tools', '组织架构管理工具集', config);
    
    // 预注册所有可能的基础工具
    this.registerTools(this.getBaseTools());
    this.registerTools(this.getAdminTools());
  }

  /**
   * 插件初始化
   */
  async initialize(context: PluginContext): Promise<void> {
    await super.initialize?.(context);
    console.log('[OrganizationPlugin] 组织架构插件初始化完成');
  }

  /**
   * 重写getTools方法 - 根据用户token动态过滤工具
   */
  getTools(): Tool[] {
    // 如果没有上下文或token，返回基础工具（安全起见）
    if (!this.context || !this.context.config?.token) {
      return this.getBaseTools();
    }

    const token = this.context.config.token;
    
    try {
      // 验证token并获取成员信息
      const member = globalOrganizationManager.findMemberByToken(token);
      if (!member) {
        console.log('[OrganizationPlugin] 成员不存在或token无效');
        return this.getBaseTools();
      }

      // 根据成员角色过滤基础和管理员工具
      const filteredBaseTools = this.getBaseTools().filter(tool => {
        if (tool.name.startsWith('org_')) {
          return true;  // 所有成员都有基础工具
        }
        if (tool.name.startsWith('admin_')) {
          return member.role === 'admin';  // 只有管理员有管理工具
        }
        return false;
      });

      // 注意：协作工具现在不在这里返回，需要通过MCP服务器单独获取
      // 这样避免了异步问题，同时减少了重复逻辑

      // 如果是展开模式，添加展开命令
      let tools = filteredBaseTools;
      if (this.toolsetConfig?.displayMode === 'expanded' && this.expandCommand) {
        tools = [...tools, this.expandCommand];
      }

      console.log(`[OrganizationPlugin] 为成员 ${member.name} (${member.role}) 提供 ${tools.length} 个基础工具`);
      return tools;

    } catch (error) {
      console.error('[OrganizationPlugin] 工具过滤失败:', error);
      return this.getBaseTools();
    }
  }

  /**
   * 重写工具执行方法 - 支持动态工具执行
   */
  async execute(name: string, args: any): Promise<ToolResult> {
    // 从上下文中获取token
    const token = this.context?.config?.token;
    
    if (!token) {
      return {
        content: [{ type: 'text', text: '错误: 需要提供有效的用户token' }],
        isError: true
      };
    }

    try {
      // 检查是否是基础工具
      if (name.startsWith('org_')) {
        return await this.executeBaseTool(name, args, token);
      }

      // 检查是否是管理员工具
      if (name.startsWith('admin_')) {
        return await this.executeAdminTool(name, args, token);
      }

      // 否则是协作组件工具 - 委托给全局提供器
      return await executeCollaborationTool(token, name, args);

    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `执行失败: ${error.message}` }],
        isError: true
      };
    }
  }

  /**
   * 获取基础管理工具（所有成员都有）
   */
  private getBaseTools(): Tool[] {
    return [
      {
        name: 'org_get_my_info',
        description: '获取当前用户在组织中的信息（成员角色、所在组件等）',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: async (args: any): Promise<ToolResult> => {
          // 这个execute会被重写的execute方法处理
          return { content: [{ type: 'text', text: '基础工具' }] };
        }
      },
      {
        name: 'org_list_my_components',
        description: '列出当前用户加入的所有协作组件',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: async (args: any): Promise<ToolResult> => {
          return { content: [{ type: 'text', text: '基础工具' }] };
        }
      },
      {
        name: 'org_get_global_stats',
        description: '获取组织全局统计信息',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: async (args: any): Promise<ToolResult> => {
          return { content: [{ type: 'text', text: '基础工具' }] };
        }
      }
    ];
  }

  /**
   * 获取管理员专属工具
   */
  private getAdminTools(): Tool[] {
    return [
      {
        name: 'admin_create_component',
        description: '创建新的协作组件（管理员专属）',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '组件ID' },
            name: { type: 'string', description: '组件名称' },
            description: { type: 'string', description: '组件描述' }
          },
          required: ['id', 'name']
        },
        execute: async (args: any): Promise<ToolResult> => {
          return { content: [{ type: 'text', text: '管理员工具' }] };
        }
      },
      {
        name: 'admin_delete_component',
        description: '删除协作组件（管理员专属）',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: { type: 'string', description: '要删除的组件ID' }
          },
          required: ['componentId']
        },
        execute: async (args: any): Promise<ToolResult> => {
          return { content: [{ type: 'text', text: '管理员工具' }] };
        }
      },
      {
        name: 'admin_create_member',
        description: '创建组织成员（管理员专属）',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '成员名称' },
            userToken: { type: 'string', description: '用户Token' },
            role: { type: 'string', description: '角色: admin/member', enum: ['admin', 'member'] }
          },
          required: ['name', 'userToken']
        },
        execute: async (args: any): Promise<ToolResult> => {
          return { content: [{ type: 'text', text: '管理员工具' }] };
        }
      },
      {
        name: 'admin_add_member_to_component',
        description: '将成员添加到协作组件（管理员专属）',
        inputSchema: {
          type: 'object',
          properties: {
            memberId: { type: 'string', description: '成员ID' },
            componentId: { type: 'string', description: '组件ID' }
          },
          required: ['memberId', 'componentId']
        },
        execute: async (args: any): Promise<ToolResult> => {
          return { content: [{ type: 'text', text: '管理员工具' }] };
        }
      }
    ];
  }

  /**
   * 执行基础工具
   */
  private async executeBaseTool(name: string, args: any, token: string): Promise<ToolResult> {
    const member = globalOrganizationManager.findMemberByToken(token);
    if (!member) {
      return {
        content: [{ type: 'text', text: '错误: 成员不存在或token无效' }],
        isError: true
      };
    }

    switch (name) {
      case 'org_get_my_info':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: member.id,
              name: member.name,
              role: member.role,
              status: member.status,
              collaborationComponents: Array.from(member.collaborationComponents),
              joinedAt: member.joinedAt
            }, null, 2)
          }]
        };

      case 'org_list_my_components':
        const components = Array.from(member.collaborationComponents).map(id => {
          const component = globalOrganizationManager.getCollaborationComponent(id);
          return component ? { id, name: component.name } : null;
        }).filter(Boolean);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(components, null, 2)
          }]
        };

      case 'org_get_global_stats':
        const stats = globalOrganizationManager.getGlobalStats();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(stats, null, 2)
          }]
        };

      default:
        return {
          content: [{ type: 'text', text: `未知的基础工具: ${name}` }],
          isError: true
        };
    }
  }

  /**
   * 执行管理员工具
   */
  private async executeAdminTool(name: string, args: any, token: string): Promise<ToolResult> {
    const member = globalOrganizationManager.findMemberByToken(token);
    if (!member || member.role !== 'admin') {
      return {
        content: [{ type: 'text', text: '错误: 只有管理员可以执行此操作' }],
        isError: true
      };
    }

    try {
      switch (name) {
        case 'admin_create_component':
          const component = await globalOrganizationManager.registerCollaborationComponent({
            id: args.id,
            name: args.name,
            description: args.description
          });
          return {
            content: [{
              type: 'text',
              text: `协作组件创建成功: ${component.name} (${component.id})`
            }]
          };

        case 'admin_delete_component':
          const success = await globalOrganizationManager.deleteCollaborationComponent(args.componentId);
          return {
            content: [{
              type: 'text',
              text: success ? `协作组件 ${args.componentId} 已删除` : `删除失败`
            }]
          };

        case 'admin_create_member':
          const newMember = globalOrganizationManager.createOrganizationMember(
            args.name,
            args.userToken,
            {},
            args.role || 'member'
          );
          return {
            content: [{
              type: 'text',
              text: `成员创建成功: ${newMember.name} (${newMember.id})`
            }]
          };

        case 'admin_add_member_to_component':
          const added = globalOrganizationManager.addMemberToComponent(args.memberId, args.componentId);
          return {
            content: [{
              type: 'text',
              text: added ? `成员 ${args.memberId} 已添加到组件 ${args.componentId}` : `添加失败`
            }]
          };

        default:
          return {
            content: [{ type: 'text', text: `未知的管理员工具: ${name}` }],
            isError: true
          };
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `执行失败: ${error.message}` }],
        isError: true
      };
    }
  }

  /**
   * 重写getDisplayTools - 支持动态权限过滤
   */
  getDisplayTools(roleName?: string): Tool[] {
    // 这里可以实现更复杂的显示逻辑
    // 比如根据角色过滤显示的工具
    return this.getTools();
  }
}

/**
 * 创建组织插件的便捷函数
 */
export function createOrganizationPlugin(): OrganizationPlugin {
  return new OrganizationPlugin();
}