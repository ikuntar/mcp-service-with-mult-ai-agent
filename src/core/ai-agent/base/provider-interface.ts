/**
 * AI服务商接口定义
 */

export interface AIProvider {
  name: string;
  model: string;
  
  // 核心推理接口
  think(prompt: string, options?: ThinkingOptions): Promise<AIResponse>;
  
  // 健康检查
  healthCheck(): Promise<boolean>;
  
  // 获取模型信息
  getModelInfo(): ModelInfo;
}

export interface ThinkingOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AIResponse {
  content: string;
  reasoning?: string;
  confidence?: number;
  tokens?: {
    input: number;
    output: number;
  };
  metadata?: Record<string, any>;
}

export interface ModelInfo {
  name: string;
  provider: string;
  maxTokens: number;
  capabilities: string[];
}

/**
 * 服务商配置
 */
export interface ProviderConfig {
  id: string;
  type: 'openai' | 'anthropic' | 'gemini' | 'local' | 'mock';
  
  // API配置
  apiKey?: string;
  baseURL?: string;
  
  // 模型配置
  model: string;
  
  // 能力声明
  capabilities: string[];
  
  // 优先级（数字越大越优先）
  priority?: number;
}

/**
 * 服务商工厂接口
 */
export interface ProviderFactory {
  create(config: ProviderConfig): AIProvider;
  getOrCreate(config: ProviderConfig): AIProvider;
  clearCache(): void;
}