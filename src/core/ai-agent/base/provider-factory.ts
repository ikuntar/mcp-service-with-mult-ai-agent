/**
 * AI服务商工厂实现
 */

import { AIProvider, ProviderConfig, ProviderFactory } from './provider-interface';

// Mock服务商（测试用）
export class MockProvider implements AIProvider {
  name = 'Mock';
  model: string;
  
  constructor(config: ProviderConfig) {
    this.model = config.model;
  }
  
  async think(prompt: string, options?: any): Promise<any> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const lowerPrompt = prompt.toLowerCase();
    let reasoning = '';
    
    if (lowerPrompt.includes('读取')) {
      reasoning = '这是一个读取操作，需要使用文件读取工具';
    } else if (lowerPrompt.includes('写入')) {
      reasoning = '这是一个写入操作，需要使用文件写入工具';
    } else if (lowerPrompt.includes('分析')) {
      reasoning = '这是一个分析操作，需要使用数据分析工具';
    } else {
      reasoning = '这是一个通用操作，需要使用基础工具';
    }
    
    return {
      content: reasoning,
      reasoning: reasoning,
      confidence: 0.8,
      metadata: { mock: true, model: this.model }
    };
  }
  
  async healthCheck(): Promise<boolean> {
    return true;
  }
  
  getModelInfo(): any {
    return {
      name: this.model,
      provider: 'mock',
      maxTokens: 1000,
      capabilities: ['text']
    };
  }
}

// OpenAI服务商
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  model: string;
  private client: any;
  
  constructor(config: ProviderConfig) {
    this.model = config.model;
    
    // 简单的fetch实现，不依赖SDK
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = {
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.openai.com/v1'
    };
  }
  
  async think(prompt: string, options?: any): Promise<any> {
    const response = await fetch(`${this.client.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.client.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      reasoning: data.choices[0].message.content,
      confidence: 0.9,
      tokens: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens
      }
    };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.client.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${this.client.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  getModelInfo(): any {
    return {
      name: this.model,
      provider: 'openai',
      maxTokens: 4096,
      capabilities: ['text', 'function_calling']
    };
  }
}

// Anthropic服务商
export class AnthropicProvider implements AIProvider {
  name = 'Anthropic';
  model: string;
  private client: any;
  
  constructor(config: ProviderConfig) {
    this.model = config.model;
    
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = {
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.anthropic.com'
    };
  }
  
  async think(prompt: string, options?: any): Promise<any> {
    const response = await fetch(`${this.client.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.client.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.content[0].text,
      reasoning: data.content[0].text,
      confidence: 0.9,
      tokens: {
        input: data.usage.input_tokens,
        output: data.usage.output_tokens
      }
    };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.client.baseURL}/v1/models`, {
        headers: { 'x-api-key': this.client.apiKey }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  getModelInfo(): any {
    return {
      name: this.model,
      provider: 'anthropic',
      maxTokens: 8192,
      capabilities: ['text', 'thinking']
    };
  }
}

// 本地模型服务商
export class LocalProvider implements AIProvider {
  name = 'Local';
  model: string;
  private endpoint: string;
  
  constructor(config: ProviderConfig) {
    this.model = config.model;
    this.endpoint = config.baseURL || 'http://localhost:8080';
  }
  
  async think(prompt: string, options?: any): Promise<any> {
    const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Local model error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      reasoning: data.choices[0].message.content,
      confidence: 0.8,
      metadata: { local: true }
    };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  getModelInfo(): any {
    return {
      name: this.model,
      provider: 'local',
      maxTokens: 4096,
      capabilities: ['text']
    };
  }
}

// Gemini服务商
export class GeminiProvider implements AIProvider {
  name = 'Gemini';
  model: string;
  private apiKey: string;
  
  constructor(config: ProviderConfig) {
    this.model = config.model;
    
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = config.apiKey;
  }
  
  async think(prompt: string, options?: any): Promise<any> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || 1000
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    return {
      content: content,
      reasoning: content,
      confidence: 0.85,
      metadata: { gemini: true }
    };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}?key=${this.apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  getModelInfo(): any {
    return {
      name: this.model,
      provider: 'gemini',
      maxTokens: 8192,
      capabilities: ['text', 'multimodal']
    };
  }
}

// 工厂实现
export class DefaultProviderFactory implements ProviderFactory {
  private static instances: Map<string, AIProvider> = new Map();
  
  create(config: ProviderConfig): AIProvider {
    const key = `${config.type}:${config.model}`;
    
    if (DefaultProviderFactory.instances.has(key)) {
      return DefaultProviderFactory.instances.get(key)!;
    }
    
    let provider: AIProvider;
    
    switch (config.type) {
      case 'openai':
        provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      case 'gemini':
        provider = new GeminiProvider(config);
        break;
      case 'local':
        provider = new LocalProvider(config);
        break;
      case 'mock':
        provider = new MockProvider(config);
        break;
      default:
        throw new Error(`Unsupported provider type: ${config.type}`);
    }
    
    DefaultProviderFactory.instances.set(key, provider);
    return provider;
  }
  
  getOrCreate(config: ProviderConfig): AIProvider {
    return this.create(config);
  }
  
  clearCache(): void {
    DefaultProviderFactory.instances.clear();
  }
}