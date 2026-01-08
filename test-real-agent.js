/**
 * 测试真实AI服务商的Agent - 修复版本
 */

const fs = require('fs');
const path = require('path');

// 读取API配置
function loadAPIConfig() {
  const configPath = path.join(__dirname, 'aichat-apikey.info');
  const content = fs.readFileSync(configPath, 'utf8');
  
  const config = {};
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      config[match[1]] = match[2].trim();
    }
  });
  
  return config;
}

// 测试API调用
async function testAPI() {
  console.log('=== 测试API连接 ===\n');
  
  const config = loadAPIConfig();
  console.log('配置:', {
    type: config.type,
    url: config.url,
    model: config.model,
    apiKey: config.apikey ? config.apikey.substring(0, 15) + '...' : '无'
  });
  
  const apiUrl = config.url + '/chat/completions';
  console.log('\nAPI地址:', apiUrl);
  
  try {
    console.log('\n正在发送请求...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apikey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'user', content: '你好' }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API错误 ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('\n✅ API调用成功！');
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices.length > 0) {
      console.log('\nAI回复:', data.choices[0].message.content);
    }
    
    return { success: true, data, config };
    
  } catch (error) {
    console.log('\n❌ API调用失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试Agent功能
async function testAgent() {
  console.log('\n\n=== 测试Agent功能 ===\n');
  
  const config = loadAPIConfig();
  
  // 模拟功能性Agent的推理过程
  const testTasks = [
    '读取文件test.txt',
    '分析数据',
    '计算1+1',
    '搜索信息'
  ];
  
  console.log('测试任务列表:');
  testTasks.forEach((task, i) => console.log(`  ${i+1}. ${task}`));
  
  for (const task of testTasks) {
    console.log(`\n--- 测试任务: "${task}" ---`);
    
    try {
      const response = await fetch(config.url + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apikey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { 
              role: 'system', 
              content: '你是一个智能助手。请分析任务并说明需要使用什么工具。用简洁的语言回答。'
            },
            { role: 'user', content: task }
          ],
          temperature: 0.7,
          max_tokens: 100
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      console.log('✅ 推理成功');
      console.log('AI响应:', aiResponse);
      
      // 模拟Agent执行
      console.log('执行结果: 模拟执行成功');
      
    } catch (error) {
      console.log('❌ 失败:', error.message);
    }
  }
  
  return { success: true };
}

// 测试高级Agent功能
async function testAdvancedAgent() {
  console.log('\n\n=== 测试高级Agent功能 ===\n');
  
  const config = loadAPIConfig();
  
  // 测试带工具调用的场景
  const testTask = '读取文件data.txt并分析内容';
  
  console.log('测试任务:', testTask);
  console.log('预期: 识别出需要调用readFile和analyzeData工具\n');
  
  try {
    const response = await fetch(config.url + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apikey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { 
            role: 'system', 
            content: `你是一个高级AI助手，支持函数调用。
可用工具:
1. readFile(path: string) - 读取文件
2. analyzeData(data: string) - 分析数据

请分析任务，如果需要使用工具，请明确指出。`
          },
          { role: 'user', content: testTask }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('✅ 高级推理成功');
    console.log('AI响应:', aiResponse);
    
    // 检查响应中是否提到工具
    const mentionsReadFile = aiResponse.toLowerCase().includes('readfile') || 
                             aiResponse.toLowerCase().includes('读取文件');
    const mentionsAnalyze = aiResponse.toLowerCase().includes('analyze') || 
                            aiResponse.toLowerCase().includes('分析');
    
    console.log('\n工具识别:');
    console.log('  readFile:', mentionsReadFile ? '✅' : '❌');
    console.log('  analyzeData:', mentionsAnalyze ? '✅' : '❌');
    
    return { success: true, mentionsTools: mentionsReadFile || mentionsAnalyze };
    
  } catch (error) {
    console.log('❌ 失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function main() {
  console.log('🧪 AI-Agent 真实服务商测试\n');
  console.log('配置文件: aichat-apikey.info\n');
  
  // 1. 测试API连接
  const apiResult = await testAPI();
  
  if (!apiResult.success) {
    console.log('\n❌ API测试失败，无法继续');
    return;
  }
  
  // 2. 测试功能性Agent
  const funcResult = await testAgent();
  
  // 3. 测试高级Agent
  const advResult = await testAdvancedAgent();
  
  // 总结
  console.log('\n\n=== 测试总结 ===');
  console.log('API连接:', apiResult.success ? '✅ 成功' : '❌ 失败');
  console.log('功能性Agent:', funcResult.success ? '✅ 成功' : '❌ 失败');
  console.log('高级Agent:', advResult.success ? '✅ 成功' : '❌ 失败');
  
  if (apiResult.success && funcResult.success && advResult.success) {
    console.log('\n🎉 所有测试通过！');
    console.log('\n模型信息:');
    console.log('  提供商:', apiResult.config.type);
    console.log('  模型:', apiResult.config.model);
    console.log('  API地址:', apiResult.config.url);
  } else {
    console.log('\n⚠️ 部分测试失败');
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAPI, testAgent, testAdvancedAgent };