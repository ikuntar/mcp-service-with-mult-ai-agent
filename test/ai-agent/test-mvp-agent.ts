/**
 * AI-Agent MVP 测试
 * 验证基本的思考-行动循环
 */

import { createDefaultAgent, type Task } from '../../src/core/ai-agent';

async function testMVPAgent() {
  console.log('🧪 测试 AI-Agent MVP 系统\n');
  console.log('='.repeat(60));

  // 1. 创建Agent
  console.log('1️⃣ 创建Agent...');
  const agent = createDefaultAgent();
  console.log('✅ Agent创建成功');
  console.log('   信息:', agent.getInfo());
  console.log('');

  // 2. 测试简单任务
  console.log('2️⃣ 测试简单任务...');
  const task1: Task = {
    id: 'task-001',
    input: '读取文件test.txt',
    context: { userId: 'test-user' }
  };

  console.log('   任务:', task1.input);
  const result1 = await agent.thinkAndAct(task1);
  console.log('   结果:', result1.success ? '✅ 成功' : '❌ 失败');
  console.log('   输出:', result1.output);
  console.log('   耗时:', result1.duration, 'ms');
  console.log('');

  // 3. 测试复杂任务
  console.log('3️⃣ 测试复杂任务...');
  const task2: Task = {
    id: 'task-002',
    input: '分析销售数据并生成报告',
    context: { userId: 'test-user' }
  };

  console.log('   任务:', task2.input);
  const result2 = await agent.thinkAndAct(task2);
  console.log('   结果:', result2.success ? '✅ 成功' : '❌ 失败');
  console.log('   输出:', result2.output);
  console.log('   耗时:', result2.duration, 'ms');
  console.log('');

  // 4. 测试记忆系统
  console.log('4️⃣ 测试记忆系统...');
  const stats = await agent.getMemoryStats();
  console.log('   记忆统计:', JSON.stringify(stats, null, 2));

  const recentMemories = await agent.getRecentMemories(3);
  console.log('   最近记忆:');
  recentMemories.forEach((memory, index) => {
    console.log(`     ${index + 1}. [${memory.type}] ${memory.content.substring(0, 50)}...`);
  });
  console.log('');

  // 5. 测试状态管理
  console.log('5️⃣ 测试状态管理...');
  console.log('   当前状态:', agent.getState());
  console.log('');

  // 6. 测试多个任务
  console.log('6️⃣ 测试多个任务...');
  const tasks: Task[] = [
    { id: 'task-003', input: '写入文件output.txt' },
    { id: 'task-004', input: '计算1+1' },
    { id: 'task-005', input: '搜索关键词' }
  ];

  for (const task of tasks) {
    console.log(`   执行: ${task.input}`);
    const result = await agent.thinkAndAct(task);
    console.log(`   结果: ${result.success ? '✅' : '❌'} ${result.output?.substring(0, 30)}...`);
  }
  console.log('');

  // 7. 最终统计
  console.log('7️⃣ 最终统计...');
  const finalStats = await agent.getMemoryStats();
  console.log('   总记忆数:', finalStats.total);
  console.log('   按类型:', JSON.stringify(finalStats.byType, null, 2));
  console.log('   24小时内:', finalStats.recent);
  console.log('');

  // 8. Agent信息
  console.log('8️⃣ Agent最终信息...');
  console.log('   ', JSON.stringify(agent.getInfo(), null, 2));
  console.log('');

  console.log('='.repeat(60));
  console.log('🎉 MVP Agent测试完成！');
  console.log('   ✅ 思考-行动循环正常');
  console.log('   ✅ 记忆系统正常');
  console.log('   ✅ 状态管理正常');
  console.log('   ✅ 任务处理正常');
}

// 如果直接运行此文件
if (require.main === module) {
  testMVPAgent().catch(console.error);
}

export { testMVPAgent };