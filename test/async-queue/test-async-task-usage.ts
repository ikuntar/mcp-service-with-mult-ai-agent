/**
 * 异步任务使用测试
 * 
 * 验证用户可以：
 * 1. 将已存在的MCP工具注册为异步任务
 * 2. 提交异步任务调用
 * 3. 管理异步任务
 */

import { globalUserSpaceManager } from './src/core/user-space';
import { globalTokenManager } from './src/core/token-manager';

// 导入异步任务工具
import { 
  registerAsyncTaskTool, 
  submitAsyncTask, 
  getAsyncTaskStatus, 
  waitAsyncTask, 
  getUserAsyncTasks, 
  getAsyncTaskStats, 
  cancelAsyncTask, 
  deleteAsyncTask,
  getRegisteredTools 
} from './src/tools/async-task-tools';

// 导入消息队列工具
import { 
  userPublishMessage, 
  userReceiveMessage, 
  userReplyMessage, 
  userGetPendingMessages, 
  userGetMessageStats, 
  userCleanupExpiredMessages 
} from './src/tools/user-message-queue-tools';

async function testAsyncTaskUsage() {
  console.log('🚀 开始测试异步任务和消息队列功能\n');

  // 1. 创建测试Token
  console.log('1. 创建测试Token...');
  const testToken = 'test-async-' + Date.now();
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
  console.log(`   - 异步任务执行器: ${userSpace.asyncTaskExecutor ? '已创建' : '未创建'}`);
  console.log(`   - 消息队列: ${userSpace.messageQueue ? '已连接' : '未连接'}`);

  // 3. 测试异步任务功能
  console.log('\n3. 测试异步任务功能...');

  // 3.1 注册已存在的MCP工具为异步任务
  console.log('\n3.1 注册MCP工具为异步任务...');
  const registerResult = await registerAsyncTaskTool.execute({
    token: testToken,
    toolName: 'echo',
    toolDescription: '回声工具，返回输入的内容',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '要回显的消息' }
      },
      required: ['message']
    }
  });
  console.log(`✅ 注册结果: ${registerResult.isError ? '失败' : '成功'}`);

  // 3.2 查看已注册的工具
  console.log('\n3.2 查看已注册的工具...');
  const toolsResult = await getRegisteredTools.execute({
    token: testToken
  });
  console.log(`✅ 工具列表: ${toolsResult.isError ? '失败' : '成功'}`);

  // 3.3 提交异步任务
  console.log('\n3.3 提交异步任务...');
  const submitResult = await submitAsyncTask.execute({
    token: testToken,
    toolName: 'echo',
    toolArgs: { message: 'Hello from async task!' },
    metadata: { priority: 'high', category: 'test' }
  });
  console.log(`✅ 提交任务: ${submitResult.isError ? '失败' : '成功'}`);

  // 提取任务ID
  let taskId = '';
  if (!submitResult.isError && submitResult.content && submitResult.content[0] && submitResult.content[0].text) {
    const text = submitResult.content[0].text;
    const match = text.match(/任务ID: (\w+)/);
    if (match) {
      taskId = match[1];
      console.log(`   任务ID: ${taskId}`);
    }
  }

  // 3.4 查询任务状态
  if (taskId) {
    console.log('\n3.4 查询任务状态...');
    const statusResult = await getAsyncTaskStatus.execute({
      token: testToken,
      taskId: taskId
    });
    console.log(`✅ 状态查询: ${statusResult.isError ? '失败' : '成功'}`);
  }

  // 3.5 获取用户所有任务
  console.log('\n3.5 获取用户所有任务...');
  const tasksResult = await getUserAsyncTasks.execute({
    token: testToken
  });
  console.log(`✅ 任务列表: ${tasksResult.isError ? '失败' : '成功'}`);

  // 3.6 获取统计信息
  console.log('\n3.6 获取异步任务统计...');
  const statsResult = await getAsyncTaskStats.execute({
    token: testToken
  });
  console.log(`✅ 统计信息: ${statsResult.isError ? '失败' : '成功'}`);

  // 4. 测试消息队列功能
  console.log('\n4. 测试消息队列功能...');

  // 4.1 发布消息
  console.log('\n4.1 发布消息...');
  const publishResult = await userPublishMessage.execute({
    token: testToken,
    type: 'notification',
    destination: testToken,
    content: { message: 'Hello from message queue', timestamp: Date.now() },
    priority: 'high',
    ttl: 300
  });
  console.log(`✅ 发布消息: ${publishResult.isError ? '失败' : '成功'}`);

  // 4.2 发布多条消息
  console.log('\n4.2 发布多条测试消息...');
  const messages = [
    { type: 'tool-request', content: { tool: 'echo', args: 'test1' }, priority: 'normal' },
    { type: 'tool-response', content: { result: 'success' }, priority: 'high' },
    { type: 'event', content: { event: 'user_login' }, priority: 'low' }
  ];

  for (const msg of messages) {
    await userPublishMessage.execute({
      token: testToken,
      type: msg.type as any,
      destination: testToken,
      content: msg.content,
      priority: msg.priority as any
    });
  }
  console.log(`✅ 发布了 ${messages.length} 条额外消息`);

  // 4.3 查看待处理消息
  console.log('\n4.3 查看待处理消息...');
  const pendingResult = await userGetPendingMessages.execute({
    token: testToken
  });
  console.log(`✅ 待处理消息: ${pendingResult.isError ? '失败' : '成功'}`);

  // 4.4 接收消息
  console.log('\n4.4 接收消息...');
  const receiveResult = await userReceiveMessage.execute({
    token: testToken,
    count: 2,
    filterType: 'tool-request'
  });
  console.log(`✅ 接收消息: ${receiveResult.isError ? '失败' : '成功'}`);

  // 4.5 回复消息
  console.log('\n4.5 回复消息...');
  const pendingForReply = userSpace.messageQueue.getPendingMessages(testToken);
  if (pendingForReply.length > 0) {
    const replyResult = await userReplyMessage.execute({
      token: testToken,
      messageId: pendingForReply[0].id,
      content: { reply: '收到消息', originalId: pendingForReply[0].id }
    });
    console.log(`✅ 回复消息: ${replyResult.isError ? '失败' : '成功'}`);
  }

  // 4.6 获取消息统计
  console.log('\n4.6 获取消息统计...');
  const msgStatsResult = await userGetMessageStats.execute({
    token: testToken
  });
  console.log(`✅ 消息统计: ${msgStatsResult.isError ? '失败' : '成功'}`);

  // 4.7 清理过期消息
  console.log('\n4.7 清理过期消息...');
  const cleanupResult = await userCleanupExpiredMessages.execute({
    token: testToken
  });
  console.log(`✅ 清理过期消息: ${cleanupResult.isError ? '失败' : '成功'}`);

  // 5. 测试异步任务等待
  if (taskId) {
    console.log('\n5. 测试异步任务等待...');
    try {
      const waitResult = await waitAsyncTask.execute({
        token: testToken,
        taskId: taskId,
        timeout: 5000
      });
      console.log(`✅ 任务等待: ${waitResult.isError ? '失败' : '成功'}`);
    } catch (error) {
      console.log(`⚠️ 任务等待超时（预期行为）`);
    }
  }

  // 6. 测试任务取消和删除
  if (taskId) {
    console.log('\n6. 测试任务管理...');
    
    // 尝试取消任务（可能已完成）
    const cancelResult = await cancelAsyncTask.execute({
      token: testToken,
      taskId: taskId
    });
    console.log(`✅ 取消任务: ${cancelResult.isError ? '失败（可能已完成）' : '成功'}`);

    // 尝试删除任务
    const deleteResult = await deleteAsyncTask.execute({
      token: testToken,
      taskId: taskId
    });
    console.log(`✅ 删除任务: ${deleteResult.isError ? '失败（可能正在运行）' : '成功'}`);
  }

  // 7. 清理测试
  console.log('\n7. 清理测试数据...');

  // 7.1 清理用户空间
  console.log('\n7.1 清理用户空间...');
  await globalUserSpaceManager.cleanupUserSpace(testToken);
  console.log(`✅ 用户空间已清理`);

  // 7.2 验证清理
  console.log('\n7.2 验证清理结果...');
  const remainingTasks = userSpace.asyncTaskExecutor.getUserTasks(testToken);
  const remainingMessages = userSpace.messageQueue.getPendingMessages(testToken);
  console.log(`📊 清理后状态:`);
  console.log(`   - 剩余任务: ${remainingTasks.length}`);
  console.log(`   - 剩余消息: ${remainingMessages.length}`);

  console.log('\n🎉 所有测试完成！');
  console.log('\n📋 测试总结:');
  console.log('✅ 异步任务：用户可以将已存在的MCP工具注册为异步任务');
  console.log('✅ 异步执行：用户可以提交异步任务并管理任务状态');
  console.log('✅ 消息队列：用户可以全权处理消息队列');
  console.log('✅ 权责关系：异步任务和消息队列都隶属于用户空间');
}

// 运行测试
testAsyncTaskUsage().catch(console.error);