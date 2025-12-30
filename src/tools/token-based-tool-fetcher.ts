/**
 * 基于Token的工具获取器
 * 
 * 提供通过token获取角色信息和工具列表的功能
 */

import type { Tool, ToolResult } from '../types.js';
import { globalTokenManager } from '../core/token/token-manager.js';

/**
 * 获取当前token角色信息的工具
 */
export const getTokenRoleInfoTool: Tool = {
  name: 'get_token_role_info',
  description: '获取token对应的角色详细信息和权限范围',
  groups: ['public', 'token-based-fetcher'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '要查询的token'
      }
    },
    required: ['token']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token } = args;

      if (!token) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      
      if (!role) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Token无效或已过期\n\n请检查token是否正确，或使用token管理工具创建新token。`
            }
          ],
          isError: true
        };
      }

      // 获取token详细信息
      const tokenInfo = globalTokenManager.getTokenInfo(token);

      // 角色权限描述
      const roleDescriptions: Record<string, string> = {
        'user': '普通用户 - 可访问基础工具和公共工具',
        'analyst': '分析师 - 可访问基础工具、高级工具和数据处理工具',
        'admin': '管理员 - 可访问所有工具和Token管理工具'
      };

      // 工具组权限
      const groupPermissions: Record<string, string[]> = {
        'user': ['public', 'basic'],
        'analyst': ['public', 'basic', 'advanced', 'sensitive', 'data-group'],
        'admin': ['*']
      };

      let response = `📊 Token角色信息\n\n`;
      response += `Token: ${token.substring(0, 16)}...\n`;
      response += `角色: ${role}\n`;
      response += `描述: ${roleDescriptions[role] || '自定义角色'}\n`;
      response += `状态: ${tokenInfo?.isActive ? '✅ 有效' : '❌ 无效'}\n`;
      
      if (tokenInfo?.expiresAt) {
        const expiresAt = new Date(tokenInfo.expiresAt);
        const now = new Date();
        const isExpired = now > expiresAt;
        response += `过期时间: ${tokenInfo.expiresAt}\n`;
        response += `时效状态: ${isExpired ? '❌ 已过期' : '✅ 未过期'}\n`;
      } else {
        response += `过期时间: 永久\n`;
      }

      response += `\n权限范围:\n`;
      const groups = groupPermissions[role] || ['根据配置动态分配'];
      groups.forEach(group => {
        response += `  • ${group}\n`;
      });

      response += `\n使用建议:\n`;
      response += `1. 在tools/list请求中使用此token获取对应角色的工具\n`;
      response += `2. 请求格式: {"method":"tools/list","params":{"_meta":{"token":"your-token"}}}\n`;
      response += `3. 系统会自动根据token角色过滤可见工具`;

      return {
        content: [
          {
            type: 'text',
            text: response
          }
        ]
      };

    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取角色信息失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 验证token工具
 */
export const validateTokenTool: Tool = {
  name: 'validate_token',
  description: '验证token的有效性并返回对应角色',
  groups: ['public', 'token-based-fetcher'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '要验证的token'
      }
    },
    required: ['token']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token } = args;
      
      if (!token) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token参数' }],
          isError: true
        };
      }

      const role = globalTokenManager.validateToken(token);

      if (role) {
        return {
          content: [
            {
              type: 'text',
              text: `✅ Token有效\n\nToken: ${token.substring(0, 16)}...\n角色: ${role}\n状态: 有效`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Token无效或已过期\n\nToken: ${token.substring(0, 16)}...\n状态: 无效/过期/已禁用`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `验证token失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 所有基于token的工具获取器
 */
export const tokenBasedFetcherTools: Tool[] = [
  getTokenRoleInfoTool,
  validateTokenTool
];