/**
 * 文件系统执行器实例 - 示例
 * 
 * 这是一个示例实现，展示了如何创建文件系统执行器实例。
 * 你可以复制这个文件到你的项目目录并根据需求修改。
 */

import { ExecutorInstance } from '../../../core/interfaces/executor-instance';
import { Tool, ToolResult } from '../../../types';
import { ExecutorRules } from '../../../core/token-rule-manager';

export class FileSystemExecutorInstance implements ExecutorInstance {
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
    // 自动审批检查
    if (!this.rules.autoApprove) {
      return false;
    }

    // 文件大小检查
    if (this.rules.maxFileSize && args.content) {
      const contentSize = typeof args.content === 'string' 
        ? args.content.length 
        : JSON.stringify(args.content).length;
      
      if (contentSize > this.rules.maxFileSize) {
        return false;
      }
    }

    return true;
  }

  private getRejectionReason(args: any): string {
    if (!this.rules.autoApprove) {
      return '需要人工审批';
    }

    if (this.rules.maxFileSize && args.content) {
      const contentSize = typeof args.content === 'string' 
        ? args.content.length 
        : JSON.stringify(args.content).length;
      
      if (contentSize > this.rules.maxFileSize) {
        return `文件大小超过限制（最大 ${this.rules.maxFileSize} 字节）`;
      }
    }

    return '规则不允许执行';
  }

  private async realExecute(args: any): Promise<ToolResult> {
    // 根据工具名执行具体操作
    switch (this.tool.name) {
      case 'file_read':
        return await this.readFile(args.path);
      
      case 'file_write':
        return await this.writeFile(args.path, args.content);
      
      case 'file_delete':
        return await this.deleteFile(args.path);
      
      case 'file_list':
        return await this.listDirectory(args.path);
      
      default:
        // 如果工具名不匹配，尝试直接调用工具的execute方法
        if (this.tool.execute) {
          return await this.tool.execute(args);
        }
        
        throw new Error(`未知的文件系统操作：${this.tool.name}`);
    }
  }

  private async readFile(path: string): Promise<ToolResult> {
    // 模拟文件读取
    return {
      content: [{
        type: 'text',
        text: `模拟读取文件：${path}\n文件内容示例...`
      }]
    };
  }

  private async writeFile(path: string, content: string): Promise<ToolResult> {
    // 模拟文件写入
    return {
      content: [{
        type: 'text',
        text: `文件已写入：${path}\n内容长度：${content.length} 字节`
      }]
    };
  }

  private async deleteFile(path: string): Promise<ToolResult> {
    // 模拟文件删除
    return {
      content: [{
        type: 'text',
        text: `文件已删除：${path}`
      }]
    };
  }

  private async listDirectory(path: string): Promise<ToolResult> {
    // 模拟目录列表
    return {
      content: [{
        type: 'text',
        text: `目录：${path}\n- file1.txt\n- file2.txt\n- subdirectory/`
      }]
    };
  }
}
