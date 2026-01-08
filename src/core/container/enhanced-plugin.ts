/**
 * 增强插件基类 - 支持工具展开模式
 * 提供类似工具集容器的expanded/flat两种显示模式
 */

import type { 
  Tool, 
  ToolResult, 
  ToolPlugin, 
  EnhancedToolPlugin, 
  ToolsetConfig, 
  ToolsetDisplayMode,
  PluginContext 
} from '../../types';

/**
 * 增强插件基类
 * 支持两种显示模式：expanded（展开模式）和flat（扁平模式）
 */
export abstract class EnhancedPluginBase implements EnhancedToolPlugin {
  name: string;
  description: string;
  toolsetConfig?: ToolsetConfig;
  protected expandCommand?: Tool;
  protected tools: Map<string, Tool> = new Map();
  context?: PluginContext;

  constructor(name: string, description: string, toolsetConfig?: ToolsetConfig) {
    this.name = name;
    this.description = description;
    this.toolsetConfig = toolsetConfig;
    
    // 如果配置了展开模式且需要自动生成展开命令，则创建展开命令
    if (toolsetConfig && 
        toolsetConfig.displayMode === 'expanded' && 
        toolsetConfig.autoGenerateExpandCommand) {
      this.createExpandCommand();
    }
  }

  /**
   * 插件初始化
   */
  async initialize?(context: PluginContext): Promise<void> {
    this.context = context;
  }

  /**
   * 获取插件提供的所有工具
   * 根据显示模式返回不同的工具列表
   * 支持异步，便于子类实现动态工具生成
   */
  getTools(): Tool[] {
    const allTools = Array.from(this.tools.values());
    
    // 如果没有配置或配置为展开模式
    if (!this.toolsetConfig || this.toolsetConfig.displayMode === 'expanded') {
      const result = [...allTools];
      if (this.expandCommand) {
        result.push(this.expandCommand);
      }
      return result;
    } else if (this.toolsetConfig.displayMode === 'flat') {
      // 扁平模式：只返回工具，不包含展开命令
      return allTools;
    }
    
    return allTools;
  }

  /**
   * 获取显示的工具列表（根据配置模式和角色）
   */
  getDisplayTools(roleName?: string): Tool[] {
    // 简化版本：暂时不考虑角色过滤，后续可以扩展
    return this.getTools();
  }

  /**
   * 注册单个工具
   */
  protected registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * 批量注册工具
   */
  protected registerTools(tools: Tool[]): void {
    tools.forEach(tool => this.registerTool(tool));
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
   * 设置配置
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
   * 获取配置
   */
  getConfig(): ToolsetConfig | undefined {
    return this.toolsetConfig;
  }

  /**
   * 插件清理
   */
  async cleanup?(): Promise<void> {
    this.tools.clear();
    this.expandCommand = undefined;
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
      description: this.toolsetConfig.expandCommandDescription || '展开显示插件内的所有工具命令',
      groups: ['public', 'expand'],
      inputSchema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            description: '角色名称（可选）'
          }
        },
        required: []
      },
      execute: async (args: any): Promise<ToolResult> => {
        const tools = this.getTools();
        
        return {
          content: [{
            type: 'text',
            text: `🔧 插件: ${this.name}\n📝 ${this.toolsetConfig?.description || ''}\n\n📚 可用工具 (${tools.length}个):\n${tools.map(t => `  • ${t.name}: ${t.description}`).join('\n')}`
          }]
        };
      }
    };
  }

  /**
   * 获取工具数量
   */
  get size(): number {
    return this.tools.size;
  }

  /**
   * 查找工具
   */
  find(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * 检查是否包含工具
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 执行工具
   */
  async execute(name: string, args: any): Promise<ToolResult> {
    const tool = this.find(name);
    if (!tool) {
      throw new Error(`工具不存在: ${name}`);
    }
    return await tool.execute(args);
  }

  /**
   * 获取所有工具（原始列表）
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

/**
 * 创建增强插件的便捷函数
 */
export function createEnhancedPlugin(
  name: string,
  description: string,
  toolFactory: () => Tool[],
  toolsetConfig?: ToolsetConfig
): EnhancedToolPlugin {
  return new (class extends EnhancedPluginBase {
    constructor() {
      super(name, description, toolsetConfig);
      const tools = toolFactory();
      this.registerTools(tools);
    }
  })();
}

/**
 * 插件配置模板（与工具集配置模板一致）
 */
export const PluginTemplates = {
  /**
   * 展开模式模板 - 显示插件信息和展开命令
   */
  expanded: (name: string, description: string): ToolsetConfig => {
    return {
      name,
      description,
      displayMode: 'expanded',
      autoGenerateExpandCommand: true,
      expandCommandName: `expand_${name.toLowerCase().replace(/\s+/g, '_')}`,
      expandCommandDescription: `展开显示 ${name} 的所有工具命令`
    };
  },

  /**
   * 扁平模式模板 - 直接列出所有工具
   */
  flat: (name: string, description: string): ToolsetConfig => {
    return {
      name,
      description,
      displayMode: 'flat',
      autoGenerateExpandCommand: false
    };
  },

  /**
   * 自定义配置模板
   */
  custom: (config: Partial<ToolsetConfig>): ToolsetConfig => {
    return {
      name: config.name || '未命名插件',
      description: config.description || '无描述',
      displayMode: config.displayMode || 'expanded',
      autoGenerateExpandCommand: config.autoGenerateExpandCommand ?? true,
      expandCommandName: config.expandCommandName,
      expandCommandDescription: config.expandCommandDescription,
      metadata: config.metadata || {}
    };
  }
};