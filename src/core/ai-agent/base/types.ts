/**
 * AI-Agent MVP 核心类型定义
 */

/**
 * 任务类型
 */
export interface Task {
  id: string;
  input: string;
  context?: any;
  timestamp?: string;
}

/**
 * 思考结果
 */
export interface Thought {
  reasoning: string;      // 推理过程
  tool?: string;          // 推荐的工具（MVP阶段可能为空）
  confidence: number;     // 置信度 0-1
  metadata?: any;         // 元数据
}

/**
 * 执行结果
 */
export interface ActionResult {
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
  metadata?: any;
}

/**
 * 记忆项
 */
export interface MemoryItem {
  id: string;
  type: 'task' | 'thought' | 'experience' | 'ai_response';
  content: string;
  timestamp: string;
  metadata?: any;
}

/**
 * Agent状态
 */
export type AgentState = 
  | 'initialized'   // 已初始化
  | 'idle'          // 空闲
  | 'planning'      // 规划中
  | 'executing'     // 执行中
  | 'learning'      // 学习中
  | 'error'         // 错误状态
  | 'stopped';      // 已停止

/**
 * Agent配置
 */
export interface AgentConfig {
  id: string;
  name: string;
  role?: string;
  personality?: string;
  capabilities?: string[];
  maxMemoryItems?: number;
}