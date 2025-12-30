/**
 * 执行器框架测试
 */

import type { Tool, ToolResult } from '../../src/types';
import { UnifiedExecutorLayer, createExecutorConfig } from '../../src/core/unified-executor-layer';
import { ExecutorEnhancedContainer, integrateExecutorLayer } from '../../src/core/container-integration';
import { EnhancedToolContainer } from '../../src/core/enhanced-tool-container';

// 测试工具1：简单计算工具
const addTool: Tool = {
  name: 'add',
  description: '加法计算',
  groups: ['public', 'basic'],
  inputSchema: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  },
  execute: async (args: any): Promise<ToolResult> => {
    console.log('[addTool] 执行加法计算:', args);
    const result = args.a + args.b;
    return {
      content: [{ type: 'text', text: `${result}` }]
    };
  }
};

// 测试工具2：带执行器配置的文件读取工具
const fileReadTool: Tool = {
  name: 'file_read',
  description: '读取文件',
  groups: ['public', 'file-io'],
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  executor: {
    type: 'isolated',
    timeout: 10000,
    memory: 256
  },
  execute: async (args: any): Promise<ToolResult> => {
    console.log('[fileReadTool] 读取文件:', args.path);
    // 模拟文件读取
    return {
      content: [{ type: 'text', text: `文件内容: ${args.path}` }]
    };
  }
};

// 测试工具3：网络请求工具
const httpTool: Tool = {
  name: 'http_request',
  description: 'HTTP请求',
  groups: ['public', 'network'],
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      method: { type: 'string' }
    },
    required: ['url']
  },
  executor: {
    type: 'async',
    timeout: 30000,
    network: true
  },
  execute: async (args: any): Promise<ToolResult> => {
    console.log('[httpTool] 发送HTTP请求:', args);
    // 模拟网络请求
    return {
      content: [{ type: 'text', text: `响应: ${args.method || 'GET'} ${args.url}` }]
    };
  }
};

/**
 * 测试1：基础执行器层
 */
async function testBasicExecutor(): Promise<void> {
  console.log('\n=== 测试1：基础执行器层 ===');
  
  const executor = new UnifiedExecutorLayer();
  
  // 测试简单工具
  const result1 = await executor.executeTool(addTool, { a: 5, b: 3 });
  console.log('加法结果:', result1.content[0].text);
  
  // 测试带配置的工具
  const result2 = await executor.executeTool(fileReadTool, { path: '/test.txt' });
  console.log('文件读取结果:', result2.content[0].text);
  
  // 测试自定义配置
  const result3 = await executor.executeTool(
    httpTool, 
    { url: 'https://example.com', method: 'POST' },
    { timeout: 5000 }
  );
  console.log('HTTP请求结果:', result3.content[0].text);
}

/**
 * 测试2：容器集成执行器
 */
async function testContainerIntegration(): Promise<void> {
  console.log('\n=== 测试2：容器集成执行器 ===');
  
  // 创建容器配置
  const config = {
    name: '测试容器',
    defaultRole: 'user',
    roles: {
      user: {
        name: '用户',
        allowedGroups: ['public', 'basic', 'file-io']
      },
      admin: {
        name: '管理员',
        allowedGroups: ['*']
      }
    }
  };
  
  // 创建增强容器
  const container = new EnhancedToolContainer('测试容器', 'test', config);
  container.register(addTool);
  container.register(fileReadTool);
  container.register(httpTool);
  
  // 集成执行器层
  const executorContainer = integrateExecutorLayer(container);
  
  // 测试用户权限执行
  const result1 = await executorContainer.executeWithRole('user', 'add', { a: 10, b: 20 });
  console.log('用户执行加法:', result1.content[0].text);
  
  // 测试文件读取（带执行器配置）
  const result2 = await executorContainer.executeWithRole('user', 'file_read', { path: '/config.json' });
  console.log('用户读取文件:', result2.content[0].text);
  
  // 测试管理员权限
  const result3 = await executorContainer.executeWithRole('admin', 'http_request', { url: 'https://api.example.com' });
  console.log('管理员HTTP请求:', result3.content[0].text);
}

/**
 * 测试3：执行器配置演示
 */
async function testExecutorConfig(): Promise<void> {
  console.log('\n=== 测试3：执行器配置演示 ===');
  
  // 创建带不同执行器配置的工具
  const tools: Tool[] = [
    {
      name: 'basic_tool',
      description: '基础工具',
      groups: ['public'],
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({ content: [{ type: 'text', text: '基础执行' }] })
    },
    {
      name: 'isolated_tool',
      description: '隔离工具',
      groups: ['public'],
      inputSchema: { type: 'object', properties: {} },
      executor: { type: 'isolated', timeout: 5000 },
      execute: async () => ({ content: [{ type: 'text', text: '隔离执行' }] })
    },
    {
      name: 'async_tool',
      description: '异步工具',
      groups: ['public'],
      inputSchema: { type: 'object', properties: {} },
      executor: { type: 'async', timeout: 10000, async: true },
      execute: async () => ({ content: [{ type: 'text', text: '异步执行' }] })
    }
  ];
  
  const executor = new UnifiedExecutorLayer();
  
  for (const tool of tools) {
    const result = await executor.executeTool(tool, {});
    console.log(`${tool.name}: ${result.content[0].text}`);
  }
}

/**
 * 运行所有测试
 */
export async function runExecutorTests(): Promise<void> {
  try {
    await testBasicExecutor();
    await testContainerIntegration();
    await testExecutorConfig();
    
    console.log('\n✅ 所有测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runExecutorTests();
}