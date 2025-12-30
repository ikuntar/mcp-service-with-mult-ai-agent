/**
 * 工具集配置实现
 * 定义工具集的显示模式和行为
 */

import { ToolsetConfig, ToolsetDisplayMode } from '../../types';

/**
 * 默认配置
 */
export const DEFAULT_TOOLSET_CONFIG: Omit<ToolsetConfig, 'name' | 'description'> = {
  displayMode: 'expanded',
  autoGenerateExpandCommand: true,
  expandCommandName: 'expand_tools',
  expandCommandDescription: '展开显示工具集内的所有工具命令',
};

/**
 * 配置管理器
 * 用于管理工具集的配置
 */
export class ToolsetConfigManager {
  private configs: Map<string, ToolsetConfig> = new Map();

  /**
   * 注册工具集配置
   */
  registerConfig(config: ToolsetConfig): void {
    this.configs.set(config.name, config);
  }

  /**
   * 获取工具集配置
   */
  getConfig(name: string): ToolsetConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * 检查是否存在配置
   */
  hasConfig(name: string): boolean {
    return this.configs.has(name);
  }

  /**
   * 获取所有配置
   */
  getAllConfigs(): ToolsetConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * 更新配置
   */
  updateConfig(name: string, updates: Partial<ToolsetConfig>): void {
    const existing = this.configs.get(name);
    if (existing) {
      this.configs.set(name, { ...existing, ...updates });
    }
  }

  /**
   * 删除配置
   */
  deleteConfig(name: string): boolean {
    return this.configs.delete(name);
  }

  /**
   * 清空所有配置
   */
  clear(): void {
    this.configs.clear();
  }

  /**
   * 获取配置数量
   */
  get size(): number {
    return this.configs.size;
  }
}

/**
 * 全局配置管理器实例
 */
export const globalToolsetConfigManager = new ToolsetConfigManager();

/**
 * 工具集显示模式枚举
 */
export enum ToolsetDisplayModeEnum {
  EXPANDED = 'expanded',
  FLAT = 'flat',
}

/**
 * 配置验证工具
 */
export class ConfigValidator {
  /**
   * 验证配置是否有效
   */
  static validate(config: ToolsetConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('工具集名称不能为空');
    }

    if (!config.description || config.description.trim() === '') {
      errors.push('工具集描述不能为空');
    }

    if (!['expanded', 'flat'].includes(config.displayMode)) {
      errors.push(`显示模式必须是 'expanded' 或 'flat'，当前值: ${config.displayMode}`);
    }

