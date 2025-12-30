import type { Tool, ToolResult } from '../types';

/**
 * Echo工具 - 回显用户消息
 *
 * @description 基础工具，所有角色可见
 * @groups ['public', 'basic']
 *
 * @example
 * ```typescript
 * // 调用示例
 * await echoTool.execute({ message: 'Hello World' });
 * // 返回: { content: [{ type: 'text', text: 'Echo: Hello World' }] }
 * ```
 */
export const echoTool: Tool = {
  name: 'echo',
  description: 'Echo back the message you send to me',
  groups: ['public', 'basic'],
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to echo back',
      },
    },
    required: ['message'],
  },
  execute: async (args): Promise<ToolResult> => {
    // 参数验证
    if (!args || typeof args.message !== 'string') {
      throw new Error('echo工具需要一个message参数（字符串类型）');
    }

    return {
      content: [
        {
          type: 'text',
          text: `Echo: ${args.message}`,
        },
      ],
    };
  },
};
