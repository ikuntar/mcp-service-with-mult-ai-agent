// 简化版会话测试
const path = require('path');

// 直接导入模块
const TemplateSession = require('./src/core/ai-agent/session/template-session').TemplateSession;
const ChatSession = require('./src/core/ai-agent/session/chat-session').ChatSession;
const { createSimpleWorkflow } = require('./src/core/ai-agent/session/index');

// 模拟AI
class MockAI {
  static async generateResponse(prompt) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return `AI回复: ${prompt.substring(0, 30)}...`;
  }
}

// 测试模板会话
async function testTemplate() {
  console.log('=== 模板会话测试 ===\n');
  
  const workflow = createSimpleWorkflow('test', [
    { name: '步骤1', prompt: '第一步: {{input}}' },
    { name: '步骤2', prompt: '第二步: 继续' }
  ]);

  const session = new TemplateSession('test-session', {
    workflow,
    timeout: 10000,
    initialVariables: { input: '测试数据' }
  });

  // 重写executeStep
  session.executeStep = async function(step, prompt) {
    return await MockAI.generateResponse(prompt);
  };

  const result = await session.waitUntilEnd();
  console.log('结果:', result.status);
  console.log('输出:', result.output);
}

// 测试聊天会话
async function testChat() {
  console.log('\n=== 聊天会话测试 ===\n');
  
  const session = new ChatSession('chat-test', {
    systemPrompt: '你是助手',
    timeout: 10000
  });

  // 重写generateResponse
  session.generateResponse = async function(input, context) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return `回复: ${input}`;
  };

  await session.start();
  const reply1 = await session.sendMessage('你好');
  console.log('回复1:', reply1);
  
  const reply2 = await session.sendMessage('再见');
  console.log('回复2:', reply2);

  await session.cancel();
  console.log('最终状态:', session.getStatus());
}

// 运行测试
async function run() {
  try {
    await testTemplate();
    await testChat();
    console.log('\n✅ 测试完成');
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

run();