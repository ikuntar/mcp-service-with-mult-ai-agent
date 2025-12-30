/**
 * 模板会话 - 按照固定工作流执行的会话
 */

import { BaseSession } from './base-session';
import { 
  SessionStatus, 
  TemplateSessionConfig, 
  WorkflowTemplate, 
  SessionStep, 
  StepResult,
  SessionResult 
} from './types';
import * as fs from 'fs';
import * as path from 'path';

export class TemplateSession extends BaseSession {
  private workflow: WorkflowTemplate;
  private currentStepIndex: number;
  private variables: Record<string, any>;
  private stepResults: StepResult[];
  private currentStepId: string | null;

  constructor(id: string, config: TemplateSessionConfig) {
    super(id, config);
    
    // 加载工作流
    if (typeof config.workflow === 'string') {
      this.workflow = this.loadWorkflowFromFile(config.workflow);
    } else {
      this.workflow = config.workflow;
    }

    this.currentStepIndex = 0;
    this.variables = { ...config.initialVariables };
    this.stepResults = [];
    this.currentStepId = null;
  }

  /**
   * 从JSON文件加载工作流
   */
  private loadWorkflowFromFile(filePath: string): WorkflowTemplate {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Workflow file not found: ${resolvedPath}`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const json = JSON.parse(content);

    // 验证工作流格式
    if (!json.steps || !Array.isArray(json.steps) || json.steps.length === 0) {
      throw new Error('Invalid workflow format: steps array required');
    }

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
   * 从代码定义工作流
   */
  static createFromCode(
    id: string,
    steps: SessionStep[],
    options?: {
      name?: string;
      description?: string;
      workflowOptions?: WorkflowTemplate['options'];
    }
  ): WorkflowTemplate {
    return {
      id,
      name: options?.name || `Workflow-${id}`,
      description: options?.description,
      steps,
      options: options?.workflowOptions
    };
  }

  /**
   * 执行会话
   */
  protected async execute(): Promise<void> {
    const options = this.workflow.options || {};
    const strictOrder = options.strictOrder ?? true;
    const autoContinue = options.autoContinue ?? true;
    const maxRetries = options.maxRetries ?? 3;

    try {
      await this.emit('step', { type: 'workflow-start', workflow: this.workflow });

      // 执行每个步骤
      while (this.currentStepIndex < this.workflow.steps.length) {
        const step = this.workflow.steps[this.currentStepIndex];
        this.currentStepId = step.id;
  
        await this.emit('step', { type: 'step-start', step, index: this.currentStepIndex });
  
        // 执行步骤
        let retryCount = 0;
        let stepSuccess = false;
        let stepOutput: string | undefined;
        let stepError: string | undefined;
  
        while (retryCount <= maxRetries && !stepSuccess) {
          try {
            // 准备步骤提示词
            const prompt = this.prepareStepPrompt(step);
            
            // 添加用户消息（步骤提示）
            this.addMessage('system', `步骤 ${this.currentStepIndex + 1}: ${step.name}`);
            this.addMessage('user', prompt);
  
            // 执行步骤（调用AI或模拟）
            stepOutput = await this.executeStep(step, prompt);
            
            // 验证输出（如果有期望格式）
            if (step.expectedOutput) {
              const validation = this.validateOutput(stepOutput, step.expectedOutput);
              if (!validation.valid) {
                throw new Error(`输出验证失败: ${validation.error}`);
              }
            }
  
            // 添加助手消息
            this.addMessage('assistant', stepOutput);
  
            // 保存结果
            const stepResult: StepResult = {
              stepId: step.id,
              success: true,
              output: stepOutput,
              variables: { ...this.variables }
            };
            this.stepResults.push(stepResult);
  
            stepSuccess = true;
  
            await this.emit('step', {
              type: 'step-success',
              step,
              output: stepOutput,
              result: stepResult
            });
  
          } catch (error) {
            retryCount++;
            stepError = error instanceof Error ? error.message : String(error);
  
            await this.emit('step', {
              type: 'step-retry',
              step,
              retryCount,
              error: stepError
            });
  
            if (retryCount > maxRetries) {
              const stepResult: StepResult = {
                stepId: step.id,
                success: false,
                error: stepError,
                variables: { ...this.variables }
              };
              this.stepResults.push(stepResult);
  
              await this.emit('step', {
                type: 'step-failed',
                step,
                error: stepError
              });
  
              if (strictOrder) {
                throw new Error(`步骤 "${step.name}" 失败: ${stepError}`);
              }
            }
          }
        }
  
        // 步骤成功，更新变量
        if (stepSuccess) {
          this.updateVariablesFromOutput(stepOutput!);
        }
  
        // 检查是否继续
        if (autoContinue) {
          this.currentStepIndex++;
        } else {
          // 等待外部决定是否继续
          await this.waitForNextStep();
        }
      }

      // 所有步骤完成
      await this.emit('step', { type: 'workflow-complete', results: this.stepResults });
      await this.complete();

    } catch (error) {
      await this.handleError(error);
    }
  }

  /**
   * 准备步骤提示词
   */
  private prepareStepPrompt(step: SessionStep): string {
    let prompt = step.prompt;

    // 替换变量
    for (const [key, value] of Object.entries(this.variables)) {
      const placeholder = `{{${key}}}`;
      prompt = prompt.split(placeholder).join(String(value));
    }

    // 替换步骤上下文
    prompt = prompt.split('{{step_index}}').join(String(this.currentStepIndex + 1));
    prompt = prompt.split('{{step_name}}').join(step.name);

    return prompt;
  }

  /**
   * 执行单个步骤（子类可重写）
   */
  protected async executeStep(step: SessionStep, prompt: string): Promise<string> {
    // 默认实现：模拟AI响应
    // 实际使用时，这里应该调用真实的AI模型
    return `步骤 ${step.name} 的模拟响应。\n提示词: ${prompt.substring(0, 100)}...`;
  }

  /**
   * 验证输出
   */
  private validateOutput(output: string, expected: string): { valid: boolean; error?: string } {
    // 简单验证逻辑
    if (expected.includes('json') && !output.includes('{')) {
      return { valid: false, error: '期望JSON格式但未找到JSON' };
    }
    
    if (expected.includes('code') && !output.includes('function')) {
      return { valid: false, error: '期望包含代码但未找到' };
    }

    return { valid: true };
  }

  /**
   * 从输出更新变量
   */
  private updateVariablesFromOutput(output: string): void {
    // 简单的变量提取逻辑
    // 实际使用时，可以根据需要实现更复杂的提取逻辑
    
    // 示例：提取JSON中的变量
    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        Object.assign(this.variables, data);
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  /**
   * 等待下一步（用于手动控制）
   */
  private async waitForNextStep(): Promise<void> {
    return new Promise((resolve) => {
      const handler: any = (event: any) => {
        if (event.type === 'continue') {
          this.off(handler);
          this.currentStepIndex++;
          resolve();
        }
      };
      this.on(handler);
    });
  }

  /**
   * 继续下一步（手动控制时调用）
   */
  async continue(): Promise<void> {
    if (this.status !== SessionStatus.RUNNING) {
      throw new Error('Session is not running');
    }
    
    // 触发继续事件
    await this.emit('step', { type: 'continue', currentStep: this.currentStepIndex });
  }

  /**
   * 跳转到指定步骤
   */
  async jumpToStep(stepId: string): Promise<void> {
    if (this.status !== SessionStatus.RUNNING) {
      throw new Error('Session is not running');
    }

    const index = this.workflow.steps.findIndex(s => s.id === stepId);
    if (index === -1) {
      throw new Error(`Step not found: ${stepId}`);
    }

    this.currentStepIndex = index;
    await this.emit('step', { type: 'jump', to: stepId, index });
  }

  /**
   * 获取当前步骤
   */
  protected getCurrentStep(): string | undefined {
    if (this.currentStepIndex < this.workflow.steps.length) {
      return this.workflow.steps[this.currentStepIndex].id;
    }
    return undefined;
  }

  /**
   * 获取变量
   */
  protected getVariables(): Record<string, any> {
    return { ...this.variables };
  }

  /**
   * 获取输出
   */
  protected getOutput(): string | undefined {
    if (this.stepResults.length === 0) return undefined;
    
    return this.stepResults
      .filter(r => r.success && r.output)
      .map(r => `[${r.stepId}] ${r.output}`)
      .join('\n\n');
  }

  /**
   * 获取错误
   */
  protected getError(): string | undefined {
    const failed = this.stepResults.find(r => !r.success);
    return failed?.error;
  }

  /**
   * 处理消息（模板会话不支持连续对话）
   */
  protected async handleMessage(content: string): Promise<string> {
    throw new Error('Template session does not support continuous messaging');
  }

  /**
   * 获取步骤结果
   */
  getStepResults(): StepResult[] {
    return [...this.stepResults];
  }

  /**
   * 获取工作流
   */
  getWorkflow(): WorkflowTemplate {
    return { ...this.workflow };
  }
}