/**
 * 简化版提示词工程测试
 * 演示系统提示词和追加提示词的使用
 */

const { 
  PromptManager, 
  SystemPromptFactory, 
  AppendPromptFactory,
  PromptComposition,
  createPromptManager,
  SimplePrompt
} = require('../src/core/prompt-engine/simple/index.ts');

console.log('🚀 简化版提示词工程测试\n');

// ==================== 测试1：固定格式 ====================
console.log('1. 固定格式提示词');
console.log('─'.repeat(50));

const manager1 = new PromptManager();

// 系统提示词（固定格式）
manager1.registerSystemPrompt({
  id: 'fixed-system',
  name: '固定系统提示词',
  format: 'fixed',
  content: '你是一位助手。请简洁回答问题。'
});

// 追加提示词（固定格式）
manager1.registerAppendPrompt({
  id: 'fixed-append',
  name: '固定追加提示词',
  format: 'fixed',
  content: '请直接回答，不要多余解释。',
  position: 'after'
});

const result1 = manager1.composePrompt('fixed-system', ['fixed-append']);
console.log('结果:', result1.content);

// ==================== 测试2：模板格式 ====================
console.log('\n2. 模板格式提示词');
console.log('─'.repeat(50));

const manager2 = new PromptManager();

// 系统提示词（模板格式）
manager2.registerSystemPrompt({
  id: 'template-system',
  name: '模板系统提示词',
  format: 'template',
  template: '你是一位{{role}}专家。请分析以下{{domain}}数据。',
  variables: [
    { name: 'role', type: 'string', required: true },
    { name: 'domain', type: 'string', required: true, default: '技术' }
  ]
});

// 追加提示词（模板格式）
manager2.registerAppendPrompt({
  id: 'template-append',
  name: '模板追加提示词',
  format: 'template',
  template: '输出格式：\n- 摘要：{{summary}}\n- 建议：{{suggestions}}',
  variables: [
    { name: 'summary', type: 'string', required: true },
    { name: 'suggestions', type: 'string', required: false, default: '暂无' }
  ],
  position: 'after'
});

const result2 = manager2.composePrompt(
  'template-system',
  ['template-append'],
  {
    role: '数据分析',
    domain: '销售',
    summary: '增长趋势良好',
    suggestions: '继续扩大市场'
  }
);
console.log('结果:', result2.content);

// ==================== 测试3：工厂快速创建 ====================
console.log('\n3. 工厂快速创建');
console.log('─'.repeat(50));

// 使用工厂创建
const systemPrompt = SystemPromptFactory.createFixed(
  'factory-system',
  '工厂系统提示词',
  '你是一位专业的编程助手。'
);

const appendPrompt = AppendPromptFactory.createStepByStep(
  'factory-steps',
  ['理解需求', '设计方案', '编写代码', '测试验证']
);

const manager3 = new PromptManager();
manager3.registerSystemPrompt(systemPrompt);
manager3.registerAppendPrompt(appendPrompt);

const result3 = manager3.composePrompt('factory-system', ['factory-steps']);
console.log('结果:', result3.content);

// ==================== 测试4：组合工厂 ====================
console.log('\n4. 组合工厂');
console.log('─'.repeat(50));

const composition = PromptComposition.simpleQA('中文');
const manager4 = new PromptManager();
manager4.registerSystemPrompt(composition.system);
composition.append.forEach(p => manager4.registerAppendPrompt(p));

const result4 = manager4.composePrompt(
  composition.system.id,
  composition.append.map(p => p.id)
);
console.log('结果:', result4.content);

// ==================== 测试5：快速API ====================
console.log('\n5. 快速API');
console.log('─'.repeat(50));

// 快速系统提示词
const quickSystem = SimplePrompt.system('你是一位助手。');
console.log('快速系统:', quickSystem);

// 快速追加提示词
const quickAppend = SimplePrompt.append('请简洁回答。', 'after');
console.log('快速追加:', quickAppend);

// 快速组合
const quickCompose = SimplePrompt.compose(
  '你是一位编程专家。',
  ['请提供代码示例。', '使用Python语言。']
);
console.log('快速组合:', quickCompose);

// ==================== 测试6：复杂场景 ====================
console.log('\n6. 复杂场景 - 代码生成');
console.log('─'.repeat(50));

const codeComposition = PromptComposition.codeGeneration('Python', '用户登录验证');
const manager6 = new PromptManager();
manager6.registerSystemPrompt(codeComposition.system);
codeComposition.append.forEach(p => manager6.registerAppendPrompt(p));

const result6 = manager6.composePrompt(
  codeComposition.system.id,
  codeComposition.append.map(p => p.id),
  {
    task: '用户登录验证',
    language: 'Python',
    style: 'clean'
  }
);
console.log('结果:', result6.content);

// ==================== 测试7：位置控制 ====================
console.log('\n7. 位置控制测试');
console.log('─'.repeat(50));

const manager7 = new PromptManager();

manager7.registerSystemPrompt({
  id: 'base-system',
  name: '基础系统',
  format: 'fixed',
  content: '基础内容'
});

manager7.registerAppendPrompt({
  id: 'before-append',
  name: '前置追加',
  format: 'fixed',
  content: '前置内容',
  position: 'before'
});

manager7.registerAppendPrompt({
  id: 'after-append',
  name: '后置追加',
  format: 'fixed',
  content: '后置内容',
  position: 'after'
});

manager7.registerAppendPrompt({
  id: 'replace-append',
  name: '替换追加',
  format: 'fixed',
  content: '替换内容',
  position: 'replace'
});

console.log('前置组合:', manager7.composePrompt('base-system', ['before-append']).content);
console.log('后置组合:', manager7.composePrompt('base-system', ['after-append']).content);
console.log('替换组合:', manager7.composePrompt('base-system', ['replace-append']).content);

// ==================== 测试8：错误处理 ====================
console.log('\n8. 错误处理');
console.log('─'.repeat(50));

const manager8 = new PromptManager({ strictMode: true });

try {
  // 尝试渲染不存在的提示词
  const result = manager8.renderSystemPrompt('non-existent');
  console.log('错误结果:', result);
} catch (e) {
  console.log('捕获错误:', e.message);
}

// 验证变量
const validation = manager8.validateVariables(
  [
    { name: 'name', type: 'string', required: true },
    { name: 'age', type: 'number', required: false }
  ],
  { name: '张三' }
);
console.log('变量验证:', validation);

// ==================== 测试9：导出导入 ====================
console.log('\n9. 导出导入');
console.log('─'.repeat(50));

const manager9 = new PromptManager();
manager9.registerSystemPrompt(SystemPromptFactory.createFixed('test', '测试', '内容'));
manager9.registerAppendPrompt(AppendPromptFactory.createFormat('format', 'JSON格式'));

const exported = manager9.export();
console.log('导出数据:', JSON.stringify(exported, null, 2));

const manager10 = new PromptManager();
manager10.import(exported);
const result10 = manager10.composePrompt('test', ['format']);
console.log('导入后渲染:', result10.content);

console.log('\n✅ 所有测试完成！');