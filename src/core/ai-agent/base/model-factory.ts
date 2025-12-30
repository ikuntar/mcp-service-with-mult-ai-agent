/**
 * 模型接口工厂
 * 创建功能性模型接口或高级模型接口
 */

import { 
  ModelInterface, 
  BaseModelConfig, 
  FunctionalModelConfig, 
  AdvancedModelConfig,
  ModelResponse,
  ThinkingOptions,
  ToolDefinition,
  ToolCall
} from './model-interface';

/**
 * 功能性模型接口
 * 用于简单任务，不支持函数调用或MCP
 */
class FunctionalModel implements ModelInterface {
  name: string;
  model: string;
  type: 'functional' = 'functional';
  private config: FunctionalModelConfig;

  constructor(config: FunctionalModelConfig) {
    this.name = config.id;
    this.model = config.model;
    this.config = config;
  }

  async think(prompt: string, options?: ThinkingOptions): Promise<ModelResponse> {
    // 模拟功能性模型的推理
    await new Promise(resolve => setTimeout(resolve, 50));

    const lowerPrompt = prompt.toLowerCase();
    let reasoning = '';

    // 基于关键词的简单推理
    if (lowerPrompt.includes('读取') || lowerPrompt.includes('read')) {
      reasoning = '这是一个读取操作，需要使用文件读取工具';
    } else if (lowerPrompt.includes('写入') || lowerPrompt.includes('write')) {
      reasoning = '这是一个写入操作，需要使用文件写入工具';
    } else if (lowerPrompt.includes('分析') || lowerPrompt.includes('analyze')) {
      reasoning = '这是一个分析操作，需要使用数据分析工具';
    } else if (lowerPrompt.includes('计算') || lowerPrompt.includes('calculate')) {
      reasoning = '这是一个计算操作，需要使用计算工具';
    } else {
      reasoning = '这是一个通用操作，需要使用基础工具';
    }

    return {
      content: reasoning,
      reasoning: reasoning,
      confidence: 0.8,
      tokens: {
        input: prompt.length,
        output: reasoning.length
      },
      metadata: {
        model: this.model,
        type: 'functional',
        provider: this.config.provider
      }
    };
  }

  async healthCheck(): Promise<boolean> {
    // 功能性模型总是可用（Mock或本地）
    return true;
  }

  getModelInfo(): any {
    return {
      name: this.name,
      provider: this.config.provider,
      type: this.type,
      model: this.model,
      maxTokens: this.config.maxTokens || 1000,
      maxContextLength: this.config.maxContextLength || 2000,
      capabilities: this.config.capabilities,
      functionCalling: false,
      mcpSupport: false
    };
  }
}

/**
 * 高级模型接口
 * 用于复杂任务，支持函数调用和MCP
 */
class AdvancedModel implements ModelInterface {
  name: string;
  model: string;
  type: 'advanced' = 'advanced';
  private config: AdvancedModelConfig;

  constructor(config: AdvancedModelConfig) {
    this.name = config.id;
    this.model = config.model;
    this.config = config;
  }

