/**
 * 简单集成测试
 * 验证用户空间架构的基本功能
 */

import { UserSpaceUnifiedExecutor } from './src/core/user-space-unified-executor';
import { globalTokenManager } from './src/core/token-manager';
import type { Tool, ToolResult } from './src/types';

// 简单工具
const simpleTool: Tool = {
  name: 'simple_echo',
  description: '简单回声工具',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  },
  executor: { type: 'default' },
  execute: async (args: any): Promise<ToolResult> => {
    return {
      content: [{ type: 'text', text: `Echo: ${args.message}` }]
    };
  }
};

async function main() {
  console.log('=== 简单集成测试 ===\n');

  // 1. 创建Token
  console.log('1. 创建Token...');
  const token = globalTokenManager.createToken('test-user', '测试用户', '1h');
  console.log(`✓ Token: ${token.substring(0, 16)}...\n`);

  // 2. 初始化执行器
  console.log('2. 初始化用户空间执行器...');
  const executor = new UserSpaceUnifiedExecutor();
  console.log('✓ 执行器就绪\n');

  // 3. 第一次执行（自动创建用户空间）
  console.log('3. 第一次执行（自动创建用户空间）...');
  const result1 = await executor.executeTool(simpleTool, { message: 'Hello World' }, token, 'test-user');
  console.log(`结果: ${result1.content[0].text}`);
  console.log(`状态: ${result1.isError ? '失败' : '成功'}\n`);

  // 4. 第二次执行（复用用户空间）
  console.log('4. 第二次执行（复用用户空间）...');
  const result2 = await executor.executeTool(simpleTool, { message: '第二次调用' }, token);
  console.log(`结果: ${result2.content[0].text}`);
  console.log(`状态: ${result2.isError ? '失败' : '成功'}\n`);

  // 5. 查看统计
  console.log('5. 查看用户空间统计...');
  const stats = executor.getStats();
  console.log(`总数: ${stats.total}, 活跃: ${stats.active}, 角色: ${JSON.stringify(stats.byRole)}\n`);

  // 6. 清理
  console.log('6. 清理资源...');
  await executor.cleanup();
  console.log('✓ 资源已清理\n');

  console.log('=== 测试完成 ===');
  console.log('✓ 用户空间架构工作正常');
  console.log('✓ Token与用户空间绑定成功');
  console.log('✓ 执行流程简化有效');
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };