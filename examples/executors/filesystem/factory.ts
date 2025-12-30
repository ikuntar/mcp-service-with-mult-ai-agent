/**
 * 文件系统执行器工厂 - 示例
 * 
 * 这是一个示例实现，展示了如何创建文件系统执行器工厂。
 * 你可以复制这个文件到你的项目目录并根据需求修改。
 */

import { IExecutorFactory } from '../../../core/interfaces/executor-factory';
import { ExecutorInstance } from '../../../core/interfaces/executor-instance';
import { Tool } from '../../../types';
import { TokenRuleManager } from '../../../core/token-rule-manager';
import { FileSystemExecutorInstance } from './instance';

export class FileSystemExecutorFactory implements IExecutorFactory {
  private ruleManager: TokenRuleManager;

  constructor(ruleManager: TokenRuleManager) {
    this.ruleManager = ruleManager;
  }

  /**
   * 创建文件系统执行器实例
   * @param tool 工具对象
   * @param token 用户Token
   * @returns 文件系统执行器实例
   */
  async create(tool: Tool, token: string): Promise<ExecutorInstance> {
    // 根据token获取文件系统规则
    const rules = await this.ruleManager.getRules(token, 'filesystem');
    
    // 创建实例并传入规则
    return new FileSystemExecutorInstance(tool, rules);
  }
}
