/**
 * Token规则管理器
 * 管理Token与执行器规则的映射关系
 */

import { RuleStorage } from '../storage/rule-storage';

export interface ExecutorRules {
  autoApprove: boolean;
  approver?: string;
  maxFileSize?: number;
  timeout?: number;
  allowedDomains?: string[];
  allowedCommands?: string[];
  maxCalls?: number;
}

export class TokenRuleManager {
  private storage: RuleStorage;

  constructor(storage: RuleStorage) {
    this.storage = storage;
  }

  /**
   * 获取Token对某个执行器的规则
   * @param token 用户Token
   * @param executorId 执行器ID
   * @returns 规则对象
   */
  async getRules(token: string, executorId: string): Promise<ExecutorRules> {
    const key = `${token}:${executorId}`;
    const rules = await this.storage.get(key);
    
    if (!rules) {
      // 返回默认规则
      return this.getDefaultRules(executorId);
    }
    
    return rules;
  }

  /**
   * 设置Token对某个执行器的规则
   * @param token 用户Token
   * @param executorId 执行器ID
   * @param rules 规则对象
   */
  async setRules(token: string, executorId: string, rules: ExecutorRules): Promise<void> {
    const key = `${token}:${executorId}`;
    await this.storage.save(key, rules);
  }

  /**
   * 删除Token对某个执行器的规则
   * @param token 用户Token
   * @param executorId 执行器ID
   */
  async deleteRule(token: string, executorId: string): Promise<void> {
    const key = `${token}:${executorId}`;
    await this.storage.delete(key);
  }

  /**
   * 获取Token的所有规则
   * @param token 用户Token
   * @returns 所有规则
   */
  async getAllRules(token: string): Promise<Record<string, ExecutorRules>> {
    const allRules: Record<string, ExecutorRules> = {};
    
    // 这里需要遍历所有可能的executorId
    // 简化实现：返回当前Token的所有存储规则
    // 实际应用中可能需要存储索引
    const executorIds = ['filesystem', 'network', 'system', 'default'];
    
    for (const executorId of executorIds) {
      const rules = await this.getRules(token, executorId);
      if (rules) {
        allRules[executorId] = rules;
      }
    }
    
    return allRules;
  }

  /**
   * 设置默认规则
   * @param executorId 执行器ID
   * @param rules 规则对象
   */
  async setDefaultRule(executorId: string, rules: ExecutorRules): Promise<void> {
    const key = `default:${executorId}`;
    await this.storage.save(key, rules);
  }

  /**
   * 获取默认规则
   * @param executorId 执行器ID
   * @returns 默认规则
   */
  async getDefaultRule(executorId: string): Promise<ExecutorRules> {
    const key = `default:${executorId}`;
    const rules = await this.storage.get(key);
    return rules || this.getDefaultRules(executorId);
  }

  /**
   * 获取内置默认规则
   * @param executorId 执行器ID
   * @returns 默认规则
   */
  private getDefaultRules(executorId: string): ExecutorRules {
    const defaults: Record<string, ExecutorRules> = {
      filesystem: { 
        autoApprove: true, 
        maxFileSize: 1024 * 1024, // 1MB
        maxCalls: 100 
      },
      network: { 
        autoApprove: true, 
        timeout: 30000, // 30秒
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
    
    return defaults[executorId] || defaults.default;
  }
}
