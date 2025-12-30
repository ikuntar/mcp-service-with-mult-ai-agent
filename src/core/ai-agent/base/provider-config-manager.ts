/**
 * 服务商配置管理器
 */

import { ProviderConfig } from './provider-interface';

export class ProviderConfigManager {
  private static instance: ProviderConfigManager;
  private configs: Map<string, ProviderConfig> = new Map();
  
  static getInstance(): ProviderConfigManager {
    if (!ProviderConfigManager.instance) {
      ProviderConfigManager.instance = new ProviderConfigManager();
    }
    return ProviderConfigManager.instance;
  }
  
  /**
   * 从环境变量加载配置
   */
  loadFromEnv(): void {
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.addConfig({
        id: 'openai-gpt-4',
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
        model: 'gpt-4',
        capabilities: ['text', 'reasoning', 'function_calling'],
        priority: 100
      });
      
      this.addConfig({
        id: 'openai-gpt-3.5',
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
        model: 'gpt-3.5-turbo',
        capabilities: ['text', 'reasoning'],
        priority: 80
      });
    }
    
    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.addConfig({
        id: 'anthropic-claude-3-sonnet',
        type: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: process.env.ANTHROPIC_BASE_URL,
        model: 'claude-3-sonnet-20240229',
        capabilities: ['text', 'thinking'],
        priority: 90
      });
      
      this.addConfig({
        id: 'anthropic-claude-3-haiku',
        type: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: process.env.ANTHROPIC_BASE_URL,
        model: 'claude-3-haiku-20240307',
        capabilities: ['text', 'thinking'],
        priority: 70
      });
    }
    
    // Gemini
    if (process.env.GEMINI_API_KEY) {
      this.addConfig({
        id: 'gemini-pro',
        type: 'gemini',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-1.5-pro',
        capabilities: ['text', 'multimodal'],
        priority: 85
      });
      
      this.addConfig({
        id: 'gemini-flash',
        type: 'gemini',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-1.5-flash',
        capabilities: ['text', 'multimodal'],
        priority: 75
      });
    }
    
    // 本地模型
    if (process.env.LOCAL_MODEL_ENDPOINT) {
      this.addConfig({
        id: 'local-llama',
        type: 'local',
        baseURL: process.env.LOCAL_MODEL_ENDPOINT,
        model: process.env.LOCAL_MODEL_NAME || 'llama-2-7b',
        capabilities: ['text'],
        priority: 60
      });
    }
    
    // Mock（测试用）
    this.addConfig({
      id: 'mock-test',
      type: 'mock',
      model: 'mock-model',
      capabilities: ['text'],
      priority: 1
    });
  }
  
  /**
   * 从JSON加载配置
   */
  loadFromJSON(configs: ProviderConfig[]): void {
    configs.forEach(config => this.addConfig(config));
  }
  
  /**
   * 添加配置
   */
  addConfig(config: ProviderConfig): void {
    this.configs.set(config.id, config);
  }
  
  /**
   * 获取配置
   */
  getConfig(id: string): ProviderConfig | undefined {
    return this.configs.get(id);
  }
  
  /**
   * 获取所有配置
   */
  getAllConfigs(): ProviderConfig[] {
    return Array.from(this.configs.values());
  }
  
  /**
   * 按能力获取配置（已排序）
   */
  getProvidersByCapability(capability: string): ProviderConfig[] {
    return Array.from(this.configs.values())
      .filter(c => c.capabilities.includes(capability))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  /**
   * 获取主备服务商配置
   */
  getPrimaryAndFallbacks(primaryId: string, fallbackIds: string[]): ProviderConfig[] {
    const result: ProviderConfig[] = [];
    
    // 主服务商
    const primary = this.getConfig(primaryId);
    if (primary) {
      result.push(primary);
    }
    
    // 备用服务商
    for (const id of fallbackIds) {
      const config = this.getConfig(id);
      if (config && config.id !== primaryId) {
        result.push(config);
      }
    }
    
    return result;
  }
  
  /**
   * 清空配置
   */
  clear(): void {
    this.configs.clear();
  }
}