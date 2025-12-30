/**
 * MCP会话 - 支持MCP工具调用的会话
 */

import { BaseSession } from './base-session';
import { 
  SessionStatus, 
  MCPSessionConfig, 
  SessionResult, 
  MCPToolDefinition, 
  MCPToolCall,
  SessionMessage,
  SessionEvent,
  EventHandler
} from './types';

/**
 * MCP会话类
 * 支持调用MCP工具的会话，可以与MCP服务器交互
 */
export class MCPSession extends BaseSession {
  private tools: MCPToolDefinition[];
  private mcpEndpoint: string;
  private mcpHeaders: Record<string, string>;
  private context: string;

  constructor(id: string, config: MCPSessionConfig) {
    super(id, config);
    
    this.mcpEndpoint = config.mcpEndpoint;
    this.mcpHeaders = config.mcpHeaders || {};
    this.tools = config.tools || [];
    this.context = config.initialContext || '';
  }

  /**
   * 重写start方法 - MCP会话保持运行直到手动取消
   */
  async start(): Promise<SessionResult> {
    if (this.status !== SessionStatus.PENDING) {
      throw new Error(`Cannot start session with status: ${this.status}`);
    }

    this.status = SessionStatus.RUNNING;
    this.startTime = Date.now();
    this.lastUpdate = Date.now();

    // 设置超时
    this.setupTimeout();

    await this.emit('start', { id: this.id });

    // 执行初始化逻辑
    this.execute().catch(error => {
      this.handleError(error);
    });

    // 返回Promise，但不会自动解决
    return new Promise<SessionResult>((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    });
  }

  /**
   * 执行会话逻辑 - 初始化
   */
  protected async execute(): Promise<void> {
    await this.emit('step', { 
      type: 'mcp-ready', 
      message: 'MCP会话已准备就绪，可以调用工具' 
    });

    // 添加系统提示
    if (this.tools.length > 0) {
      const toolNames = this.tools.map(t => t.name).join(', ');
      this.addMessage('system', `MCP会话已启动。可用工具: ${toolNames}`);
    }

    // 初始化完成，会话保持运行状态
  }

  /**
   * 处理用户消息（支持工具调用）
   */
  protected async handleMessage(content: string): Promise<string> {
    // 重置超时（每次消息都重置）
    this.clearTimeout();
    this.setupTimeout();

    // 检查是否包含工具调用请求
    const toolCallMatch = this.parseToolCall(content);
    
    if (toolCallMatch) {
      return await this.executeToolCall(toolCallMatch);
    }

    // 普通对话处理
    return await this.generateResponse(content);
  }

  /**
   * 解析工具调用请求
   */
  private parseToolCall(content: string): MCPToolCall | null {
    // 支持多种格式的工具调用
    // 格式1: @toolName(param1=value1, param2=value2)
    // 格式2: {"tool": "toolName", "params": {...}}
    // 格式3: toolName: param1=value1, param2=value2

    try {
      // 尝试JSON格式
      if (content.trim().startsWith('{')) {
        const json = JSON.parse(content);
        if (json.tool && json.params) {
          return {
            name: json.tool,
            arguments: json.params,
            id: `mcp-call-${Date.now()}`
          };
        }
      }

      // 尝试 @toolName(params) 格式
      const atMatch = content.match(/@(\w+)\((.*)\)/);
      if (atMatch) {
        const toolName = atMatch[1];
        const paramsStr = atMatch[2];
        const params = this.parseParams(paramsStr);
        
        return {
          name: toolName,
          arguments: params,
          id: `mcp-call-${Date.now()}`
        };
      }

      // 尝试 toolName: params 格式
      const colonMatch = content.match(/^(\w+):\s*(.+)$/);
      if (colonMatch) {
        const toolName = colonMatch[1];
        const paramsStr = colonMatch[2];
        const params = this.parseParams(paramsStr);
        
        return {
          name: toolName,
          arguments: params,
          id: `mcp-call-${Date.now()}`
        };
      }

    } catch (error) {
      console.warn('解析工具调用失败:', error);
    }

    return null;
  }

