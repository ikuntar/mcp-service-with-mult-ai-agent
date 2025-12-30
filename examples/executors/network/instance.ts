/**
 * 网络执行器实例 - 示例
 * 
 * 这是一个示例实现，展示了如何创建网络执行器实例。
 * 你可以复制这个文件到你的项目目录并根据需求修改。
 */

import { ExecutorInstance } from '../../../core/interfaces/executor-instance';
import { Tool, ToolResult } from '../../../types';
import { ExecutorRules } from '../../../core/token-rule-manager';

export class NetworkExecutorInstance implements ExecutorInstance {
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

    // 域名检查
    if (this.rules.allowedDomains && args.url) {
      try {
        const url = new URL(args.url);
        if (!this.rules.allowedDomains.includes(url.hostname)) {
          return false;
        }
      } catch (e) {
        // URL解析失败
        return false;
      }
    }

    // 超时检查
    if (this.rules.timeout && args.timeout) {
      if (args.timeout > this.rules.timeout) {
        return false;
      }
    }

    return true;
  }

  private getRejectionReason(args: any): string {
    if (!this.rules.autoApprove) {
      return '需要人工审批';
    }

    if (this.rules.allowedDomains && args.url) {
      try {
        const url = new URL(args.url);
        if (!this.rules.allowedDomains.includes(url.hostname)) {
          return `域名不在允许列表：${url.hostname}`;
        }
      } catch (e) {
        return `URL格式无效：${args.url}`;
      }
    }

    if (this.rules.timeout && args.timeout) {
      if (args.timeout > this.rules.timeout) {
        return `超时时间超过限制（最大 ${this.rules.timeout}ms）`;
      }
    }

    return '规则不允许执行';
  }

  private async realExecute(args: any): Promise<ToolResult> {
    // 根据工具名执行具体操作
    switch (this.tool.name) {
      case 'http_request':
      case 'http_get':
      case 'http_post':
        return await this.makeHttpRequest(args);
      
      case 'http_download':
        return await this.downloadFile(args);
      
      default:
        if (this.tool.execute) {
          return await this.tool.execute(args);
        }
        
        throw new Error(`未知的网络操作：${this.tool.name}`);
    }
  }

  private async makeHttpRequest(args: any): Promise<ToolResult> {
    // 模拟HTTP请求
    const method = args.method || 'GET';
    const url = args.url || 'https://example.com';
    
    return {
      content: [{
        type: 'text',
        text: `模拟HTTP ${method} 请求\nURL: ${url}\n状态：成功\n响应：模拟数据...`
      }]
    };
  }

  private async downloadFile(args: any): Promise<ToolResult> {
    // 模拟文件下载
    const url = args.url || 'https://example.com/file.zip';
    
    return {
      content: [{
        type: 'text',
        text: `模拟文件下载\nURL: ${url}\n大小：1024 KB\n状态：完成`
      }]
    };
  }
}
