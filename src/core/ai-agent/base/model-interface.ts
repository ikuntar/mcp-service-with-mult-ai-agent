/**
 * AI-Agent 模型接口定义
 * 支持两种类型的模型接口：功能性模型接口和高级模型接口
 */

/**
 * 基础模型配置
 */
export interface BaseModelConfig {
  id: string;
  type: 'functional' | 'advanced';  // 功能性或高级
  provider: 'openai' | 'anthropic' | 'gemini' | 'local' | 'mock';
  
  // API配置
  apiKey?: string;
  baseURL?: string;
  
  // 模型配置
  model: string;
  temperature?: number;        // 温度参数
  maxTokens?: number;          // 最大token数
  maxContextLength?: number;   // 最大上下文长度
  
  // 能力声明
  capabilities: string[];      // 如: ['text', 'reasoning', 'function_calling', 'mcp']
  
  // 优先级
  priority?: number;
}

/**
 * 功能性模型接口配置
 * 用于简单任务，不支持函数调用或MCP
 */
export interface FunctionalModelConfig extends BaseModelConfig {
  type: 'functional';
  capabilities: ('text' | 'reasoning')[];  // 仅支持文本和基础推理
}

/**
 * 高级模型接口配置
 * 用于复杂任务，支持函数调用和MCP
 */
export interface AdvancedModelConfig extends BaseModelConfig {
  type: 'advanced';
  capabilities: ('text' | 'reasoning' | 'function_calling' | 'mcp' | 'multimodal')[];
  
  // 高级特性配置
  functionCalling?: boolean;   // 是否支持函数调用
  mcpSupport?: boolean;        // 是否支持MCP
  parallelCalls?: boolean;     // 是否支持并行调用
}

/**
 * 模型响应格式
 */
export interface ModelResponse {
  content: string;
  reasoning?: string;
  toolCalls?: ToolCall[];      // 高级模型可能返回工具调用
  confidence?: number;
  tokens?: {
    input: number;
    output: number;
  };
  metadata?: Record<string, any>;
}

/**
 * 工具调用定义
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

/**
 * 模型接口基类
 */
export interface ModelInterface {
  name: string;
  model: string;
  type: 'functional' | 'advanced';
  
  // 核心推理接口
  think(prompt: string, options?: ThinkingOptions): Promise<ModelResponse>;
  
  // 高级模型专用：带工具调用的推理
  thinkWithTools?(prompt: string, tools: ToolDefinition[], options?: ThinkingOptions): Promise<ModelResponse>;
  
  // 健康检查
  healthCheck(): Promise<boolean>;
  
  // 获取模型信息
  getModelInfo(): ModelInfo;
}

/**
 * 思考选项
 */
export interface ThinkingOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  context?: any;  // 上下文信息
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;  // JSON Schema格式
}

/**
 * 模型信息
 */
export interface ModelInfo {
  name: string;
  provider: string;
  type: 'functional' | 'advanced';
  maxTokens: number;
  maxContextLength: number;
  capabilities: string[];
  functionCalling?: boolean;
  mcpSupport?: boolean;
}