  /**
   * 解析参数字符串
   */
  private parseParams(paramsStr: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (!paramsStr || paramsStr.trim() === '') {
      return params;
    }

    // 简单的参数解析：key=value, key2=value2
    const pairs = paramsStr.split(',').map(p => p.trim());
    
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=').trim();
      
      // 尝试解析为合适的类型
      if (value === 'true') params[key.trim()] = true;
      else if (value === 'false') params[key.trim()] = false;
      else if (value === 'null') params[key.trim()] = null;
      else if (!isNaN(Number(value))) params[key.trim()] = Number(value);
      else if (value.startsWith('"') && value.endsWith('"')) {
        params[key.trim()] = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        params[key.trim()] = value.slice(1, -1);
      } else {
        params[key.trim()] = value;
      }
    }

    return params;
  }

  /**
   * 执行工具调用
   */
  private async executeToolCall(toolCall: MCPToolCall): Promise<string> {
    try {
      // 检查工具是否存在
      const tool = this.tools.find(t => t.name === toolCall.name);
      if (!tool) {
        return `错误: 工具 "${toolCall.name}" 不存在。可用工具: ${this.tools.map(t => t.name).join(', ')}`;
      }

      // 验证参数
      const validation = this.validateToolParams(tool, toolCall.arguments);
      if (!validation.valid) {
        return `参数验证失败: ${validation.errors.join(', ')}`;
      }

      // 发送工具调用事件
      await this.emit('tool-call', {
        tool: toolCall.name,
        arguments: toolCall.arguments,
        callId: toolCall.id
      });

      // 执行MCP调用
      const result = await this.callMCPEndpoint(toolCall);

      // 记录工具调用
      this.addMessage('system', `工具调用: ${toolCall.name}`, {
        tool: toolCall.name,
        arguments: toolCall.arguments,
        result: result,
        callId: toolCall.id
      });

      // 发送工具结果事件
      await this.emit('tool-result', {
        tool: toolCall.name,
        result: result,
        callId: toolCall.id
      });

      return `工具 "${toolCall.name}" 执行成功:\n${JSON.stringify(result, null, 2)}`;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.emit('tool-error', {
        tool: toolCall.name,
        error: errorMsg,
        callId: toolCall.id
      });
      return `工具调用失败: ${errorMsg}`;
    }
  }

  /**
   * 验证工具参数
   */
  private validateToolParams(tool: MCPToolDefinition, params: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tool.parameters) {
      return { valid: errors.length === 0, errors };
    }

    const properties = tool.parameters.properties || {};
    const required = tool.parameters.required || [];

    // 检查必填参数
    for (const param of required) {
      if (params[param] === undefined) {
        errors.push(`缺少必填参数: ${param}`);
      }
    }

    // 检查参数类型
    for (const [paramName, paramValue] of Object.entries(params)) {
      const schema = properties[paramName];
      if (schema) {
        if (schema.type === 'string' && typeof paramValue !== 'string') {
          errors.push(`参数 ${paramName} 应为字符串类型`);
        } else if (schema.type === 'number' && typeof paramValue !== 'number') {
          errors.push(`参数 ${paramName} 应为数字类型`);
        } else if (schema.type === 'boolean' && typeof paramValue !== 'boolean') {
          errors.push(`参数 ${paramName} 应为布尔类型`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 调用MCP端点
   */
  private async callMCPEndpoint(toolCall: MCPToolCall): Promise<any> {
    // 模拟MCP调用（实际使用时需要真实的MCP服务器）
    await new Promise(resolve => setTimeout(resolve, 50));

    // 模拟不同工具的结果
    if (toolCall.name === 'calculate') {
      try {
        const result = eval(toolCall.arguments.expression);
        return { result: result };
      } catch (e) {
        throw new Error(`计算失败: ${e.message}`);
      }
    } else if (toolCall.name === 'getTime') {
      return { time: new Date().toISOString() };
    } else {
      return { 
        success: true, 
        message: `工具 ${toolCall.name} 执行完成`,
        arguments: toolCall.arguments 
      };
    }
  }

  /**
   * 生成AI回复（当不是工具调用时）
   */
  protected async generateResponse(input: string): Promise<string> {
    // 发送思考事件
    await this.emit('step', { 
      type: 'thinking', 
      message: '正在思考...' 
    });

    // 简单的响应生成逻辑
    if (input.includes('你好') || input.includes('hi') || input.includes('hello')) {
      return '你好！我是MCP会话助手。你可以调用工具，格式如：@toolName(param1=value1, param2=value2)';
    }

    if (input.includes('工具') || input.includes('tools')) {
      const toolList = this.tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
      return `可用工具:\n${toolList}\n\n调用格式示例:\n@toolName(param1=value1, param2=value2)`;
    }

    if (input.includes('帮助') || input.includes('help')) {
      return `MCP会话助手使用指南:
1. 调用工具: @toolName(param1=value1, param2=value2)
2. 查看工具列表: 说"工具"或"tools"
3. 工具调用结果会自动显示
4. 支持JSON格式调用: {"tool": "toolName", "params": {...}}`;
    }

    return `我收到了你的消息: "${input}"\n\n这是一个MCP会话。如果需要调用工具，请使用指定格式。输入"帮助"查看使用指南。`;
  }

  /**
   * 获取输出
   */
  protected getOutput(): string | undefined {
    const lastAssistant = [...this.messages].reverse().find(m => m.role === 'assistant');
    return lastAssistant?.content;
  }

  /**
   * 获取错误
   */
  protected getError(): string | undefined {
    const lastSystem = [...this.messages].reverse().find(m => m.role === 'system');
    return lastSystem?.content;
  }

  /**
   * 获取上下文
   */
  getContext(): string {
    return this.context;
  }

  /**
   * 设置上下文
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * 清空上下文
   */
  clearContext(): void {
    this.context = '';
  }

  /**
   * 添加工具
   */
  addTool(tool: MCPToolDefinition): void {
    if (!this.tools.find(t => t.name === tool.name)) {
      this.tools.push(tool);
    }
  }

  /**
   * 批量添加工具
   */
  addTools(tools: MCPToolDefinition[]): void {
    tools.forEach(tool => this.addTool(tool));
  }

  /**
   * 获取工具列表
   */
  getTools(): MCPToolDefinition[] {
    return [...this.tools];
  }

  /**
   * 更新MCP端点
   */
  updateMCPEndpoint(endpoint: string, headers?: Record<string, string>): void {
    this.mcpEndpoint = endpoint;
    if (headers) {
      this.mcpHeaders = { ...this.mcpHeaders, ...headers };
    }
  }

  /**
   * 导出会话历史
   */
  exportHistory(): {
    context: string;
    messages: Array<{ role: string; content: string; timestamp: number; metadata?: any }>;
    tools: MCPToolDefinition[];
    metadata: any;
  } {
    return {
      context: this.context,
      messages: this.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        metadata: m.metadata
      })),
      tools: this.tools,
      metadata: {
        id: this.id,
        mcpEndpoint: this.mcpEndpoint,
        startTime: this.startTime,
        lastUpdate: this.lastUpdate,
        messageCount: this.messages.length
      }
    };
  }

  /**
   * 导入会话历史
   */
  importHistory(history: {
    context?: string;
    messages?: Array<{ role: string; content: string; timestamp?: number; metadata?: any }>;
    tools?: MCPToolDefinition[];
  }): void {
    if (history.context) {
      this.context = history.context;
    }

    if (history.messages) {
      this.messages = history.messages.map(m => ({
        id: `${m.timestamp || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: m.role as any,
        content: m.content,
        timestamp: m.timestamp || Date.now(),
        metadata: m.metadata
      }));
      this.lastUpdate = Date.now();
    }

    if (history.tools) {
      this.tools = history.tools;
    }
  }

  /**
   * 重置会话（保留上下文和工具）
   */
  reset(): void {
    this.messages = [];
    this.lastUpdate = Date.now();
  }

  /**
   * 撤销最后一条消息
   */
  undo(): void {
    if (this.messages.length > 0) {
      this.messages.pop();
      this.lastUpdate = Date.now();
    }
  }

  /**
   * 修改最后一条消息
   */
  modifyLastMessage(content: string, role?: 'user' | 'assistant' | 'system'): void {
    if (this.messages.length > 0) {
      const lastMsg = this.messages[this.messages.length - 1];
      if (role && lastMsg.role !== role) return;
      
      lastMsg.content = content;
      lastMsg.timestamp = Date.now();
      this.lastUpdate = Date.now();
    }
  }
}