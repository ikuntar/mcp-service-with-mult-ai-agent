import type { Tool, ToolResult, ToolsetConfig, ToolsetDisplayMode } from '../../types';

/**
 * 简化的工具容器基类（用于增强容器）
 *
 * @abstract
 * @class SimpleToolContainer
 * @description 所有工具容器的基类，提供基础的工具注册和管理功能
 *
 * @example
 * ```typescript
 * class MyContainer extends SimpleToolContainer {
 *   constructor() {
 *     super('MyContainer', 'custom');
 *   }
 * }
 * ```
 */
abstract class SimpleToolContainer {
  protected tools: Map<string, Tool> = new Map();
  protected containerName: string;
  protected containerType: string;

  constructor(name: string, type: string) {
    this.containerName = name;
    this.containerType = type;
  }

  protected registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  getRawTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  findRaw(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  hasRaw(name: string): boolean {
    return this.tools.has(name);
  }

  async execute(name: string, args: any): Promise<ToolResult> {
    const tool = this.findRaw(name);
    if (!tool) {
      throw new Error(`工具不存在: ${name}`);
    }
    return await tool.execute(args);
  }

  clear(): void {
    this.tools.clear();
  }
}

/**
 * 角色定义接口
 *
 * @interface Role
 * @description 定义单个角色的权限配置
 *
 * @property {string} name - 角色显示名称
 * @property {string} [description] - 角色描述（可选）
 * @property {string[]} allowedGroups - 允许访问的组列表
 *
 * @example
 * ```typescript
 * {
 *   name: '普通用户',
 *   description: '可以访问公共工具',
 *   allowedGroups: ['public', 'basic']
 * }
 * ```
 */
export interface Role {
  name: string;
  description?: string;
  allowedGroups: string[]; // 允许访问的组
}

/**
 * 容器配置接口
 *
 * @interface ContainerConfig
 * @description 定义工具容器的完整配置
 *
 * @property {string} name - 容器名称
 * @property {string} [description] - 容器描述（可选）
 * @property {string} defaultRole - 默认角色名称
 * @property {Record<string, Role>} roles - 角色定义映射
 *
 * @example
 * ```typescript
 * {
 *   name: '基础工具集',
 *   description: '所有用户可用的基础工具',
 *   defaultRole: 'user',
 *   roles: {
 *     'user': { allowedGroups: ['public'] },
 *     'admin': { allowedGroups: ['*'] }
 *   }
 * }
 * ```
 */
export interface ContainerConfig {
  name: string;
  description?: string;
  defaultRole: string; // 默认角色
  roles: Record<string, Role>; // 角色定义
}

/**
 * 增强工具容器 - 支持基于角色和组的权限控制
 *
 * @class EnhancedToolContainer
 * @extends SimpleToolContainer
 * @description 实现RBAC权限控制的核心类，采用类似Linux用户组的权限模型
 *
 * @example
 * ```typescript
 * const config: ContainerConfig = {
 *   name: '高级工具集',
 *   defaultRole: 'user',
 *   roles: {
 *     'user': { allowedGroups: ['public'] },
 *     'admin': { allowedGroups: ['public', 'sensitive', 'admin-only'] }
 *   }
 * };
 *
 * const container = new EnhancedToolContainer('高级工具', 'advanced', config);
 * container.register(testTool);
 *
 * // 获取可见工具
 * const tools = container.getToolsByRole('user');
 *
 * // 检查权限
 * const canAccess = container.canAccess('user', 'test_tool');
 *
 * // 执行工具（自动权限检查）
 * await container.executeWithRole('user', 'test_tool', args);
 * ```
 */
export class EnhancedToolContainer extends SimpleToolContainer {
  public containerName: string;
  public containerType: string;
  protected roleConfig: ContainerConfig;
  protected toolsetConfig?: ToolsetConfig;
  protected expandCommand?: Tool;

  constructor(name: string, type: string, config: ContainerConfig, toolsetConfig?: ToolsetConfig) {
    super(name, type);
    this.containerName = name;
    this.containerType = type;
    this.roleConfig = config;
    this.toolsetConfig = toolsetConfig;
    
    // 如果配置了展开模式且需要自动生成展开命令，则创建展开命令
    if (toolsetConfig && 
        toolsetConfig.displayMode === 'expanded' && 
        toolsetConfig.autoGenerateExpandCommand) {
      this.createExpandCommand();
    }
  }

