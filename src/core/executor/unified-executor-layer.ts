/**
 * 统一执行器层
 * 集成执行器工厂，提供工具执行的统一入口
 */

import { Tool, ToolResult } from '../../types';
import { ExecutorFactory } from './executor-factory';
import { TokenRuleManager } from '../token/token-rule-manager';
import { FileRuleStorage } from '../storage/file-rule-storage';

export class UnifiedExecutorLayer {
  private executorFactory: ExecutorFactory;
  private ruleManager: TokenRuleManager;

  constructor(dataDir: string = './data') {
    // 初始化规则存储
    const ruleStorage = new FileRuleStorage(`${dataDir}/rules.json`);
    
    // 初始化规则管理器
    this.ruleManager = new TokenRuleManager(ruleStorage);
    
    // 初始化执行器工厂
    this.executorFactory = new ExecutorFactory(this.ruleManager);
  }

  /**
   * 执行工具
   * @param tool 工具对象
   * @param args 执行参数
   * @param token 用户Token
   * @returns 执行结果
   */
  async executeTool(tool: Tool, args: any, token: string): Promise<ToolResult> {
    try {
      // 1. Token验证（这里可以集成现有的TokenManager）
      if (!token || token.trim() === '') {
        return {
          content: [{ type: 'text', text: '错误：Token不能为空' }],
          isError: true
        };
      }

      // 2. 获取执行器实例
      const executor = await this.executorFactory.getExecutor(tool, token);

      // 3. 通过实例执行（实例内部会根据token获取规则）
      const result = await executor.execute(args);

      return result;
    } catch (error: any) {
      return {
        content: [{ 
          type: 'text', 
          text: `执行错误：${error.message}` 
        }],
        isError: true
      };
    }
  }

  /**
   * 获取规则管理器（用于规则管理工具）
   */
  getRuleManager(): TokenRuleManager {
    return this.ruleManager;
  }

  /**
   * 获取执行器工厂（用于扩展）
   */
  getExecutorFactory(): ExecutorFactory {
    return this.executorFactory;
  }
}
