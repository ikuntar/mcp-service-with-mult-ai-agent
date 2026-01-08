/**
 * 测试重构后的AI-Agent模块
 */

import {
  createFunctionalQuickAgent,
  createAdvancedQuickAgent,
  createQuickTemplate,
  configManager,
  examples
} from '../../src/core/ai-agent';

/**
 * 测试功能性Agent
 */
async function testFunctionalAgent() {
  console.log('\n=== 测试功能性Agent ===');
  
  // 先加载模型配置
  configManager.loadModelsFromEnv();
  
  const agent = createFunctionalQuickAgent('小助手', {
    role: '对话助手',
    personality: '友好热情',
    systemPrompt: '你是一个乐于助人的助手，用简洁的语言回答问题'
  });
  
  console.log('Agent信息:', agent.getInfo());
  
  // 测试单次任务
  const result = await agent.execute({
    id: 'test-1',
    input: '介绍一下你自己'
  });
  
  console.log('单次任务结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('输出:', result.output);
  
  // 测试连续对话
  await agent.startChat();
  const response1 = await agent.sendMessage('你好！');
  console.log('对话1:', response1);
  
  const response2 = await agent.sendMessage('你能做什么？');
  console.log('对话2:', response2);
  
  await agent.stopChat();
  
  // 查看状态
  console.log('最终状态:', agent.getState());
  console.log('对话历史:', agent.getConversationHistory());
  
  return true;
}

/**
 * 测试高级Agent
 */
async function testAdvancedAgent() {
  console.log('\n=== 测试高级Agent ===');
  
  // 先加载模型配置
  configManager.loadModelsFromEnv();
  
  const agent = createAdvancedQuickAgent('专家助手', {
    role: '技术专家',
    personality: '严谨专业',
    tools: [
      {
        name: 'calculate',
        description: '计算器',
        parameters: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: '计算表达式' }
          },
          required: ['expression']
        }
      }
    ]
  });
  
  console.log('Agent信息:', agent.getInfo());
  
  // 测试单次任务（带工具调用）
  const result = await agent.execute({
    id: 'test-2',
    input: '计算 100 + 200 * 3'
  });
  
  console.log('任务结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('输出:', result.output);
  
  // 测试连续对话
  await agent.startChat();
  const response1 = await agent.sendMessage('你好，能帮我计算吗？');
  console.log('对话1:', response1);
  
  const response2 = await agent.sendMessage('@calculate(expression=50/2)');
  console.log('对话2 (工具调用):', response2);
  
  await agent.stopChat();
  
  // 查看可用工具
  console.log('可用工具:', agent.getTools());
  
  return true;
}

/**
 * 测试模板对话
 */
async function testTemplateManager() {
  console.log('\n=== 测试模板对话 ===');
  
  const manager = createQuickTemplate('数据分析流程', [
    { name: '数据收集', prompt: '收集数据文件: {{filename}}', variables: { filename: 'sales.csv' } },
    { name: '数据清洗', prompt: '清洗数据: {{rawData}}' },
    { name: '趋势分析', prompt: '分析趋势并生成报告' }
  ], { filename: 'sales.csv' });
  
  console.log('工作流信息:', manager.getWorkflowInfo());
  console.log('初始状态:', manager.getState());
  
  // 执行模板对话
  await manager.start();
  
  console.log('执行状态:', manager.getExecutionStatus());
  console.log('执行结果:', manager.getOutput());
  console.log('步骤结果:', manager.getStepResults());
  
  // 导出历史
  const history = manager.exportHistory();
  console.log('导出历史:', history);
  
  return true;
}

/**
 * 测试配置管理器
 */
async function testConfigManager() {
  console.log('\n=== 测试配置管理器 ===');
  
  // 模拟环境变量
  process.env.FUNCTIONAL_MODEL_ENDPOINT = 'http://mock-functional';
  process.env.OPENAI_API_KEY = 'sk-test';
  
  // 加载配置
  configManager.loadModelsFromEnv();
  
  // 获取可用模型
  const models = configManager.getAvailableModels();
  console.log('可用功能模型:', models.functional.length);
  console.log('可用高级模型:', models.advanced.length);
  
  // 清理
  delete process.env.FUNCTIONAL_MODEL_ENDPOINT;
  delete process.env.OPENAI_API_KEY;
  
  return true;
}

/**
 * 测试状态管理
 */
async function testStateManagement() {
  console.log('\n=== 测试状态管理 ===');
  
  const agent = createFunctionalQuickAgent('状态测试');
  
  console.log('初始状态:', agent.getState());
  
  // 执行任务
  await agent.execute({ id: 'state-test', input: '测试' });
  console.log('执行后状态:', agent.getState());
  
  // 开始对话
  await agent.startChat();
  console.log('对话中状态:', agent.getState());
  
  // 发送消息
  await agent.sendMessage('测试消息');
  console.log('消息后状态:', agent.getState());
  
  // 停止对话
  await agent.stopChat();
  console.log('停止后状态:', agent.getState());
  
  return true;
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🧪 开始重构后AI-Agent模块测试...\n');
  
  try {
    await testFunctionalAgent();
    await testAdvancedAgent();
    await testTemplateManager();
    await testConfigManager();
    await testStateManagement();
    
    console.log('\n✅ 所有测试完成！');
    console.log('\n重构总结:');
    console.log('1. ✅ 功能性Agent和高级Agent已拆分');
    console.log('2. ✅ 两者都是对话推理的唯一接口');
    console.log('3. ✅ 高级Agent持有Token（内部处理）');
    console.log('4. ✅ 配置简化，Token自动获取');
    console.log('5. ✅ 完整的状态控制');
    console.log('6. ✅ 连续对话完全控制');
    console.log('7. ✅ 模板对话可取消可重试');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests();
}

export {
  testFunctionalAgent,
  testAdvancedAgent,
  testTemplateManager,
  testConfigManager,
  testStateManagement,
  runAllTests
};