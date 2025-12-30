/**
 * 执行器演示工具集
 * 
 * 这些工具展示了如何在MCP工具中调用执行器系统
 * 从MCP调用开始的完整流程验证
 */

import { Tool, ToolResult } from '../types.js';
import { UnifiedExecutorLayer } from '../core/executor/unified-executor-layer';
import { TokenRuleManager } from '../core/token/token-rule-manager';
import { FileRuleStorage } from '../core/storage/file-rule-storage';
import { FileSystemExecutorFactory } from '../executors/example/filesystem/factory';
import { NetworkExecutorFactory } from '../executors/example/network/factory';
import { SystemExecutorFactory } from '../executors/example/system/factory';
import { DefaultExecutorFactory } from '../executors/example/default/factory';

// 全局执行器实例（单例）
let unifiedExecutor: UnifiedExecutorLayer | null = null;

/**
 * 初始化执行器系统
 */
function getUnifiedExecutor(): UnifiedExecutorLayer {
  if (!unifiedExecutor) {
    unifiedExecutor = new UnifiedExecutorLayer('./data');
    
    // 注册所有执行器工厂
    const executorFactory = unifiedExecutor.getExecutorFactory();
    const ruleManager = unifiedExecutor.getRuleManager();
    
    executorFactory.register('filesystem', new FileSystemExecutorFactory(ruleManager));
    executorFactory.register('network', new NetworkExecutorFactory(ruleManager));
    executorFactory.register('system', new SystemExecutorFactory(ruleManager));
    executorFactory.register('default', new DefaultExecutorFactory(ruleManager));
  }
  return unifiedExecutor;
}

/**
 * 工具1: 文件读取工具（通过执行器）
 * 演示：使用Token规则控制文件读取权限
 */
