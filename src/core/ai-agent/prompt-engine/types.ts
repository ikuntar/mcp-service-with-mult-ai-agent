/**
 * 简化版提示词工程 - 类型定义
 * 包含三种提示词类型：系统提示词、追加提示词、拼接提示词
 */

/**
 * 模板变量定义
 */
export interface VariableDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  validation?: (value: any) => boolean;
}

/**
 * 提示词格式类型
 */
export type PromptFormat = 'template' | 'fixed';

/**
 * 系统提示词 (System Prompt)
 * - 定义AI的基础角色和行为
 * - 通常作为提示词的起点
 */
export interface SystemPromptConfig {
  id: string;
  name: string;
  format: PromptFormat;
  
  // 模板格式
  template?: string;
  variables?: VariableDefinition[];
  
  // 固定格式
  content?: string;
  
  // 元数据
  metadata?: {
    version?: string;
    author?: string;
    tags?: string[];
    description?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * 追加提示词 (Append Prompt)
 * - 在对话过程中追加的指令
 * - 用于强化、修正或补充
 */
export interface AppendPromptConfig {
  id: string;
  name: string;
  format: PromptFormat;
  
  // 模板格式
  template?: string;
  variables?: VariableDefinition[];
  
  // 固定格式
  content?: string;
  
  // 追加位置
  position?: 'before' | 'after' | 'replace';
  
  // 元数据
  metadata?: {
    version?: string;
    author?: string;
    tags?: string[];
    description?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * 拼接提示词 (Concatenate Prompt)
 * - 可以插入到任意提示词的变量位置
 * - 支持动态拼接
 */
export interface ConcatenatePromptConfig {
  id: string;
  name: string;
  format: PromptFormat;
  
  // 模板格式
  template?: string;
  variables?: VariableDefinition[];
  
  // 固定格式
  content?: string;
  
  // 拼接目标：指定要插入的提示词ID和变量名
  target: {
    promptId: string;    // 目标提示词ID
    variableName: string; // 目标变量名
  };
  
  // 拼接方式
  mode?: 'prepend' | 'append' | 'replace';
  
  // 元数据
  metadata?: {
    version?: string;
    author?: string;
    tags?: string[];
    description?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * 渲染选项
 */
export interface RenderOptions {
  strict?: boolean;
  useDefaults?: boolean;
  autoFormat?: boolean;
}

/**
 * 渲染结果
 */
export interface RenderResult {
  success: boolean;
  content: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 提示词引擎配置
 */
export interface PromptEngineConfig {
  strictMode?: boolean;
  useDefaults?: boolean;
  autoFormat?: boolean;
  debug?: boolean;
}

/**
 * 提示词组合配置
 */
export interface PromptComposition {
  systemPromptId: string;
  appendPromptIds?: string[];
  concatenatePromptIds?: string[];
  variables?: Record<string, any>;
  options?: RenderOptions;
}

/**
 * JSON加载器配置
 */
export interface JSONLoaderConfig {
  /**
   * 扫描的根目录
   * @default 'src/core/ai-agent/prompts'
   */
  rootDir?: string;
  
  /**
   * 是否递归扫描子目录
   * @default true
   */
  recursive?: boolean;
  
  /**
   * 文件匹配模式
   * @default '*.json'
   */
  pattern?: string;
  
  /**
   * 是否自动加载默认配置
   * @default true
   */
  autoLoadDefaults?: boolean;
}

/**
 * 加载结果接口
 */
export interface LoadResult {
  success: boolean;
  loaded: {
    system: number;
    append: number;
    concatenate: number;
  };
  errors: string[];
  files: string[];
}