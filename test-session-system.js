// 测试会话系统
const { 
  createTemplateSession, 
  createChatSession,
  loadWorkflowFromJSON,
  createSimpleWorkflow 
} = require('./src/core/ai-agent/session');

// 模拟AI响应（实际使用时替换为真实AI调用）
class MockAI {
  static async generateResponse(prompt) {
    // 模拟思考延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 简单的响应逻辑
    if (prompt.includes('分析')) {
      return JSON.stringify({
        summary: "分析完成",
        findings: ["发现1", "发现2"],
        analysis: "详细分析内容",
        recommendations: ["建议1", "建议2"]
      }, null, 2);
    }
    
    if (prompt.includes('代码')) {
      return "```typescript\nfunction solution() {\n  return '代码已生成';\n}\n```";
    }
    
    return `AI响应: ${prompt.substring(0, 50)}...`;
  }
}

// 扩展模板会话以使用模拟AI
class TestTemplateSession extends require('./src/core/ai-agent/session/template-session').TemplateSession {
  async executeStep(step, prompt) {
    return await MockAI.generateResponse(prompt);
  }
}

// 扩展聊天会话以使用模拟AI
class TestChatSession extends require('./src/core/ai-agent/session/chat-session').ChatSession {
  async generateResponse(input, context) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (input.includes('你好')) {
      return '你好！我是测试助手，很高兴为你服务！';
    }
    
    if (input.includes('时间')) {
      return `当前时间: ${new Date().toLocaleString('zh-CN')}`;
    }
    
    return `收到你的消息: "${input}"\n\n这是模拟回复。在实际使用中，这里会调用真实AI。`;
  }
}

async function testTemplateSession() {
  console.log('=== 测试模板会话 ===\n');

  // 方式1：代码定义工作流
  const workflow = createSimpleWorkflow('test-workflow', [
    {
      name: '数据收集',
      prompt: '请分析以下数据：{{data}}',
      variables: { data: '示例数据' }
    },
    {
      name: '生成报告',
      prompt: '基于以上分析，生成详细报告，格式：JSON'
    },
    {
      name: '总结',
      prompt: '请总结整个流程，输出关键点'
    }
  ]);

  console.log('1. 创建模板会话');
  const session = new TestTemplateSession('template-test', {
    workflow,
    timeout: 60000,
    initialVariables: {
      data: '销售数据2024年Q4',
      context: '季度分析'
    }
  });

  // 监听事件
  session.on((event) => {
    switch (event.type) {
      case 'start':
        console.log('   ✅ 会话开始');
        break;
      case 'step':
        if (event.data.type === 'step-start') {
          console.log(`   📝 步骤 ${event.data.index + 1}: ${event.data.step.name}`);
        } else if (event.data.type === 'step-success') {
          console.log(`   ✅ 步骤完成`);
        } else if (event.data.type === 'step-retry') {
          console.log(`   🔄 重试 ${event.data.retryCount}: ${event.data.error}`);
        }
        break;
      case 'end':
        console.log('   🏁 会话结束');
        break;
      case 'error':
        console.log('   ❌ 错误:', event.data.error);
        break;
    }
  });

  console.log('\n2. 开始执行');
  const result = await session.waitUntilEnd();

  console.log('\n3. 执行结果:');
  console.log('   状态:', result.status);
  console.log('   耗时:', result.duration + 'ms');
  console.log('   输出:', result.output);
  console.log('   步骤结果:', session.getStepResults().map(r => ({
    step: r.stepId,
    success: r.success,
    output: r.output ? (r.output.length > 50 ? r.output.substring(0, 50) + '...' : r.output) : undefined,
    error: r.error
  })));

  return result;
}

