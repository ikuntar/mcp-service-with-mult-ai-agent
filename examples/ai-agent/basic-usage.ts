/**
 * AI-Agent MVP 使用示例
 */

import { createDefaultAgent, createAgent, type Task } from '../../src/index';

async function demonstrateMVPAgent() {
  console.log('🤖 AI-Agent MVP 使用示例\n');
  console.log('='.repeat(60));

  // 示例1：使用默认Agent
  console.log('示例1：使用默认Agent');
  console.log('-'.repeat(40));
  
  const agent1 = createDefaultAgent();
  console.log('Agent信息:', agent1.getInfo().name);
  
  const task1: Task = {
    id: 'demo-001',
    input: '读取销售数据文件'
  };
  
  const result1 = await agent1.thinkAndAct(task1);
  console.log('任务:', task1.input);
  console.log('结果:', result1.output);
  console.log('');

  // 示例2：自定义Agent
  console.log('示例2：自定义Agent');
  console.log('-'.repeat(40));
  
  const agent2 = createAgent({
    id: 'data-analyst',
    name: '数据分析师',
    role: '数据分析专家',
    personality: '严谨、细致、逻辑性强',
    capabilities: ['数据分析', '报告生成', '趋势识别'],
    maxMemoryItems: 100
  });
  
  console.log('Agent信息:', agent2.getInfo().name);
  
  const task2: Task = {
    id: 'demo-002',
    input: '分析Q4销售趋势并生成报告',
    context: { quarter: 'Q4', year: 2024 }
  };
  
  const result2 = await agent2.thinkAndAct(task2);
  console.log('任务:', task2.input);
  console.log('结果:', result2.output);
  console.log('');

  // 示例3：连续任务处理
  console.log('示例3：连续任务处理');
  console.log('-'.repeat(40));
  
  const agent3 = createAgent({
    id: 'assistant',
    name: '智能助手',
    role: '通用助手',
    personality: '友好、乐于助人',
    capabilities: ['对话', '任务处理']
  });
  
  const tasks: Task[] = [
    { id: 'task-1', input: '读取配置文件' },
    { id: 'task-2', input: '写入日志文件' },
    { id: 'task-3', input: '计算统计数据' }
  ];
  
  for (const task of tasks) {
    const result = await agent3.thinkAndAct(task);
    console.log(`✅ ${task.input} → ${result.output?.substring(0, 30)}...`);
  }
  console.log('');

  // 示例4：查看记忆系统
  console.log('示例4：查看记忆系统');
  console.log('-'.repeat(40));
  
  const stats = await agent3.getMemoryStats();
  console.log('记忆统计:', JSON.stringify(stats, null, 2));
  
  const recent = await agent3.getRecentMemories(2);
  console.log('最近记忆:');
  recent.forEach((m, i) => {
    console.log(`  ${i + 1}. [${m.type}] ${m.content.substring(0, 40)}...`);
  });
  console.log('');

  // 示例5：状态管理
  console.log('示例5：状态管理');
  console.log('-'.repeat(40));
  
  const agent5 = createDefaultAgent();
  console.log('初始状态:', agent5.getState());
  
  // 执行任务时观察状态变化
  const task5: Task = { id: 'status-test', input: '测试状态变化' };
  await agent5.thinkAndAct(task5);
  console.log('执行后状态:', agent5.getState());
  
  // 停止Agent
  await agent5.stop();
  console.log('停止后状态:', agent5.getState());
  console.log('');

  console.log('='.repeat(60));
  console.log('✨ MVP AI-Agent示例完成！');
  console.log('\n关键特性总结:');
  console.log('• 基于规则的简单推理');
  console.log('• 完整的思考-行动循环');
  console.log('• 记忆系统（存储+检索）');
  console.log('• 状态管理（转换+验证）');
  console.log('• 无需外部AI模型');
  console.log('• 易于扩展和定制');
}

// 如果直接运行
if (require.main === module) {
  demonstrateMVPAgent().catch(console.error);
}

export { demonstrateMVPAgent };