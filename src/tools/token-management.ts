/**
 * Token管理工具
 * 
 * 提供token和角色的增删改查功能（非MCP工具，用于内部管理）
 */

import { globalTokenManager, TokenManager } from '../core/token/token-manager.js';
import type { Tool, ToolResult } from '../types.js';

/**
 * 创建token工具
 */
export const createTokenTool: Tool = {
  name: 'token_create',
  description: '创建新的token并绑定角色 - 用于管理用户访问权限',
  groups: ['admin-only', 'token-management'],
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: '要绑定的角色名称 (user, analyst, admin)'
      },
      description: {
        type: 'string',
        description: 'token的描述信息（可选）'
      },
      expiresIn: {
        type: 'string',
        description: '有效期，格式: 数字+单位 (s=秒, m=分钟, h=小时, d=天, w=周, y=年)，不传表示永久'
      }
    },
    required: ['role']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { role, description, expiresIn } = args;
      
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供role参数' }],
          isError: true
        };
      }

      const token = globalTokenManager.createToken(role, description, expiresIn);
      const info = globalTokenManager.getTokenInfo(token);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Token创建成功\n\nToken: ${token}\n角色: ${role}\n描述: ${description || '无'}\n创建时间: ${info?.createdAt}\n过期时间: ${info?.expiresAt || '永久'}\n\n⚠️  请妥善保存此token，关闭后将无法再次查看！`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `创建token失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 验证token工具
 */
