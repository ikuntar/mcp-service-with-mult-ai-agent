/**
 * 会话系统类型定义
 */

/**
 * 会话状态
 */
export enum SessionStatus {
  PENDING = 'pending',    // 等待开始
  RUNNING = 'running',    // 运行中
  PAUSED = 'paused',      // 暂停
  COMPLETED = 'completed', // 正常结束
  TIMEOUT = 'timeout',    // 超时
  ERROR = 'error',        // 错误终止
  CANCELLED = 'cancelled' // 用户取消
}

/**
 * 会话消息
 */
export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * 会话步骤（用于模板会话）
 */
export interface SessionStep {
  id: string;
  name: string;
  prompt: string;
  variables?: Record<string, any>;
  expectedOutput?: string; // 期望的输出格式
  timeout?: number; // 步骤超时时间（毫秒）
}

/**
 * 模板工作流定义
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  steps: SessionStep[];
  options?: {
    autoContinue?: boolean; // 自动继续下一步
    strictOrder?: boolean;  // 严格按顺序执行
    maxRetries?: number;    // 每步最大重试次数
  };
}

/**
 * 会话配置
 */
export interface SessionConfig {
  /**
   * 会话超时时间（毫秒）
   * @default 300000 (5分钟)
   */
  timeout?: number;
  
  /**
   * 最大消息数
   * @default 50
   */
  maxMessages?: number;
  
  /**
   * 是否保存历史
   * @default true
   */
  saveHistory?: boolean;
  
  /**
   * 自动清理旧消息
   * @default false
   */
  autoCleanup?: boolean;
  
  /**
   * 清理阈值（超过多少条消息时清理）
   * @default 40
   */
  cleanupThreshold?: number;
  
  /**
   * 清理保留数量
   * @default 10
   */
  cleanup保留?: number;
}

/**
 * 会话结果
 */
export interface SessionResult {
  status: SessionStatus;
  messages: SessionMessage[];
  output?: string;
  error?: string;
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * 模板会话配置
 */
export interface TemplateSessionConfig extends SessionConfig {
  /**
   * 工作流模板
   */
  workflow: WorkflowTemplate | string; // string表示JSON文件路径
  
  /**
   * 初始变量
   */
  initialVariables?: Record<string, any>;
  
  /**
   * 步骤间变量传递
   * @default true
   */
  passVariables?: boolean;
}

/**
 * 连续对话配置
 */
export interface ChatSessionConfig extends SessionConfig {
  /**
   * 系统提示词
   */
  systemPrompt?: string;
  
  /**
   * 初始上下文
   */
  initialContext?: string;
  
  /**
   * 记忆窗口大小
   * @default 10
   */
  memoryWindow?: number;
}

/**
 * MCP工具定义
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean';
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * MCP工具调用
 */
export interface MCPToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

/**
 * MCP会话配置
 */
export interface MCPSessionConfig extends SessionConfig {
  /**
   * MCP端点URL
   */
  mcpEndpoint: string;
  
  /**
   * MCP请求头
   */
  mcpHeaders?: Record<string, string>;
  
  /**
   * 可用工具列表
   */
  tools?: MCPToolDefinition[];
  
  /**
   * 初始上下文
   */
  initialContext?: string;
}

/**
 * 会话事件
 */
export interface SessionEvent {
  type: 'start' | 'step' | 'message' | 'error' | 'end' | 'timeout' | 'tool-call' | 'tool-result' | 'tool-error';
  data: any;
  timestamp: number;
}

/**
 * 事件处理器
 */
export type EventHandler = (event: SessionEvent) => void | Promise<void>;

/**
 * 模板步骤执行结果
 */
export interface StepResult {
  stepId: string;
  success: boolean;
  output?: string;
  error?: string;
  variables?: Record<string, any>;
}

/**
 * 会话状态快照
 */
export interface SessionSnapshot {
  id: string;
  status: SessionStatus;
  messages: SessionMessage[];
  currentStep?: string;
  variables?: Record<string, any>;
  startTime: number;
  lastUpdate: number;
}