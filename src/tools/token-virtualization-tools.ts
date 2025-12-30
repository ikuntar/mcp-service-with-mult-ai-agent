/**
 * Token虚拟化管理工具
 * 
 * 提供通过token管理虚拟化实例的功能
 */

import type { Tool, ToolResult } from '../types';
import { globalTokenVirtualizationManager } from '../core/token/token-virtualization-manager';
import { globalTokenManager } from '../core/token/token-manager';

/**
 * 获取token虚拟化实例工具
 */
export const getVirtualizationTool: Tool = {
  name: 'virtualization_get',
  description: '获取token对应的虚拟化实例（如果不存在则创建）',
  groups: ['admin-only', 'virtualization-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
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
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取或创建虚拟化实例
      const virtualization = globalTokenVirtualizationManager.getVirtualization(token);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 虚拟化实例获取成功\n\nToken: ${token.substring(0, 16)}...\n角色: ${role}\n状态: 已创建/已获取\n\n现在可以使用virtualization_execute执行虚拟化操作`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取虚拟化实例失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 执行虚拟化操作工具
 */
export const executeVirtualizationTool: Tool = {
  name: 'virtualization_execute',
  description: '执行token对应虚拟化实例的操作',
  groups: ['admin-only', 'virtualization-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      action: {
        type: 'string',
        description: '操作名称'
      },
      args: {
        type: 'object',
        description: '操作参数（可选）'
      }
    },
    required: ['token', 'action']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, action, args: actionArgs } = args;
      
      if (!token || !action) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和action参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 检查虚拟化实例是否存在
      if (!globalTokenVirtualizationManager.hasVirtualization(token)) {
        return {
          content: [{ type: 'text', text: `错误: Token ${token.substring(0, 16)}... 没有虚拟化实例，请先使用virtualization_get创建` }],
          isError: true
        };
      }

      // 执行操作
      const result = await globalTokenVirtualizationManager.execute(token, action, actionArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 虚拟化操作成功\n\nToken: ${token.substring(0, 16)}...\n操作: ${action}\n结果: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `虚拟化操作失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 获取虚拟化资源工具
 */
export const getVirtualizationResourcesTool: Tool = {
  name: 'virtualization_get_resources',
  description: '获取token对应虚拟化实例的资源信息',
  groups: ['admin-only', 'virtualization-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
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
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取资源
      const resources = globalTokenVirtualizationManager.getResources(token);
      
      if (!resources) {
        return {
          content: [{ type: 'text', text: `错误: Token ${token.substring(0, 16)}... 没有虚拟化实例或实例未激活` }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ 虚拟化资源信息\n\nToken: ${token.substring(0, 16)}...\n资源: ${JSON.stringify(resources, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取虚拟化资源失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 设置虚拟化资源工具
 */
export const setVirtualizationResourcesTool: Tool = {
  name: 'virtualization_set_resources',
  description: '设置token对应虚拟化实例的资源',
  groups: ['admin-only', 'virtualization-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      resources: {
        type: 'object',
        description: '要设置的虚拟化资源'
      }
    },
    required: ['token', 'resources']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, resources } = args;
      
      if (!token || !resources) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和resources参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 设置资源
      const success = globalTokenVirtualizationManager.setResources(token, resources);
      
      if (!success) {
        return {
          content: [{ type: 'text', text: `错误: Token ${token.substring(0, 16)}... 没有虚拟化实例或实例未激活` }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ 虚拟化资源设置成功\n\nToken: ${token.substring(0, 16)}...\n资源: ${JSON.stringify(resources, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `设置虚拟化资源失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 清理token虚拟化工具
 */
export const cleanupVirtualizationTool: Tool = {
  name: 'virtualization_cleanup',
  description: '清理token的虚拟化资源（软清理，可恢复）',
  groups: ['admin-only', 'virtualization-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
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

      const success = await globalTokenVirtualizationManager.cleanupToken(token);

      if (!success) {
        return {
          content: [{ type: 'text', text: `错误: Token ${token.substring(0, 16)}... 没有虚拟化实例` }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ 虚拟化资源已清理\n\nToken: ${token.substring(0, 16)}...\n提示: 可使用virtualization_activate重新激活`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `清理虚拟化资源失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 删除token虚拟化工具
 */
export const deleteVirtualizationTool: Tool = {
  name: 'virtualization_delete',
  description: '完全删除token的虚拟化实例',
  groups: ['admin-only', 'virtualization-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
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

      const success = await globalTokenVirtualizationManager.deleteVirtualization(token);

      if (!success) {
        return {
          content: [{ type: 'text', text: `错误: Token ${token.substring(0, 16)}... 没有虚拟化实例` }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ 虚拟化实例已删除\n\nToken: ${token.substring(0, 16)}...\n提示: 此操作不可逆，需要重新创建`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `删除虚拟化实例失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 激活token虚拟化工具
 */
export const activateVirtualizationTool: Tool = {
  name: 'virtualization_activate',
  description: '激活已停用的token虚拟化实例',
  groups: ['admin-only', 'virtualization-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
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

      const success = globalTokenVirtualizationManager.activateVirtualization(token);

      if (!success) {
        return {
          content: [{ type: 'text', text: `错误: Token ${token.substring(0, 16)}... 没有虚拟化实例` }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ 虚拟化实例已激活\n\nToken: ${token.substring(0, 16)}...`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `激活虚拟化实例失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 虚拟化统计工具
 */
export const virtualizationStatsTool: Tool = {
  name: 'virtualization_stats',
  description: '获取虚拟化实例统计信息',
  groups: ['admin-only', 'virtualization-management'],
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const stats = globalTokenVirtualizationManager.getStats();
      const instances = globalTokenVirtualizationManager.listVirtualizations(true);

      const lines = [
        `总数: ${stats.total}`,
        `活跃: ${stats.active}`,
        `停用: ${stats.inactive}`,
        '',
        '实例列表:'
      ];

      instances.forEach(info => {
        const status = info.isActive ? '✓' : '✗';
        const tokenShort = info.token.substring(0, 8) + '...';
        const lastUsed = info.lastUsed || '未使用';
        lines.push(`  ${status} ${tokenShort} | 创建: ${info.createdAt} | 最后使用: ${lastUsed}`);
      });

      return {
        content: [
          {
            type: 'text',
            text: `📊 虚拟化统计信息\n\n${lines.join('\n')}`
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
 * 所有虚拟化管理工具
 */
export const virtualizationManagementTools: Tool[] = [
  getVirtualizationTool,
  executeVirtualizationTool,
  getVirtualizationResourcesTool,
  setVirtualizationResourcesTool,
  cleanupVirtualizationTool,
  deleteVirtualizationTool,
  activateVirtualizationTool,
  virtualizationStatsTool
];