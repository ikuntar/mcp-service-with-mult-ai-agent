/**
 * 基于用户空间的执行器工厂
 * 
 * 直接从用户空间获取配置和规则，简化执行器创建流程
 */

import { IExecutorFactory } from '../executor/interfaces/executor-factory';
import { ExecutorInstance } from '../executor/interfaces/executor-instance';
import { Tool } from '../../types';
import { UserSpaceManager } from './user-space';

// 导入执行器实例
import { FileSystemExecutorInstance } from '../../executors/example/filesystem/instance';
import { NetworkExecutorInstance } from '../../executors/example/network/instance';
import { SystemExecutorInstance } from '../../executors/example/system/instance';
import { DefaultExecutorInstance } from '../../executors/example/default/instance';

export class UserSpaceExecutorFactory implements IExecutorFactory {
  private userSpaceManager: UserSpaceManager;

  constructor(userSpaceManager: UserSpaceManager) {
    this.userSpaceManager = userSpaceManager;
  }

  /**
   * 创建执行器实例
   * @param tool 工具对象
   * @param token 用户Token
   * @returns 执行器实例
   */
  async create(tool: Tool, token: string): Promise<ExecutorInstance> {
    // 1. 获取用户空间
    const userSpace = this.userSpaceManager.getUserSpaceIfExists(token);
    if (!userSpace) {
      throw new Error(`用户空间不存在: ${token.substring(0, 8)}...`);
    }

    // 2. 解析执行器类型
    const executorType = this.resolveExecutorType(tool);

    // 3. 从用户空间获取规则
    const rules = userSpace.executorRules[executorType] || 
                  this.getDefaultRules(executorType);

    // 4. 创建执行器实例
    return this.createExecutorInstance(tool, rules, executorType);
  }

  /**
   * 解析执行器类型
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
   */
  private inferTypeFromToolName(name: string): string {
    if (name.startsWith('file_')) return 'filesystem';
    if (name.startsWith('http_')) return 'network';
    if (name.startsWith('exec_')) return 'system';
    return 'default';
  }

  /**
   * 创建执行器实例
   */
  private createExecutorInstance(
    tool: Tool, 
    rules: any, 
    executorType: string
  ): ExecutorInstance {
    switch (executorType) {
      case 'filesystem':
        return new FileSystemExecutorInstance(tool, rules);
      case 'network':
        return new NetworkExecutorInstance(tool, rules);
      case 'system':
        return new SystemExecutorInstance(tool, rules);
      case 'default':
      default:
        return new DefaultExecutorInstance(tool, rules);
    }
  }

  /**
   * 获取默认规则
   */
  private getDefaultRules(executorType: string): any {
    const defaults: Record<string, any> = {
      filesystem: { 
        autoApprove: true, 
        maxFileSize: 1024 * 1024,
        maxCalls: 100 
      },
      network: { 
        autoApprove: true, 
        timeout: 30000,
        maxCalls: 50 
      },
      system: { 
        autoApprove: false, 
        approver: 'admin',
        maxCalls: 10 
      },
      default: { 
        autoApprove: true,
        maxCalls: 1000 
      }
    };
    
    return defaults[executorType] || defaults.default;
  }

  /**
   * 批量注册执行器工厂（兼容性方法）
   */
  register(type: string, factory: IExecutorFactory): void {
    // 用户空间工厂不需要注册，它直接处理所有类型
    console.log(`[UserSpaceExecutorFactory] 注册工厂 ${type} (用户空间模式下不需要注册)`);
  }
}