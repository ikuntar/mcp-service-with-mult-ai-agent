/**
 * 执行器实例接口
 * 定义所有执行器实例必须实现的接口
 */

import { ToolResult } from '../../../types';

export interface ExecutorInstance {
  /**
   * 执行操作
   * @param args 执行参数
   * @returns 执行结果
   */
  execute(args: any): Promise<ToolResult>;
}
