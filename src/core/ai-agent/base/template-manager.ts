/**
 * 模板对话管理器
 * 提供模板会话的完整控制接口，隐藏内部细节
 */

import { createTemplateSession, TemplateSession, createSimpleWorkflow, WorkflowTemplate } from '../session/index';
import { AgentState } from './types';

export interface TemplateManagerConfig {
  id: string;
  workflow: WorkflowTemplate;  // 工作流定义
  initialVariables?: Record<string, any>;
  autoContinue?: boolean;
}

export class TemplateManager {
  private id: string;
  private session: TemplateSession | null = null;
  private workflow: WorkflowTemplate;
  private state: AgentState = 'initialized';
  private isRunning: boolean = false;
  
  // 配置
  private autoContinue: boolean;

  constructor(config: TemplateManagerConfig) {
    this.id = config.id;
    this.autoContinue = config.autoContinue ?? true;
    this.workflow = config.workflow;
    
    // 初始化会话
    this.session = createTemplateSession(`${config.id}-template`, this.workflow, {
      initialVariables: config.initialVariables || {}
    });
  }

  /**
   * 开始执行模板对话
   */
  async start(): Promise<void> {
    if (this.state !== 'initialized' && this.state !== 'idle') {
      throw new Error(`Cannot start template session with state: ${this.state}`);
    }
    
    if (!this.session) {
      throw new Error('Session not initialized');
    }
    
    this.isRunning = true;
    await this.transition('executing');
    
    // 启动会话
    await this.session.start();
    
    // 等待完成
    await this.session.waitUntilEnd();
    
    // 检查结果
    const result = this.session.getResult();
    if (result.status === 'completed') {
      await this.transition('idle');
    } else if (result.status === 'error') {
      await this.transition('error');
    } else {
      await this.transition('stopped');
    }
    
    this.isRunning = false;
    console.log(`[TemplateManager] ${this.id} 模板对话执行完成`);
  }

  /**
   * 取消执行
   */
  async cancel(): Promise<void> {
    if (this.state === 'executing' && this.session) {
      await this.session.cancel();
      await this.transition('idle');
      this.isRunning = false;
      console.log(`[TemplateManager] ${this.id} 模板对话已取消`);
    }
  }

  /**
   * 重置模板对话
   */
  async reset(): Promise<void> {
    if (this.session) {
      this.session.reset();
      this.state = 'initialized';
      this.isRunning = false;
      console.log(`[TemplateManager] ${this.id} 模板对话已重置`);
    }
  }

  /**
   * 状态转换
   */
  private async transition(to: AgentState): Promise<boolean> {
    const validTransitions: Record<AgentState, AgentState[]> = {
      'initialized': ['idle', 'executing'],
      'idle': ['executing', 'initialized'],
      'planning': ['idle', 'executing', 'error'],
      'executing': ['idle', 'error', 'stopped'],
      'learning': ['idle'],
      'error': ['idle', 'stopped'],
      'stopped': ['initialized']
    };

    if (validTransitions[this.state]?.includes(to)) {
      this.state = to;
      return true;
    }

    console.warn(`Invalid state transition: ${this.state} -> ${to}`);
    return false;
  }

  // ==================== 对外访问接口 ====================

  /**
   * 获取当前状态
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * 获取执行状态
   */
  getExecutionStatus() {
    return {
      isRunning: this.isRunning,
      state: this.state,
      hasSession: this.session !== null
    };
  }

  /**
   * 获取所有步骤结果
   */
  getStepResults() {
    if (!this.session) return [];
    return this.session.getStepResults();
  }

  /**
   * 获取工作流信息
   */
  getWorkflowInfo() {
    return {
      id: this.workflow.id,
      name: this.workflow.name,
      description: this.workflow.description,
      stepCount: this.workflow.steps.length,
      steps: this.workflow.steps.map(s => ({
        id: s.id,
        name: s.name,
        prompt: s.prompt
      }))
    };
  }

  /**
   * 获取输出
   */
  getOutput(): string | undefined {
    if (!this.session) return undefined;
    const result = this.session.getResult();
    return result.output;
  }

  /**
   * 获取错误
   */
  getError(): string | undefined {
    if (!this.session) return undefined;
    const result = this.session.getResult();
    return result.error;
  }

  /**
   * 导出执行历史
   */
  exportHistory() {
    if (!this.session) return null;
    return {
      workflow: this.workflow,
      results: this.session.getStepResults(),
      output: this.getOutput(),
      error: this.getError(),
      status: this.state
    };
  }

  /**
   * 获取完整结果
   */
  getResult() {
    if (!this.session) return null;
    return this.session.getResult();
  }
}

/**
 * 快速创建模板管理器
 */
export function createTemplateManager(config: TemplateManagerConfig): TemplateManager {
  return new TemplateManager(config);
}

/**
 * 快速创建简单工作流的模板管理器
 */
export function createSimpleTemplateManager(
  id: string,
  steps: Array<{ name: string; prompt: string; variables?: Record<string, any> }>,
  initialVariables?: Record<string, any>
): TemplateManager {
  const workflow = createSimpleWorkflow(id, steps);
  return new TemplateManager({
    id,
    workflow,
    initialVariables
  });
}