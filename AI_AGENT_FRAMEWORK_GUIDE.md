# AI Agent框架使用指南

## 🚀 框架概述

这是一个完整的AI Agent框架，提供了从简单到复杂的各种AI代理功能。框架支持多服务商、提示词工程、会话管理、工作流模板等核心功能。

## 📦 核心组件

### 1. Agent系统

#### 功能性Agent (FunctionalAgent)
适用于简单任务，快速响应，低资源消耗

```typescript
import { createDefaultFunctionalAgent, createFunctionalAgent } from './src/core/ai-agent';

// 使用默认配置
const agent = createDefaultFunctionalAgent();

// 自定义配置
const customAgent = createFunctionalAgent({
  id: 'my-agent',
  name: '我的助手',
  role: '客服',
  modelId: 'functional-mock'
});
```

#### 高级Agent (AdvancedAgent)
适用于复杂任务，支持工具调用和推理

```typescript
import { createDefaultAdvancedAgent, createAdvancedAgent, defineTool } from './src/core/ai-agent';

// 使用默认配置
const agent = createDefaultAdvancedAgent();

// 自定义配置
const searchTool = defineTool('search', '搜索信息', {
  type: 'object',
  properties: { query: { type: 'string' } },
  required: ['query']
});

const customAgent = createAdvancedAgent({
  id: 'expert-agent',
  name: '专家助手',
  role: '分析师',
  modelId: 'advanced-mock',
  tools: [searchTool]
});
```

### 2. 提示词工程

#### 创建提示词管理器
```typescript
import { PromptManager, SystemPromptFactory, AppendPromptFactory } from './src/core/ai-agent';

const manager = new PromptManager();

// 创建系统提示词
const systemPrompt = SystemPromptFactory.createRole('analyst', '数据分析师', ['统计', '可视化']);
manager.registerSystemPrompt(systemPrompt);

// 创建追加提示词
const formatPrompt = AppendPromptFactory.createOutputFormat('json-format', 'json');
manager.registerAppendPrompt(formatPrompt);

// 组合提示词
const finalPrompt = manager.composePrompt('analyst', ['json-format']);
```

#### 快速创建Agent提示词
```typescript
import { createPromptIntegration } from './src/core/ai-agent';

const integration = await createPromptIntegration();
const prompt = integration.createAgentPrompt('Python专家', '编写排序函数', {
  format: 'json',
  qualityCheck: true
});
```

### 3. 会话系统

#### 连续对话会话
```typescript
import { createChatSession } from './src/core/ai-agent';

const session = createChatSession('chat-001', {
  systemPrompt: '你是一个友好的助手',
  memoryWindow: 10,
  timeout: 300000
});

await session.start();
const response = await session.sendMessage('你好，请介绍一下自己');
const history = session.exportHistory();
await session.cancel(); // 取消会话
```

#### 模板工作流会话
```typescript
import { createTemplateSession, createSimpleWorkflow } from './src/core/ai-agent';

const workflow = createSimpleWorkflow('data-analysis', [
  { name: '数据收集', prompt: '收集{{domain}}数据' },
  { name: '数据分析', prompt: '分析数据并找出关键趋势' },
  { name: '报告生成', prompt: '生成详细报告' }
]);

const session = createTemplateSession('workflow-001', workflow, {
  initialVariables: { domain: '销售' }
});

const result = await session.start();
const steps = session.getStepResults();
```

### 4. Agent执行任务

```typescript
// 执行简单任务
const result = await agent.execute({
  id: 'task-001',
  input: '读取配置文件'
});

console.log('成功:', result.success);
console.log('输出:', result.output);
console.log('错误:', result.error);
```

### 5. 记忆系统

```typescript
// 获取记忆统计
const stats = await agent.getMemoryStats();
console.log('总记忆数:', stats.total);
console.log('按类型:', stats.byType);

// 获取最近记忆
const recent = await agent.getRecentMemories(5);
recent.forEach(memory => {
  console.log(`[${memory.type}] ${memory.content}`);
});
```

## 🎯 使用场景

### 场景1：简单问答
```typescript
const agent = createDefaultFunctionalAgent();
const result = await agent.execute({
  id: 'qa-001',
  input: '什么是人工智能？'
});
```

### 场景2：代码生成
```typescript
const searchTool = defineTool('readFile', '读取文件', {
  type: 'object',
  properties: { path: { type: 'string' } }
});

const agent = createAdvancedAgent({
  id: 'coder',
  name: '代码助手',
  role: '开发者',
  modelId: 'advanced-mock',
  tools: [searchTool]
});

const result = await agent.execute({
  id: 'code-001',
  input: '编写一个Python登录函数'
});
```

