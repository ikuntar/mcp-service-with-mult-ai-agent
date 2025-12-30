/**
 * 用户空间管理工具
 * 
 * 提供通过token管理用户空间的功能
 */

import type { Tool, ToolResult } from '../types';
import { globalUserSpaceManager } from '../core/user-space/user-space';
import { globalTokenManager } from '../core/token/token-manager';
import type { ExecutorRules } from '../core/token/token-rule-manager';
import type { ContainerConfig } from '../core/container/enhanced-tool-container';

/**
 * 获取用户空间工具
 */
export const getUserSpaceTool: Tool = {
  name: 'userspace_get',
  description: '获取或创建用户空间（包含虚拟化、规则、可见性等所有资源）',
  groups: ['admin-only', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      role: {
        type: 'string',
        description: '用户角色（如果用户空间不存在，将使用此角色创建）'
      }
    },
    required: ['token', 'role']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, role } = args;
      
      if (!token || !role) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和role参数' }],
          isError: true
        };
      }

      // 验证token
      const tokenRole = globalTokenManager.validateToken(token);
      if (!tokenRole) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取或创建用户空间
      const userSpace = globalUserSpaceManager.getUserSpace(token, role);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 用户空间获取成功\n\nToken: ${token.substring(0, 16)}...\n角色: ${userSpace.role}\n状态: ${userSpace.isActive ? '活跃' : '非活跃'}\n创建时间: ${userSpace.createdAt}\n\n用户空间包含:\n• 虚拟化实例\n• 执行器规则 (${Object.keys(userSpace.executorRules).length}个)\n• 可见工具 (${userSpace.visibleTools.size}个)\n• 容器配置 (${userSpace.containerConfig ? '已设置' : '未设置'})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取用户空间失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 设置执行器规则工具
 */
export const setExecutorRulesTool: Tool = {
  name: 'userspace_set_rules',
  description: '为用户空间设置执行器规则',
  groups: ['admin-only', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      executorId: {
        type: 'string',
        description: '执行器ID'
      },
      rules: {
        type: 'object',
        description: '执行器规则对象',
        properties: {
          autoApprove: { type: 'boolean' },
          approver: { type: 'string' },
          maxFileSize: { type: 'number' },
          timeout: { type: 'number' },
          allowedDomains: { type: 'array', items: { type: 'string' } },
          allowedCommands: { type: 'array', items: { type: 'string' } },
          maxCalls: { type: 'number' }
        }
      }
    },
    required: ['token', 'executorId', 'rules']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, executorId, rules } = args;
      
      if (!token || !executorId || !rules) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token、executorId和rules参数' }],
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

      // 检查用户空间是否存在
      if (!globalUserSpaceManager.hasUserSpace(token)) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在，请先使用userspace_get创建` }],
          isError: true
        };
      }

      // 设置规则
      globalUserSpaceManager.setExecutorRules(token, executorId, rules as ExecutorRules);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 执行器规则设置成功\n\nToken: ${token.substring(0, 16)}...\n执行器: ${executorId}\n规则: ${JSON.stringify(rules, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `设置执行器规则失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 获取执行器规则工具
 */
