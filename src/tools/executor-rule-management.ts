/**
 * 执行器规则管理工具
 * 提供MCP工具用于动态管理Token的执行器规则
 */

import { Tool, ToolResult } from '../types';
import { TokenRuleManager, ExecutorRules } from '../core/token/token-rule-manager';

// 获取规则管理器实例（需要在应用启动时初始化）
let ruleManager: TokenRuleManager;

export function setRuleManager(manager: TokenRuleManager): void {
  ruleManager = manager;
}

/**
 * 设置执行器规则
 */
const setExecutorRuleTool: Tool = {
  name: 'set_executor_rule',
  description: '为Token设置执行器规则。一个Token可以对多个执行器设置不同的规则。',
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      executorId: {
        type: 'string',
        description: '执行器ID（filesystem/network/system/default）',
        enum: ['filesystem', 'network', 'system', 'default']
      },
      rules: {
        type: 'object',
        description: '规则配置',
        properties: {
          autoApprove: {
            type: 'boolean',
            description: '是否自动审批'
          },
          approver: {
            type: 'string',
            description: '需要审批时的审批人'
          },
          maxFileSize: {
            type: 'number',
            description: '最大文件大小（字节）'
          },
          timeout: {
            type: 'number',
            description: '超时时间（毫秒）'
          },
          allowedDomains: {
            type: 'array',
            items: { type: 'string' },
            description: '允许的域名列表'
          },
          allowedCommands: {
            type: 'array',
            items: { type: 'string' },
            description: '允许的命令列表'
          },
          maxCalls: {
            type: 'number',
            description: '最大调用次数'
          }
        },
        required: ['autoApprove']
      }
    },
    required: ['token', 'executorId', 'rules']
  },
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const { token, executorId, rules } = args;
      
      if (!ruleManager) {
        return {
          content: [{ type: 'text', text: '错误：规则管理器未初始化' }],
          isError: true
        };
      }

      // 验证参数
      if (!token || !executorId || !rules) {
        return {
          content: [{ type: 'text', text: '错误：缺少必要参数' }],
          isError: true
        };
      }

      // 保存规则
      await ruleManager.setRules(token, executorId, rules);

      return {
        content: [{
          type: 'text',
          text: `成功设置规则\nToken: ${token}\n执行器: ${executorId}\n规则: ${JSON.stringify(rules, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `设置规则失败：${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 获取执行器规则
 */
const getExecutorRulesTool: Tool = {
  name: 'get_executor_rules',
  description: '查看Token的所有执行器规则',
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
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const { token } = args;

      if (!ruleManager) {
        return {
          content: [{ type: 'text', text: '错误：规则管理器未初始化' }],
          isError: true
        };
      }

      if (!token) {
        return {
          content: [{ type: 'text', text: '错误：缺少token参数' }],
          isError: true
        };
      }

      const allRules = await ruleManager.getAllRules(token);

      return {
        content: [{
          type: 'text',
          text: `Token: ${token}\n所有规则:\n${JSON.stringify(allRules, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `获取规则失败：${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 删除执行器规则
 */
const deleteExecutorRuleTool: Tool = {
  name: 'delete_executor_rule',
  description: '删除Token对某个执行器的规则',
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      executorId: {
        type: 'string',
        description: '执行器ID',
        enum: ['filesystem', 'network', 'system', 'default']
      }
    },
    required: ['token', 'executorId']
  },
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const { token, executorId } = args;

      if (!ruleManager) {
        return {
          content: [{ type: 'text', text: '错误：规则管理器未初始化' }],
          isError: true
        };
      }

      if (!token || !executorId) {
        return {
          content: [{ type: 'text', text: '错误：缺少参数' }],
          isError: true
        };
      }

      await ruleManager.deleteRule(token, executorId);

      return {
        content: [{
          type: 'text',
          text: `成功删除规则\nToken: ${token}\n执行器: ${executorId}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `删除规则失败：${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 设置默认规则
 */
const setDefaultRuleTool: Tool = {
  name: 'set_default_rule',
  description: '设置执行器的默认规则（对所有未设置特定规则的Token生效）',
  inputSchema: {
    type: 'object',
    properties: {
      executorId: {
        type: 'string',
        description: '执行器ID',
        enum: ['filesystem', 'network', 'system', 'default']
      },
      rules: {
        type: 'object',
        description: '默认规则配置',
        properties: {
          autoApprove: { type: 'boolean' },
          approver: { type: 'string' },
          maxFileSize: { type: 'number' },
          timeout: { type: 'number' },
          allowedDomains: { type: 'array', items: { type: 'string' } },
          allowedCommands: { type: 'array', items: { type: 'string' } },
          maxCalls: { type: 'number' }
        },
        required: ['autoApprove']
      }
    },
    required: ['executorId', 'rules']
  },
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const { executorId, rules } = args;

      if (!ruleManager) {
        return {
          content: [{ type: 'text', text: '错误：规则管理器未初始化' }],
          isError: true
        };
      }

      if (!executorId || !rules) {
        return {
          content: [{ type: 'text', text: '错误：缺少参数' }],
          isError: true
        };
      }

      await ruleManager.setDefaultRule(executorId, rules);

      return {
        content: [{
          type: 'text',
          text: `成功设置默认规则\n执行器: ${executorId}\n规则: ${JSON.stringify(rules, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `设置默认规则失败：${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 获取默认规则
 */
const getDefaultRuleTool: Tool = {
  name: 'get_default_rule',
  description: '查看执行器的默认规则',
  inputSchema: {
    type: 'object',
    properties: {
      executorId: {
        type: 'string',
        description: '执行器ID',
        enum: ['filesystem', 'network', 'system', 'default']
      }
    },
    required: ['executorId']
  },
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const { executorId } = args;

      if (!ruleManager) {
        return {
          content: [{ type: 'text', text: '错误：规则管理器未初始化' }],
          isError: true
        };
      }

      if (!executorId) {
        return {
          content: [{ type: 'text', text: '错误：缺少executorId参数' }],
          isError: true
        };
      }

      const defaultRule = await ruleManager.getDefaultRule(executorId);

      return {
        content: [{
          type: 'text',
          text: `执行器: ${executorId}\n默认规则:\n${JSON.stringify(defaultRule, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `获取默认规则失败：${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 导出所有规则管理工具
 */
export const ruleManagementTools: Tool[] = [
  setExecutorRuleTool,
  getExecutorRulesTool,
  deleteExecutorRuleTool,
  setDefaultRuleTool,
  getDefaultRuleTool
];
