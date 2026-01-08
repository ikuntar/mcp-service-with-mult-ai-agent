/**
 * 会话系统 - 主入口
 */

import { TemplateSession } from './template-session';
import { ChatSession } from './chat-session';
import { MCPSession } from './mcp-session';
import { 
  WorkflowTemplate, 
  TemplateSessionConfig, 
  ChatSessionConfig, 
  MCPSessionConfig,
  MCPToolDefinition 
} from './types';

export { BaseSession } from './base-session';
export { TemplateSession } from './template-session';
export { ChatSession } from './chat-session';
export { MCPSession } from './mcp-session';

export type {
  SessionStatus,
  SessionMessage,
  SessionStep,
  WorkflowTemplate,
  SessionConfig,
  SessionResult,
  SessionEvent,
  EventHandler,
  TemplateSessionConfig,
  ChatSessionConfig,
  MCPSessionConfig,
  StepResult,
  SessionSnapshot,
  MCPToolDefinition,
  MCPToolCall
} from './types';

/**
 * 快速创建模板会话
 */
export function createTemplateSession(
  id: string,
  workflow: WorkflowTemplate | string,
  config?: Omit<TemplateSessionConfig, 'workflow'>
): TemplateSession {
  return new TemplateSession(id, {
    workflow,
    ...config
  });
}

/**
 * 快速创建连续对话会话
 */
export function createChatSession(
  id: string,
  config?: ChatSessionConfig
): ChatSession {
  return new ChatSession(id, config);
}

/**
 * 快速创建MCP会话
 */
export function createMCPSession(
  id: string,
  config: MCPSessionConfig
): MCPSession {
  return new MCPSession(id, config);
}

/**
 * 从JSON文件加载工作流
 */
export function loadWorkflowFromJSON(path: string): WorkflowTemplate {
  const fs = require('fs');
  const content = fs.readFileSync(path, 'utf-8');
  const json = JSON.parse(content);
  
  return {
    id: json.id || `workflow-${Date.now()}`,
    name: json.name || 'Unnamed Workflow',
    description: json.description,
    steps: json.steps.map((step: any, index: number) => ({
      id: step.id || `step-${index}`,
      name: step.name || `Step ${index + 1}`,
      prompt: step.prompt,
      variables: step.variables || {},
      expectedOutput: step.expectedOutput,
      timeout: step.timeout
    })),
    options: json.options || {}
  };
}

/**
 * 创建简单的工作流
 */
export function createSimpleWorkflow(
  id: string,
  steps: Array<{ name: string; prompt: string; variables?: Record<string, any> }>
): WorkflowTemplate {
  return {
    id,
    name: `Workflow-${id}`,
    steps: steps.map((step, index) => ({
      id: `step-${index}`,
      name: step.name,
      prompt: step.prompt,
      variables: step.variables || {}
    }))
  };
}

/**
 * 快速创建MCP工具定义
 */
export function createMCPTool(
  name: string,
  description: string,
  parameters?: {
    type: 'object';
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean';
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  }
): MCPToolDefinition {
  return {
    name,
    description,
    parameters
  };
}

/**
 * 快速创建模板工作流（增强版）
 * 这是统一的模板会话创建函数，提供简化的控制接口
 */
export function createTemplateWorkflow(
  id: string,
  steps: Array<{ name: string; prompt: string; variables?: Record<string, any> }>,
  initialVariables?: Record<string, any>
): TemplateSession {
  const workflow = createSimpleWorkflow(id, steps);
  return new TemplateSession(id, {
    workflow,
    initialVariables
  });
}