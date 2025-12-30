/**
 * 三种提示词类型测试
 * 系统提示词 + 追加提示词 + 拼接提示词
 */

const { 
  PromptManager, 
  SystemPromptFactory, 
  AppendPromptFactory,
  ConcatenatePromptFactory,
  PromptComposition,
  SimplePrompt
} = require('../src/core/ai-agent/prompt-engine/index.ts');

console.log('🚀 三种提示词类型测试\n');

// ==================== 测试1：三种类型基础使用 ====================
console.log('1. 三种类型基础使用');
console.log('─'.repeat(50));

const manager1 = new PromptManager();

// 1.1 系统提示词（固定格式）
manager1.registerSystemPrompt({
  id: 'system-fixed',
  name: '系统固定',
  format: 'fixed',
  content: '你是一位助手。'
});

// 1.2 追加提示词（固定格式）
manager1.registerAppendPrompt({
  id: 'append-fixed',
  name: '追加固定',
  format: 'fixed',
  content: '请简洁回答。',
  position: 'after'
});

// 1.3 拼接提示词（固定格式）
manager1.registerConcatenatePrompt({
  id: 'concat-fixed',
  name: '拼接固定',
  format: 'fixed',
  content: '额外数据：sales.csv',
  target: {
    promptId: 'system-fixed',
    variableName: 'extra'
  },
  mode: 'replace'
});

// 组合（只有系统和追加，因为系统没有变量）
const result1 = manager1.composePrompt('system-fixed', ['append-fixed'], []);
console.log('结果1:', result1.content);

// ==================== 测试2：模板格式 ====================
console.log('\n2. 模板格式');
console.log('─'.repeat(50));

const manager2 = new PromptManager();

// 2.1 系统提示词（模板格式）
manager2.registerSystemPrompt({
  id: 'system-template',
  name: '系统模板',
  format: 'template',
  template: '你是一位{{role}}专家。\n数据：{{data}}',
  variables: [
    { name: 'role', type: 'string', required: true },
    { name: 'data', type: 'string', required: false, default: '无数据' }
  ]
});

// 2.2 追加提示词（模板格式）
manager2.registerAppendPrompt({
  id: 'append-template',
  name: '追加模板',
  format: 'template',
  template: '输出格式：{{format}}',
  variables: [
    { name: 'format', type: 'string', required: true }
  ],
  position: 'after'
});

// 2.3 拼接提示词（模板格式）
manager2.registerConcatenatePrompt({
  id: 'concat-template',
  name: '拼接模板',
  format: 'template',
  template: '用户：{{user}}，时间：{{time}}',
  variables: [
    { name: 'user', type: 'string', required: true },
    { name: 'time', type: 'string', required: false, default: '2024' }
  ],
  target: {
    promptId: 'system-template',
    variableName: 'data'
  },
  mode: 'append'
});

// 组合
const result2 = manager2.composePrompt(
  'system-template',
  ['append-template'],
  ['concat-template'],
  {
    role: '数据分析',
    format: 'JSON',
    user: '张三'
  }
);
console.log('结果2:', result2.content);

// ==================== 测试3：工厂方法 ====================
console.log('\n3. 工厂方法');
console.log('─'.repeat(50));

// 系统提示词工厂
const system = SystemPromptFactory.createRole('expert', '编程专家', ['Python', 'Java']);
manager1.registerSystemPrompt(system);

// 追加提示词工厂
const append = AppendPromptFactory.createFormat('json-format', 'JSON格式');
manager1.registerAppendPrompt(append);

// 拼接提示词工厂
const concat = ConcatenatePromptFactory.createReplace(
  'task-inject',
  '任务注入',
  '任务：编写登录函数',
  { promptId: 'expert', variableName: 'task' }
);
manager1.registerConcatenatePrompt(concat);

// 组合
const result3 = manager1.composePrompt('expert', ['json-format'], ['task-inject']);
console.log('结果3:', result3.content);

// ==================== 测试4：组合工厂 ====================
console.log('\n4. 组合工厂');
console.log('─'.repeat(50));

const composition = PromptComposition.advancedWithConcatenate(
  '数据分析师',
  '分析销售数据',
  '数据源：sales.csv'
);

const manager4 = new PromptManager();
manager4.registerSystemPrompt(composition.system);
composition.append.forEach(p => manager4.registerAppendPrompt(p));
composition.concatenate.forEach(p => manager4.registerConcatenatePrompt(p));

const result4 = manager4.composePrompt(
  composition.system.id,
  composition.append.map(p => p.id),
  composition.concatenate.map(p => p.id)
);
console.log('结果4:', result4.content);

// ==================== 测试5：快速API ====================
console.log('\n5. 快速API');
console.log('─'.repeat(50));

// 系统提示词
const s = SimplePrompt.system('你是一位专家。');
console.log('系统:', s);

// 追加提示词
const a = SimplePrompt.append('请使用JSON格式。', 'after');
console.log('追加:', a);

// 拼接提示词
const c = SimplePrompt.concatenate(
  '额外数据：sales.csv',
  'system-id',
  'data',
  'replace'
);
console.log('拼接:', c);

