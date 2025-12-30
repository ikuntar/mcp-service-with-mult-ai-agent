/**
 * 系统执行器实例 - 示例
 * 
 * 这是一个示例实现，展示了如何创建系统执行器实例。
 * 你可以复制这个文件到你的项目目录并根据需求修改。
 */

import { ExecutorInstance } from '../../../core/interfaces/executor-instance';
import { Tool, ToolResult } from '../../../types';
import { ExecutorRules } from '../../../core/token-rule-manager';

export class SystemExecutorInstance implements ExecutorInstance {
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
    // 系统执行器默认需要审批
    if (!this.rules.autoApprove) {
      return false;
    }

    // 命令白名单检查
    if (this.rules.allowedCommands && args.command) {
      const command = args.command.split(' ')[0];
      if (!this.rules.allowedCommands.includes(command)) {
        return false;
      }
    }

    return true;
  }

  private getRejectionReason(args: any): string {
    if (!this.rules.autoApprove) {
      return '需要人工审批';
    }

    if (this.rules.allowedCommands && args.command) {
      const command = args.command.split(' ')[0];
      if (!this.rules.allowedCommands.includes(command)) {
        return `命令不在允许列表：${command}`;
      }
    }

    return '规则不允许执行';
  }

  private async realExecute(args: any): Promise<ToolResult> {
    // 根据工具名执行具体操作
    switch (this.tool.name) {
      case 'exec_command':
      case 'execute_command':
        return await this.executeCommand(args);
      
      case 'exec_script':
        return await this.executeScript(args);
      
      default:
        if (this.tool.execute) {
          return await this.tool.execute(args);
        }
        
        throw new Error(`未知的系统操作：${this.tool.name}`);
    }
  }

  private async executeCommand(args: any): Promise<ToolResult> {
    // 模拟命令执行
    const command = args.command || 'echo "hello"';
    
    return {
      content: [{
        type: 'text',
        text: `模拟执行命令：${command}\n输出：命令执行结果...`
      }]
    };
  }

  private async executeScript(args: any): Promise<ToolResult> {
    // 模拟脚本执行
    const script = args.script || 'console.log("hello")';
    
    return {
      content: [{
        type: 'text',
        text: `模拟执行脚本：${script.substring(0, 50)}...\n输出：脚本执行结果...`
      }]
    };
  }
}
