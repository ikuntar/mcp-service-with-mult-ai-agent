/**
 * MCP会话简单测试
 */

const { createMCPSession, createMCPTool } = require('./build/core/ai-agent');

async function test() {
  console.log('🧪 MCP会话简单测试\n');

  // 创建工具
  const tools = [
    createMCPTool('calculate', '计算器', {
      type: 'object',
      properties: {
        expression: { type: 'string' }
      },
      required: ['expression']
    })
  ];

  // 创建会话
  const session = createMCPSession('test', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: tools
  });

  // 启动会话
  console.log('1. 启动会话...');
  const startPromise = session.start();
  
  // 等待一小会儿让会话启动
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('   状态:', session.getStatus());
  console.log('   工具数:', session.getTools().length);

  // 测试工具调用
  console.log('\n2. 测试工具调用...');
  const response = await session.sendMessage('@calculate(expression=100+200)');
  console.log('   响应:', response);

  // 测试普通对话
  console.log('\n3. 测试普通对话...');
  const response2 = await session.sendMessage('你好');
  console.log('   响应:', response2);

  // 取消会话
  console.log('\n4. 取消会话...');
  const result = await session.cancel();
  console.log('   最终状态:', result.status);
  console.log('   消息数:', result.messages.length);

  console.log('\n✅ 测试完成！');
}

test().catch(console.error);