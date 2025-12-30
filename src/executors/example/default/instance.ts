/**
 * 默认执行器实例 - 示例
 * 
 * 这是一个示例实现，展示了如何创建默认执行器实例。
 * 你可以复制这个文件到你的项目目录并根据需求修改。
 */

import { ExecutorInstance } from '../../../core/executor/interfaces/executor-instance';
import { Tool, ToolResult } from '../../../types';
import { ExecutorRules } from '../../../core/token/token-rule-manager';

export class DefaultExecutorInstance implements ExecutorInstance {
  constructor(
    private tool: Tool,
    private rules: ExecutorRules
  ) {}

  async execute(args: any): Promise<ToolResult> {
    // 1. 检查规则
    if (!this.checkRules(args)) {
      return {
        content: [{ 
          type: 'text', 
          text: `执行被拒绝：${this.getRejectionReason(args)}` 
        }],
        isError: true
      };
    }

    // 2. 执行实际操作
    try {
      const result = await this.realExecute(args);
      return result;
    } catch (error: any) {
      return {
        content: [{ 
          type: 'text', 
          text: `执行失败：${error.message}` 
        }],
        isError: true
      };
    }
  }

  private checkRules(args: any): boolean {
    // 默认执行器通常自动审批
    if (this.rules.autoApprove === false) {
      return false;
    }

    // 调用次数检查
    if (this.rules.maxCalls) {
      // 这里应该有调用计数逻辑
      // 暂时简化为总是通过
    }

    return true;
  }

  private getRejectionReason(args: any): string {
    if (this.rules.autoApprove === false) {
      return '需要人工审批';
    }

    return '规则不允许执行';
  }

  private async realExecute(args: any): Promise<ToolResult> {
    // 默认执行器：直接调用工具的execute方法
    if (this.tool.execute) {
      return await this.tool.execute(args);
    }

    throw new Error(`工具 ${this.tool.name} 没有execute方法`);
  }
}