export const validateTokenTool: Tool = {
  name: 'token_validate',
  description: '验证token并返回对应角色',
  groups: ['admin-only', 'token-management'],
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
              text: `✅ Token有效\n\nToken: ${token}\n角色: ${role}\n状态: 有效`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Token无效或已过期\n\nToken: ${token}\n状态: 无效/过期/已禁用`
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
 * 获取token信息工具
 */
export const getTokenInfoTool: Tool = {
  name: 'token_info',
  description: '获取token的详细信息',
  groups: ['admin-only', 'token-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '要查询的token，不传则列出所有token'
      },
      includeInactive: {
        type: 'boolean',
        description: '是否包含无效/过期的token',
        default: false
      }
    },
    required: []
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, includeInactive = false } = args;

      if (token) {
        // 获取单个token信息
        const info = globalTokenManager.getTokenInfo(token);
        if (!info) {
          return {
            content: [{ type: 'text', text: `❌ 未找到token: ${token}` }],
            isError: true
          };
        }

        const status = info.isActive ? '有效' : '无效';
        const expired = info.expiresAt && new Date(info.expiresAt) < new Date() ? ' (已过期)' : '';

        return {
          content: [
            {
              type: 'text',
              text: `Token信息:\n\nToken: ${token}\n角色: ${info.role}\n描述: ${info.description || '无'}\n创建时间: ${info.createdAt}\n过期时间: ${info.expiresAt || '永久'}${expired}\n最后使用: ${info.lastUsed || '未使用'}\n状态: ${status}${expired}`
            }
          ]
        };
      } else {
        // 列出所有token
        const tokens = globalTokenManager.listTokens(includeInactive);
        
        if (tokens.length === 0) {
          return {
            content: [{ type: 'text', text: '暂无token' }]
          };
        }

        const lines = tokens.map(info => {
          const status = info.isActive ? '✓' : '✗';
          const expired = info.expiresAt && new Date(info.expiresAt) < new Date() ? ' (过期)' : '';
          const tokenShort = info.token.substring(0, 8) + '...';
          return `${status} ${tokenShort} | 角色: ${info.role} | 描述: ${info.description || '无'} | 有效期: ${info.expiresAt || '永久'}${expired}`;
        });

        return {
          content: [
            {
              type: 'text',
              text: `可用的Token (${tokens.length}):\n\n${lines.join('\n')}\n\n提示: 使用token_info并传入完整token查看详情`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取token信息失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 删除token工具
 */
export const deleteTokenTool: Tool = {
  name: 'token_delete',
  description: '删除指定的token',
  groups: ['admin-only', 'token-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '要删除的token'
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

      const success = globalTokenManager.deleteToken(token);

      if (success) {
        return {
          content: [
            {
              type: 'text',
              text: `✅ Token已删除\n\nToken: ${token}`
            }
          ]
        };
      } else {
        return {
          content: [{ type: 'text', text: `❌ 删除失败，token不存在: ${token}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `删除token失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 禁用token工具
 */
export const deactivateTokenTool: Tool = {
  name: 'token_deactivate',
  description: '禁用token（软删除，可恢复）',
  groups: ['admin-only', 'token-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '要禁用的token'
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

      const success = globalTokenManager.deactivateToken(token);

      if (success) {
        return {
          content: [
            {
              type: 'text',
              text: `✅ Token已禁用\n\nToken: ${token}\n提示: 可使用token_activate重新激活`
            }
          ]
        };
      } else {
        return {
          content: [{ type: 'text', text: `❌ 禁用失败，token不存在: ${token}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `禁用token失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 激活token工具
 */
export const activateTokenTool: Tool = {
  name: 'token_activate',
  description: '激活已禁用的token',
  groups: ['admin-only', 'token-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '要激活的token'
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

      const success = globalTokenManager.activateToken(token);

      if (success) {
        return {
          content: [
            {
              type: 'text',
              text: `✅ Token已激活\n\nToken: ${token}`
            }
          ]
        };
      } else {
        return {
          content: [{ type: 'text', text: `❌ 激活失败，token不存在或已过期: ${token}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `激活token失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 续期token工具
 */
export const renewTokenTool: Tool = {
  name: 'token_renew',
  description: '为token续期',
  groups: ['admin-only', 'token-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '要续期的token'
      },
      expiresIn: {
        type: 'string',
        description: '新的有效期，格式: 数字+单位 (s=秒, m=分钟, h=小时, d=天, w=周, y=年)'
      }
    },
    required: ['token', 'expiresIn']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, expiresIn } = args;
      
      if (!token || !expiresIn) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和expiresIn参数' }],
          isError: true
        };
      }

      const success = globalTokenManager.renewToken(token, expiresIn);

      if (success) {
        const info = globalTokenManager.getTokenInfo(token);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Token续期成功\n\nToken: ${token}\n新有效期: ${expiresIn}\n过期时间: ${info?.expiresAt}`
            }
          ]
        };
      } else {
        return {
          content: [{ type: 'text', text: `❌ 续期失败，token不存在: ${token}` }],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `续期token失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 清理过期token工具
 */
export const cleanupTokensTool: Tool = {
  name: 'token_cleanup',
  description: '清理所有过期的token',
  groups: ['admin-only', 'token-management'],
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const deletedCount = globalTokenManager.cleanupExpired();

      return {
        content: [
          {
            type: 'text',
            text: `✅ 清理完成\n\n已删除过期token数量: ${deletedCount}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `清理token失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 获取token统计信息工具
 */
export const tokenStatsTool: Tool = {
  name: 'token_stats',
  description: '获取token统计信息',
  groups: ['admin-only', 'token-management'],
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const stats = globalTokenManager.getStats();

      const lines = [
        `总数: ${stats.total}`,
        `有效: ${stats.active}`,
        `过期: ${stats.expired}`,
        `禁用: ${stats.inactive}`,
        '',
        '角色分布:'
      ];

      for (const [role, count] of Object.entries(stats.byRole)) {
        lines.push(`  ${role}: ${count}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `📊 Token统计信息\n\n${lines.join('\n')}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取统计信息失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 所有token管理工具
 */
export const tokenManagementTools: Tool[] = [
  createTokenTool,
  validateTokenTool,
  getTokenInfoTool,
  deleteTokenTool,
  deactivateTokenTool,
  activateTokenTool,
  renewTokenTool,
  cleanupTokensTool,
  tokenStatsTool
];