  /**
   * 创建展开命令
   */
  private createExpandCommand(): void {
    if (!this.toolsetConfig || !this.toolsetConfig.expandCommandName) {
      return;
    }

    this.expandCommand = {
      name: this.toolsetConfig.expandCommandName,
      description: this.toolsetConfig.expandCommandDescription || '展开显示工具集内的所有工具命令',
      groups: ['public', 'expand'],
      inputSchema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            description: '角色名称（可选，默认使用默认角色）'
          }
        },
        required: []
      },
      execute: async (args: any): Promise<ToolResult> => {
        const role = args?.role || this.roleConfig.defaultRole;
        const tools = this.getToolsByRole(role);
        
        return {
          content: [{
            type: 'text',
            text: `🔧 工具集: ${this.containerName}\n📝 ${this.toolsetConfig?.description || ''}\n\n📚 可用工具 (${tools.length}个):\n${tools.map(t => `  • ${t.name}: ${t.description}`).join('\n')}`
          }]
        };
      }
    };
  }

  /**
   * 设置工具集配置
   */
  setConfig(config: ToolsetConfig): void {
    this.toolsetConfig = config;
    
    // 重新创建展开命令
    this.expandCommand = undefined;
    if (config.displayMode === 'expanded' && config.autoGenerateExpandCommand) {
      this.createExpandCommand();
    }
  }

  /**
   * 获取工具集配置
   */
  getConfig(): ToolsetConfig | undefined {
    return this.toolsetConfig;
  }

  /**
   * 是否包含展开命令
   */
  hasExpandCommand(): boolean {
    return !!this.expandCommand;
  }

  /**
   * 获取展开命令
   */
  getExpandCommand(): Tool | undefined {
    return this.expandCommand;
  }

  /**
   * 获取显示的工具列表（根据配置模式）
   * @param roleName 角色名称
   * @returns 显示的工具列表
   */
  getDisplayTools(roleName: string): Tool[] {
    const role = this.roleConfig.roles[roleName];
    if (!role) {
      throw new Error(`角色 "${roleName}" 在容器 "${this.containerName}" 中不存在`);
    }

    const allTools = this.getRawTools();
    const visibleTools = allTools.filter(tool => {
      if (role.allowedGroups.includes('*')) {
        return true;
      }
      
      const toolGroups = tool.groups || [];
      return toolGroups.some((group: string) =>
        role.allowedGroups.includes(group)
      );
    });

    // 根据显示模式处理
    if (!this.toolsetConfig || this.toolsetConfig.displayMode === 'expanded') {
      // 展开模式：返回可见工具 + 展开命令（如果存在）
      const result = [...visibleTools];
      if (this.expandCommand) {
        result.push(this.expandCommand);
      }
      return result;
    } else if (this.toolsetConfig.displayMode === 'flat') {
      // 扁平模式：只返回可见工具，不包含展开命令
      return visibleTools;
    }

    return visibleTools;
  }

  /**
   * 注册工具（重写以支持groups）
   */
  register(tool: Tool): void {
    this.registerTool(tool);
  }

  /**
   * 批量注册工具
   */
  registerMany(tools: Tool[]): void {
    tools.forEach(tool => this.register(tool));
  }

  /**
   * 根据角色获取可见工具（白名单模式）
   * @param roleName 角色名称
   * @returns 可见工具列表
   */
  getToolsByRole(roleName: string): Tool[] {
    // 如果有配置，使用新的显示逻辑
    if (this.toolsetConfig) {
      return this.getDisplayTools(roleName);
    }
    
    // 否则使用原有逻辑
    const role = this.roleConfig.roles[roleName];
    if (!role) {
      throw new Error(`角色 "${roleName}" 在容器 "${this.containerName}" 中不存在`);
    }

    const allTools = this.getRawTools();
    return allTools.filter(tool => {
      if (role.allowedGroups.includes('*')) {
        return true;
      }
      
      const toolGroups = tool.groups || [];
      return toolGroups.some((group: string) =>
        role.allowedGroups.includes(group)
      );
    });
  }

  /**
   * 检查角色是否有权访问指定工具
   * @param roleName 角色名称
   * @param toolName 工具名称
   * @returns 是否有权访问
   */
  canAccess(roleName: string, toolName: string): boolean {
    const visibleTools = this.getToolsByRole(roleName);
    return visibleTools.some(tool => tool.name === toolName);
  }

  /**
   * 根据角色执行工具
   * @param roleName 角色名称
   * @param toolName 工具名称
   * @param args 工具参数
   * @returns 工具执行结果
   */
  async executeWithRole(roleName: string, toolName: string, args: any): Promise<ToolResult> {
    if (!this.canAccess(roleName, toolName)) {
      throw new Error(`角色 "${roleName}" 无权访问工具 "${toolName}"`);
    }

    const tool = this.findRaw(toolName);
    if (!tool) {
      throw new Error(`工具不存在: ${toolName}`);
    }

    return await tool.execute(args);
  }

  /**
   * 获取容器的角色配置信息
   */
  getRoleConfig(): ContainerConfig {
    return { ...this.roleConfig };
  }

  /**
   * 获取角色列表
   */
  getRoles(): string[] {
    return Object.keys(this.roleConfig.roles);
  }

  /**
   * 获取默认角色
   */
  getDefaultRole(): string {
    return this.roleConfig.defaultRole;
  }

  /**
   * 获取权限报告（用于调试）
   * @param roleName 角色名称
   */
  getPermissionReport(roleName: string): string {
    const role = this.roleConfig.roles[roleName];
    if (!role) {
      return `角色 "${roleName}" 不存在`;
    }

    const visibleTools = this.getToolsByRole(roleName);
    const allTools = this.getRawTools();

    const report: string[] = [];
    report.push(`容器: ${this.containerName} (${this.containerType})`);
    report.push(`角色: ${roleName} - ${role.description || '无描述'}`);
    report.push(`允许的组: ${role.allowedGroups.join(', ')}`);
    
    // 如果有配置，显示显示模式
    if (this.toolsetConfig) {
      report.push(`显示模式: ${this.toolsetConfig.displayMode}`);
      if (this.expandCommand) {
        report.push(`展开命令: ${this.expandCommand.name}`);
      }
    }
    
    report.push(`可见工具 (${visibleTools.length}/${allTools.length}):`);
    
    visibleTools.forEach(tool => {
      const groups = tool.groups || [];
      const isExpandCommand = this.expandCommand && tool.name === this.expandCommand.name;
      const marker = isExpandCommand ? '📦' : '✓';
      report.push(`  ${marker} ${tool.name} [${groups.join(', ')}]`);
    });

    const hiddenTools = allTools.filter(t => !visibleTools.includes(t));
    if (hiddenTools.length > 0) {
      report.push(`隐藏工具 (${hiddenTools.length}):`);
      hiddenTools.forEach(tool => {
        const groups = tool.groups || [];
        report.push(`  ✗ ${tool.name} [${groups.join(', ')}]`);
      });
    }

    return report.join('\n');
  }
}

