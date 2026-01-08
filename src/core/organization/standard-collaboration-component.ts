/**
 * 标准协作组件实现 - 精简版
 * 通过组合用户空间实现协作功能，通过包装Token模块方法管理协作单元权限
 */

import { UserSpace } from '../user-space/user-space';
import { OptimizedUserSpaceManager, globalOptimizedUserSpaceManager } from '../user-space/user-space-optimized';
import { CollaborationComponent } from './collaboration-component';
import { globalTokenManager } from '../token/token-manager';
import { 
  CollaborationComponentConfig,
  OrganizationMember, 
  ProxyExecutionContext, 
  ProxyExecutionResult,
  OrganizationEventType,
  OrganizationEvent
} from './types';
import { Tool, ToolResult } from '../../types';
import { ToolPrefixManager } from './tool-prefix-manager';

export class StandardCollaborationComponent implements CollaborationComponent {
  // 基础属性
  id: string;
  name: string;
  description?: string;
  config: CollaborationComponentConfig;
  
  // 用户空间接口（组合模式）
  token: string;
  role: string;
  visibleTools: Set<string>;
  
  // 成员管理
  private members: Map<string, OrganizationMember>;
  
  // 状态
  private createdAt: string;
  private updatedAt: string;
  isActive: boolean;
  
  // 依赖
  private userSpaceManager: OptimizedUserSpaceManager;
  private eventListeners: ((event: OrganizationEvent) => void)[] = [];

  constructor(config: CollaborationComponentConfig, userSpaceManager: OptimizedUserSpaceManager = globalOptimizedUserSpaceManager) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.config = config;
    
    this.members = new Map();
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
    this.isActive = true;
    
    this.userSpaceManager = userSpaceManager;
    