  async think(prompt: string, options?: ThinkingOptions): Promise<ModelResponse> {
    // 高级模型的推理逻辑
    // 这里可以集成真实的API调用
    await new Promise(resolve => setTimeout(resolve, 100));

    const lowerPrompt = prompt.toLowerCase();
    let reasoning = '';
    let toolCalls: ToolCall[] = [];

    // 高级模型可以识别工具调用
    if (lowerPrompt.includes('读取') || lowerPrompt.includes('read')) {
      reasoning = '检测到文件读取需求，建议调用readFile工具';
      toolCalls.push({
        id: 'call-001',
        name: 'readFile',
        arguments: { path: 'file.txt' }
      });
    } else if (lowerPrompt.includes('写入') || lowerPrompt.includes('write')) {
      reasoning = '检测到文件写入需求，建议调用writeFile工具';
      toolCalls.push({
        id: 'call-002',
        name: 'writeFile',
        arguments: { path: 'file.txt', content: 'data' }
      });
    } else if (lowerPrompt.includes('分析') || lowerPrompt.includes('analyze')) {
      reasoning = '检测到分析需求，建议调用数据分析工具';
      toolCalls.push({
        id: 'call-003',
        name: 'analyzeData',
        arguments: { data: 'sample' }
      });
    } else {
      reasoning = '这是一个复杂任务，需要多步骤处理';
    }

    return {
      content: reasoning,
      reasoning: reasoning,
      toolCalls: toolCalls,
      confidence: 0.9,
      tokens: {
        input: prompt.length,
        output: reasoning.length
      },
      metadata: {
        model: this.model,
        type: 'advanced',
        provider: this.config.provider,
        functionCalling: this.config.functionCalling,
        mcpSupport: this.config.mcpSupport
      }
    };
  }

  /**
   * 高级模型专用：带工具调用的推理
   */
  async thinkWithTools(
    prompt: string, 
    tools: ToolDefinition[], 
    options?: ThinkingOptions
  ): Promise<ModelResponse> {
    // 模拟带工具调用的推理
    await new Promise(resolve => setTimeout(resolve, 150));

    const baseResponse = await this.think(prompt, options);
    
    // 根据可用工具增强响应
    if (tools.length > 0 && baseResponse.toolCalls && baseResponse.toolCalls.length > 0) {
      // 过滤出可用的工具
      const availableTools = baseResponse.toolCalls.filter(call => 
        tools.some(t => t.name === call.name)
      );

      return {
        ...baseResponse,
        toolCalls: availableTools,
        metadata: {
          ...baseResponse.metadata,
          availableTools: availableTools.length,
          totalTools: tools.length
        }
      };
    }

    return baseResponse;
  }

  async healthCheck(): Promise<boolean> {
    // 高级模型需要检查API可用性
    // 这里可以集成真实的健康检查逻辑
    return true;
  }

  getModelInfo(): any {
    return {
      name: this.name,
      provider: this.config.provider,
      type: this.type,
      model: this.model,
      maxTokens: this.config.maxTokens || 4000,
      maxContextLength: this.config.maxContextLength || 8000,
      capabilities: this.config.capabilities,
      functionCalling: this.config.functionCalling || false,
      mcpSupport: this.config.mcpSupport || false
    };
  }
}

/**
 * 模型工厂
 */
export class ModelFactory {
  /**
   * 创建模型接口
   */
  static create(config: BaseModelConfig): ModelInterface {
    if (config.type === 'functional') {
      return new FunctionalModel(config as FunctionalModelConfig);
    } else {
      return new AdvancedModel(config as AdvancedModelConfig);
    }
  }

  /**
   * 从配置创建模型
   */
  static createFromConfig(config: BaseModelConfig): ModelInterface {
    return this.create(config);
  }

  /**
   * 批量创建模型
   */
  static createMultiple(configs: BaseModelConfig[]): ModelInterface[] {
    return configs.map(config => this.create(config));
  }
}

/**
 * 模型配置管理器
 */
export class ModelConfigManager {
  private static instance: ModelConfigManager;
  private functionalConfigs: Map<string, FunctionalModelConfig> = new Map();
  private advancedConfigs: Map<string, AdvancedModelConfig> = new Map();

  static getInstance(): ModelConfigManager {
    if (!ModelConfigManager.instance) {
      ModelConfigManager.instance = new ModelConfigManager();
    }
    return ModelConfigManager.instance;
  }

  /**
   * 添加功能性模型配置
   */
  addFunctionalConfig(config: FunctionalModelConfig): void {
    this.functionalConfigs.set(config.id, config);
  }

  /**
   * 添加高级模型配置
   */
  addAdvancedConfig(config: AdvancedModelConfig): void {
    this.advancedConfigs.set(config.id, config);
  }