### 场景3：数据分析
```typescript
const agent = createAdvancedAgent({
  id: 'analyst',
  name: '数据分析师',
  role: '分析师',
  modelId: 'advanced-mock',
  tools: [searchTool]
});

const result = await agent.execute({
  id: 'analysis-001',
  input: '分析销售数据并生成报告'
});
```

### 场景4：多轮对话
```typescript
const session = createChatSession('customer-service', {
  systemPrompt: '你是一个专业的客服助手',
  memoryWindow: 5
});

await session.start();

// 第一轮
const response1 = await session.sendMessage('我的订单状态如何？');

// 第二轮（基于上下文）
const response2 = await session.sendMessage('可以取消吗？');

// 查看完整对话
const history = session.getConversationHistory();
```

### 场景5：自动化工作流
```typescript
const workflow = createSimpleWorkflow('content-creation', [
  { name: '研究', prompt: '研究{{topic}}的最新发展' },
  { name: '大纲', prompt: '创建内容大纲' },
  { name: '写作', prompt: '撰写完整文章' },
  { name: '校对', prompt: '检查语法和事实' }
]);

const session = createTemplateSession('content-workflow', workflow, {
  initialVariables: { topic: 'AI技术' }
});

const result = await session.start();
console.log('工作流完成:', result.status);
```

## 🔧 高级功能

### 多服务商支持
```typescript
import { ProviderConfigManager } from './src/core/ai-agent';

const manager = ProviderConfigManager.getInstance();
manager.loadFromEnv(); // 从环境变量加载

// 获取支持特定能力的服务商
const textProviders = manager.getProvidersByCapability('text');
const multimodalProviders = manager.getProvidersByCapability('multimodal');
```

### 重试机制
```typescript
const agent = createFunctionalAgent({
  id: 'retry-agent',
  name: '重试测试',
  role: '测试',
  modelId: 'functional-mock',
  maxRetries: 3,
  baseRetryDelay: 500  // 指数退避：500ms, 1000ms, 2000ms
});
```

### 状态管理
```typescript
// 检查Agent状态
const state = agent.getState(); // 'initialized', 'idle', 'planning', 'executing', 'error', 'stopped'

// 停止Agent
await agent.stop();

// 获取完整信息
const info = agent.getInfo();
```

## 📊 性能特性

- **快速响应**: 功能性Agent优化了响应速度
- **可靠执行**: 内置重试机制和错误处理
- **记忆持久化**: 支持记忆存储和检索
- **状态跟踪**: 完整的状态管理系统
- **多服务商**: 支持主备服务商切换

## 🎨 最佳实践

1. **选择合适的Agent类型**:
   - 简单任务 → 功能性Agent
   - 复杂任务 → 高级Agent

2. **合理配置参数**:
   - 超时时间根据任务复杂度调整
   - 记忆窗口大小根据对话长度设置
   - 重试次数根据API稳定性配置

3. **使用提示词工程**:
   - 利用工厂方法快速创建提示词
   - 组合多个提示词构建复杂指令
   - 使用模板变量提高灵活性

4. **会话管理**:
   - 及时清理不需要的会话
   - 合理设置记忆窗口
   - 导出重要会话历史

## 🔗 与MCP框架集成

AI Agent框架可以与MCP框架无缝集成：

```typescript
import { UnifiedExecutorLayer } from './src/core/executor';
import { createDefaultFunctionalAgent } from './src/core/ai-agent';

// 创建Agent
const agent = createDefaultFunctionalAgent();

// 创建执行器
const executor = new UnifiedExecutorLayer({
  name: 'AI Agent执行器',
  description: '执行AI Agent任务'
});

// 在执行器中使用Agent
const result = await executor.execute({
  tool: 'ai-agent-execute',
  input: { task: '分析数据' }
});
```

## 📝 总结

这个AI Agent框架提供了：

- ✅ **双模式Agent**: 功能性和高级Agent
- ✅ **提示词工程**: 完整的提示词管理系统
- ✅ **会话系统**: 连续对话和工作流模板
- ✅ **记忆系统**: 持久化记忆和检索
- ✅ **工具系统**: 工具定义和调用
- ✅ **多服务商**: OpenAI、Anthropic、Gemini、本地模型
- ✅ **重试机制**: 指数退避重试
- ✅ **状态管理**: 完整的生命周期管理
- ✅ **类型安全**: 完整的TypeScript类型定义

框架设计简洁易用，同时提供了强大的扩展能力，适合各种AI应用场景。