/**
 * 工具组扩展 - 支持角色控制的工具组
 */
export class RoleBasedToolGroup extends EnhancedToolContainer {
  constructor(name: string, description: string, config: ContainerConfig, tools: Tool[] = [], toolsetConfig?: ToolsetConfig) {
    super(name, 'group', config, toolsetConfig);
    // 展开嵌套的工具数组
    const flatTools = tools.flat();
    flatTools.forEach(tool => this.registerTool(tool));
  }

  /**
   * 添加工具到组
   */
  addTool(tool: Tool): void {
    this.registerTool(tool);
  }

  /**
   * 批量添加工具
   */
  addTools(tools: Tool[]): void {
    tools.forEach(tool => this.addTool(tool));
  }
}

/**
 * 扩展工具集 - 支持角色控制的分组管理
 */
export class RoleBasedExtendedToolSet extends EnhancedToolContainer {
  private groups: Map<string, RoleBasedToolGroup | EnhancedToolContainer> = new Map();

  constructor(name: string, config: ContainerConfig, toolsetConfig?: ToolsetConfig) {
    super(name, 'extended', config, toolsetConfig);
  }

  /**
   * 注册工具组（支持 RoleBasedToolGroup 和 EnhancedToolContainer）
   */
  registerGroup(group: RoleBasedToolGroup | EnhancedToolContainer): void {
    // 获取组的名称（通过公共方法或属性）
    const groupName = group.getRoleConfig().name;
    this.groups.set(groupName, group as any);
    // 将组内工具注册到父容器
    group.getRawTools().forEach((tool: Tool) => this.registerTool(tool));
  }

