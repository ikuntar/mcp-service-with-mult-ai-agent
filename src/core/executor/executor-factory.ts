/**
 * 统一执行层工厂
 * 作为工具调用的统一入口，创建并返回执行器实例
 */

import { IExecutorFactory } from './interfaces/executor-factory';
import { ExecutorInstance } from './interfaces/executor-instance';
import { Tool } from '../../types';
import { TokenRuleManager } from '../token/token-rule-manager';

// 导入所有执行器工厂（从示例目录）
import { FileSystemExecutorFactory } from '../../executors/example/filesystem/factory';
import { NetworkExecutorFactory } from '../../executors/example/network/factory';
import { SystemExecutorFactory } from '../../executors/example/system/factory';
import { DefaultExecutorFactory } from '../../executors/example/default/factory';

export class ExecutorFactory {
  private factories = new Map<string, IExecutorFactory>();
  private ruleManager: TokenRuleManager;

  constructor(ruleManager: TokenRuleManager) {
    this.ruleManager = ruleManager;
    this.registerDefaultFactories();
  }

  /**
   * 注册执行器工厂
   * @param type 执行器类型
   * @param factory 工厂实例
   */
  register(type: string, factory: IExecutorFactory): void {
    this.factories.set(type, factory);
  }

  /**
   * 获取执行器实例（统一入口）
   * @param tool 工具对象
   * @param token 用户Token
   * @returns 执行器实例
   */
  async getExecutor(tool: Tool, token: string): Promise<ExecutorInstance> {
    const executorType = this.resolveExecutorType(tool);
    const factory = this.factories.get(executorType);

    if (!factory) {
      throw new Error(`No factory registered for executor type: ${executorType}`);
    }

    // 工厂只负责创建实例
    return await factory.create(tool, token);
  }

  /**
   * 解析执行器类型
   * @param tool 工具对象
   * @returns 执行器类型
   */
  private resolveExecutorType(tool: Tool): string {
    // 优先级1：工具自声明
    if (tool.executor?.type) {
      return tool.executor.type;
    }

    // 优先级2：根据工具名推断
    return this.inferTypeFromToolName(tool.name);
  }

  /**
   * 根据工具名推断执行器类型
   * @param name 工具名
   * @returns 执行器类型
   */
  private inferTypeFromToolName(name: string): string {
    if (name.startsWith('file_')) return 'filesystem';
    if (name.startsWith('http_')) return 'network';
    if (name.startsWith('exec_')) return 'system';
    return 'default';
  }

  /**
   * 注册默认执行器工厂
   */
  private registerDefaultFactories(): void {
    // 注意：这里只注册工厂实例，不创建执行器实例
    this.register('filesystem', new FileSystemExecutorFactory(this.ruleManager));
    this.register('network', new NetworkExecutorFactory(this.ruleManager));
    this.register('system', new SystemExecutorFactory(this.ruleManager));
    this.register('default', new DefaultExecutorFactory(this.ruleManager));
  }
}