    // 核心：组合用户空间
    this.initializeUserSpace();
  }

  /**
   * 核心：初始化用户空间（组合模式）
   * 继承Token生态权限
   */
  private initializeUserSpace(): void {
    // 为协作组件创建独立的用户空间
    const unitToken = `collab_${this.id}`;
    const unitRole = `collaboration_unit_${this.id}`;
    
    // 获取基础用户空间（继承Token生态权限）
    const baseUserSpace = this.userSpaceManager.getUserSpace(unitToken, unitRole);
    
    // 组合用户空间属性
    this.token = baseUserSpace.token;
    this.role = baseUserSpace.role;
    
    // 继承生态的可见工具
    this.visibleTools = new Set(baseUserSpace.visibleTools);
    
    console.log(`[StandardCollaborationComponent] 初始化用户空间: ${this.token} (角色: ${this.role})`);
  }

  /**
   * 添加成员
   */
  addMember(member: OrganizationMember): boolean {
    if (this.members.has(member.id)) {
      return false;
    }

    this.members.set(member.id, member);
    member.collaborationComponents.add(this.id);
    
    this.updatedAt = new Date().toISOString();
    
    // 触发事件
    this.emitEvent({
      type: OrganizationEventType.MEMBER_JOINED,
      timestamp: new Date().toISOString(),
      data: {
        memberId: member.id,
        memberName: member.name,
        collaborationUnitId: this.id,
        collaborationUnitName: this.name,
        role: member.role
      },
      actor: member.id,
      target: this.id
    });
    
    console.log(`[StandardCollaborationComponent] 成员加入: ${member.name} -> ${this.name} [角色: ${member.role}]`);
    return true;
  }

  /**
   * 移除成员
   */
  removeMember(memberId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) {
      return false;
    }

    this.members.delete(memberId);
    member.collaborationComponents.delete(this.id);
    
    this.updatedAt = new Date().toISOString();
    
    // 触发事件
    this.emitEvent({
      type: OrganizationEventType.MEMBER_LEFT,
      timestamp: new Date().toISOString(),
      data: {
        memberId,
        collaborationUnitId: this.id
      },
      actor: memberId,
      target: this.id
    });
    
    console.log(`[StandardCollaborationComponent] 成员离开: ${memberId} <- ${this.name}`);
    return true;
  }

  /**
   * 获取成员列表
   */
  getMembers(): Map<string, OrganizationMember> {
    return this.members;
  }

  /**
   * 代理执行（核心方法）
   * 作为中间件检查权限并代理执行
   */
  async proxyExecute(
    memberToken: string,
    toolName: string,
    args: any,
    context: ProxyExecutionContext
  ): Promise<ProxyExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 1. 验证成员身份
      const member = this.findMemberByToken(memberToken);
      if (!member) {
        return {
          success: false,
          error: '成员不存在或未加入此协作组件'
        };
      }

      // 2. 检查工具权限（通过Token系统）
      if (!this.checkToolPermission(toolName, member)) {
        return {
          success: false,
          error: `协作组件 ${this.name} 不允许工具: ${toolName} (角色: ${member.role})`
        };
      }

      // 3. 通过组合的用户空间执行
      const result = await this.executeThroughProxy(toolName, args, member);
      
      const executionTime = Date.now() - startTime;
      
      // 4. 触发执行事件
      this.emitEvent({
        type: OrganizationEventType.PROXY_EXECUTION,
        timestamp: new Date().toISOString(),
        data: {
          memberId: member.id,
          collaborationUnitId: this.id,
          toolName,
          success: result.success,
          executionTime,
          role: member.role
        },
        actor: member.id,
        target: this.id
      });
      
      return {
        success: result.success,
        output: result.output,
        executionTime,
        metadata: result.metadata
      };
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // 触发失败事件
      this.emitEvent({
        type: OrganizationEventType.PROXY_EXECUTION_FAILED,
        timestamp: new Date().toISOString(),
        data: {
          error: error.message,
          executionTime
        }
      });
      
      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * 通过组合的用户空间执行
   */
  private async executeThroughProxy(
    toolName: string,
    args: any,
    member: OrganizationMember
  ): Promise<{ success: boolean; output?: any; metadata?: any }> {
    // 检查协作组件是否允许此工具
    if (!this.visibleTools.has(toolName) && this.visibleTools.size > 0) {
      throw new Error(`协作组件 ${this.name} 不允许工具: ${toolName}`);
    }

    // 使用组合的用户空间执行
    // 这里集成到现有的工具执行系统
    console.log(`[StandardCollaborationComponent] 代理执行: ${member.name} (${member.role}) -> ${toolName}`, {
      args
    });
    
    // 模拟执行结果（实际应集成到执行器）
    return {
      success: true,
      output: `通过协作组件 ${this.name} 执行成功 (角色: ${member.role})`,
      metadata: {
        proxy: true,
        collaborationUnit: this.id,
        memberRole: member.role
      }
    };
  }

  /**
   * 检查工具权限（通过Token系统和成员角色）
   */
  private checkToolPermission(toolName: string, member: OrganizationMember): boolean {
    // 检查协作组件的可见工具
    if (this.visibleTools.size > 0 && !this.visibleTools.has(toolName)) {
      return false;
    }
    
    // 根据成员角色进行额外的权限检查
    // 管理员可以访问所有工具，普通成员可能受限
    if (member.role === 'admin') {
      return true; // 管理员拥有所有权限
    }
    
    // 普通成员的额外限制（可以根据需要扩展）
    const restrictedTools = ['delete_member', 'modify_component', 'cleanup'];
    if (member.role === 'member' && restrictedTools.includes(toolName)) {
      return false;
    }
    
    return true;
  }

  /**
   * 查找成员（通过Token）
   */
  private findMemberByToken(token: string): OrganizationMember | undefined {
    for (const member of this.members.values()) {
      if (member.userToken === token) {
        return member;
      }
    }
    return undefined;
  }

  /**
   * 状态管理
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const adminCount = Array.from(this.members.values()).filter(m => m.role === 'admin').length;
    const memberCount = this.members.size - adminCount;
    
    return {
      id: this.id,
      name: this.name,
      memberCount: this.members.size,
      adminCount,
      regularMemberCount: memberCount,
      active: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      visibleTools: Array.from(this.visibleTools),
      config: this.config
    };
  }

  /**
   * 监听事件
   */
  onEvent(listener: (event: OrganizationEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * 触发事件
   */
  private emitEvent(event: OrganizationEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[StandardCollaborationComponent] 事件监听器错误:', error);
      }
    });
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    // 清理用户空间
    const unitToken = `collab_${this.id}`;
    await this.userSpaceManager.cleanupUserSpace(unitToken);
    
    this.members.clear();
    this.eventListeners = [];
    
    console.log(`[StandardCollaborationComponent] 清理完成: ${this.name}`);
  }

  /**
   * 获取协作组件的MCP工具集（带前缀）
   * 自动为所有工具添加组件前缀
   */
  async getMCPToolsWithPrefix(memberToken: string): Promise<Tool[]> {
    const tools = await this.getMCPTools(memberToken);
    return tools.map(tool => ({
      ...tool,
      name: ToolPrefixManager.addPrefix(this.id, tool.name),
      description: `[${this.name}] ${tool.description}`
    }));
  }

  /**
   * 获取协作组件的MCP工具集（原始，无前缀）
   * 根据成员角色提供不同的工具
   */
  async getMCPTools(memberToken: string): Promise<Tool[]> {
    // 验证成员身份
    const member = this.findMemberByToken(memberToken);
    if (!member) {
      throw new Error('成员不存在或未加入此协作组件');
    }

    // 基础工具：代理执行工具（所有成员都有）
    const proxyTool: Tool = {
      name: 'proxy_execute',
      description: `通过协作组件 ${this.name} 代理执行工具调用`,
      inputSchema: {
        type: 'object',
        properties: {
          toolName: {
            type: 'string',
            description: '要执行的工具名称'
          },
          args: {
            type: 'object',
            description: '工具参数'
          }
        },
        required: ['toolName', 'args']
      },
      execute: async (args: any): Promise<ToolResult> => {
        return await this.executeMCPTool(memberToken, 'proxy_execute', args);
      }
    };

    // 成员管理工具（所有成员都有）
    const memberTools: Tool[] = [
      {
        name: 'list_members',
        description: `列出协作组件 ${this.name} 的所有成员`,
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: async (args: any): Promise<ToolResult> => {
          return await this.executeMCPTool(memberToken, 'list_members', args);
        }
      },
      {
        name: 'get_component_info',
        description: `获取协作组件 ${this.name} 的详细信息`,
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: async (args: any): Promise<ToolResult> => {
          return await this.executeMCPTool(memberToken, 'get_component_info', args);
        }
      }
    ];

    // 管理员专属工具
    const adminTools: Tool[] = [];
    if (member.role === 'admin') {
      adminTools.push(
        {
          name: 'add_member',
          description: `添加成员到协作组件 ${this.name}`,
          inputSchema: {
            type: 'object',
            properties: {
              memberId: {
                type: 'string',
                description: '要添加的成员ID'
              }
            },
            required: ['memberId']
          },
          execute: async (args: any): Promise<ToolResult> => {
            return await this.executeMCPTool(memberToken, 'add_member', args);
          }
        },
        {
          name: 'remove_member',
          description: `从协作组件 ${this.name} 移除成员`,
          inputSchema: {
            type: 'object',
            properties: {
              memberId: {
                type: 'string',
                description: '要移除的成员ID'
              }
            },
            required: ['memberId']
          },
          execute: async (args: any): Promise<ToolResult> => {
            return await this.executeMCPTool(memberToken, 'remove_member', args);
          }
        },
        {
          name: 'set_component_active',
          description: `设置协作组件 ${this.name} 的激活状态`,
          inputSchema: {
            type: 'object',
            properties: {
              active: {
                type: 'boolean',
                description: '是否激活'
              }
            },
            required: ['active']
          },
          execute: async (args: any): Promise<ToolResult> => {
            return await this.executeMCPTool(memberToken, 'set_component_active', args);
          }
        }
      );
    }

    // 组合所有工具
    const allTools = [proxyTool, ...memberTools, ...adminTools];
    
    console.log(`[StandardCollaborationComponent] 为成员 ${member.name} (${member.role}) 提供 ${allTools.length} 个MCP工具`);
    return allTools;
  }

  /**
   * 执行MCP工具
   * 作为MCP端点的统一入口
   */
  async executeMCPTool(memberToken: string, toolName: string, args: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // 验证成员身份
      const member = this.findMemberByToken(memberToken);
      if (!member) {
        return {
          content: [{ type: 'text', text: '错误: 成员不存在或未加入此协作组件' }],
          isError: true
        };
      }

      // 根据工具名称执行不同的逻辑
      switch (toolName) {
        case 'proxy_execute':
          return await this.handleProxyExecuteMCP(member, args);
        
        case 'list_members':
          return await this.handleListMembersMCP();
        
        case 'get_component_info':
          return await this.handleGetComponentInfoMCP();
        
        case 'add_member':
          return await this.handleAddMemberMCP(member, args);
        
        case 'remove_member':
          return await this.handleRemoveMemberMCP(member, args);
        
        case 'set_component_active':
          return await this.handleSetActiveMCP(member, args);
        
        default:
          return {
            content: [{ type: 'text', text: `错误: 未知的工具 ${toolName}` }],
            isError: true
          };
      }
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // 触发失败事件
      this.emitEvent({
        type: OrganizationEventType.PROXY_EXECUTION_FAILED,
        timestamp: new Date().toISOString(),
        data: {
          error: error.message,
          executionTime,
          toolName,
          memberToken: memberToken.substring(0, 8) + '...'
        }
      });
      
      return {
        content: [{ type: 'text', text: `执行失败: ${error.message}` }],
        isError: true,
      };
    }
  }

  /**
   * 处理代理执行MCP调用
   */
  private async handleProxyExecuteMCP(member: OrganizationMember, args: any): Promise<ToolResult> {
    const { toolName, args: toolArgs } = args;
    
    if (!toolName || !toolArgs) {
      return {
        content: [{ type: 'text', text: '错误: 需要提供 toolName 和 args 参数' }],
        isError: true
      };
    }

    // 通过代理执行
    const result = await this.proxyExecute(
      member.userToken,
      toolName,
      toolArgs,
      {
        memberToken: member.userToken,
        collaborationUnitId: this.id,
        requestedTool: toolName,
        requestedAction: 'execute'
      }
    );

    if (result.success) {
      return {
        content: [{ type: "text", text: JSON.stringify(result.output, null, 2) }]
      };
    } else {
      return {
        content: [{ type: "text", text: `执行失败: ${result.error}` }],
        isError: true
      };
    }
  }

  /**
   * 处理列出成员MCP调用
   */
  private async handleListMembersMCP(): Promise<ToolResult> {
    const members = Array.from(this.members.values()).map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt
    }));

    return {
      content: [{ 
        type: 'text', 
        text: `协作组件 ${this.name} 的成员 (${members.length}人):\n${JSON.stringify(members, null, 2)}` 
      }]
    };
  }

  /**
   * 处理获取组件信息MCP调用
   */
  private async handleGetComponentInfoMCP(): Promise<ToolResult> {
    const info = this.getStats();
    return {
      content: [{ 
        type: 'text', 
        text: `协作组件信息:\n${JSON.stringify(info, null, 2)}` 
      }]
    };
  }

  /**
   * 处理添加成员MCP调用（管理员专属）
   */
  private async handleAddMemberMCP(admin: OrganizationMember, args: any): Promise<ToolResult> {
    // 检查权限
    if (admin.role !== 'admin') {
      return {
        content: [{ type: 'text', text: '错误: 只有管理员可以添加成员' }],
        isError: true
      };
    }

    const { memberId } = args;
    if (!memberId) {
      return {
        content: [{ type: 'text', text: '错误: 需要提供 memberId 参数' }],
        isError: true
      };
    }

    // 查找要添加的成员
    const member = this.members.get(memberId);
    if (member) {
      return {
        content: [{ type: 'text', text: `成员 ${member.name} 已经在协作组件中` }]
      };
    }

    // 这里应该通过全局管理器查找成员，简化处理
    return {
      content: [{ type: 'text', text: `添加成员 ${memberId} 功能需要通过全局管理器实现` }]
    };
  }

  /**
   * 处理移除成员MCP调用（管理员专属）
   */
  private async handleRemoveMemberMCP(admin: OrganizationMember, args: any): Promise<ToolResult> {
    // 检查权限
    if (admin.role !== 'admin') {
      return {
        content: [{ type: 'text', text: '错误: 只有管理员可以移除成员' }],
        isError: true
      };
    }

    const { memberId } = args;
    if (!memberId) {
      return {
        content: [{ type: 'text', text: '错误: 需要提供 memberId 参数' }],
        isError: true
      };
    }

    const success = this.removeMember(memberId);
    if (success) {
      return {
        content: [{ type: 'text', text: `成员 ${memberId} 已从协作组件移除` }]
      };
    } else {
      return {
        content: [{ type: 'text', text: `移除失败: 成员 ${memberId} 不存在` }],
        isError: true
      };
    }
  }

  /**
   * 处理设置激活状态MCP调用（管理员专属）
   */
  private async handleSetActiveMCP(admin: OrganizationMember, args: any): Promise<ToolResult> {
    // 检查权限
    if (admin.role !== 'admin') {
      return {
        content: [{ type: 'text', text: '错误: 只有管理员可以设置组件状态' }],
        isError: true
      };
    }

    const { active } = args;
    if (typeof active !== 'boolean') {
      return {
        content: [{ type: 'text', text: '错误: 需要提供 active 参数 (boolean)' }],
        isError: true
      };
    }

    this.setActive(active);
    return {
      content: [{ type: 'text', text: `协作组件 ${this.name} 已${active ? '激活' : '停用'}` }]
    };
  }
}
