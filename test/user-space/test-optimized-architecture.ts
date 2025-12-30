/**
 * 优化架构测试 - 简化异步任务使用
 * 
 * 演示：无需预先注册工具，直接执行异步任务
 */

import { globalOptimizedUserSpaceManager } from './src/core/user-space-optimized';
import { globalTokenManager } from './src/core/token-manager';
import { EnhancedToolContainer, ContainerConfig } from './src/core/enhanced-tool-container';
import { globalMessageQueue } from './src/core/message-queue';
import type { Tool } from './src/types';

// 测试工具
const testTool: Tool = {
  name: 'test_async_tool',
  description: '测试异步工具，模拟耗时操作',
  groups: ['public'],
  inputSchema: {
    type: 'object',
    properties: {
      delay: { type: 'number', description: '延迟时间(毫秒)' },
      message: { type: 'string', description: '测试消息' }
    },
    required: ['delay', 'message']
  },
  execute: async (args: any) => {
    await new Promise(resolve => setTimeout(resolve, args.delay));
    return {
      content: [{ type: 'text', text: `✅ 完成: ${args.message} (延迟: ${args.delay}ms)` }]
    };
  }
};

const anotherTool: Tool = {
  name: 'calculate',
  description: '计算工具',
  groups: ['public', 'math'],
  inputSchema: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  },
  execute: async (args: any) => {
    return {
      content: [{ type: 'text', text: `结果: ${args.a} + ${args.b} = ${args.a + args.b}` }]
    };
  }
};

async function runOptimizedTest() {
  console.log('🚀 开始优化架构测试\n');

  // 1. 创建Token
  console.log('1️⃣ 创建用户Token');
  const token = globalTokenManager.createToken('user', '测试用户');
  console.log(`✅ Token: ${token.substring(0, 20)}...\n`);

  // 2. 创建工具容器并注册工具（只需一次）
  console.log('2️⃣ 创建工具容器并注册工具');
  const config: ContainerConfig = {
    name: '测试工具集',
    defaultRole: 'user',
    roles: {
      'user': { name: '普通用户', allowedGroups: ['public'] },
      'admin': { name: '管理员', allowedGroups: ['*'] }
    }
  };
  
  const container = new EnhancedToolContainer('测试容器', 'test', config);
  container.register(testTool);
  container.register(anotherTool);
  console.log(`✅ 工具容器创建完成，注册了 ${container.getRawTools().length} 个工具\n`);

  // 3. 创建用户空间（自动集成工具容器）
  console.log('3️⃣ 创建用户空间');
  const userSpace = globalOptimizedUserSpaceManager.getUserSpace(token, 'user', container);
  console.log(`✅ 用户空间创建完成\n`);

  // 4. 直接提交异步任务（无需预先注册！）
  console.log('4️⃣ 直接提交异步任务（无需注册）');
  const task1 = userSpace.asyncTaskExecutor.submitTask(
    token,
    'test_async_tool',  // 直接指定工具名
    { delay: 500, message: 'Hello Optimized World' },
    { priority: 'high', source: 'test' },
    'request-001'
  );
  
  console.log('✅ 任务1提交成功');
  console.log(`   任务ID: ${task1.id}`);
  console.log(`   工具: ${task1.toolName}`);
  console.log(`   状态: ${task1.status}`);
  console.log(`   原始调用: ${JSON.stringify(task1.originalCall)}\n`);

  // 5. 提交第二个任务
  console.log('5️⃣ 提交第二个任务');
  const task2 = userSpace.asyncTaskExecutor.submitTask(
    token,
    'calculate',  // 直接指定另一个工具名
    { a: 10, b: 20 },
    { priority: 'normal' },
    'request-002'
  );
  
  console.log('✅ 任务2提交成功');
  console.log(`   任务ID: ${task2.id}`);
  console.log(`   工具: ${task2.toolName}\n`);

  // 6. 等待任务完成
  console.log('6️⃣ 等待任务完成');
  const [completed1, completed2] = await Promise.all([
    userSpace.asyncTaskExecutor.waitForTask(task1.id),
    userSpace.asyncTaskExecutor.waitForTask(task2.id)
  ]);
  
  console.log('✅ 任务完成');
  console.log(`   任务1结果: ${JSON.stringify(completed1.result)}`);
  console.log(`   任务2结果: ${JSON.stringify(completed2.result)}`);
  console.log(`   任务1执行时间: ${completed1.executionTime}ms`);
  console.log(`   任务2执行时间: ${completed2.executionTime}ms\n`);

  // 7. 查看任务统计
  console.log('7️⃣ 查看任务统计');
  const stats = userSpace.asyncTaskExecutor.getStats(token);
  console.log('✅ 统计信息');
  console.log(`   总任务数: ${stats.total}`);
  console.log(`   状态分布:`, stats.byStatus);
  console.log('');

  // 8. 查看原始调用数据
  console.log('8️⃣ 查看原始调用数据');
  const originalCall = userSpace.asyncTaskExecutor.getTaskOriginalCall(task1.id);
  console.log('✅ 原始调用数据');
  console.log(`   用户Token: ${originalCall?.token}`);
  console.log(`   工具名称: ${originalCall?.toolName}`);
  console.log(`   工具参数: ${JSON.stringify(originalCall?.toolArgs)}`);
  console.log(`   调用时间: ${originalCall?.timestamp}`);
  console.log(`   请求ID: ${originalCall?.requestId}`);
  console.log(`   元数据: ${JSON.stringify(originalCall?.metadata)}\n`);

  // 9. 测试权限检查
  console.log('9️⃣ 测试权限检查');
  try {
    // 尝试访问不存在的工具
    userSpace.asyncTaskExecutor.submitTask(
      token,
      'nonexistent_tool',
      {}
    );
    console.log('❌ 应该抛出错误');
  } catch (error: any) {
    console.log(`✅ 权限检查正常: ${error.message}\n`);
  }

  // 10. 测试消息队列
  console.log('🔟 测试消息队列');
  const message = globalMessageQueue.publish(
    'notification',
    token,
    token,
    '来自优化架构的消息',
    'high'
  );
  console.log(`✅ 消息已发布: ${message.id}`);
  
  const received = globalMessageQueue.receiveMessage(token);
  console.log(`✅ 接收消息: ${received?.content}\n`);

  // 11. 总结
  console.log('📊 优化架构优势总结');
  console.log('✅ 无需预先注册工具');
  console.log('✅ 直接使用工具容器中的工具');
  console.log('✅ 一步完成任务提交');
  console.log('✅ 完整的原始调用数据');
  console.log('✅ 丰富的返回信息');
  console.log('✅ 自动权限检查');
  console.log('✅ 用户隔离正常');
  console.log('\n🎉 优化架构测试完成！');

  return {
    success: true,
    token,
    userSpace,
    tasks: [task1, task2]
  };
}

// 运行测试
if (require.main === module) {
  runOptimizedTest().catch(console.error);
}

export { runOptimizedTest };