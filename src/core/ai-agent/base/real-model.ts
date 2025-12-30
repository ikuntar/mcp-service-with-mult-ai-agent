/**
 * 真实模型接口实现
 * 支持OpenAI兼容的API
 */

import { ModelInterface, ModelResponse, ThinkingOptions, ToolDefinition } from './model-interface';

export interface RealModelConfig {
  id: string;
  type: 'functional' | 'advanced';
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  baseURL: string;
  apiKey: string;
  model: string;
  capabilities: string[];
  maxTokens?: number;
  maxContextLength?: number;
  temperature?: number;
}

/**
 * 真实模型接口
 */
export class RealModel implements ModelInterface {
  name: string;
  model: string;
  type: 'functional' | 'advanced';
  private config: RealModelConfig;

  constructor(config: RealModelConfig) {
    this.name = config.id;
    this.model = config.model;
    this.type = config.type;
    this.config = config;
  }

  /**
   * 核心推理接口
   */
  async think(prompt: string, options?: ThinkingOptions): Promise<ModelResponse> {
    const apiUrl = this.config.baseURL.replace(/\/$/, '') + '/chat/completions';
    
    const temperature = options?.temperature || this.config.temperature || 0.7;
    const maxTokens = options?.maxTokens || this.config.maxTokens || 1000;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: temperature,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('API返回空响应');
      }

      const message = data.choices[0].message;
      const content = message.content || '';
      
      // 检查是否包含工具调用信息
      const toolCalls = this.parseToolCalls(content);

      return {
        content: content,
        reasoning: content,
        toolCalls: toolCalls,
        confidence: 0.9,
        tokens: {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0
        },
        metadata: {
          model: this.model,
          type: this.type,
          provider: this.config.provider,
          rawResponse: data
        }
      };

    } catch (error) {
      console.error('模型调用失败:', error);
      throw error;
    }
  }

  /**
   * 高级模型专用：带工具调用的推理
   */
  async thinkWithTools(
    prompt: string, 
    tools: ToolDefinition[], 
    options?: ThinkingOptions
  ): Promise<ModelResponse> {
    const apiUrl = this.config.baseURL.replace(/\/$/, '') + '/chat/completions';
    
    const temperature = options?.temperature || this.config.temperature || 0.7;
    const maxTokens = options?.maxTokens || this.config.maxTokens || 2000;

    // 构建带工具描述的提示词
    const systemPrompt = this.buildSystemPrompt(tools);
    const fullPrompt = systemPrompt + '\n\n任务: ' + prompt;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: temperature,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('API返回空响应');
      }

      const message = data.choices[0].message;
      const content = message.content || '';
      
      // 解析工具调用
      const toolCalls = this.parseToolCalls(content);

      return {
        content: content,
        reasoning: content,
        toolCalls: toolCalls,
        confidence: 0.9,
        tokens: {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0
        },
        metadata: {
          model: this.model,
          type: this.type,
          provider: this.config.provider,
          hasTools: toolCalls.length > 0,
          rawResponse: data
        }
      };

    } catch (error) {
      console.error('高级模型调用失败:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const apiUrl = this.config.baseURL.replace(/\/$/, '') + '/models';
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): any {
    return {
      name: this.name,
      provider: this.config.provider,
      type: this.type,
      model: this.model,
      maxTokens: this.config.maxTokens || 4000,
      maxContextLength: this.config.maxContextLength || 8000,
      capabilities: this.config.capabilities,
      functionCalling: this.type === 'advanced',
      mcpSupport: this.type === 'advanced'
    };
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(tools: ToolDefinition[]): string {
    let prompt = '你是一个智能助手，支持函数调用。\n\n可用工具:\n';
    
    tools.forEach((tool, index) => {
      prompt += `${index + 1}. ${tool.name}: ${tool.description}\n`;
      prompt += `   参数: ${JSON.stringify(tool.parameters)}\n\n`;
    });

    prompt += `请分析任务，如果需要使用工具，请按以下格式返回:
\`\`\`json
{
  "api": "工具名称",
  "parameters": {
    "参数名": "参数值"
  }
}
\`\`\`

如果不需要工具，请直接给出回答。`;

    return prompt;
  }

  /**
   * 解析工具调用
   */
  private parseToolCalls(content: string): any[] {
    const toolCalls: any[] = [];
    
    // 尝试匹配JSON格式的工具调用
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.api && parsed.parameters) {
          toolCalls.push({
            id: `call_${Date.now()}`,
            name: parsed.api,
            arguments: parsed.parameters
          });
        }
      } catch (e) {
        // JSON解析失败，继续尝试其他方式
      }
    }

    // 尝试匹配直接的JSON对象
    if (toolCalls.length === 0) {
      const directJsonMatch = content.match(/\{[\s\S]*"api"[\s\S]*"parameters"[\s\S]*\}/);
      if (directJsonMatch) {
        try {
          const parsed = JSON.parse(directJsonMatch[0]);
          if (parsed.api && parsed.parameters) {
            toolCalls.push({
              id: `call_${Date.now()}`,
              name: parsed.api,
              arguments: parsed.parameters
            });
          }
        } catch (e) {
          // JSON解析失败
        }
      }
    }

    // 尝试基于关键词匹配
    if (toolCalls.length === 0) {
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes('readfile') || lowerContent.includes('读取文件')) {
        toolCalls.push({
          id: `call_${Date.now()}`,
          name: 'readFile',
          arguments: { path: 'file.txt' }
        });
      }
      
      if (lowerContent.includes('writefile') || lowerContent.includes('写入文件')) {
        toolCalls.push({
          id: `call_${Date.now()}`,
          name: 'writeFile',
          arguments: { path: 'file.txt', content: 'data' }
        });
      }
      
      if (lowerContent.includes('analyze') || lowerContent.includes('分析')) {
        toolCalls.push({
          id: `call_${Date.now()}`,
          name: 'analyzeData',
          arguments: { data: 'sample' }
        });
      }
    }

    return toolCalls;
  }
}

/**
 * 真实模型工厂
 */
export class RealModelFactory {
  /**
   * 从配置文件创建模型
   */
  static fromConfigFile(filePath: string): RealModel {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    const config: any = {};
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        config[match[1]] = match[2].trim();
      }
    });

    // 判断是功能性还是高级模型
    const isAdvanced = config.type === 'openai' || config.type === 'anthropic' || config.type === 'gemini';
    
    return new RealModel({
      id: `real-${config.model}`,
      type: isAdvanced ? 'advanced' : 'functional',
      provider: config.type,
      baseURL: config.url,
      apiKey: config.apikey,
      model: config.model,
      capabilities: isAdvanced ? 
        ['text', 'reasoning', 'function_calling', 'mcp'] : 
        ['text', 'reasoning'],
      maxTokens: isAdvanced ? 4000 : 1000,
      maxContextLength: isAdvanced ? 8000 : 2000,
      temperature: 0.7
    });
  }

  /**
   * 从环境变量创建模型
   */
  static fromEnv(prefix: string = 'AI'): RealModel {
    const baseURL = process.env[`${prefix}_BASE_URL`];
    const apiKey = process.env[`${prefix}_API_KEY`];
    const model = process.env[`${prefix}_MODEL`];
    const type = process.env[`${prefix}_TYPE`] || 'advanced';

    if (!baseURL || !apiKey || !model) {
      throw new Error(`Missing environment variables: ${prefix}_BASE_URL, ${prefix}_API_KEY, ${prefix}_MODEL`);
    }

    return new RealModel({
      id: `real-${model}`,
      type: type as 'functional' | 'advanced',
      provider: 'openai', // 默认为OpenAI兼容
      baseURL,
      apiKey,
      model,
      capabilities: type === 'advanced' ? 
        ['text', 'reasoning', 'function_calling', 'mcp'] : 
        ['text', 'reasoning'],
      maxTokens: type === 'advanced' ? 4000 : 1000,
      maxContextLength: type === 'advanced' ? 8000 : 2000,
      temperature: 0.7
    });
  }
}