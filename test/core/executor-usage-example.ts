/**
 * 执行器层使用示例
 * 
 * 展示如何使用统一执行器层
 */

import type { Tool, ToolResult } from '../../src/types';
import { UnifiedExecutorLayer, createExecutorConfig } from '../../src/core/unified-executor-layer';
import { ExecutorEnhancedContainer, integrateExecutorLayer, createToolWithExecutor } from '../../src/core/container-integration';
import { EnhancedToolContainer } from '../../src/core/enhanced-tool-container';

// ==================== 示例工具定义 ====================

/**
 * 示例1：简单工具（无执行器配置）
 */
const echoTool: Tool = {
  name: 'echo',
  description: '回显消息',
  groups: ['public', 'basic'],
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  },
  execute: async (args: any): Promise<ToolResult> => {
    return {
      content: [{ type: 'text', text: `Echo: ${args.message}` }]
    };
  }
};

/**
 * 示例2：文件操作工具（需要隔离执行）
 */
const fileReadTool: Tool = {
  name: 'file_read',
  description: '读取文件内容',
  groups: ['public', 'file-io'],
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件路径' }
    },
    required: ['path']
  },
  executor: {
    type: 'isolated',
    timeout: 10000,
    memory: 256
  },
  execute: async (args: any): Promise<ToolResult> => {
    // 模拟文件系统调用（实际会经过执行器层控制）
    console.log(`[系统调用] 读取文件: ${args.path}`);
    return {
      content: [{ type: 'text', text: `文件内容: ${args.path}` }]
    };
  }
};

/**
 * 示例3：网络请求工具（需要异步执行）
 */
const httpTool: Tool = {
  name: 'http_request',
  description: '发送HTTP请求',
  groups: ['public', 'network'],
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
      headers: { type: 'object' },
      body: { type: 'string' }
    },
    required: ['url']
  },
  executor: {
    type: 'async',
    timeout: 30000,
    network: true
  },
  execute: async (args: any): Promise<ToolResult> => {
    // 模拟网络调用（实际会经过执行器层控制）
    console.log(`[系统调用] HTTP ${args.method || 'GET'} ${args.url}`);
    return {
      content: [{ type: 'text', text: `响应: ${args.method || 'GET'} ${args.url}` }]
    };
  }
};

/**
 * 示例4：计算密集型工具（需要沙箱执行）
 */
const computeTool: Tool = {
  name: 'compute',
  description: '复杂计算',
  groups: ['public', 'compute'],
  inputSchema: {
    type: 'object',
    properties: {
      data: { type: 'array', items: { type: 'number' } }
    },
    required: ['data']
  },
  executor: {
    type: 'sandbox',
    timeout: 60000,
    memory: 512
  },
  execute: async (args: any): Promise<ToolResult> => {
    // 模拟CPU密集型计算（实际会经过执行器层控制）
    console.log(`[系统调用] CPU计算，数据量: ${args.data?.length || 0}`);
    const sum = (args.data || []).reduce((a: number, b: number) => a + b, 0);
    return {
      content: [{ type: 'text', text: `计算结果: ${sum}` }]
    };
  }
};

// ==================== 使用示例 ====================

/**
 * 示例1：直接使用统一执行器层
 */
async function example1_directExecutor(): Promise<void> {
  console.log('\n📌 示例1：直接使用统一执行器层');
  
  const executor = new UnifiedExecutorLayer();
  
  // 执行简单工具
  const result1 = await executor.executeTool(echoTool, { message: 'Hello World' });
  console.log('结果:', result1.content[0].text);
  
  // 执行带配置的工具
  const result2 = await executor.executeTool(fileReadTool, { path: '/etc/config.json' });
  console.log('结果:', result2.content[0].text);
  
  // 自定义配置执行
  const result3 = await executor.executeTool(
    httpTool,
    { url: 'https://api.example.com/data', method: 'POST' },
    { timeout: 5000 }  // 覆盖默认超时
  );
  console.log('结果:', result3.content[0].text);
}

/**
 * 示例2：通过容器集成执行器
 */
