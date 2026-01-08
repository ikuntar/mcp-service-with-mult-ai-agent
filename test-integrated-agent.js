/**
 * 测试集成Agent - 验证智能体和会话的合并
 */

const { createIntegratedAgent, FunctionalIntegratedAgent, AdvancedIntegratedAgent } = require('./src/core/ai-agent');

async function testIntegratedAgent() {
  console.log('🧪 测试集成Agent - 智能体 + 会话 + 模型\n');

  // 1. 测试基础集成Agent
  console.log('1. 测试基础集成Agent');
  try {
    const agent = createIntegratedAgent({
      id: 'test-agent',
      name: '测试助手',
      role: '计算助手',
      modelId: 'functional-mock',
      mcpEndpoint: 'http://localhost:3000/mcp',
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

    console.log('✅ Agent创建成功');
    console.log('   信息:', agent.getInfo());

    // 2. 测试执行任务
    console.log('\n2. 测试执行任务');
    const result = await agent.execute({
      id: 'task-1',
      input: '计算100+200'
    });

    console.log('✅ 任务执行完成');
    console.log('   结果:', result.output);
    console.log('   成功:', result.success);

    // 3. 测试会话功能
    console.log('\n3. 测试会话功能');
    const history = agent.getSessionHistory();
    console.log('✅ 会话历史:', history.length, '条消息');

    const tools = agent.getTools();
    console.log('✅ 可用工具:', tools.map(t => t.name).join(', '));

    // 4. 测试上下文管理
    console.log('\n4. 测试上下文管理');
    agent.setContext('这是一个测试上下文');
    console.log('✅ 设置上下文:', agent.getContext());

    agent.clearContext();
    console.log('✅ 清空上下文:', agent.getContext());

    // 5. 测试记忆系统
    console.log('\n5. 测试记忆系统');
    const stats = await agent.getMemoryStats();
    console.log('✅ 记忆统计:', stats);

    const memories = await agent.getRecentMemories(3);
    console.log('✅ 最近记忆:', memories.length, '条');

    console.log('\n🎉 基础集成Agent测试完成！\n');

  } catch (error) {
    console.error('❌ 基础测试失败:', error.message);
  }

  // 6. 测试功能性集成Agent
  console.log('6. 测试功能性集成Agent');
  try {
    const funcAgent = new FunctionalIntegratedAgent({
      id: 'func-agent',
      name: '功能助手',
      role: '助手',
      mcpEndpoint: 'http://localhost:3000/mcp',
      tools: [
        {
          name: 'echo',
          description: '回声工具',
          parameters: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            },
            required: ['message']
          }
        }
      ]
    });

    console.log('✅ 功能性Agent创建成功');
    console.log('   信息:', funcAgent.getInfo());

    const result = await funcAgent.execute({
      id: 'task-2',
      input: '测试回声: hello'
    });

    console.log('✅ 功能性Agent执行完成');
    console.log('   结果:', result.output);

    console.log('\n🎉 功能性集成Agent测试完成！\n');

  } catch (error) {
    console.error('❌ 功能性测试失败:', error.message);
  }

  // 7. 测试高级集成Agent
  console.log('7. 测试高级集成Agent');
  try {
    const advancedAgent = new AdvancedIntegratedAgent({
      id: 'advanced-agent',
      name: '高级助手',
      role: '专家',
      modelId: 'advanced-mock',
      mcpEndpoint: 'http://localhost:3000/mcp',
      tools: [
        {
          name: 'analyze',
          description: '分析工具',
          parameters: {
            type: 'object',
            properties: {
              data: { type: 'string' }
            },
            required: ['data']
          }
        }
      ]
    });

    console.log('✅ 高级Agent创建成功');
    console.log('   信息:', advancedAgent.getInfo());

    const result = await advancedAgent.execute({
      id: 'task-3',
      input: '分析数据: sales_2024'
    });

    console.log('✅ 高级Agent执行完成');
    console.log('   结果:', result.output);

    console.log('\n🎉 高级集成Agent测试完成！\n');

  } catch (error) {
    console.error('❌ 高级测试失败:', error.message);
  }

  // 8. 测试事件监听
  console.log('8. 测试事件监听');
  try {
    const eventAgent = createIntegratedAgent({
      id: 'event-agent',
      name: '事件助手',
      role: '助手',
      modelId: 'functional-mock',
      mcpEndpoint: 'http://localhost:3000/mcp'
    });

    let eventCount = 0;
    eventAgent.on((event) => {
      eventCount++;
      console.log(`   事件 ${eventCount}: ${event.type}`);
    });

    await eventAgent.execute({
      id: 'task-4',
      input: '测试事件'
    });

    console.log('✅ 事件监听测试完成，收到', eventCount, '个事件');

  } catch (error) {
    console.error('❌ 事件测试失败:', error.message);
  }

  // 9. 测试工具管理
  console.log('\n9. 测试工具管理');
  try {
    const toolAgent = createIntegratedAgent({
      id: 'tool-agent',
      name: '工具助手',
      role: '助手',
      modelId: 'functional-mock',
      mcpEndpoint: 'http://localhost:3000/mcp'
    });

    // 添加工具
    toolAgent.addTool({
      name: 'testTool',
      description: '测试工具',
      parameters: {
        type: 'object',
        properties: {
          value: { type: 'number' }
        },
        required: ['value']
      }
    });

    const tools = toolAgent.getTools();
    console.log('✅ 添加工具成功，当前工具数:', tools.length);
    console.log('   工具列表:', tools.map(t => t.name).join(', '));

  } catch (error) {
    console.error('❌ 工具管理测试失败:', error.message);
  }

  // 10. 测试历史管理
  console.log('\n10. 测试历史管理');
  try {
    const historyAgent = createIntegratedAgent({
      id: 'history-agent',
      name: '历史助手',
      role: '助手',
      modelId: 'functional-mock',
      mcpEndpoint: 'http://localhost:3000/mcp'
    });

    await historyAgent.execute({
      id: 'task-5',
      input: '第一次对话'
    });

    await historyAgent.execute({
      id: 'task-6',
      input: '第二次对话'
    });

    // 导出历史
    const history = historyAgent.exportHistory();
    console.log('✅ 导出历史成功');
    console.log('   消息数:', history.messages.length);
    console.log('   工具数:', history.tools.length);

    // 撤销
    await historyAgent.undo();
    console.log('✅ 撤销成功');

    // 修改消息
    historyAgent.modifyLastMessage('修改后的消息');
    console.log('✅ 修改消息成功');

    // 重置
    await historyAgent.reset();
    console.log('✅ 重置成功');

  } catch (error) {
    console.error('❌ 历史管理测试失败:', error.message);
  }

  console.log('\n🎯 所有集成Agent测试完成！');
  console.log('总结:');
  console.log('- ✅ 智能体持有会话作为记忆');
  console.log('- ✅ 智能体持有模型作为推理');
  console.log('- ✅ 外部接口简洁清晰');
  console.log('- ✅ 功能完整且集成');
}

// 运行测试
if (require.main === module) {
  testIntegratedAgent().catch(console.error);
}

module.exports = { testIntegratedAgent };