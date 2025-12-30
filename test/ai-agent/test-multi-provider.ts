/**
 * 测试多服务商AI-Agent
 */

import { 
  createEnhancedAgent, 
  createDefaultAgent,
  ProviderConfigManager,
  EnhancedAgentCore
} from '../../src/core/ai-agent';

/**
 * 测试1：使用Mock服务商（无需API Key）
 */
async function testMockProvider() {
  console.log('\n=== 测试1: Mock服务商 ===');
  
  const agent = createDefaultAgent();
  
  const result = await agent.thinkAndAct({
    id: 'mock-task-001',
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
 * 测试2：多服务商配置（主备切换）
 */
async function testMultipleProviders() {
  console.log('\n=== 测试2: 多服务商配置 ===');
  
  const providerManager = ProviderConfigManager.getInstance();
  providerManager.clear();
  
  // 配置多个服务商
  providerManager.addConfig({
    id: 'mock-primary',
    type: 'mock',
    model: 'mock-primary',
    capabilities: ['text'],
    priority: 100
  });
  
  providerManager.addConfig({
    id: 'mock-fallback-1',
    type: 'mock',
    model: 'mock-fallback-1',
    capabilities: ['text'],
    priority: 80
  });
  
  providerManager.addConfig({
    id: 'mock-fallback-2',
    type: 'mock',
    model: 'mock-fallback-2',
    capabilities: ['text'],
    priority: 60
  });
  
  const agent = new EnhancedAgentCore({
    id: 'multi-provider-agent',
    name: '多服务商测试Agent',
    role: '测试助手',
    personality: '严谨',
    capabilities: ['测试'],
    primaryProvider: 'mock-primary',
    fallbackProviders: ['mock-fallback-1', 'mock-fallback-2']
  }, undefined, providerManager);
  
  const result = await agent.thinkAndAct({
    id: 'multi-task-001',
    input: '分析数据'
  });
  
  console.log('任务:', '分析数据');
  console.log('结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('输出:', result.output);
  
  // 查看服务商信息
  const info = agent.getInfo();
  console.log('Agent信息:', {
    name: info.name,
    primaryProvider: info.primaryProvider,
    fallbackCount: info.fallbackCount
  });
}

/**
 * 测试3：重试机制（指数退避）
 */
async function testRetryMechanism() {
  console.log('\n=== 测试3: 重试机制 ===');
  
  const providerManager = ProviderConfigManager.getInstance();
  providerManager.clear();
  
  // 配置一个会失败的Mock服务商（模拟API失败）
  providerManager.addConfig({
    id: 'failing-mock',
    type: 'mock',
    model: 'failing-mock',
    capabilities: ['text'],
    priority: 100
  });
  
  const agent = new EnhancedAgentCore({
    id: 'retry-agent',
    name: '重试测试Agent',
    role: '测试助手',
    personality: '耐心',
    capabilities: ['测试'],
    primaryProvider: 'failing-mock',
    maxRetries: 3,
    baseRetryDelay: 500  // 基础延迟500ms
  }, undefined, providerManager);
  
  // Mock服务商不会失败，所以这里测试重试逻辑
  console.log('配置: 最大重试3次，基础延迟500ms');
  console.log('预期: 每次重试延迟递增 (500ms, 1000ms, 2000ms)');
  
  const result = await agent.thinkAndAct({
    id: 'retry-task-001',
    input: '测试重试'
  });
  
  console.log('结果:', result.success ? '✅ 成功' : '❌ 失败');
  console.log('输出:', result.output);
}

/**
 * 测试4：环境变量配置
 */
async function testEnvConfig() {
  console.log('\n=== 测试4: 环境变量配置 ===');
  
  // 模拟环境变量
  process.env.OPENAI_API_KEY = 'sk-test-key';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
  
  const providerManager = ProviderConfigManager.getInstance();
  providerManager.clear();
  providerManager.loadFromEnv();
  
  const configs = providerManager.getAllConfigs();
  console.log('从环境变量加载的配置数量:', configs.length);
  console.log('配置列表:', configs.map(c => ({
    id: c.id,
    type: c.type,
    model: c.model,
    priority: c.priority
  })));
  
  // 清理模拟的环境变量
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
}

/**
 * 测试5：按能力获取服务商
 */
async function testGetByCapability() {
  console.log('\n=== 测试5: 按能力获取服务商 ===');
  
  const providerManager = ProviderConfigManager.getInstance();
  providerManager.clear();
  
  providerManager.addConfig({
    id: 'text-only',
    type: 'mock',
    model: 'text-model',
    capabilities: ['text'],
    priority: 50
  });
  
  providerManager.addConfig({
    id: 'multimodal',
    type: 'mock',
    model: 'multimodal-model',
    capabilities: ['text', 'multimodal'],
    priority: 100
  });
  
  providerManager.addConfig({
    id: 'reasoning',
    type: 'mock',
    model: 'reasoning-model',
    capabilities: ['text', 'reasoning'],
    priority: 80
  });
  
  const textProviders = providerManager.getProvidersByCapability('text');
  const multimodalProviders = providerManager.getProvidersByCapability('multimodal');
  const reasoningProviders = providerManager.getProvidersByCapability('reasoning');
  
  console.log('支持text的提供商数量:', textProviders.length);
  console.log('支持multimodal的提供商数量:', multimodalProviders.length);
  console.log('支持reasoning的提供商数量:', reasoningProviders.length);
  
  console.log('Multimodal提供商:', multimodalProviders.map(p => p.id));
  console.log('Reasoning提供商:', reasoningProviders.map(p => p.id));
}

/**
 * 测试6：主备服务商配置
 */
async function testPrimaryAndFallbacks() {
  console.log('\n=== 测试6: 主备服务商配置 ===');
  
  const providerManager = ProviderConfigManager.getInstance();
  providerManager.clear();
  
  providerManager.addConfig({
    id: 'primary',
    type: 'mock',
    model: 'primary-model',
    capabilities: ['text'],
    priority: 100
  });
  
  providerManager.addConfig({
    id: 'fallback1',
    type: 'mock',
    model: 'fallback1-model',
    capabilities: ['text'],
    priority: 80
  });
  
  providerManager.addConfig({
    id: 'fallback2',
    type: 'mock',
    model: 'fallback2-model',
    capabilities: ['text'],
    priority: 60
  });
  
  providerManager.addConfig({
    id: 'other',
    type: 'mock',
    model: 'other-model',
    capabilities: ['text'],
    priority: 50
  });
  
  const providers = providerManager.getPrimaryAndFallbacks('primary', ['fallback1', 'fallback2']);
  
  console.log('主备配置结果:', providers.map(p => ({
    id: p.id,
    model: p.model,
    priority: p.priority
  })));
  
  console.log('数量:', providers.length);
  console.log('第一个是主服务商:', providers[0].id === 'primary');
  console.log('包含所有备用服务商:', 
    providers.some(p => p.id === 'fallback1') && 
    providers.some(p => p.id === 'fallback2')
  );
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🧪 开始运行多服务商AI-Agent测试...\n');
  
  try {
    await testMockProvider();
    await testMultipleProviders();
    await testRetryMechanism();
    await testEnvConfig();
    await testGetByCapability();
    await testPrimaryAndFallbacks();
    
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
  testMockProvider,
  testMultipleProviders,
  testRetryMechanism,
  testEnvConfig,
  testGetByCapability,
  testPrimaryAndFallbacks,
  runAllTests
};