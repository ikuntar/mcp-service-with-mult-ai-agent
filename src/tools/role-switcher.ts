/**
 * 角色切换工具
 * 
 * 用于切换当前用户角色（主要用于测试）
 */

import type { Tool, ToolResult } from '../types.js';

/**
 * 角色切换工具
 * 注意：这个工具需要在主服务器中特殊处理，因为它需要访问服务器实例
 */
export const switchRoleTool: Tool = {
  name: 'switch_role',
  description: '切换当前用户角色（仅用于测试和演示）',
  groups: ['public', 'admin-only'],
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要切换到的角色 (user, analyst, admin)'
      }
    },
    required: ['role']
  },
  execute: async (args): Promise<ToolResult> => {
    // 这个工具的执行逻辑需要在主服务器中实现
    // 因为它需要修改服务器的currentUserRole属性
    return {
      content: [
        {
          type: 'text',
          text: '此工具需要在主服务器中特殊处理，请使用服务器内置的角色切换机制'
        }
      ]
    };
  }
};