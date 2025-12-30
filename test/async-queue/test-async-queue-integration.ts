/**
 * 异步执行队列和消息队列集成测试
 * 
 * 测试用户空间中的异步任务执行和消息传递功能
 */

import { globalUserSpaceManager } from './src/core/user-space';
import { globalTokenManager } from './src/core/token-manager';
import { globalAsyncExecutionQueue } from './src/core/async-execution-queue';
import { globalMessageQueue } from './src/core/message-queue';
import type { ExecutorObject } from './src/core/async-execution-queue';

// 测试工具
import { registerAsyncExecutorTool, submitAsyncTaskTool, getAsyncTaskTool, waitForAsyncTaskTool, getUserTasksTool, getAsyncStatsTool, cancelAsyncTaskTool, deleteAsyncTaskTool } from './src/tools/async-queue-tools';
import { publishMessageTool, receiveMessageTool, getPendingMessagesTool, replyMessageTool, getMessageStatsTool, cleanupExpiredMessagesTool } from './src/tools/message-queue-tools';

async function testAsyncQueueAndMessageQueue() {
  console.log('🚀 开始测试异步执行队列和消息队列功能\n');

  // 1. 创建测试Token
  console.log('1. 创建测试Token...');
  const testToken = 'test-async-token-' + Date.now();
  const testRole = 'test-user';
  
  // 注册Token
  (globalTokenManager as any).tokens.set(testToken, {
    role: testRole,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  });
  console.log(`✅ Token创建成功: ${testToken.substring(0, 16)}...`);

  // 2. 创建用户空间
  console.log('\n2. 创建用户空间...');
  const userSpace = globalUserSpaceManager.getUserSpace(testToken, testRole);
  console.log(`✅ 用户空间创建成功`);
  console.log(`   - Token: ${testToken.substring(0, 16)}...`);
  console.log(`   - 角色: ${userSpace.role}`);
  console.log(`   - 异步队列: ${userSpace.asyncExecutionQueue ? '已创建' : '未创建'}`);
  console.log(`   - 消息队列: ${userSpace.messageQueue ? '已连接' : '未连接'}`);

  // 3. 测试异步执行队列
  console.log('\n3. 测试异步执行队列...');

  // 3.1 注册执行器
  console.log('\n3.1 注册异步执行器...');
  const executorId = 'test-executor-' + Date.now();
  const executorName = '数据处理执行器';
  
  // 创建执行器对象
  const executor: ExecutorObject = {
    id: executorId,
    name: executorName,
    description: '用于测试的异步数据处理执行器',
    execute: async (args: any) => {
      console.log(`   [执行器] 开始处理: ${JSON.stringify(args)}`);
      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = {
        processed: true,
        input: args,
        timestamp: new Date().toISOString(),
        random: Math.random()
      };
      console.log(`   [执行器] 处理完成`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        isError: false
      };
    },
    metadata: { version: '1.0', category: 'test' }
  };

  // 注册到用户空间
  userSpace.asyncExecutionQueue.registerExecutor(executor);
  console.log(`✅ 执行器注册成功: ${executorName}`);

  // 3.2 提交异步任务
  console.log('\n3.2 提交异步任务...');
  const taskArgs = { data: 'test-data', userId: testToken.substring(0, 8) };
  const task = userSpace.asyncExecutionQueue.submitTask(testToken, executorId, taskArgs, { priority: 'high' });
  
  console.log(`✅ 任务提交成功`);
  console.log(`   - 任务ID: ${task.id}`);
  console.log(`   - 执行器: ${task.toolName}`);
  console.log(`   - 状态: ${task.status}`);
  console.log(`   - 参数: ${JSON.stringify(taskArgs)}`);

  // 3.3 查询任务状态
  console.log('\n3.3 查询任务状态...');
  const taskStatus = userSpace.asyncExecutionQueue.getTask(task.id);
  if (taskStatus) {
    console.log(`📊 任务状态: ${taskStatus.status}`);
    if (taskStatus.result) {
      console.log(`   结果: ${JSON.stringify(taskStatus.result, null, 2)}`);
    }
  }

  // 3.4 等待任务完成
  console.log('\n3.4 等待任务完成...');
  try {
    const completedTask = await userSpace.asyncExecutionQueue.waitForTask(task.id, 5000);
    console.log(`✅ 任务完成`);
    console.log(`   - 状态: ${completedTask.status}`);
    if (completedTask.result) {
      console.log(`   - 结果: ${JSON.stringify(completedTask.result.content[0].text, null, 2)}`);
    }
  } catch (error) {
    console.log(`⚠️ 任务等待: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 3.5 获取用户所有任务
  console.log('\n3.5 获取用户所有任务...');
  const userTasks = userSpace.asyncExecutionQueue.getUserTasks(testToken);
  console.log(`📊 用户任务统计: ${userTasks.length} 个`);
  userTasks.forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.id} | ${t.status} | ${t.toolName}`);
  });

  // 3.6 获取统计信息
  console.log('\n3.6 获取异步队列统计...');
  const stats = userSpace.asyncExecutionQueue.getStats(testToken);
  console.log(`📊 统计信息:`);
  console.log(`   - 总任务数: ${stats.total}`);
  console.log(`   - 状态分布: ${JSON.stringify(stats.byStatus)}`);

  // 4. 测试消息队列
  console.log('\n4. 测试消息队列...');

  // 4.1 发布消息
  console.log('\n4.1 发布消息...');
  const messageContent = { action: 'notify', data: 'Hello from test', timestamp: Date.now() };
  const message = userSpace.messageQueue.publish(
    'notification',
    testToken,
    testToken, // 发送给自己
    messageContent,
    'high',
    300, // 5分钟过期
    { test: true }
  );
  console.log(`✅ 消息发布成功`);
  console.log(`   - 消息ID: ${message.id}`);
  console.log(`   - 类型: ${message.type}`);
  console.log(`   - 优先级: ${message.priority}`);

  // 4.2 发布多条消息
  console.log('\n4.2 发布多条测试消息...');
  const messages = [
    { type: 'tool-request' as const, content: { tool: 'echo', args: 'test1' }, priority: 'normal' as const },
    { type: 'tool-response' as const, content: { result: 'success' }, priority: 'high' as const },
    { type: 'event' as const, content: { event: 'user_login' }, priority: 'low' as const }
  ];

  for (const msg of messages) {
    userSpace.messageQueue.publish(
      msg.type,
      testToken,
      testToken,
      msg.content,
      msg.priority,
      600
    );
  }
  console.log(`✅ 发布了 ${messages.length} 条额外消息`);

  // 4.3 查看待处理消息
  console.log('\n4.3 查看待处理消息...');
  const pending = userSpace.messageQueue.getPendingMessages(testToken);
  console.log(`📊 待处理消息: ${pending.length} 条`);
  pending.forEach((msg, i) => {
    console.log(`   ${i + 1}. [${msg.priority}] ${msg.type} - ${JSON.stringify(msg.content)}`);
  });

  // 4.4 接收消息
  console.log('\n4.4 接收消息...');
  const received = userSpace.messageQueue.receiveMessages(testToken, 2);
  console.log(`✅ 接收到 ${received.length} 条消息`);
  received.forEach((msg, i) => {
    console.log(`   ${i + 1}. ID: ${msg.id}, 类型: ${msg.type}, 内容: ${JSON.stringify(msg.content)}`);
  });

  // 4.5 回复消息
  console.log('\n4.5 回复消息...');
  const pendingForReply = userSpace.messageQueue.getPendingMessages(testToken);
  if (pendingForReply.length > 0) {
    const originalMsg = pendingForReply[0];
    const replyContent = { reply: '收到消息', originalId: originalMsg.id };
    const replyMsg = userSpace.messageQueue.reply(originalMsg, testToken, replyContent, 'normal');
    console.log(`✅ 回复成功: ${replyMsg.id}`);
  }

  // 4.6 获取消息统计
  console.log('\n4.6 获取消息统计...');
  const msgStats = userSpace.messageQueue.getStats(testToken);
  console.log(`📊 消息统计:`);
  console.log(`   - 总消息数: ${msgStats.total}`);
  console.log(`   - 待处理: ${msgStats.pending}`);
  console.log(`   - 类型分布: ${JSON.stringify(msgStats.byType)}`);
  console.log(`   - 优先级分布: ${JSON.stringify(msgStats.byPriority)}`);

  // 5. 测试MCP工具
  console.log('\n5. 测试MCP工具...');

  // 5.1 测试注册执行器工具
  console.log('\n5.1 测试注册执行器工具...');
  const registerResult = await registerAsyncExecutorTool.execute({
    token: testToken,
    executorId: 'mcp-executor-' + Date.now(),
    name: 'MCP测试执行器',
    description: '通过MCP工具注册的执行器',
    metadata: { source: 'mcp-tool' }
  });
  console.log(`✅ 工具执行结果: ${registerResult.isError ? '失败' : '成功'}`);

  // 5.2 测试提交任务工具
  console.log('\n5.2 测试提交任务工具...');
  const submitResult = await submitAsyncTaskTool.execute({
    token: testToken,
    executorId: executorId,
    args: { test: 'mcp-task' },
    metadata: { source: 'mcp-tool' }
  });
  console.log(`✅ 工具执行结果: ${submitResult.isError ? '失败' : '成功'}`);

  // 5.3 测试获取任务工具
  console.log('\n5.3 测试获取任务工具...');
  const getTaskResult = await getAsyncTaskTool.execute({
    token: testToken,
    taskId: task.id
  });
  console.log(`✅ 工具执行结果: ${getTaskResult.isError ? '失败' : '成功'}`);

  // 5.4 测试发布消息工具
  console.log('\n5.4 测试发布消息工具...');
  const publishResult = await publishMessageTool.execute({
    token: testToken,
    type: 'event',
    destination: testToken,
    content: { test: 'mcp-message' },
    priority: 'normal'
  });
  console.log(`✅ 工具执行结果: ${publishResult.isError ? '失败' : '成功'}`);

  // 5.5 测试接收消息工具
  console.log('\n5.5 测试接收消息工具...');
  const receiveResult = await receiveMessageTool.execute({
    token: testToken,
    count: 1
  });
  console.log(`✅ 工具执行结果: ${receiveResult.isError ? '失败' : '成功'}`);

  // 5.6 测试回复消息工具
  console.log('\n5.6 测试回复消息工具...');
  const pendingForReplyTool = userSpace.messageQueue.getPendingMessages(testToken);
  if (pendingForReplyTool.length > 0) {
    const replyResult = await replyMessageTool.execute({
      token: testToken,
      messageId: pendingForReplyTool[0].id,
      content: { reply: '测试回复' }
    });
    console.log(`✅ 工具执行结果: ${replyResult.isError ? '失败' : '成功'}`);
  }

  // 6. 清理测试
  console.log('\n6. 清理测试数据...');

  // 6.1 清理用户空间
  console.log('\n6.1 清理用户空间...');
  await globalUserSpaceManager.cleanupUserSpace(testToken);
  console.log(`✅ 用户空间已清理`);

  // 6.2 验证清理
  console.log('\n6.2 验证清理结果...');
  const remainingTasks = globalAsyncExecutionQueue.getUserTasks(testToken);
  const remainingMessagesGlobal = globalMessageQueue.getPendingMessages(testToken);
  console.log(`📊 清理后状态:`);
  console.log(`   - 剩余任务: ${remainingTasks.length}`);
  console.log(`   - 剩余消息: ${remainingMessagesGlobal.length}`);

  console.log('\n🎉 所有测试完成！');
}

// 运行测试
testAsyncQueueAndMessageQueue().catch(console.error);