async function example2_containerIntegration(): Promise<void> {
  console.log('\n📌 示例2：通过容器集成执行器');
  
  // 创建容器配置
  const config = {
    name: '业务工具集',
    defaultRole: 'user',
    roles: {
      user: {
        name: '普通用户',
        allowedGroups: ['public', 'basic', 'file-io']
      },
      admin: {
        name: '管理员',
        allowedGroups: ['*']
      }
    }
  };
  
  // 创建增强容器
  const container = new EnhancedToolContainer('业务工具集', 'business', config);
  container.register(echoTool);
  container.register(fileReadTool);
  container.register(httpTool);
  container.register(computeTool);
  
  // 集成执行器层
  const executorContainer = integrateExecutorLayer(container);
  
  // 用户执行可见工具
  console.log('用户执行:');
  const result1 = await executorContainer.executeWithRole('user', 'echo', { message: '测试' });
  console.log('  -', result1.content[0].text);
  
  const result2 = await executorContainer.executeWithRole('user', 'file_read', { path: '/user/data.txt' });
  console.log('  -', result2.content[0].text);
  
  // 管理员执行所有工具
  console.log('管理员执行:');
  const result3 = await executorContainer.executeWithRole('admin', 'compute', { data: [1, 2, 3, 4, 5] });
  console.log('  -', result3.content[0].text);
}

/**
 * 示例3：使用工具工厂函数
 */
async function example3_toolFactory(): Promise<void> {
  console.log('\n📌 示例3：使用工具工厂函数');
  
  // 使用工厂函数创建带执行器配置的工具
  const dbTool = createToolWithExecutor(
    'database_query',
    '数据库查询',
    async (args: any): Promise<ToolResult> => {
      console.log(`[系统调用] 数据库查询: ${args.query}`);
      return {
        content: [{ type: 'text', text: `查询结果: ${args.query}` }]
      };
    },
    ['public', 'database'],
    { type: 'isolated', timeout: 15000, memory: 128 }
  );
  
  const executor = new UnifiedExecutorLayer();
  const result = await executor.executeTool(dbTool, { query: 'SELECT * FROM users' });
  console.log('数据库查询结果:', result.content[0].text);
}

/**
 * 示例4：批量执行演示
 */
async function example4_batchExecution(): Promise<void> {
  console.log('\n📌 示例4：批量执行演示');
  
  const executor = new UnifiedExecutorLayer();
  
  // 定义多个任务
  const tasks = [
    { tool: echoTool, args: { message: '任务1' } },
    { tool: fileReadTool, args: { path: '/file1.txt' } },
    { tool: echoTool, args: { message: '任务2' } },
    { tool: fileReadTool, args: { path: '/file2.txt' } }
  ];
  
  console.log('批量执行开始...');
  const results = [];
  
  for (const task of tasks) {
    const result = await executor.executeTool(task.tool, task.args);
    results.push(result);
    console.log(`  ${task.tool.name}: ${result.content[0].text}`);
  }
  
  console.log(`批量执行完成，共 ${results.length} 个任务`);
}

/**
 * 示例5：配置管理
 */
async function example5_configManagement(): Promise<void> {
  console.log('\n📌 示例5：配置管理');
  
  const executor = new UnifiedExecutorLayer();
  
  // 查看默认配置
  console.log('默认配置:', executor.getDefaultConfig());
  
  // 设置新的默认配置
  executor.setDefaultConfig({
    type: 'async',
    timeout: 60000,
    async: true
  });
  
  console.log('更新后默认配置:', executor.getDefaultConfig());
  
  // 使用新配置执行
  const result = await executor.executeTool(echoTool, { message: '使用新配置' });
  console.log('执行结果:', result.content[0].text);
}

/**
 * 运行所有示例
 */
export async function runAllExamples(): Promise<void> {
  console.log('='.repeat(60));
  console.log('🚀 统一执行器层使用示例');
  console.log('='.repeat(60));
  
  try {
    await example1_directExecutor();
    await example2_containerIntegration();
    await example3_toolFactory();
    await example4_batchExecution();
    await example5_configManagement();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有示例运行完成！');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ 示例运行失败:', error);
  }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
  runAllExamples();
}