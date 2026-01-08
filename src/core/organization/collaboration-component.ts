/**
 * 协作组件接口
 * 定义所有协作单元需要实现的核心功能
 */

import { ProxyExecutionContext, ProxyExecutionResult, CollaborationComponentConfig } from './types';
import { Tool, ToolResult } from '../../types';

export interface CollaborationComponent {
  // 基础属性
  id: string;
  name: string;
  description?: string;
  
  // 配置
  config: CollaborationComponentConfig;
  
  // 用户空间接口（组合模式）
  token: string;
  role: string;
  visibleTools: Set<string>;
  
  // 成员管理
  addMember(member: any): boolean;
  removeMember(memberId: string): boolean;
  getMembers(): Map<string, any>;
  
  // 代理执行
  proxyExecute(
    memberToken: string,
    toolName: string,
    args: any,
    context: ProxyExecutionContext
  ): Promise<ProxyExecutionResult>;
  
  // 状态管理
  readonly isActive: boolean;
  setActive(active: boolean): void;
  
  // 统计信息
  getStats(): any;
  
  // 事件监听
  onEvent(listener: (event: any) => void): void;
  
  // 清理资源
  cleanup(): Promise<void>;
  
  // MCP工具集接口（新增）
  /**
   * 获取协作组件的MCP工具集
   * 不同的协作组件实现可以返回不同的工具集
   * @param memberToken 成员Token（用于权限验证）
   * @returns 该成员在此协作组件中可用的MCP工具列表
   */
  getMCPTools(memberToken: string): Promise<Tool[]>;
  
  /**
   * 执行MCP工具
   * 作为MCP端点的统一入口
   * @param memberToken 成员Token
   * @param toolName 工具名称
   * @param args 工具参数
   * @returns MCP工具执行结果
   */
  executeMCPTool(memberToken: string, toolName: string, args: any): Promise<ToolResult>;

  /**
   * 获取协作组件的MCP工具集（带前缀）
   * 自动为所有工具添加组件前缀
   * @param memberToken 成员Token
   * @returns 带前缀的工具列表
   */
  getMCPToolsWithPrefix(memberToken: string): Promise<Tool[]>;
}