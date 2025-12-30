/**
 * 高级示例：执行器集成
 * 展示如何将执行器框架集成到工具中
 */

import { Tool, ToolResult } from '../../src/types';
import { UnifiedExecutorLayer } from '../../src/core/unified-executor-layer';
import { TokenRuleManager } from '../../src/core/token-rule-manager';
import { FileRuleStorage } from '../../src/core/storage/file-rule-storage';

/**
 * 示例1：带执行器配置的工具
 * 展示如何在工具定义中指定执行器配置
 */
export const secureFileTool: Tool = {
  name: 'secure_file_operation',
  description: '安全的文件操作（需要隔离执行）',
  groups: ['sensitive', 'file-io'],
  executor: {
    timeout: 15000,
    needAuth: true,
    metadata: {
      operation: 'file-io',
      riskLevel: 'high'
    }
  },
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'delete'],
        description: '文件操作类型'
      },
      path: {
        type: 'string',
        description: '文件路径'
      },
      content: {
        type: 'string',
        description: '文件内容（写入时需要）'
      }
    },
    required: ['operation', 'path']
  },
  execute: async (args: { operation: string; path: string; content?: string }): Promise<ToolResult> => {
    // 模拟安全的文件操作
    // 在实际应用中，这里会通过执行器层进行安全控制
    
    let result = '';
    switch (args.operation) {
      case 'read':
        result = `读取文件: ${args.path}\n模拟内容: 安全读取的数据`;
        break;
      case 'write':
        result = `写入文件: ${args.path}\n内容: ${args.content || '空内容'}`;
        break;
      case 'delete':
        result = `删除文件: ${args.path}\n状态: 已安全删除`;
        break;
      default:
        return {
          content: [{ type: 'text', text: `不支持的操作: ${args.operation}` }],
          isError: true
        };
    }

    return {
      content: [{ type: 'text', text: result }]
    };
  }
};

/**
 * 示例2：网络请求工具
 * 展示异步执行器的使用
 */
export const httpTool: Tool = {
  name: 'http_request',
  description: '发送HTTP请求',
  groups: ['advanced', 'network'],
  executor: {
    timeout: 30000,
    needAuth: true,
    metadata: {
      operation: 'network',
      protocol: 'http'
    }
  },
  inputSchema: {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        default: 'GET'
      },
      url: {
        type: 'string',
        description: '请求URL'
      },
      headers: {
        type: 'object',
        description: '请求头'
      },
      body: {
        type: 'object',
        description: '请求体'
      }
    },
    required: ['url']
  },
  execute: async (args: { 
    method?: string; 
    url: string; 
    headers?: Record<string, string>; 
    body?: any 
  }): Promise<ToolResult> => {
    // 模拟HTTP请求
    return {
      content: [
        {
          type: 'text',
          text: `模拟 ${args.method || 'GET'} 请求到 ${args.url}\n状态: 200 OK\n响应: { "data": "模拟响应数据" }`
        }
      ]
    };
  }
};

/**
 * 示例3：系统命令执行工具
 * 展示系统执行器的使用
 */
export const systemCommandTool: Tool = {
  name: 'exec_command',
  description: '执行系统命令（需要严格控制）',
  groups: ['admin'],
  executor: {
    timeout: 60000,
    needAuth: true,
    metadata: {
      operation: 'system',
      privileged: true
    }
  },
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: '要执行的命令'
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: '命令参数'
      }
    },
    required: ['command']
  },
  execute: async (args: { command: string; args?: string[] }): Promise<ToolResult> => {
    // 模拟系统命令执行
    const fullCommand = `${args.command} ${args.args?.join(' ') || ''}`.trim();
    
    return {
      content: [
        {
          type: 'text',
          text: `模拟执行系统命令: ${fullCommand}\n输出: 命令执行完成\n返回码: 0`
        }
      ]
    };
  }
};

/**
 * 示例4：使用执行器层的完整流程
 * 展示如何直接使用UnifiedExecutorLayer
 */
export async function demonstrateExecutorLayer() {
  console.log('🚀 演示执行器层使用\n');
  
  // 1. 创建执行器层实例
  const ruleStorage = new FileRuleStorage('./data/rules.json');
  const ruleManager = new TokenRuleManager(ruleStorage);
  const executorLayer = new UnifiedExecutorLayer('./data');
  
  // 2. 创建测试工具
  const testTool: Tool = {
    name: 'test_executor',
    description: '测试执行器功能',
    groups: ['public'],
    executor: {
      timeout: 5000,
      needAuth: false
    },
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    },
    execute: async (args: { message: string }): Promise<ToolResult> => {
      return {
        content: [{ type: 'text', text: `执行器测试: ${args.message}` }]
      };
    }
  };
  
  // 3. 执行工具
  try {
    const result = await executorLayer.executeTool(
      testTool,
      { message: 'Hello from executor layer!' },
      'test-token'
    );
    
    console.log('✅ 执行结果:', result);
    return result;
  } catch (error) {
    console.error('❌ 执行失败:', error);
    throw error;
  }
}

/**
 * 示例5：高级权限控制工具
 * 结合Token和执行器的完整权限控制
 */
export const adminTool: Tool = {
  name: 'admin_operation',
  description: '管理员操作（最高权限）',
  groups: ['admin-only', 'sensitive'],
  executor: {
    timeout: 120000, // 2分钟超时
    needAuth: true,
    metadata: {
      operation: 'admin',
      privileged: true,
      audit: true // 需要审计
    }
  },
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['restart', 'config-update', 'user-management'],
        description: '管理员操作类型'
      },
      parameters: {
        type: 'object',
        description: '操作参数'
      }
    },
    required: ['action']
  },
  execute: async (args: { action: string; parameters?: any }): Promise<ToolResult> => {
    // 模拟管理员操作
    const timestamp = new Date().toISOString();
    
    return {
      content: [
        {
          type: 'text',
          text: `管理员操作: ${args.action}\n参数: ${JSON.stringify(args.parameters || {})}\n时间: ${timestamp}\n状态: 成功`
        }
      ],
      _meta: {
        progressToken: `audit-${Date.now()}`,
        // 注意：_meta 的标准字段只有 progressToken
        // 审计信息可以通过其他方式传递
      }
    };
  }
};

/**
 * 工具注册函数
 * 将高级工具注册到容器
 */
export function registerAdvancedTools(container: any) {
  container.register(secureFileTool);
  container.register(httpTool);
  container.register(systemCommandTool);
  container.register(adminTool);
  
  console.log('✅ 高级工具已注册');
}

/**
 * 使用示例总结
 * 
 * 这个文件展示了：
 * 1. 如何为工具配置执行器参数
 * 2. 不同类型执行器的使用场景
 * 3. 如何直接使用UnifiedExecutorLayer
 * 4. 高级权限控制的实现
 * 5. 审计和元数据跟踪
 * 
 * 推荐学习路径：
 * 1. 先阅读 docs/07_执行器框架使用指南.md
 * 2. 运行 examples/basic/simple-tool.ts
 * 3. 研究 examples/executors/ 中的实现
 * 4. 尝试这个高级示例
 */