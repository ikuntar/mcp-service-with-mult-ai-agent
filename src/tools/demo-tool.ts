/**
 * 演示工具 - 从高级工具转换而来
 * 使用现有的用户组过滤系统
 */

import type { Tool, ToolResult } from '../types.js';

/**
 * 演示工具 - 用于测试权限系统
 * 通过groups标签实现权限控制
 */
export const demoTool: Tool = {
  name: 'demo_tool',
  description: '演示工具 - 用于测试基于用户组的权限控制系统',
  groups: ['advanced', 'sensitive'],  // 需要analyst或admin角色才能访问
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: '要处理的演示消息',
      },
      operation: {
        type: 'string',
        description: '操作类型',
        enum: ['uppercase', 'lowercase', 'reverse'],
        default: 'uppercase'
      }
    },
    required: ['message'],
  },
  execute: async (args): Promise<ToolResult> => {
    if (!args || typeof args.message !== 'string') {
      throw new Error('演示工具需要一个message参数（字符串类型）');
    }

    const { message, operation = 'uppercase' } = args;
    let result = message;

    switch (operation) {
      case 'uppercase':
        result = message.toUpperCase();
        break;
      case 'lowercase':
        result = message.toLowerCase();
        break;
      case 'reverse':
        result = message.split('').reverse().join('');
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: `演示工具结果:\n原始消息: ${message}\n操作: ${operation}\n结果: ${result}\n\n提示: 此工具通过groups标签('advanced', 'sensitive')控制权限，仅analyst和admin角色可见。`,
        },
      ],
    };
  },
};