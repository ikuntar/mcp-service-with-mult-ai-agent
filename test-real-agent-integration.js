/**
 * 集成测试：使用真实模型的Agent
 */

const path = require('path');

// 动态导入TypeScript模块（通过Node.js require）
async function loadAgentModule() {
  try {
    // 尝试从build目录加载（如果已编译）
    const buildPath = path.join(__dirname, 'build/core/ai-agent/index.js');
    const fs = require('fs');
    
    if (fs.existsSync(buildPath)) {
      console.log('使用编译后的模块...');
      return require(buildPath);
    }
    
    // 否则使用源码（需要ts-node或先编译）
    console.log('⚠️ 需要先编译TypeScript代码');
    console.log('请运行: npm run build');
    return null;
    
  } catch (error) {
    console.log('加载模块失败:', error.message);
    return null;
  }
}

// 使用RealModel直接测试
async function testWithRealModel() {
  console.log('🧪 使用真实模型测试\n');
  
  const { RealModel, RealModelFactory } = require('./src/core/ai-agent/base/real-model');
  
  // 从配置文件创建模型
  const model = RealModelFactory.fromConfigFile(path.join(__dirname, 'aichat-apikey.info'));
  
  console.log('模型信息:', model.getModelInfo());
  
  // 测试1：功能性推理
  console.log('\n--- 测试1: 功能性推理 ---');
  const task1 = '读取文件test.txt';
  console.log('任务:', task1);
  
  try {
    const result1 = await model.think(task1, { temperature: 0.7, maxTokens: 200 });
    console.log('✅ 推理成功');
    console.log('响应:', result1.content);
    console.log('工具调用:', result1.toolCalls);
  } catch (error) {
    console.log('❌ 失败:', error.message);
  }
  
  // 测试2：高级推理（带工具）
  console.log('\n--- 测试2: 高级推理（带工具）---');
  const task2 = '分析数据并读取文件';
  console.log('任务:', task2);
  
  const tools = [
    {
      name: 'readFile',
      description: '读取文件内容',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' }
        },
        required: ['path']
      }
    },
    {
      name: 'analyzeData',
      description: '分析数据',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'string', description: '要分析的数据' }
        },
        required: ['data']
      }
    }
  ];
  
  try {
    const result2 = await model.thinkWithTools(task2, tools, { temperature: 0.7, maxTokens: 300 });
    console.log('✅ 高级推理成功');
    console.log('响应:', result2.content);
    console.log('工具调用:', result2.toolCalls);
    
    if (result2.toolCalls && result2.toolCalls.length > 0) {
      console.log('\n检测到工具调用:');
      result2.toolCalls.forEach(call => {
        console.log(`  - ${call.name}:`, call.arguments);
      });
    }
  } catch (error) {
    console.log('❌ 失败:', error.message);
  }
  
  // 测试3：健康检查
  console.log('\n--- 测试3: 健康检查 ---');
  try {
    const healthy = await model.healthCheck();
    console.log('健康状态:', healthy ? '✅ 正常' : '❌ 异常');
  } catch (error) {
    console.log('❌ 检查失败:', error.message);
  }
  
  return { success: true };
}

// 测试完整的Agent流程
async function testCompleteAgentFlow() {
  console.log('\n\n=== 完整Agent流程测试 ===\n');
  
  const { RealModelFactory } = require('./src/core/ai-agent/base/real-model');
  const { FunctionalAgent } = require('./src/core/ai-agent/base/functional-agent');
  const { AdvancedAgent } = require('./src/core/ai-agent/base/advanced-agent');
  
  // 创建真实模型
  const model = RealModelFactory.fromConfigFile(path.join(__dirname, 'aichat-apikey.info'));
  
  // 测试功能性Agent
  console.log('--- 功能性Agent ---');
  const funcAgent = new FunctionalAgent({
    id: 'real-func-agent',
    name: '真实功能助手',
    role: '文本处理',
    modelId: 'real-mimo-v2-flash'
  });
  
  // 手动注入真实模型
  funcAgent.model = model;
  
  try {
    const result1 = await funcAgent.execute({
      id: 'test-1',
      input: '读取文件config.json'
    });
    console.log('✅ 功能性Agent执行成功');
    console.log('结果:', result1.output);
  } catch (error) {
    console.log('❌ 功能性Agent失败:', error.message);
  }
  
  // 测试高级Agent
  console.log('\n--- 高级Agent ---');
  const tools = [
    {
      name: 'readFile',
      description: '读取文件',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path']
      }
    }
  ];
  
  const advAgent = new AdvancedAgent({
    id: 'real-adv-agent',
    name: '真实智能助手',
    role: '复杂任务处理',
    modelId: 'real-mimo-v2-flash',
    tools: tools
  });
  
  // 手动注入真实模型
  advAgent.model = model;
  
  try {
    const result2 = await advAgent.execute({
      id: 'test-2',
      input: '读取文件data.txt并分析'
    });
    console.log('✅ 高级Agent执行成功');
    console.log('结果:', result2.output);
  } catch (error) {
    console.log('❌ 高级Agent失败:', error.message);
  }
  
  return { success: true };
}

// 主测试函数
async function main() {
  console.log('🎯 AI-Agent 真实模型集成测试\n');
  
  try {
    // 1. 直接测试RealModel
    await testWithRealModel();
    
    // 2. 测试完整Agent流程
    await testCompleteAgentFlow();
    
    console.log('\n\n✅ 所有集成测试完成！');
    
  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
    console.log(error.stack);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { testWithRealModel, testCompleteAgentFlow };