export const executorFileReadTool: Tool = {
  name: 'executor_file_read',
  description: '通过执行器系统读取文件 - 支持Token规则控制',
  groups: ['public', 'executor-demo'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token（用于规则验证）'
      },
      path: {
        type: 'string',
        description: '文件路径'
      }
    },
    required: ['token', 'path']
  },
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const { token, path } = args;
      
      // 创建工具描述
      const tool: Tool = {
        name: 'file_read',
        description: '文件读取',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string' }
          },
          required: ['path']
        },
        executor: { type: 'filesystem' },
        execute: async (args: any): Promise<ToolResult> => {
          return {
            content: [{ type: 'text', text: `文件内容: ${args.path}` }]
          };
        }
      };
      
      // 通过执行器执行
      const executor = getUnifiedExecutor();
      const result = await executor.executeTool(tool, { path }, token);
      
      return result;
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `执行失败: ${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 工具2: HTTP请求工具（通过执行器）
 * 演示：使用Token规则控制网络请求
 */
export const executorHttpTool: Tool = {
  name: 'executor_http_request',
  description: '通过执行器系统发送HTTP请求 - 支持Token规则控制',
  groups: ['public', 'executor-demo'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token（用于规则验证）'
      },
      url: {
        type: 'string',
        description: '请求URL'
      },
      method: {
        type: 'string',
        description: '请求方法',
        enum: ['GET', 'POST'],
        default: 'GET'
      }
    },
    required: ['token', 'url']
  },
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const { token, url, method = 'GET' } = args;
      
      // 创建工具描述
      const tool: Tool = {
        name: 'http_request',
        description: 'HTTP请求',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            method: { type: 'string', enum: ['GET', 'POST'], default: 'GET' }
          },
          required: ['url']
        },
        executor: { type: 'network' },
        execute: async (args: any): Promise<ToolResult> => {
          return {
            content: [{ type: 'text', text: `HTTP ${args.method} 请求: ${args.url}` }]
          };
        }
      };
      
      // 通过执行器执行
      const executor = getUnifiedExecutor();
      const result = await executor.executeTool(tool, { url, method }, token);
      
      return result;
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `执行失败: ${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 工具3: 系统命令工具（通过执行器）
 * 演示：使用Token规则控制命令执行
 */
export const executorSystemTool: Tool = {
  name: 'executor_exec_command',
  description: '通过执行器系统执行命令 - 支持Token规则控制',
  groups: ['public', 'executor-demo'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token（用于规则验证）'
      },
      command: {
        type: 'string',
        description: '要执行的命令'
      }
    },
    required: ['token', 'command']
  },
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const { token, command } = args;
      
      // 创建工具描述
      const tool: Tool = {
        name: 'exec_command',
        description: '执行系统命令',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string' }
          },
          required: ['command']
        },
        executor: { type: 'system' },
        execute: async (args: any): Promise<ToolResult> => {
          return {
            content: [{ type: 'text', text: `命令执行: ${args.command}` }]
          };
        }
      };
      
      // 通过执行器执行
      const executor = getUnifiedExecutor();
      const result = await executor.executeTool(tool, { command }, token);
      
      return result;
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `执行失败: ${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 工具4: 设置执行器规则
 * 演示：动态配置Token的执行器规则
 */
export const setExecutorRuleTool: Tool = {
  name: 'set_executor_rule',
  description: '为Token设置执行器规则 - 控制各类操作的权限',
  groups: ['public', 'executor-demo'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      executorId: {
        type: 'string',
        description: '执行器类型',
        enum: ['filesystem', 'network', 'system', 'default']
      },
      autoApprove: {
        type: 'boolean',
        description: '是否自动审批'
      },
      maxFileSize: {
        type: 'number',
        description: '文件大小限制（字节）'
      },
      timeout: {
        type: 'number',
        description: '超时时间（毫秒）'
      },
      allowedCommands: {
        type: 'array',
        items: { type: 'string' },
        description: '允许的命令列表'
      },
      approver: {
        type: 'string',
        description: '需要审批时的审批人'
      }
    },
    required: ['token', 'executorId', 'autoApprove']
  },
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const { token, executorId, ...rules } = args;
      
      // 通过规则管理工具设置
      const executor = getUnifiedExecutor();
      const ruleManager = executor.getRuleManager();
      
      // 构建规则对象
      const ruleObj: any = { autoApprove: rules.autoApprove };
      if (rules.maxFileSize) ruleObj.maxFileSize = rules.maxFileSize;
      if (rules.timeout) ruleObj.timeout = rules.timeout;
      if (rules.allowedCommands) ruleObj.allowedCommands = rules.allowedCommands;
      if (rules.approver) ruleObj.approver = rules.approver;
      
      await ruleManager.setRules(token, executorId, ruleObj);
      
      return {
        content: [{
          type: 'text',
          text: `✅ 规则设置成功\n\nToken: ${token}\n执行器: ${executorId}\n规则: ${JSON.stringify(ruleObj, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `设置失败: ${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 工具5: 查看执行器规则
 * 演示：查看Token的所有执行器规则
 */
export const getExecutorRulesTool: Tool = {
  name: 'get_executor_rules',
  description: '查看Token的所有执行器规则',
  groups: ['public', 'executor-demo'],
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
      
      const executor = getUnifiedExecutor();
      const ruleManager = executor.getRuleManager();
      
      const rules = await ruleManager.getAllRules(token);
      
      return {
        content: [{
          type: 'text',
          text: `📊 Token规则详情\n\nToken: ${token}\n\n${JSON.stringify(rules, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `查询失败: ${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 工具6: 执行器系统状态
 * 演示：查看执行器系统状态和统计
 */
export const executorSystemStatusTool: Tool = {
  name: 'executor_system_status',
  description: '查看执行器系统状态和统计信息',
  groups: ['public', 'executor-demo'],
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (args: any): Promise<ToolResult> => {
    try {
      const executor = getUnifiedExecutor();
      const ruleManager = executor.getRuleManager();
      
      // 获取规则存储统计
      const fs = require('fs');
      let ruleCount = 0;
      let storageSize = 0;
      
      try {
        const data = fs.readFileSync('./data/rules.json', 'utf-8');
        const rules = JSON.parse(data);
        ruleCount = Object.keys(rules).length;
        storageSize = data.length;
      } catch (e) {
        // 文件不存在
      }
      
      const status = {
        system: '统一执行器层',
        version: '3.1.0',
        registeredExecutors: ['filesystem', 'network', 'system', 'default'],
        ruleCount: ruleCount,
        storageSize: storageSize,
        storagePath: './data/rules.json',
        status: '✅ 运行正常'
      };
      
      return {
        content: [{
          type: 'text',
          text: `🔧 执行器系统状态\n\n${JSON.stringify(status, null, 2)}\n\n提示:\n1. 使用 set_executor_rule 配置Token规则\n2. 使用 executor_* 工具测试执行器调用\n3. 规则会实时生效并持久化到文件`
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `状态查询失败: ${error.message}` }],
        isError: true
      };
    }
  }
};

/**
 * 所有执行器演示工具
 */
export const executorDemoTools: Tool[] = [
  executorFileReadTool,
  executorHttpTool,
  executorSystemTool,
  setExecutorRuleTool,
  getExecutorRulesTool,
  executorSystemStatusTool
];
