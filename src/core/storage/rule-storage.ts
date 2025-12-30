/**
 * 规则存储接口
 * 定义规则持久化的接口
 */

export interface RuleStorage {
  /**
   * 获取规则
   * @param key 键（通常为 token:executorId）
   * @returns 规则数据
   */
  get(key: string): Promise<any>;
  
  /**
   * 保存规则
   * @param key 键
   * @param value 规则数据
   */
  save(key: string, value: any): Promise<void>;
  
  /**
   * 删除规则
   * @param key 键
   */
  delete(key: string): Promise<void>;
}