  /**
   * 获取功能性模型配置
   */
  getFunctionalConfig(id: string): FunctionalModelConfig | undefined {
    return this.functionalConfigs.get(id);
  }

  /**
   * 获取高级模型配置
   */
  getAdvancedConfig(id: string): AdvancedModelConfig | undefined {
    return this.advancedConfigs.get(id);
  }

  /**
   * 获取所有功能性模型
   */
  getAllFunctionalModels(): FunctionalModelConfig[] {
    return Array.from(this.functionalConfigs.values());
  }

  /**
   * 获取所有高级模型
   */
  getAllAdvancedModels(): AdvancedModelConfig[] {
    return Array.from(this.advancedConfigs.values());
  }

  /**
   * 按能力获取功能性模型
   */
  getFunctionalModelsByCapability(capability: string): FunctionalModelConfig[] {
    return this.getAllFunctionalModels()
      .filter(c => c.capabilities.includes(capability as any))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * 按能力获取高级模型
   */
  getAdvancedModelsByCapability(capability: string): AdvancedModelConfig[] {
    return this.getAllAdvancedModels()
      .filter(c => c.capabilities.includes(capability as any))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * 从环境变量加载配置
   */
  loadFromEnv(): void {
    // 功能性模型
    if (process.env.FUNCTIONAL_MODEL_ENDPOINT) {
      this.addFunctionalConfig({
        id: 'functional-local',
        type: 'functional',
        provider: 'local',
        baseURL: process.env.FUNCTIONAL_MODEL_ENDPOINT,
        model: process.env.FUNCTIONAL_MODEL_NAME || 'functional-model',
        capabilities: ['text', 'reasoning'],
        priority: 100,
        maxTokens: 1000,
        maxContextLength: 2000
      });
    }

    // 高级模型 - OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.addAdvancedConfig({
        id: 'advanced-openai-gpt4',
        type: 'advanced',
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4',
        capabilities: ['text', 'reasoning', 'function_calling', 'mcp'],
        priority: 100,
        maxTokens: 4000,
        maxContextLength: 8000,
        functionCalling: true,
        mcpSupport: true
      });
    }

    // 高级模型 - Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.addAdvancedConfig({
        id: 'advanced-anthropic-claude',
        type: 'advanced',
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-sonnet',
        capabilities: ['text', 'reasoning', 'function_calling', 'mcp'],
        priority: 90,
        maxTokens: 4000,
        maxContextLength: 8000,
        functionCalling: true,
        mcpSupport: true
      });
    }

    // 高级模型 - Gemini
    if (process.env.GEMINI_API_KEY) {
      this.addAdvancedConfig({
        id: 'advanced-gemini-pro',
        type: 'advanced',
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-1.5-pro',
        capabilities: ['text', 'reasoning', 'function_calling', 'mcp', 'multimodal'],
        priority: 85,
        maxTokens: 4000,
        maxContextLength: 8000,
        functionCalling: true,
        mcpSupport: true
      });
    }

    // Mock模型（测试用）
    this.addFunctionalConfig({
      id: 'functional-mock',
      type: 'functional',
      provider: 'mock',
      model: 'mock-functional',
      capabilities: ['text', 'reasoning'],
      priority: 1,
      maxTokens: 1000,
      maxContextLength: 2000
    });

    this.addAdvancedConfig({
      id: 'advanced-mock',
      type: 'advanced',
      provider: 'mock',
      model: 'mock-advanced',
      capabilities: ['text', 'reasoning', 'function_calling', 'mcp'],
      priority: 1,
      maxTokens: 4000,
      maxContextLength: 8000,
      functionCalling: true,
      mcpSupport: true
    });
  }

  /**
   * 清空配置
   */
  clear(): void {
    this.functionalConfigs.clear();
    this.advancedConfigs.clear();
  }
}