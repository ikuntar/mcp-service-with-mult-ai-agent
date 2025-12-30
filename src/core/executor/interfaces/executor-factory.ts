/**
 * 执行器工厂接口
 * 定义所有执行器工厂必须实现的接口
 */

import { ExecutorInstance } from './executor-instance';
import { Tool } from '../../../types';

export interface IExecutorFactory {
  /**
   * 创建执行器实例
   * @param tool 工具对象
   * @param token 用户Token
   * @returns 执行器实例
   */
  create(tool: Tool, token: string): Promise<ExecutorInstance>;
}
