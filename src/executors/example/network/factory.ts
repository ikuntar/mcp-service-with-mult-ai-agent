/**
 * 网络执行器工厂 - 示例
 * 
 * 这是一个示例实现，展示了如何创建网络执行器工厂。
 * 你可以复制这个文件到你的项目目录并根据需求修改。
 */

import { IExecutorFactory } from '../../../core/executor/interfaces/executor-factory';
import { ExecutorInstance } from '../../../core/executor/interfaces/executor-instance';
import { Tool } from '../../../types';
import { TokenRuleManager } from '../../../core/token/token-rule-manager';
import { NetworkExecutorInstance } from './instance';

export class NetworkExecutorFactory implements IExecutorFactory {
  private ruleManager: TokenRuleManager;

  constructor(ruleManager: TokenRuleManager) {
    this.ruleManager = ruleManager;
  }

  async create(tool: Tool, token: string): Promise<ExecutorInstance> {
    const rules = await this.ruleManager.getRules(token, 'network');
    return new NetworkExecutorInstance(tool, rules);
  }
}