  /**
   * 获取指定组的工具（根据角色）
   */
  getToolsByGroup(groupName: string, roleName: string): Tool[] {
    const group = this.groups.get(groupName);
    if (!group) {
      return [];
    }
    // 支持 EnhancedToolContainer 和 RoleBasedToolGroup
    if (typeof group.getToolsByRole === 'function') {
      return group.getToolsByRole(roleName);
    }
    return [];
  }

  /**
   * 获取所有组
   */
  getAllGroups(): (RoleBasedToolGroup | EnhancedToolContainer)[] {
    return Array.from(this.groups.values());
  }

  /**
   * 获取组信息
   */
  getGroup(name: string): RoleBasedToolGroup | EnhancedToolContainer | undefined {
    return this.groups.get(name);
  }

  /**
   * 检查是否存在指定组
   */
  hasGroup(name: string): boolean {
    return this.groups.has(name);
  }

  /**
   * 获取组数量
   */
  get groupSize(): number {
    return this.groups.size;
  }

  /**
   * 重写获取显示工具方法，支持分组和配置模式
   */
  getDisplayTools(roleName: string): Tool[] {
    const role = this.roleConfig.roles[roleName];
    if (!role) {
      throw new Error(`角色 "${roleName}" 在容器 "${this.containerName}" 中不存在`);
    }

    const allTools = this.getRawTools();
    const visibleTools = allTools.filter(tool => {
      if (role.allowedGroups.includes('*')) {
        return true;
      }
      
      const toolGroups = tool.groups || [];
      return toolGroups.some((group: string) =>
        role.allowedGroups.includes(group)
      );
    });

    // 根据显示模式处理
    if (!this.toolsetConfig || this.toolsetConfig.displayMode === 'expanded') {
      // 展开模式：返回可见工具 + 展开命令（如果存在）
      const result = [...visibleTools];
      if (this.expandCommand) {
        result.push(this.expandCommand);
      }
      return result;
    } else if (this.toolsetConfig.displayMode === 'flat') {
      // 扁平模式：只返回可见工具，不包含展开命令
      return visibleTools;
    }

    return visibleTools;
  }

  /**
   * 重写权限报告方法，支持分组信息
   */
  getPermissionReport(roleName: string): string {
    const role = this.roleConfig.roles[roleName];
    if (!role) {
      return `角色 "${roleName}" 不存在`;
    }

    const visibleTools = this.getToolsByRole(roleName);
    const allTools = this.getRawTools();

    const report: string[] = [];
    report.push(`容器: ${this.containerName} (${this.containerType})`);
    report.push(`角色: ${roleName} - ${role.description || '无描述'}`);
    report.push(`允许的组: ${role.allowedGroups.join(', ')}`);
    
    // 如果有配置，显示显示模式
    if (this.toolsetConfig) {
      report.push(`显示模式: ${this.toolsetConfig.displayMode}`);
      if (this.expandCommand) {
        report.push(`展开命令: ${this.expandCommand.name}`);
      }
    }
    
    // 显示分组信息
    if (this.groups.size > 0) {
      report.push(`子组数量: ${this.groups.size}`);
      this.groups.forEach((group, name) => {
        const groupTools = group.getRawTools();
        report.push(`  - ${name}: ${groupTools.length} 个工具`);
      });
    }
    
    report.push(`可见工具 (${visibleTools.length}/${allTools.length}):`);
    
    visibleTools.forEach(tool => {
      const groups = tool.groups || [];
      const isExpandCommand = this.expandCommand && tool.name === this.expandCommand.name;
      const marker = isExpandCommand ? '📦' : '✓';
      report.push(`  ${marker} ${tool.name} [${groups.join(', ')}]`);
    });

    const hiddenTools = allTools.filter(t => !visibleTools.includes(t));
    if (hiddenTools.length > 0) {
      report.push(`隐藏工具 (${hiddenTools.length}):`);
      hiddenTools.forEach(tool => {
        const groups = tool.groups || [];
        report.push(`  ✗ ${tool.name} [${groups.join(', ')}]`);
      });
    }

    return report.join('\n');
  }
}