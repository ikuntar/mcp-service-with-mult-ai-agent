/**
 * MCP会话集成示例
 * 展示如何使用MCP会话与MCP服务器交互
 */

import { 
  MCPSession, 
  createMCPSession, 
  createMCPTool,
  MCPSessionFactory 
} from '../../src/core/ai-agent';

/**
 * 示例1: 创建基本的MCP会话
 */
export async function basicMCPSessionExample() {
  console.log('=== 基本MCP会话示例 ===\n');

  // 创建MCP工具定义
  const tools = [
    createMCPTool(
      'readFile',
      '读取文件内容',
      {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '文件路径'
          }
        },
        required: ['path']
      }
    ),
    createMCPTool(
      'writeFile',
      '写入文件内容',
      {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '文件路径'
          },
          content: {
            type: 'string',
            description: '文件内容'
          }
        },
        required: ['path', 'content']
      }
    ),
    createMCPTool(
      'calculate',
      '执行计算',
      {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: '计算表达式'
          }
        },
        required: ['expression']
      }
    )
  ];

  // 创建MCP会话
  const session = createMCPSession('mcp-demo-1', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    mcpHeaders: {
      'Authorization': 'Bearer demo-token'
    },
    tools: tools,
    initialContext: '这是一个MCP工具演示会话',
    timeout: 300000 // 5分钟
  });

  // 监听事件
  session.on((event) => {
    switch (event.type) {
      case 'start':
        console.log('✅ MCP会话已启动');
        break;
      case 'tool-call':
        console.log(`🔧 工具调用: ${event.data.tool}`, event.data.arguments);
        break;
      case 'tool-result':
        console.log(`✅ 工具结果:`, event.data.result);
        break;
      case 'tool-error':
        console.log(`❌ 工具错误:`, event.data.error);
        break;
      case 'end':
        console.log('🏁 会话结束');
        break;
    }
  });

  // 开始会话
  const result = await session.start();
  console.log('会话状态:', result.status);

  // 发送消息测试工具调用
  console.log('\n--- 测试工具调用 ---');
  
  // 测试1: 调用calculate工具
  const response1 = await session.sendMessage('@calculate(expression=100+200)');
  console.log('响应1:', response1);

  // 测试2: 调用readFile工具
  const response2 = await session.sendMessage('readFile(path=/tmp/test.txt)');
  console.log('响应2:', response2);

  // 测试3: 普通对话
  const response3 = await session.sendMessage('你好，能帮我做什么？');
  console.log('响应3:', response3);

  // 查看工具列表
  console.log('\n可用工具:', session.getTools().map(t => t.name));

  // 导出会话历史
  const history = session.exportHistory();
  console.log('\n会话历史:', JSON.stringify(history, null, 2));

  // 取消会话
  await session.cancel();
}

/**
 * 示例2: 使用MCPSessionFactory
 */
export async function factoryExample() {
  console.log('\n=== MCPSessionFactory 示例 ===\n');

  const session = MCPSessionFactory.create('mcp-factory-demo', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: [
      {
        name: 'search',
        description: '搜索信息',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索关键词' }
          },
          required: ['query']
        }
      }
    ],
    initialContext: '搜索助手'
  });

  await session.start();
  
  const response = await session.sendMessage('search(query=AI技术)');
  console.log('搜索结果:', response);

  await session.cancel();
}

/**
 * 示例3: 从工具定义创建MCP会话
 */
export async function fromToolDefinitionsExample() {
  console.log('\n=== 从工具定义创建 ===\n');

  const tools = [
    {
      name: 'getWeather',
      description: '获取天气信息',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称' }
        },
        required: ['city']
      }
    },
    {
      name: 'getTime',
      description: '获取当前时间',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  ];

  const session = MCPSessionFactory.createFromToolDefinitions(
    'weather-assistant',
    'http://localhost:3000/mcp',
    tools,
    { 'X-API-Key': 'weather-key' }
  );

  await session.start();

  // 测试工具调用
  await session.sendMessage('@getWeather(city=北京)');
  await session.sendMessage('@getTime()');

  await session.cancel();
}

/**
 * 示例4: 带系统提示的MCP会话
 */
export async function withSystemPromptExample() {
  console.log('\n=== 带系统提示的MCP会话 ===\n');

  const session = MCPSessionFactory.createWithSystemPrompt('smart-assistant', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    systemPrompt: '你是一个智能助手，擅长使用各种工具解决问题。请根据用户需求选择合适的工具。',
    tools: [
      {
        name: 'calculator',
        description: '计算器工具',
        parameters: {
          type: 'object',
          properties: {
            operation: { type: 'string', description: '操作类型' },
            a: { type: 'number', description: '第一个数' },
            b: { type: 'number', description: '第二个数' }
          },
          required: ['operation', 'a', 'b']
        }
      }
    ]
  });

  await session.start();

  // 测试
  const response = await session.sendMessage('计算15加23');
  console.log('助手响应:', response);

  await session.cancel();
}

/**
 * 示例5: MCP会话的高级功能
 */
export async function advancedFeaturesExample() {
  console.log('\n=== MCP会话高级功能 ===\n');

  const session = createMCPSession('advanced-mcp', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: [
      createMCPTool('fileManager', '文件管理工具', {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'read', 'write', 'delete'] },
          path: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['action', 'path']
      })
    ],
    initialContext: '高级文件管理助手'
  });

  // 事件监听
  session.on(async (event) => {
    if (event.type === 'tool-call') {
      console.log(`📊 工具调用统计: ${event.data.tool}`);
    }
  });

  await session.start();

  // 测试上下文管理
  console.log('初始上下文:', session.getContext());
  
  session.setContext('更新后的上下文');
  console.log('更新后上下文:', session.getContext());

  // 测试消息操作
  await session.sendMessage('fileManager(action=list, path=/tmp)');
  
  // 撤销消息
  session.undo();
  console.log('撤销后消息数:', session.getMessages().length);

  // 修改消息
  session.modifyLastMessage('修改后的消息', 'user');
  console.log('最后一条消息:', session.getMessages().slice(-1)[0]);

  // 重置会话
  session.reset();
  console.log('重置后消息数:', session.getMessages().length);

  await session.cancel();
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  try {
    await basicMCPSessionExample();
    await factoryExample();
    await fromToolDefinitionsExample();
    await withSystemPromptExample();
    await advancedFeaturesExample();
    
    console.log('\n🎉 所有MCP会话示例运行完成！');
  } catch (error) {
    console.error('示例运行失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples();
}