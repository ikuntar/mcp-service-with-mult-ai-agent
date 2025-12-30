/**
 * MCP工具类型定义
 */

// BaseToolContainer 已移除，使用增强容器系统

/**
 * 工具执行结果
 * 符合MCP协议的CallToolResult格式
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
  _meta?: {
    progressToken?: string | number;
  };
  structuredContent?: Record<string, unknown>;
  task?: {
    taskId: string;
    status: 'working' | 'input_required' | 'completed' | 'failed' | 'cancelled';
    ttl: number | null;
    createdAt: string;
    lastUpdatedAt: string;
    pollInterval?: number;
    statusMessage?: string;
  };
}

/**
 * 执行器配置接口
 */
export interface ExecutorConfig {
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否需要权限验证 */
  needAuth?: boolean;
  /** 执行器类型 */
  type?: string;
  /** 额外的元数据 */
  metadata?: Record<string, any>;
}

/**
 * 基础工具接口定义
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  execute: (args: any) => Promise<ToolResult>;
  /**
   * 工具所属的组标签
   * 用于基于角色的权限控制
   */
  groups?: string[];
  /**
   * 执行器配置
   * 用于控制工具的执行方式
   */
  executor?: ExecutorConfig;
}

/**
 * 插件上下文 - 用于插件间共享状态和资源
 */
export interface PluginContext {
  toolSet: ToolSetLike;
  sharedState: Map<string, any>;
  config: Record<string, any>;
}

/**
 * 插件化工具接口
 * 支持生命周期管理和共享状态
 */
export interface ToolPlugin {
  name: string;
  description: string;
  
  /**
   * 插件初始化
   * 在插件注册时调用，可用于创建共享资源
   */
  initialize?(context: PluginContext): Promise<void>;
  
  /**
   * 获取插件提供的工具列表
   */
  getTools(): Tool[];
  
  /**
   * 插件清理
   * 在服务器关闭时调用，可用于释放资源
   */
  cleanup?(): Promise<void>;
}

/**
 * 工具分组
 * 用于逻辑相关的工具集合
 */
export interface ToolGroup {
  name: string;
  description: string;
  
  /**
   * 添加工具到分组
   */
  addTool(tool: Tool): void;
  
  /**
   * 从分组中移除工具
   */
  removeTool(toolName: string): void;
  
  /**
   * 查找分组中的工具
   */
  findTool(toolName: string): Tool | null;
  
  /**
   * 获取工具列表（经过过滤）
   */
  getTools(): Tool[];
  
  /**
   * 获取原始工具列表（不过滤）
   */
  getRawTools(): Tool[];
  
  /**
   * 获取工具数量
   */
  size: number;
  
  /**
   * 获取原始工具数量
   */
  rawSize: number;
}

/**
 * 工具集基础接口（用于类型约束）
 */
export interface ToolSetLike {
  register(tool: Tool): void;
  find(name: string): Tool | undefined;
  execute(name: string, args: any): Promise<ToolResult>;
  getAllTools(): Tool[];
  has(name: string): boolean;
  size: number;
}

/**
 * 工具集显示模式
 */
export type ToolsetDisplayMode = 'expanded' | 'flat';

/**
 * 工具集配置接口
 */
export interface ToolsetConfig {
  /** 工具集名称 */
  name: string;
  
  /** 工具集描述 */
  description: string;
  
  /** 显示模式 */
  displayMode: ToolsetDisplayMode;
  
  /** 是否自动生成展开工具命令 */
  autoGenerateExpandCommand?: boolean;
  
  /** 展开命令的名称（当displayMode为'expanded'时） */
  expandCommandName?: string;
  
  /** 展开命令的描述 */
  expandCommandDescription?: string;
  
  /** 额外的元数据 */
  metadata?: Record<string, any>;
}

/**
 * 扩展工具集接口（支持分组）
 */
export interface ExtendedToolSet extends ToolSetLike {
  registerGroup(group: ToolGroup): void;
  getToolsByGroup(groupName: string): Tool[];
  getAllGroups(): ToolGroup[];
  getGroup(name: string): ToolGroup | undefined;
}

/**
 * 工具集接口（支持配置和显示模式）
 */
export interface ConfigurableToolSet extends ToolSetLike {
  /** 设置配置 */
  setConfig(config: ToolsetConfig): void;
  
  /** 获取配置 */
  getConfig(): ToolsetConfig;
  
  /** 获取显示的工具列表（根据配置模式） */
  getDisplayTools(role: string): Tool[];
  
  /** 是否包含展开命令 */
  hasExpandCommand(): boolean;
  
  /** 获取展开命令 */
  getExpandCommand(): Tool | undefined;
}

/**
 * 插件管理器接口
 */
export interface PluginManager {
  registerPlugin(plugin: ToolPlugin): Promise<void>;
  getPlugin(name: string): ToolPlugin | undefined;
  getAllPlugins(): ToolPlugin[];
  initializePlugins(context: PluginContext): Promise<void>;
  cleanupPlugins(): Promise<void>;
  size: number;
}

/**
 * 工具注册方式类型
 */
export type ToolRegistrationMethod = 'direct' | 'group' | 'plugin';

/**
 * 工具元数据
 */
export interface ToolMetadata {
  registrationMethod: ToolRegistrationMethod;
  groupName?: string;
  pluginName?: string;
  createdAt: string;
}

/**
 * 服务器配置
 */
export interface ServerConfig {
  name: string;
  version: string;
  capabilities: {
    tools: {};
    resources?: {};
    prompts?: {};
  };
  plugins?: Record<string, any>;
  groups?: Record<string, any>;
}

/**
 * 错误类型定义
 */
export class ToolExecutionError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

export class PluginInitializationError extends Error {
  constructor(
    message: string,
    public pluginName: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PluginInitializationError';
  }
}

export class ToolRegistrationError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public reason: 'duplicate' | 'invalid' | 'conflict'
  ) {
    super(message);
    this.name = 'ToolRegistrationError';
  }
}
