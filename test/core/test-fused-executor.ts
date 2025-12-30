/**
 * 融合执行器框架测试
 */

import type { Tool, ToolResult } from '../../src/types';
import { 
  UnifiedExecutorLayer, 
  TokenValidatorFactory,
  ExecutorError
} from '../../src/core/unified-executor-layer';

import { 
  integrateExecutorLayer,
  createToolWithExecutor
} from '../../src/core/container-integration';

import { EnhancedToolContainer } from '../../src/core/enhanced-tool-container';

// 测试工具
const sensitiveTool: Tool = {
  name: 'delete_file',
  description: '删除文件',
  groups: ['admin'],
  inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  executor: { timeout: 10000, needAuth: true },
  execute: async (args: any): Promise<ToolResult> => ({
    content: [{ type: 'text', text: `已删除: ${args.path}` }]
  })
};

const publicTool: Tool = {
  name: 'echo',
  description: '回显',
  groups: ['public'],
  inputSchema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
  execute: async (args: any): Promise<ToolResult> => ({
    content: [{ type: 'text', text: `Echo: ${args.message}` }]
  })
};

async function test1_basicExecutor(): Promise<void> {
  console.log('\n=== 测试1：基础统一执行器 ===');
  
  const validator = TokenValidatorFactory.createRoleBasedValidator({
    'user_token': 'user',
    'admin_token': 'admin'
  });
  
  const executor = new UnifiedExecutorLayer(validator);
  
  // 正常执行
  const result1 = await executor.executeTool(publicTool, { message: 'Hello' }, 'user_token');
  console.log('✅ 公共工具执行:', result1.content[0].text);
  
  const result2 = await executor.executeTool(sensitiveTool, { path: '/secret.txt' }, 'admin_token');
  console.log('✅ 敏感工具执行:', result2.content[0].text);
  
  // Token验证失败
  try {
    await executor.executeTool(sensitiveTool, { path: '/secret.txt' }, 'invalid_token');
    throw new Error('应该失败');
  } catch (error) {
    if (error instanceof ExecutorError && error.code === ExecutorError.TOKEN_INVALID) {
      console.log('✅ Token验证失败正确处理');
    } else {
      throw error;
    }
  }
}

async function test2_containerIntegration(): Promise<void> {
  console.log('\n=== 测试2：容器集成 ===');
  
  const config = {
    name: '工具集',
    defaultRole: 'user',
    roles: {
      user: { name: '用户', allowedGroups: ['public'] },
      admin: { name: '管理员', allowedGroups: ['*'] }
    }
  };
  
  const container = new EnhancedToolContainer('工具集', 'test', config);
  container.register(publicTool);
  container.register(sensitiveTool);
  
  const validator = TokenValidatorFactory.createRoleBasedValidator({
    'user_token': 'user',
    'admin_token': 'admin'
  });
  
  const executorContainer = integrateExecutorLayer(container, validator);
  
  // 用户执行
  const result1 = await executorContainer.executeWithRoleAndToken(
    'user', 'echo', { message: '测试' }, 'user_token'
  );
  console.log('✅ 用户执行:', result1.content[0].text);
  
  // 管理员执行
  const result2 = await executorContainer.executeWithRoleAndToken(
    'admin', 'delete_file', { path: '/test.txt' }, 'admin_token'
  );
  console.log('✅ 管理员执行:', result2.content[0].text);
  
  // 权限不足
  try {
    await executorContainer.executeWithRoleAndToken(
      'user', 'delete_file', { path: '/test.txt' }, 'user_token'
    );
    throw new Error('应该失败');
  } catch (error) {
    console.log('✅ 权限不足正确拒绝');
  }
}

async function test3_toolFactory(): Promise<void> {
  console.log('\n=== 测试3：工具工厂 ===');
  
  const dbTool = createToolWithExecutor(
    'db_query',
    '数据库查询',
    async (args: any): Promise<ToolResult> => ({
      content: [{ type: 'text', text: `结果: ${args.query}` }]
    }),
    ['public'],
    { timeout: 5000, needAuth: true }
  );
  
  const validator = TokenValidatorFactory.createAlwaysValidValidator('user');
  const executor = new UnifiedExecutorLayer(validator);
  
  const result = await executor.executeTool(dbTool, { query: 'SELECT *' }, 'any_token');
  console.log('✅ 工厂工具执行:', result.content[0].text);
}

async function test4_events(): Promise<void> {
  console.log('\n=== 测试4：事件监听 ===');
  
  const validator = TokenValidatorFactory.createAlwaysValidValidator('user');
  const executor = new UnifiedExecutorLayer(validator);
  
  let events = { start: 0, complete: 0, error: 0 };
  
  executor.addListener({
    onExecuteStart: () => events.start++,
    onExecuteComplete: () => events.complete++,
    onExecuteError: () => events.error++
  });
  
  await executor.executeTool(publicTool, { message: 'test' }, 'token');
  
  if (events.start === 1 && events.complete === 1) {
    console.log('✅ 事件监听正常');
  } else {
    console.log('❌ 事件监听异常');
  }
}

export async function runFusedExecutorTests(): Promise<void> {
  console.log('🚀 融合执行器框架测试');
  
  await test1_basicExecutor();
  await test2_containerIntegration();
  await test3_toolFactory();
  await test4_events();
  
  console.log('\n🎉 所有测试通过！');
}

if (require.main === module) {
  runFusedExecutorTests();
}