export const getExecutorRulesTool: Tool = {
  name: 'userspace_get_rules',
  description: '获取用户空间的执行器规则',
  groups: ['admin-only', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      executorId: {
        type: 'string',
        description: '执行器ID（可选，不传则获取所有）'
      }
    },
    required: ['token']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, executorId } = args;
      
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

      // 获取规则
      let rules;
      if (executorId) {
        rules = globalUserSpaceManager.getExecutorRules(token, executorId);
        if (!rules) {
          return {
            content: [{ type: 'text', text: `未找到执行器 ${executorId} 的规则` }],
            isError: true
          };
        }
      } else {
        rules = globalUserSpaceManager.getAllExecutorRules(token);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 执行器规则\n\nToken: ${token.substring(0, 16)}...\n规则: ${JSON.stringify(rules, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取执行器规则失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 设置可见工具工具
 */
export const setVisibleToolsTool: Tool = {
  name: 'userspace_set_visible_tools',
  description: '设置用户空间的可见工具列表',
  groups: ['admin-only', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      toolNames: {
        type: 'array',
        items: { type: 'string' },
        description: '工具名称列表'
      }
    },
    required: ['token', 'toolNames']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, toolNames } = args;
      
      if (!token || !toolNames) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和toolNames参数' }],
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

      // 检查用户空间是否存在
      if (!globalUserSpaceManager.hasUserSpace(token)) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在，请先使用userspace_get创建` }],
          isError: true
        };
      }

      // 设置可见工具
      globalUserSpaceManager.setVisibleTools(token, toolNames);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 可见工具设置成功\n\nToken: ${token.substring(0, 16)}...\n可见工具: ${toolNames.join(', ') || '无'}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `设置可见工具失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 检查工具可见性工具
 */
export const checkToolVisibilityTool: Tool = {
  name: 'userspace_check_visibility',
  description: '检查工具对用户是否可见',
  groups: ['admin-only', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      toolName: {
        type: 'string',
        description: '工具名称'
      }
    },
    required: ['token', 'toolName']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, toolName } = args;
      
      if (!token || !toolName) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和toolName参数' }],
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

      // 检查可见性
      const isVisible = globalUserSpaceManager.isToolVisible(token, toolName);
      
      return {
        content: [
          {
            type: 'text',
            text: `🔍 工具可见性检查\n\nToken: ${token.substring(0, 16)}...\n工具: ${toolName}\n可见性: ${isVisible ? '✅ 可见' : '❌ 不可见'}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `检查工具可见性失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 虚拟化操作工具
 */
export const executeVirtualizationTool: Tool = {
  name: 'userspace_execute_virtualization',
  description: '执行用户空间的虚拟化操作',
  groups: ['admin-only', 'userspace-management'],
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
        description: '操作参数'
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

      // 检查用户空间是否存在
      if (!globalUserSpaceManager.hasUserSpace(token)) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在，请先使用userspace_get创建` }],
          isError: true
        };
      }

      // 执行虚拟化操作
      const result = await globalUserSpaceManager.executeVirtualization(token, action, actionArgs);
      
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
  name: 'userspace_get_virtualization_resources',
  description: '获取用户空间的虚拟化资源',
  groups: ['admin-only', 'userspace-management'],
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

      // 获取虚拟化资源
      const resources = globalUserSpaceManager.getVirtualizationResources(token);
      
      if (!resources) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在或未激活` }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `📊 虚拟化资源\n\nToken: ${token.substring(0, 16)}...\n资源: ${JSON.stringify(resources, null, 2)}`
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
  name: 'userspace_set_virtualization_resources',
  description: '设置用户空间的虚拟化资源',
  groups: ['admin-only', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      resources: {
        type: 'object',
        description: '虚拟化资源对象'
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

      // 检查用户空间是否存在
      if (!globalUserSpaceManager.hasUserSpace(token)) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在，请先使用userspace_get创建` }],
          isError: true
        };
      }

      // 设置虚拟化资源
      globalUserSpaceManager.setVirtualizationResources(token, resources);
      
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
 * 设置容器配置工具
 */
export const setContainerConfigTool: Tool = {
  name: 'userspace_set_container_config',
  description: '设置用户空间的容器配置',
  groups: ['admin-only', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      config: {
        type: 'object',
        description: '容器配置对象',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          defaultRole: { type: 'string' },
          roles: { type: 'object' }
        }
      }
    },
    required: ['token', 'config']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, config } = args;
      
      if (!token || !config) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和config参数' }],
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

      // 检查用户空间是否存在
      if (!globalUserSpaceManager.hasUserSpace(token)) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在，请先使用userspace_get创建` }],
          isError: true
        };
      }

      // 设置容器配置
      globalUserSpaceManager.setContainerConfig(token, config as ContainerConfig);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 容器配置设置成功\n\nToken: ${token.substring(0, 16)}...\n配置: ${JSON.stringify(config, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `设置容器配置失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 用户空间统计工具
 */
export const userSpaceStatsTool: Tool = {
  name: 'userspace_stats',
  description: '获取用户空间统计信息',
  groups: ['admin-only', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const stats = globalUserSpaceManager.getStats();
      const spaces = globalUserSpaceManager.listUserSpaces(true);

      const lines = [
        `总数: ${stats.total}`,
        `活跃: ${stats.active}`,
        `停用: ${stats.inactive}`,
        '',
        '角色分布:'
      ];

      for (const [role, count] of Object.entries(stats.byRole)) {
        lines.push(`  ${role}: ${count}`);
      }

      lines.push('', '用户空间列表:');

      spaces.forEach(space => {
        const status = space.isActive ? '✓' : '✗';
        const tokenShort = space.token.substring(0, 8) + '...';
        const lastUsed = space.lastUsed || '未使用';
        const rulesCount = Object.keys(space.executorRules).length;
        const toolsCount = space.visibleTools.size;
        
        lines.push(`  ${status} ${tokenShort} | 角色: ${space.role} | 规则: ${rulesCount} | 工具: ${toolsCount} | 最后使用: ${lastUsed}`);
      });

      return {
        content: [
          {
            type: 'text',
            text: `📊 用户空间统计信息\n\n${lines.join('\n')}`
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
 * 清理用户空间工具
 */
export const cleanupUserSpaceTool: Tool = {
  name: 'userspace_cleanup',
  description: '清理用户空间资源（软清理，可恢复）',
  groups: ['admin-only', 'userspace-management'],
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

      const success = await globalUserSpaceManager.cleanupUserSpace(token);

      if (!success) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在` }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ 用户空间资源已清理\n\nToken: ${token.substring(0, 16)}...\n提示: 可使用userspace_activate重新激活`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `清理用户空间失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 删除用户空间工具
 */
export const deleteUserSpaceTool: Tool = {
  name: 'userspace_delete',
  description: '完全删除用户空间',
  groups: ['admin-only', 'userspace-management'],
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

      const success = await globalUserSpaceManager.deleteUserSpace(token);

      if (!success) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在` }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ 用户空间已删除\n\nToken: ${token.substring(0, 16)}...\n提示: 此操作不可逆，需要重新创建`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `删除用户空间失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 激活用户空间工具
 */
export const activateUserSpaceTool: Tool = {
  name: 'userspace_activate',
  description: '激活已停用的用户空间',
  groups: ['admin-only', 'userspace-management'],
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

      const success = globalUserSpaceManager.activateUserSpace(token);

      if (!success) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在` }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ 用户空间已激活\n\nToken: ${token.substring(0, 16)}...`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `激活用户空间失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 更新用户角色工具
 */
export const updateUserRoleTool: Tool = {
  name: 'userspace_update_role',
  description: '更新用户空间的角色',
  groups: ['admin-only', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      newRole: {
        type: 'string',
        description: '新角色名称'
      }
    },
    required: ['token', 'newRole']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, newRole } = args;
      
      if (!token || !newRole) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和newRole参数' }],
          isError: true
        };
      }

      // 验证token
      const currentRole = globalTokenManager.validateToken(token);
      if (!currentRole) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 检查用户空间是否存在
      if (!globalUserSpaceManager.hasUserSpace(token)) {
        return {
          content: [{ type: 'text', text: `错误: 用户空间不存在，请先使用userspace_get创建` }],
          isError: true
        };
      }

      // 更新角色
      globalUserSpaceManager.updateUserRole(token, newRole);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 用户角色更新成功\n\nToken: ${token.substring(0, 16)}...\n原角色: ${currentRole}\n新角色: ${newRole}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `更新用户角色失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 所有用户空间管理工具
 */
export const userSpaceManagementTools: Tool[] = [
  getUserSpaceTool,
  setExecutorRulesTool,
  getExecutorRulesTool,
  setVisibleToolsTool,
  checkToolVisibilityTool,
  executeVirtualizationTool,
  getVirtualizationResourcesTool,
  setVirtualizationResourcesTool,
  setContainerConfigTool,
  userSpaceStatsTool,
  cleanupUserSpaceTool,
  deleteUserSpaceTool,
  activateUserSpaceTool,
  updateUserRoleTool
];