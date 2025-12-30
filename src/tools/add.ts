import type { Tool, ToolResult } from '../types';

/**
 * Add工具 - 计算两个数字之和
 *
 * @description 基础工具，所有角色可见
 * @groups ['public', 'basic']
 *
 * @example
 * ```typescript
 * // 调用示例
 * await addTool.execute({ a: 5, b: 3 });
 * // 返回: { content: [{ type: 'text', text: '5 + 3 = 8' }] }
 * ```
 */
export const addTool: Tool = {
  name: 'add',
  description: 'Add two numbers together',
  groups: ['public', 'basic'],
  inputSchema: {
    type: 'object',
    properties: {
      a: {
        type: 'number',
        description: 'First number',
      },
      b: {
        type: 'number',
        description: 'Second number',
      },
    },
    required: ['a', 'b'],
  },
  execute: async (args): Promise<ToolResult> => {
    // 参数验证
    if (!args || typeof args.a !== 'number' || typeof args.b !== 'number') {
      throw new Error('add工具需要两个number参数：a和b');
    }

    const result = args.a + args.b;

    return {
      content: [
        {
          type: 'text',
          text: `${args.a} + ${args.b} = ${result}`,
        },
      ],
    };
  },
};