// 组合
const compose = SimplePrompt.compose(
  '你是一位{{role}}专家。',
  ['请提供代码。'],
  [
    {
      content: 'role=Python',
      targetPromptId: 'system-id',
      targetVariableName: 'role',
      mode: 'replace'
    }
  ]
);
console.log('组合:', compose);

// ==================== 测试6：三种类型协作 ====================
console.log('\n6. 三种类型协作场景');
console.log('─'.repeat(50));

const manager6 = new PromptManager();

// 系统：定义基础角色
manager6.registerSystemPrompt({
  id: 'base-system',
  name: '基础角色',
  format: 'template',
  template: '你是一位{{role}}。\n任务：{{task}}',
  variables: [
    { name: 'role', type: 'string', required: true },
    { name: 'task', type: 'string', required: true }
  ]
});

// 追加：增强功能
manager6.registerAppendPrompt({
  id: 'quality-check',
  name: '质量检查',
  format: 'fixed',
  content: '质量要求：准确、完整、清晰',
  position: 'after'
});

// 拼接：动态注入
manager6.registerConcatenatePrompt({
  id: 'inject-role',
  name: '注入角色',
  format: 'fixed',
  content: 'Python开发专家',
  target: {
    promptId: 'base-system',
    variableName: 'role'
  },
  mode: 'replace'
});

manager6.registerConcatenatePrompt({
  id: 'inject-task',
  name: '注入任务',
  format: 'fixed',
  content: '编写用户登录验证函数',
  target: {
    promptId: 'base-system',
    variableName: 'task'
  },
  mode: 'replace'
});

// 组合
const result6 = manager6.composePrompt(
  'base-system',
  ['quality-check'],
  ['inject-role', 'inject-task']
);
console.log('结果6:', result6.content);

// ==================== 测试7：错误处理 ====================
console.log('\n7. 错误处理');
console.log('─'.repeat(50));

const manager7 = new PromptManager({ strictMode: true });

try {
  // 缺少必填变量
  manager7.registerSystemPrompt({
    id: 'test',
    format: 'template',
    template: '任务：{{task}}',
    variables: [
      { name: 'task', type: 'string', required: true }
    ]
  });
  
  const result = manager7.renderSystemPrompt('test', {});
  console.log('错误结果:', result);
} catch (e) {
  console.log('捕获错误:', e.message);
}

// ==================== 测试8：完整工作流 ====================
console.log('\n8. 完整工作流');
console.log('─'.repeat(50));

const manager8 = new PromptManager();

// 步骤1：系统提示词
manager8.registerSystemPrompt(
  SystemPromptFactory.createTemplate(
    'workflow-system',
    '工作流系统',
    '角色：{{role}}\n上下文：{{context}}\n任务：{{task}}',
    [
      { name: 'role', type: 'string', required: true },
      { name: 'context', type: 'string', required: false, default: '无' },
      { name: 'task', type: 'string', required: true }
    ]
  )
);

// 步骤2：追加提示词（格式要求）
manager8.registerAppendPrompt(
  AppendPromptFactory.createOutputFormat('workflow-format', 'json')
);

// 步骤3：追加提示词（质量检查）
manager8.registerAppendPrompt(
  AppendPromptFactory.createQualityCheck('workflow-quality', ['准确性', '完整性'])
);

// 步骤4：拼接提示词（注入角色）
manager8.registerConcatenatePrompt(
  ConcatenatePromptFactory.createReplace(
    'inject-role',
    '注入角色',
    '高级分析师',
    { promptId: 'workflow-system', variableName: 'role' }
  )
);

// 步骤5：拼接提示词（注入任务）
manager8.registerConcatenatePrompt(
  ConcatenatePromptFactory.createReplace(
    'inject-task',
    '注入任务',
    '分析2024年销售数据',
    { promptId: 'workflow-system', variableName: 'task' }
  )
);

// 步骤6：拼接提示词（注入上下文）
manager8.registerConcatenatePrompt(
  ConcatenatePromptFactory.createAppend(
    'inject-context',
    '注入上下文',
    '数据源：sales.csv',
    { promptId: 'workflow-system', variableName: 'context' }
  )
);

// 组合
const result8 = manager8.composePrompt(
  'workflow-system',
  ['workflow-format', 'workflow-quality'],
  ['inject-role', 'inject-task', 'inject-context']
);

console.log('完整工作流结果:');
console.log(result8.content);

// ==================== 测试9：导出导入 ====================
console.log('\n9. 导出导入');
console.log('─'.repeat(50));

const exported = manager8.export();
console.log('导出数据:', JSON.stringify(exported, null, 2).substring(0, 200) + '...');

const manager9 = new PromptManager();
manager9.import(exported);
const result9 = manager9.composePrompt(
  'workflow-system',
  ['workflow-format', 'workflow-quality'],
  ['inject-role', 'inject-task', 'inject-context']
);
console.log('导入后渲染:', result9.content.substring(0, 100) + '...');

console.log('\n✅ 所有测试完成！');