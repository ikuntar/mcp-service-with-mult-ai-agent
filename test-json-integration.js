// 测试JSON集成到AI-Agent
const { AIAgentWithPromptEngine, createPromptIntegration } = require('./src/core/ai-agent/prompts-engine-integration');

async function testIntegration() {
  console.log('=== AI-Agent + JSON提示词引擎集成测试 ===\n');

  // 测试1：完整Agent集成
  console.log('测试1：完整AI-Agent集成');
  try {
    const agent = new AIAgentWithPromptEngine();
    await agent.initialize();

    const result = await agent.executeTask('代码审查专家', '审查以下代码质量', {
      code: 'function test() { return 1; }',
      language: 'JavaScript'
    });

    console.log('生成的提示词:');
    console.log(result.prompt);
    console.log('\n元数据:', result.metadata);
  } catch (error) {
    console.error('错误:', error.message);
  }

  // 测试2：独立集成器
  console.log('\n\n测试2：独立集成器');
  try {
    const integration = await createPromptIntegration({ strictMode: false });

    // 使用默认提示词
    const defaultPrompt = integration.renderSystem('default-assistant');
    console.log('默认助手提示词:');
    console.log(defaultPrompt);

    // 组合使用
    const composed = integration.compose(
      'code-generator',
      ['format-json', 'quality-check'],
      [],
      { language: 'Python', task: '实现快速排序' }
    );
    console.log('\n组合提示词:');
    console.log(composed);

    // 导出配置
    const exported = await integration.exportConfig('./test-integration-export');
    console.log('\n导出文件:', exported);
  } catch (error) {
    console.error('错误:', error.message);
  }

  // 测试3：状态检查
  console.log('\n\n测试3：状态检查');
  try {
    const integration = await createPromptIntegration();

    const status = integration.getStatus();
    console.log('状态:', status);

    const allPrompts = integration.getAllPrompts();
    console.log('\n所有提示词ID:');
    console.log('系统:', allPrompts.systemPrompts.map(p => p.id));
    console.log('追加:', allPrompts.appendPrompts.map(p => p.id));
    console.log('拼接:', allPrompts.concatenatePrompts.map(p => p.id));

    // 检查特定提示词
    console.log('\n检查提示词:');
    console.log('存在 default-assistant?', integration.hasPrompt('default-assistant', 'system'));
    console.log('存在 format-json?', integration.hasPrompt('format-json', 'append'));
    console.log('存在 non-existent?', integration.hasPrompt('non-existent', 'system'));
  } catch (error) {
    console.error('错误:', error.message);
  }

  console.log('\n=== 测试完成 ===');
}

testIntegration().catch(console.error);