    if (config.displayMode === 'expanded' && config.autoGenerateExpandCommand) {
      if (!config.expandCommandName || config.expandCommandName.trim() === '') {
        errors.push('当启用自动展开命令时，必须提供 expandCommandName');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 创建配置（带验证）
   */
  static create(config: ToolsetConfig): ToolsetConfig {
    const validation = this.validate(config);
    if (!validation.valid) {
      throw new Error(`配置验证失败:\n${validation.errors.join('\n')}`);
    }
    return config;
  }
}

/**
 * 配置构建器
 * 用于流畅地创建配置
 */
export class ToolsetConfigBuilder {
  private config: Partial<ToolsetConfig> = {};

  name(name: string): this {
    this.config.name = name;
    return this;
  }

  description(description: string): this {
    this.config.description = description;
    return this;
  }

  displayMode(mode: ToolsetDisplayMode): this {
    this.config.displayMode = mode;
    return this;
  }

  autoGenerateExpandCommand(enabled: boolean = true): this {
    this.config.autoGenerateExpandCommand = enabled;
    return this;
  }

  expandCommandName(name: string): this {
    this.config.expandCommandName = name;
    return this;
  }

  expandCommandDescription(description: string): this {
    this.config.expandCommandDescription = description;
    return this;
  }

  metadata(metadata: Record<string, any>): this {
    this.config.metadata = metadata;
    return this;
  }

  build(): ToolsetConfig {
    // 应用默认值
    const finalConfig: ToolsetConfig = {
      name: this.config.name || '未命名工具集',
      description: this.config.description || '无描述',
      displayMode: this.config.displayMode || 'expanded',
      autoGenerateExpandCommand: this.config.autoGenerateExpandCommand ?? true,
      expandCommandName: this.config.expandCommandName,
      expandCommandDescription: this.config.expandCommandDescription,
      metadata: this.config.metadata || {},
    };

    // 验证配置
    const validation = ConfigValidator.validate(finalConfig);
    if (!validation.valid) {
      throw new Error(`配置验证失败:\n${validation.errors.join('\n')}`);
    }

    return finalConfig;
  }

  /**
   * 静态工厂方法
   */
  static create(): ToolsetConfigBuilder {
    return new ToolsetConfigBuilder();
  }
}

/**
 * 预定义的配置模板
 */
export const ToolsetTemplates = {
  /**
   * 展开模式模板 - 显示工具集信息和展开命令
   */
  expanded: (name: string, description: string): ToolsetConfig => {
    return ToolsetConfigBuilder.create()
      .name(name)
      .description(description)
      .displayMode('expanded')
      .autoGenerateExpandCommand(true)
      .expandCommandName(`expand_${name.toLowerCase().replace(/\s+/g, '_')}`)
      .expandCommandDescription(`展开显示 ${name} 的所有工具命令`)
      .build();
  },

  /**
   * 扁平模式模板 - 直接列出所有工具
   */
  flat: (name: string, description: string): ToolsetConfig => {
    return ToolsetConfigBuilder.create()
      .name(name)
      .description(description)
      .displayMode('flat')
      .autoGenerateExpandCommand(false)
      .build();
  },

  /**
   * 自定义配置模板
   */
  custom: (config: Partial<ToolsetConfig>): ToolsetConfig => {
    const builder = ToolsetConfigBuilder.create();
    
    if (config.name) builder.name(config.name);
    if (config.description) builder.description(config.description);
    if (config.displayMode) builder.displayMode(config.displayMode);
    if (config.autoGenerateExpandCommand !== undefined) {
      builder.autoGenerateExpandCommand(config.autoGenerateExpandCommand);
    }
    if (config.expandCommandName) builder.expandCommandName(config.expandCommandName);
    if (config.expandCommandDescription) builder.expandCommandDescription(config.expandCommandDescription);
    if (config.metadata) builder.metadata(config.metadata);
    
    return builder.build();
  },
};

/**
 * 工具集配置定义
 */
export const TOOLSET_CONFIGS: Record<string, ToolsetConfig> = {
  // 基础工具集 - 展开模式（显示工具集信息和展开命令）
  basic: ToolsetTemplates.expanded(
    '基础工具集',
    '基础工具，所有用户可用'
  ),

  // 高级工具集 - 展开模式
  advanced: ToolsetTemplates.expanded(
    '高级工具集',
    '需要特殊权限的高级工具'
  ),

  // 数据处理组 - 扁平模式（直接列出所有工具）
  'data-group': ToolsetTemplates.flat(
    '数据处理组',
    '数据处理工具组'
  ),

  // 文件插件 - 展开模式
  'file-plugin': ToolsetTemplates.expanded(
    '文件插件',
    '文件操作工具'
  ),

  // 扩展工具集 - 展开模式
  'extended-toolset': ToolsetTemplates.expanded(
    '扩展工具集',
    '扩展的工具集合'
  ),

  // 自定义配置示例
  'custom-example': ToolsetTemplates.custom({
    name: '自定义工具集',
    description: '自定义配置的工具集',
    displayMode: 'expanded',
    autoGenerateExpandCommand: true,
    expandCommandName: 'show_custom_tools',
    expandCommandDescription: '显示自定义工具集的所有工具',
    metadata: {
      version: '1.0.0',
      author: 'System'
    }
  })
};

/**
 * 初始化工具集配置管理器
 */
export function initializeToolsetConfigs(): void {
  console.log('[Config] 初始化工具集配置...');
  
  Object.entries(TOOLSET_CONFIGS).forEach(([key, config]) => {
    // 使用配置名称作为key注册
    globalToolsetConfigManager.registerConfig(config);
    console.log(`  - ${key}: ${config.name} (${config.displayMode})`);
  });
  
  console.log(`[Config] 已注册 ${globalToolsetConfigManager.size} 个工具集配置`);
}

/**
 * 获取工具集配置
 */
export function getToolsetConfig(name: string): ToolsetConfig | undefined {
  return globalToolsetConfigManager.getConfig(name);
}

/**
 * 设置工具集显示模式
 */
export function setToolsetDisplayMode(name: string, mode: ToolsetDisplayMode): void {
  const config = globalToolsetConfigManager.getConfig(name);
  if (config) {
    globalToolsetConfigManager.updateConfig(name, { displayMode: mode });
    console.log(`[Config] 工具集 "${name}" 显示模式已切换为: ${mode}`);
  } else {
    console.warn(`[Config] 未找到工具集 "${name}" 的配置`);
  }
}