async function testChatSession() {
  console.log('\n\n=== 测试连续对话会话 ===\n');

  console.log('1. 创建聊天会话');
  const session = new TestChatSession('chat-test', {
    systemPrompt: '你是一个友好的助手，总是用中文回答',
    timeout: 30000,
    memoryWindow: 5,
    initialContext: '用户正在测试聊天系统'
  });

  // 监听事件
  session.on((event) => {
    switch (event.type) {
      case 'start':
        console.log('   ✅ 会话开始');
        break;
      case 'message':
        if (event.data.role === 'user') {
          console.log(`   👤 用户: ${event.data.content}`);
        } else if (event.data.role === 'assistant') {
          console.log(`   🤖 助手: ${event.data.content}`);
        }
        break;
      case 'timeout':
        console.log('   ⏰ 超时');
        break;
      case 'end':
        console.log('   🏁 会话结束');
        break;
    }
  });

  console.log('\n2. 开始会话');
  const startResult = await session.start();
  console.log('   状态:', startResult.status);

  console.log('\n3. 发送消息');
  
  // 发送多条消息
  const messages = [
    '你好',
    '现在几点了？',
    '我想写一个快速排序函数',
    '谢谢！'
  ];

  for (const msg of messages) {
    await session.sendMessage(msg);
    await new Promise(resolve => setTimeout(resolve, 200)); // 模拟思考时间
  }

  console.log('\n4. 等待结束（超时或手动取消）');
  
  // 5秒后手动取消
  setTimeout(async () => {
    console.log('   ⏸️  5秒后手动取消会话');
    const finalResult = await session.cancel();
    console.log('\n5. 最终结果:');
    console.log('   状态:', finalResult.status);
    console.log('   消息数:', finalResult.messages.length);
    console.log('   最后回复:', session.getLastAssistantResponse());
    console.log('   对话历史:\n', session.getConversationHistory());
  }, 5000);

  // 等待会话结束
  const result = await session.waitUntilEnd();
  return result;
}

async function testJSONWorkflow() {
  console.log('\n\n=== 测试JSON工作流加载 ===\n');

  // 创建JSON文件
  const fs = require('fs');
  const path = require('path');
  
  const jsonWorkflow = {
    id: 'json-workflow',
    name: 'JSON定义的工作流',
    description: '从JSON文件加载的工作流',
    steps: [
      {
        id: 'step1',
        name: '需求分析',
        prompt: '分析需求: {{requirement}}',
        variables: { requirement: 'string' }
      },
      {
        id: 'step2',
        name: '方案设计',
        prompt: '基于需求设计解决方案',
        expectedOutput: 'json'
      },
      {
        id: 'step3',
        name: '总结',
        prompt: '总结整个流程'
      }
    ],
    options: {
      autoContinue: true,
      strictOrder: true,
      maxRetries: 2
    }
  };

  const jsonPath = path.join(__dirname, 'test-workflow.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonWorkflow, null, 2));

  console.log('1. JSON文件已创建:', jsonPath);

  // 加载工作流
  const workflow = loadWorkflowFromJSON(jsonPath);
  console.log('2. 工作流加载成功:', workflow.name);
  console.log('   步骤数:', workflow.steps.length);

  // 创建会话
  const session = new TestTemplateSession('json-test', {
    workflow,
    initialVariables: { requirement: '开发一个用户管理系统' }
  });

  console.log('\n3. 开始执行JSON工作流');
  const result = await session.waitUntilEnd();

  console.log('\n4. 执行结果:');
  console.log('   状态:', result.status);
  console.log('   输出:', result.output);

  // 清理
  fs.unlinkSync(jsonPath);
  console.log('\n5. 清理临时文件');

  return result;
}

async function testManualControl() {
  console.log('\n\n=== 测试手动控制模板会话 ===\n');

  const workflow = createSimpleWorkflow('manual-control', [
    { name: '步骤1', prompt: '第一步: {{input}}' },
    { name: '步骤2', prompt: '第二步: 基于第一步结果继续' },
    { name: '步骤3', prompt: '第三步: 最终总结' }
  ]);

  const session = new TestTemplateSession('manual-test', {
    workflow,
    timeout: 60000,
    initialVariables: { input: '初始数据' }
  });

  // 配置为手动控制
  session.on(async (event) => {
    if (event.type === 'step' && event.data.type === 'step-success') {
      console.log(`   ✅ 步骤 ${event.data.result.stepId} 完成`);
      
      // 手动决定是否继续
      if (event.data.result.stepId === 'step1') {
        console.log('   ⏸️  暂停，手动继续...');
        // 这里可以添加用户交互逻辑
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('   ▶️  继续下一步');
        await session.continue();
      }
    }
  });

  console.log('1. 开始手动控制会话');
  const result = await session.waitUntilEnd();

  console.log('\n2. 手动控制结果:');
  console.log('   状态:', result.status);
  console.log('   步骤数:', session.getStepResults().length);

  return result;
}

async function runAllTests() {
  console.log('🧪 开始会话系统测试\n');
  console.log('=' .repeat(60));

  try {
    // 测试1：模板会话
    await testTemplateSession();

    // 测试2：连续对话
    await testChatSession();

    // 测试3：JSON工作流
    await testJSONWorkflow();

    // 测试4：手动控制
    await testManualControl();

    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTemplateSession,
  testChatSession,
  testJSONWorkflow,
  testManualControl,
  runAllTests
};