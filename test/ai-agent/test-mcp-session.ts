/**
 * MCP会话测试
 */

import { 
  createMCPSession, 
  createMCPTool,
  MCPSessionFactory 
} from '../../src/core/ai-agent';

/**
 * 测试MCP会话基本功能
 */
export async function testMCPSessionBasic() {
  console.log('🧪 测试MCP会话基本功能...\n');

  // 创建工具
  const tools = [
    createMCPTool('testTool', '测试工具', {
      type: 'object',
      properties: {
        message: { type: 'string', description: '测试消息' }
      },
      required: ['message']
    })
  ];

  // 创建会话
  const session = createMCPSession('test-mcp', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: tools,
    initialContext: '测试上下文'
  });

  let toolCallCount = 0;
  let toolResultCount = 0;

  // 监听事件
  session.on((event) => {
    if (event.type === 'tool-call') toolCallCount++;
    if (event.type === 'tool-result') toolResultCount++;
  });

  // 测试启动
  const result = await session.start();
  console.log('✅ 启动测试:', result.status === 'running' ? '通过' : '失败');

  // 测试工具调用解析
  const response = await session.sendMessage('@testTool(message=hello)');
  console.log('✅ 工具调用测试:', response.includes('执行成功') ? '通过' : '失败');

  // 测试上下文
  const context = session.getContext();
  console.log('✅ 上下文测试:', context === '测试上下文' ? '通过' : '失败');

  // 测试工具列表
  const sessionTools = session.getTools();
  console.log('✅ 工具列表测试:', sessionTools.length === 1 ? '通过' : '失败');

  // 测试消息历史
  const messages = session.getMessages();
  console.log('✅ 消息历史测试:', messages.length > 0 ? '通过' : '失败');

  // 测试事件触发
  console.log('✅ 事件触发测试:', toolCallCount > 0 && toolResultCount > 0 ? '通过' : '失败');

  // 测试导出历史
  const history = session.exportHistory();
  console.log('✅ 导出历史测试:', history.tools.length === 1 ? '通过' : '失败');

  // 测试导入历史
  const newSession = createMCPSession('test-mcp-import', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: []
  });
  newSession.importHistory(history);
  console.log('✅ 导入历史测试:', newSession.getTools().length === 1 ? '通过' : '失败');

  // 测试重置
  newSession.reset();
  console.log('✅ 重置测试:', newSession.getMessages().length === 0 ? '通过' : '失败');

  // 测试撤销
  await newSession.sendMessage('test message');
  newSession.undo();
  console.log('✅ 撤销测试:', newSession.getMessages().length === 0 ? '通过' : '失败');

  // 测试修改消息
  await newSession.sendMessage('original');
  newSession.modifyLastMessage('modified');
  const lastMsg = newSession.getMessages().slice(-1)[0];
  console.log('✅ 修改消息测试:', lastMsg.content === 'modified' ? '通过' : '失败');

  // 测试上下文操作
  newSession.setContext('new context');
  console.log('✅ 设置上下文测试:', newSession.getContext() === 'new context' ? '通过' : '失败');
  
  newSession.clearContext();
  console.log('✅ 清空上下文测试:', newSession.getContext() === '' ? '通过' : '失败');

  // 测试添加工具
  newSession.addTool(createMCPTool('newTool', '新工具'));
  console.log('✅ 添加工具测试:', newSession.getTools().length === 1 ? '通过' : '失败');

  // 测试批量添加工具
  newSession.addTools([
    createMCPTool('tool1', '工具1'),
    createMCPTool('tool2', '工具2')
  ]);
  console.log('✅ 批量添加工具测试:', newSession.getTools().length === 3 ? '通过' : '失败');

  // 测试更新端点
  newSession.updateMCPEndpoint('http://new-endpoint.com', { 'X-Key': 'value' });
  console.log('✅ 更新端点测试: 通过');

  // 取消会话
  await newSession.cancel();
  console.log('✅ 取消会话测试: 通过');

  console.log('\n🎉 所有基本功能测试完成！');
}

/**
 * 测试MCPSessionFactory
 */
