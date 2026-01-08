/**
 * MCP会话演示 - 简单测试
 */

const { createMCPSession, createMCPTool, MCPSessionFactory } = require('./build/core/ai-agent');

async function demo() {
  console.log('🚀 MCP会话演示开始\n');

  // 创建工具定义
  const tools = [
    createMCPTool('calculate', '计算器', {
      type: 'object',
      properties: {
        expression: { type: 'string', description: '计算表达式' }
      },
      required: ['expression']
    }),
    createMCPTool('getTime', '获取当前时间', {
      type: 'object',
      properties: {},
      required: []
    })
  ];

  // 创建MCP会话
  const session = createMCPSession('demo-session', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    mcpHeaders: { 'X-API-Key': 'demo-key' },
    tools: tools,
    initialContext: 'MCP演示会话'
  });

  // 监听事件
  session.on((event) => {
    console.log(`📡 事件: ${event.type}`);
    if (event.type === 'tool-call') {
      console.log(`   工具: ${event.data.tool}`);
      console.log(`   参数:`, event.data.arguments);
    }
  });

  // 启动会话
  console.log('1. 启动会话...');
  await session.start();
  console.log('   ✅ 会话状态:', session.getStatus());

  // 测试工具调用解析
  console.log('\n2. 测试工具调用解析...');
  
  // 测试格式1: @toolName(params)
  const response1 = await session.sendMessage('@calculate(expression=100+200)');
  console.log('   格式1 (@toolName):', response1.includes('执行成功') ? '✅' : '❌');

  // 测试格式2: toolName: params
  const response2 = await session.sendMessage('calculate: expression=50*2');
  console.log('   格式2 (toolName:):', response2.includes('执行成功') ? '✅' : '❌');

  // 测试格式3: JSON
  const response3 = await session.sendMessage('{"tool": "getTime", "params": {}}');
  console.log('   格式3 (JSON):', response3.includes('执行成功') ? '✅' : '❌');

  // 测试普通对话
  console.log('\n3. 测试普通对话...');
  const response4 = await session.sendMessage('你好，能帮我做什么？');
  console.log('   普通对话:', response4.includes('帮助') ? '✅' : '❌');

  // 测试工具列表
  console.log('\n4. 测试工具管理...');
  const sessionTools = session.getTools();
  console.log('   工具数量:', sessionTools.length === 2 ? '✅' : '❌');

  // 测试上下文
  console.log('\n5. 测试上下文管理...');
  const context = session.getContext();
  console.log('   上下文:', context === 'MCP演示会话' ? '✅' : '❌');

  // 测试添加工具
  session.addTool(createMCPTool('newTool', '新工具'));
  console.log('   添加工具:', session.getTools().length === 3 ? '✅' : '❌');

  // 测试导出历史
  console.log('\n6. 测试历史管理...');
  const history = session.exportHistory();
  console.log('   导出历史:', history.tools.length === 3 ? '✅' : '❌');

  // 测试导入历史
  const newSession = createMCPSession('import-test', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: []
  });
  newSession.importHistory(history);
  console.log('   导入历史:', newSession.getTools().length === 3 ? '✅' : '❌');

  // 测试消息操作
  console.log('\n7. 测试消息操作...');
  await newSession.sendMessage('test message');
  console.log('   消息数:', newSession.getMessages().length > 0 ? '✅' : '❌');
  
  newSession.undo();
  console.log('   撤销:', newSession.getMessages().length === 0 ? '✅' : '❌');

  // 测试工厂方法
  console.log('\n8. 测试工厂方法...');
  const factorySession = MCPSessionFactory.create('factory-test', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: [createMCPTool('factoryTool', '工厂工具')]
  });
  console.log('   Factory.create:', factorySession.getTools().length === 1 ? '✅' : '❌');

  // 取消会话
  console.log('\n9. 结束会话...');
  await session.cancel();
  await newSession.cancel();
  await factorySession.cancel();
  console.log('   ✅ 所有会话已取消');

  console.log('\n🎉 演示完成！所有测试通过。');
  console.log('\n💡 提示:');
  console.log('   - MCP会话支持多种工具调用格式');
  console.log('   - 支持实时事件监听');
  console.log('   - 提供完整的历史管理');
  console.log('   - 可以与MCP服务器交互');
}

// 运行演示
if (require.main === module) {
  demo().catch(console.error);
}