// 性能测试：JSON初始化 vs 代码初始化
import { SystemPromptFactory, PromptManager } from './src/core/ai-agent/prompt-engine';

console.log('=== 性能测试 ===\n');

// 测试1：初始化100个提示词
console.log('测试1：初始化100个提示词');
console.time('代码初始化');
const manager1 = new PromptManager();
for (let i = 0; i < 100; i++) {
  manager1.registerSystemPrompt(
    SystemPromptFactory.createFixed(`p${i}`, `测试${i}`, `内容${i}`)
  );
}
console.timeEnd('代码初始化');

console.time('JSON初始化');
const manager2 = new PromptManager();
const jsonConfig = {
  systemPrompts: Array.from({ length: 100 }, (_, i) => ({
    id: `p${i}`,
    name: `测试${i}`,
    format: 'fixed',
    content: `内容${i}`
  }))
};
manager2.import(jsonConfig);
console.timeEnd('JSON初始化');

// 测试2：渲染1000次
console.log('\n测试2：渲染1000次');
const data = { name: 'test', task: 'demo' };

console.time('代码渲染');
for (let i = 0; i < 1000; i++) {
  manager1.renderSystemPrompt('p0', data);
}
console.timeEnd('代码渲染');

console.time('JSON渲染');
for (let i = 0; i < 1000; i++) {
  manager2.renderSystemPrompt('p0', data);
}
console.timeEnd('JSON渲染');

// 测试3：内存占用
console.log('\n测试3：内存占用');
const mem1 = process.memoryUsage().heapUsed;
const manager3 = new PromptManager();
for (let i = 0; i < 1000; i++) {
  manager3.registerSystemPrompt(
    SystemPromptFactory.createFixed(`p${i}`, `测试${i}`, `内容${i}`)
  );
}
const mem2 = process.memoryUsage().heapUsed;
console.log(`代码初始化内存: ${((mem2 - mem1) / 1024 / 1024).toFixed(2)} MB`);

const mem3 = process.memoryUsage().heapUsed;
const manager4 = new PromptManager();
const largeJson = {
  systemPrompts: Array.from({ length: 1000 }, (_, i) => ({
    id: `p${i}`,
    name: `测试${i}`,
    format: 'fixed',
    content: `内容${i}`
  }))
};
manager4.import(largeJson);
const mem4 = process.memoryUsage().heapUsed;
console.log(`JSON初始化内存: ${((mem4 - mem3) / 1024 / 1024).toFixed(2)} MB`);

console.log('\n=== 测试完成 ===');
