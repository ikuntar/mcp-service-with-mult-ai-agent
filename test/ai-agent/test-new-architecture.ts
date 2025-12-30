/**
 * 测试新的AI-Agent架构
 * 功能性Agent vs 高级Agent
 */

import {
  createFunctionalAgent,
  createAdvancedAgent,
  createDefaultFunctionalAgent,
  createDefaultAdvancedAgent,
  ModelConfigManager,
  defineTool
} from '../../src/core/ai-agent';

/**
 * 测试1：创建默认功能性Agent
 */
async function testDefaultFunctionalAgent() {
  console.log('\n=== 测试1: 默认功能性Agent ===');
  
  const agent = createDefaultFunctionalAgent();
  
  console.log('Agent信息:', agent.getInfo());
  
  const result = await agent.execute({
    id: 'func-task-001',
    input: '读取文件test.txt'
  });
  
  console.log('任务:', '读取文件test.txt');
  console.log('结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('输出:', result.output);
  
  // 查看记忆
  const stats = await agent.getMemoryStats();
  console.log('记忆统计:', stats);
}

/**
 * 测试2：创建默认高级Agent
 */
async function testDefaultAdvancedAgent() {
  console.log('\n=== 测试2: 默认高级Agent ===');
  
  const agent = createDefaultAdvancedAgent();
  
  console.log('Agent信息:', agent.getInfo());
  
  const result = await agent.execute({
    id: 'adv-task-001',
    input: '分析数据并调用工具'
  });
  
  console.log('任务:', '分析数据并调用工具');
  console.log('结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('输出:', result.output);
  
  // 查看记忆
  const stats = await agent.getMemoryStats();
  console.log('记忆统计:', stats);
}

/**
 * 测试3：自定义功能性Agent
 */
async function testCustomFunctionalAgent() {
  console.log('\n=== 测试3: 自定义功能性Agent ===');
  
  const modelManager = ModelConfigManager.getInstance();
  modelManager.clear();
  
  // 添加自定义功能性模型
  modelManager.addFunctionalConfig({
    id: 'my-functional-model',
    type: 'functional',
    provider: 'local',
    baseURL: 'http://localhost:8080',
    model: 'my-functional-llm',
    capabilities: ['text', 'reasoning'],
    priority: 100,
    maxTokens: 500,
    maxContextLength: 1000
  });
  
  const agent = createFunctionalAgent({
    id: 'custom-functional-agent',
    name: '我的功能助手',
    role: '专业功能助手',
    personality: '严谨、准确',
    capabilities: ['文本分析', '简单推理'],
    modelId: 'my-functional-model',
    maxRetries: 2,
    baseRetryDelay: 300
  }, undefined, modelManager);
  
  console.log('Agent信息:', agent.getInfo());
  
  const result = await agent.execute({
    id: 'custom-func-001',
    input: '分析这段文本的含义'
  });
  
  console.log('结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('输出:', result.output);
}

/**
 * 测试4：自定义高级Agent
 */
async function testCustomAdvancedAgent() {
  console.log('\n=== 测试4: 自定义高级Agent ===');
  
  const modelManager = ModelConfigManager.getInstance();
  modelManager.clear();
  
  // 添加自定义高级模型
  modelManager.addAdvancedConfig({
    id: 'my-advanced-model',
    type: 'advanced',
    provider: 'openai',
    apiKey: 'sk-test-key',
    model: 'gpt-4',
    capabilities: ['text', 'reasoning', 'function_calling', 'mcp'],
    priority: 100,
    maxTokens: 2000,
    maxContextLength: 8000,
    functionCalling: true,
    mcpSupport: true
  });
  
  // 自定义工具
  const customTools = [
    defineTool('searchWeb', '搜索网络信息', {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' }
      },
      required: ['query']
    }),
    defineTool('calculate', '执行计算', {
      type: 'object',
      properties: {
        expression: { type: 'string', description: '计算表达式' }
      },
      required: ['expression']
    })
  ];
  
  const agent = createAdvancedAgent({
    id: 'custom-advanced-agent',
    name: '我的智能助手',
    role: '高级任务专家',
    personality: '智能、全面',
    capabilities: ['复杂推理', '工具调用', '网络搜索'],
    modelId: 'my-advanced-model',
    tools: customTools,
    maxRetries: 3,
    baseRetryDelay: 500
  }, undefined, modelManager);
  
  console.log('Agent信息:', agent.getInfo());
  
  const result = await agent.execute({
    id: 'custom-adv-001',
    input: '搜索最新AI技术并计算相关数据'
  });
  
  console.log('结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('输出:', result.output);
}

/**
 * 测试5：环境变量配置
 */
async function testEnvConfig() {
  console.log('\n=== 测试5: 环境变量配置 ===');
  
  // 模拟环境变量
  process.env.FUNCTIONAL_MODEL_ENDPOINT = 'http://localhost:8080';
  process.env.FUNCTIONAL_MODEL_NAME = 'local-functional';
  process.env.OPENAI_API_KEY = 'sk-test-key';
  
  const modelManager = ModelConfigManager.getInstance();
  modelManager.clear();
  modelManager.loadFromEnv();
  
  const functionalModels = modelManager.getAllFunctionalModels();
  const advancedModels = modelManager.getAllAdvancedModels();
  
  console.log('功能性模型数量:', functionalModels.length);
  console.log('高级模型数量:', advancedModels.length);
  
  if (functionalModels.length > 0) {
    console.log('功能性模型:', functionalModels[0].model);
  }
  
  if (advancedModels.length > 0) {
    console.log('高级模型:', advancedModels[0].model);
  }
  
  // 清理
  delete process.env.FUNCTIONAL_MODEL_ENDPOINT;
  delete process.env.FUNCTIONAL_MODEL_NAME;
  delete process.env.OPENAI_API_KEY;
}

/**
 * 测试6：重试机制对比
 */
async function testRetryComparison() {
  console.log('\n=== 测试6: 重试机制对比 ===');
  
  const modelManager = ModelConfigManager.getInstance();
  modelManager.clear();
  
  // 添加Mock模型
  modelManager.addFunctionalConfig({
    id: 'mock-functional',
    type: 'functional',
    provider: 'mock',
    model: 'mock-functional',
    capabilities: ['text'],
    priority: 1,
    maxTokens: 1000,
    maxContextLength: 2000
  });
  
  modelManager.addAdvancedConfig({
    id: 'mock-advanced',
    type: 'advanced',
    provider: 'mock',
    model: 'mock-advanced',
    capabilities: ['text', 'function_calling'],
    priority: 1,
    maxTokens: 4000,
    maxContextLength: 8000,
    functionCalling: true,
    mcpSupport: true
  });
  
  // 功能性Agent（500ms基础延迟）
  const funcAgent = createFunctionalAgent({
    id: 'func-retry-test',
    name: '功能测试',
    role: '测试',
    modelId: 'mock-functional',
    maxRetries: 3,
    baseRetryDelay: 500
  }, undefined, modelManager);
  
  // 高级Agent（1000ms基础延迟）
  const advAgent = createAdvancedAgent({
    id: 'adv-retry-test',
    name: '高级测试',
    role: '测试',
    modelId: 'mock-advanced',
    maxRetries: 3,
    baseRetryDelay: 1000,
    tools: []
  }, undefined, modelManager);
  
  console.log('功能性Agent重试配置: 3次, 基础500ms (预期: 500ms, 1000ms, 2000ms)');
  console.log('高级Agent重试配置: 3次, 基础1000ms (预期: 1000ms, 2000ms, 4000ms)');
  
  // 执行任务（都会成功，但会显示重试日志）
  console.log('\n执行功能性Agent任务...');
  await funcAgent.execute({ id: 'func-test', input: '测试重试' });
  
  console.log('\n执行高级Agent任务...');
  await advAgent.execute({ id: 'adv-test', input: '测试重试' });
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🧪 开始运行新架构AI-Agent测试...\n');
  
  try {
    await testDefaultFunctionalAgent();
    await testDefaultAdvancedAgent();
    await testCustomFunctionalAgent();
    await testCustomAdvancedAgent();
    await testEnvConfig();
    await testRetryComparison();
    
    console.log('\n✅ 所有测试完成！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests();
}

export {
  testDefaultFunctionalAgent,
  testDefaultAdvancedAgent,
  testCustomFunctionalAgent,
  testCustomAdvancedAgent,
  testEnvConfig,
  testRetryComparison,
  runAllTests
};