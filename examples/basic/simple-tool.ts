/**
 * 基础工具示例
 * 展示如何创建和使用MCP框架的基础工具
 */

import { Tool, ToolResult } from '../../src/types';

/**
 * 简单的Echo工具
 * 功能：回显用户输入的消息
 * 权限：public组，所有角色可访问
 */
export const echoTool: Tool = {
  name: 'echo',
  description: '回显用户输入的消息',
  groups: ['public'],
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: '要回显的消息'
      }
    },
    required: ['message']
  },
  execute: async (args: { message: string }): Promise<ToolResult> => {
    return {
      content: [
        {
          type: 'text',
          text: `Echo: ${args.message}`
        }
      ]
    };
  }
};

/**
 * 计算工具
 * 功能：执行简单的数学计算
 * 权限：basic组，user及以上角色可访问
 */
export const calculatorTool: Tool = {
  name: 'calculate',
  description: '执行简单的数学计算',
  groups: ['basic'],
  inputSchema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: '数学表达式，如: 2 + 3 * 4'
      }
    },
    required: ['expression']
  },
  execute: async (args: { expression: string }): Promise<ToolResult> => {
    try {
      // 注意：在生产环境中应该使用安全的数学表达式解析器
      // 这里仅作演示用途
      const result = eval(args.expression); // eslint-disable-line no-eval
      return {
        content: [
          {
            type: 'text',
            text: `结果: ${result}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `计算错误: ${error}`
          }
        ],
        isError: true
      };
    }
  }
};

/**
 * 信息工具
 * 功能：获取系统信息
 * 权限：advanced组，analyst及以上角色可访问
 */
export const systemInfoTool: Tool = {
  name: 'get_system_info',
  description: '获取系统基本信息',
  groups: ['advanced'],
  inputSchema: {
    type: 'object',
    properties: {
      detail: {
        type: 'boolean',
        description: '是否显示详细信息',
        default: false
      }
    }
  },
  execute: async (args: { detail?: boolean }): Promise<ToolResult> => {
    const info = {
      framework: 'MCP Framework',
      version: '3.1.0',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version
    };

    const text = args.detail 
      ? JSON.stringify(info, null, 2)
      : `MCP Framework v${info.version} - ${info.timestamp}`;

    return {
      content: [
        {
          type: 'text',
          text
        }
      ]
    };
  }
};

/**
 * 带执行器配置的工具示例
 * 功能：文件读取模拟（需要隔离执行）
 * 权限：sensitive组，admin角色可访问
 */
export const fileReadTool: Tool = {
  name: 'file_read',
  description: '读取文件内容（模拟）',
  groups: ['sensitive'],
  executor: {
    timeout: 10000,
    needAuth: true
  },
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件路径'
      }
    },
    required: ['path']
  },
  execute: async (args: { path: string }): Promise<ToolResult> => {
    // 模拟文件读取
    return {
      content: [
        {
          type: 'text',
          text: `模拟读取文件: ${args.path}\n内容: 这是一个模拟的文件内容。`
        }
      ]
    };
  }
};

/**
 * 工具注册示例
 * 如何在容器中注册这些工具
 */
export function registerBasicTools(container: any) {
  // 注册基础工具
  container.register(echoTool);
  container.register(calculatorTool);
  container.register(systemInfoTool);
  container.register(fileReadTool);
  
  console.log('✅ 基础工具已注册');
}

/**
 * 使用示例
 * 
 * // 1. 创建容器
 * const container = new EnhancedToolContainer({
 *   name: 'basic-container',
 *   defaultRole: 'user',
 *   roles: {
 *     user: { name: 'user', allowedGroups: ['public', 'basic'] },
 *     analyst: { name: 'analyst', allowedGroups: ['public', 'basic', 'advanced'] },
 *     admin: { name: 'admin', allowedGroups: ['*'] }
 *   }
 * });
 * 
 * // 2. 注册工具
 * registerBasicTools(container);
 * 
 * // 3. 执行工具
 * const result = await container.executeWithRole('user', 'echo', { message: 'Hello!' });
 * console.log(result);
 */