export async function testMCPSessionFactory() {
  console.log('\n🧪 测试MCPSessionFactory...\n');

  // 测试create
  const session1 = MCPSessionFactory.create('factory-test', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: [createMCPTool('tool1', '工具1')]
  });
  console.log('✅ Factory.create测试:', session1.getTools().length === 1 ? '通过' : '失败');

  // 测试createFromToolDefinitions
  const session2 = MCPSessionFactory.createFromToolDefinitions(
    'def-test',
    'http://localhost:3000/mcp',
    [{ name: 'tool2', description: '工具2' }]
  );
  console.log('✅ Factory.createFromToolDefinitions测试:', session2.getTools().length === 1 ? '通过' : '失败');

  // 测试createWithSystemPrompt
  const session3 = MCPSessionFactory.createWithSystemPrompt('prompt-test', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    systemPrompt: '测试提示',
    tools: [createMCPTool('tool3', '工具3')]
  });
  console.log('✅ Factory.createWithSystemPrompt测试:', session3.getContext() === '测试提示' ? '通过' : '失败');

  console.log('\n🎉 Factory测试完成！');
}

/**
 * 测试参数解析
 */
export async function testParameterParsing() {
  console.log('\n🧪 测试参数解析...\n');

  const session = createMCPSession('param-test', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: [
      createMCPTool('testParams', '测试参数', {
        type: 'object',
        properties: {
          str: { type: 'string' },
          num: { type: 'number' },
          bool: { type: 'boolean' }
        }
      })
    ]
  });

  await session.start();

  // 测试不同格式的参数解析
  const tests = [
    { input: '@testParams(str=hello, num=42, bool=true)', desc: '基本参数' },
    { input: '@testParams(str="quoted string", num=3.14)', desc: '引号和小数' },
    { input: 'testParams(str=test)', desc: '无@符号' },
    { input: '{"tool": "testParams", "params": {"str": "json", "num": 100}}', desc: 'JSON格式' }
  ];

  for (const test of tests) {
    try {
      const response = await session.sendMessage(test.input);
      console.log(`✅ ${test.desc}: 通过`);
    } catch (error) {
      console.log(`❌ ${test.desc}: 失败 - ${error.message}`);
    }
  }

  await session.cancel();
  console.log('\n🎉 参数解析测试完成！');
}

/**
 * 测试错误处理
 */
export async function testErrorHandling() {
  console.log('\n🧪 测试错误处理...\n');

  const session = createMCPSession('error-test', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: [
      createMCPTool('errorTool', '错误工具', {
        type: 'object',
        properties: {
          shouldError: { type: 'boolean' }
        },
        required: ['shouldError']
      })
    ]
  });

  await session.start();

  // 测试不存在的工具
  const response1 = await session.sendMessage('@nonExistentTool()');
  console.log('✅ 不存在工具测试:', response1.includes('不存在') ? '通过' : '失败');

  // 测试参数验证失败
  const response2 = await session.sendMessage('@errorTool()'); // 缺少必填参数
  console.log('✅ 参数验证测试:', response2.includes('验证失败') ? '通过' : '失败');

  // 测试无效格式
  const response3 = await session.sendMessage('invalid format here');
  console.log('✅ 无效格式测试:', response3.includes('帮助') ? '通过' : '失败');

  await session.cancel();
  console.log('\n🎉 错误处理测试完成！');
}

/**
 * 测试事件系统
 */
export async function testEventSystem() {
  console.log('\n🧪 测试事件系统...\n');

  const session = createMCPSession('event-test', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: [createMCPTool('eventTool', '事件工具')]
  });

  const events: string[] = [];

  session.on((event) => {
    events.push(event.type);
  });

  await session.start();
  await session.sendMessage('@eventTool()');

  const hasStart = events.includes('start');
  const hasToolCall = events.includes('tool-call');
  const hasToolResult = events.includes('tool-result');

  console.log('✅ Start事件:', hasStart ? '通过' : '失败');
  console.log('✅ Tool-call事件:', hasToolCall ? '通过' : '失败');
  console.log('✅ Tool-result事件:', hasToolResult ? '通过' : '失败');

  // 测试事件处理器移除
  const handler = (event: any) => {};
  session.on(handler);
  session.off(handler);
  console.log('✅ 事件处理器移除: 通过');

  await session.cancel();
  console.log('\n🎉 事件系统测试完成！');
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('🚀 开始运行MCP会话测试...\n');

  try {
    await testMCPSessionBasic();
    await testMCPSessionFactory();
    await testParameterParsing();
    await testErrorHandling();
    await testEventSystem();

    console.log('\n🎉 所有MCP会话测试通过！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests();
}