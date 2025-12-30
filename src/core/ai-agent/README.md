# AI-Agent系统

## 📦 目录结构

```
src/core/ai-agent/
├── base/                    # 核心基础
│   ├── agent-core.ts       # 基础Agent类
│   ├── functional-agent.ts # 功能性Agent
│   ├── advanced-agent.ts   # 高级Agent
│   ├── model-factory.ts    # 模型工厂
│   ├── model-interface.ts  # 模型接口
│   ├── real-model.ts       # 真实模型
│   └── types.ts           # 类型定义
├── memory/                 # 记忆系统
│   └── simple-memory.ts   # 简单记忆
├── prompt-engine/         # 提示词工程（集成）
│   ├── types.ts          # 类型定义
│   ├── prompt-manager.ts # 核心管理器
│   ├── factory.ts       # 工厂方法
│   ├── index.ts         # 主入口
│   └── README.md        # 使用说明
├── session/              # 会话系统
│   ├── base-session.ts  # 会话基类
│   ├── chat-session.ts  # 连续对话
│   ├── template-session.ts # 模板会话
│   ├── mcp-session.ts   # MCP会话 ⭐新增
│   ├── types.ts         # 会话类型
│   └── index.ts         # 会话主入口
└── index.ts             # 系统主入口
```

---

## 🎯 核心组件

### 1. Agent类型

#### 功能性Agent
```typescript
import { FunctionalAgent } from './src/core/ai-agent';

const agent = new FunctionalAgent({
  id: 'simple-bot',
  name: '简单助手',
  role: 'Assistant',
  modelId: 'functional-model'
});
```

**特点**：
- ✅ 快速响应
- ✅ 低资源消耗
- ❌ 不支持工具调用

#### 高级Agent
```typescript
import { AdvancedAgent } from './src/core/ai-agent';

const agent = new AdvancedAgent({
  id: 'expert-bot',
  name: '专家助手',
  role: 'Senior Analyst',
  modelId: 'advanced-model',
  tools: [...]
});
```

**特点**：
- ✅ 自动推理
- ✅ 工具调用
- ✅ 复杂任务

### 2. 会话系统

#### 连续对话会话
```typescript
import { createChatSession } from './src/core/ai-agent';

const session = createChatSession('chat-1', {
  systemPrompt: '你是一个有用的助手',
  memoryWindow: 10
});

await session.start();
const response = await session.sendMessage('你好！');
await session.cancel();
```

#### 模板会话
```typescript
import { createTemplateSession, createSimpleWorkflow } from './src/core/ai-agent';

const workflow = createSimpleWorkflow('workflow-1', [
  { name: '分析', prompt: '分析数据: {{data}}' },
  { name: '总结', prompt: '总结结果' }
]);

const session = createTemplateSession('template-1', workflow, {
  initialVariables: { data: 'sales.csv' }
});

const result = await session.start();
```

#### MCP会话 ⭐新增
```typescript
import { createMCPSession, createMCPTool } from './src/core/ai-agent';

const session = createMCPSession('mcp-1', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  mcpHeaders: { 'Authorization': 'Bearer token' },
  tools: [
    createMCPTool('readFile', '读取文件', {
      type: 'object',
      properties: {
        path: { type: 'string' }
      },
      required: ['path']
    })
  ]
});

await session.start();
// 支持多种调用格式
await session.sendMessage('@readFile(path=/tmp/test.txt)');
await session.cancel();
```

**MCP会话特点**：
- ✅ 工具调用支持
- ✅ 多种调用格式
- ✅ 实时事件监控
- ✅ 上下文管理
- ✅ 历史记录导出

### 3. 提示词工程

```typescript
import { AgentPromptEngine } from './src/core/ai-agent';

const engine = new AgentPromptEngine();

// 快速创建Agent提示词
const prompt = engine.quickAgentPrompt(
  '数据分析专家',
  '分析sales.csv',
  'json'
);

// Agent执行
const result = await agent.execute({ id: 'task', input: prompt });
```

### 4. 记忆系统

```typescript
const stats = await agent.getMemoryStats();
const recent = await agent.getRecentMemories(5);
```

---

## 🚀 快速开始

### 1. 创建Agent

```typescript
import { createAgent } from './src/core/ai-agent';

// 功能性Agent
const simple = createAgent('functional', {
  id: 'simple',
  modelId: 'func-model'
});

// 高级Agent
const advanced = createAgent('advanced', {
  id: 'advanced',
  modelId: 'adv-model',
  tools: [...]
});
```

### 2. 创建会话

```typescript
import { 
  createChatSession, 
  createTemplateSession,
  createMCPSession 
} from './src/core/ai-agent';

// 连续对话
const chat = createChatSession('chat-1', {
  systemPrompt: '你是一个助手'
});

// 模板会话
const template = createTemplateSession('template-1', workflow);

// MCP会话
const mcp = createMCPSession('mcp-1', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  tools: [...]
});
```

### 3. 使用会话

```typescript
// 启动会话
await session.start();

// 发送消息
const response = await session.sendMessage('你好！');

// 监听事件
session.on((event) => {
  console.log(`事件: ${event.type}`);
});

// 取消会话
await session.cancel();
```

---

## 🎯 使用场景

### 场景1：简单问答
```typescript
const agent = createAgent('functional', { id: 'qa', modelId: 'func-model' });
const prompt = '你是一位助手。请简洁回答。';
const result = await agent.execute({ id: 'task', input: prompt + '\n问题：什么是AI?' });
```

### 场景2：代码生成
```typescript
const agent = createAgent('advanced', { 
  id: 'coder', 
  modelId: 'adv-model',
  tools: [{ name: 'readFile', ... }]
});

const engine = new AgentPromptEngine();
const prompt = engine.quickAgentPrompt('Python专家', '编写登录函数', 'markdown');

const result = await agent.execute({ id: 'task', input: prompt });
```

### 场景3：MCP工具调用
```typescript
import { createMCPSession, MCPSessionFactory } from './src/core/ai-agent';

// 方式1: 直接创建
const session = createMCPSession('mcp-1', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  tools: [
    {
      name: 'calculate',
      description: '计算器',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string' }
        },
        required: ['expression']
      }
    }
  ]
});

// 方式2: 使用工厂
const session = MCPSessionFactory.create('mcp-2', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  tools: [/* 工具定义 */]
});

await session.start();

// 调用工具 - 多种格式支持
await session.sendMessage('@calculate(expression=100+200)');
await session.sendMessage('calculate: expression=100+200');
await session.sendMessage('{"tool": "calculate", "params": {"expression": "100+200"}}');

// 普通对话
await session.sendMessage('你好，能帮我计算吗？');

await session.cancel();
```

### 场景4：带事件监控的MCP会话
```typescript
const session = createMCPSession('monitored', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  tools: [/* 工具定义 */]
});

// 监听所有事件
session.on((event) => {
  switch (event.type) {
    case 'tool-call':
      console.log(`🔧 调用: ${event.data.tool}`, event.data.arguments);
      break;
    case 'tool-result':
      console.log(`✅ 结果:`, event.data.result);
      break;
    case 'tool-error':
      console.log(`❌ 错误:`, event.data.error);
      break;
  }
});

await session.start();
await session.sendMessage('@readFile(path=/tmp/data.txt)');
await session.cancel();
```

### 场景5：会话历史管理
```typescript
const session = createMCPSession('history-demo', config);
await session.start();

// 执行一些操作
await session.sendMessage('@tool1(param=value)');

// 导出历史
const history = session.exportHistory();
console.log('历史:', JSON.stringify(history, null, 2));

// 导入历史到新会话
const newSession = createMCPSession('new-session', config);
newSession.importHistory(history);

// 查看工具列表
console.log('工具:', session.getTools());

// 操作消息
session.undo(); // 撤销
session.modifyLastMessage('修改内容'); // 修改
session.reset(); // 重置

await session.cancel();
```

---

## 💡 核心原则

1. **简单即美**：最小化复杂度
2. **清晰分层**：职责明确
3. **生产就绪**：包含错误处理、重试、监控
4. **易于扩展**：模块化设计
5. **MCP集成**：无缝外部工具集成

---

## 📊 架构概览

### Agent架构
```
用户任务
    ↓
[Agent选择] → 功能性 或 高级
    ↓
[模型推理] → 功能性模型 或 高级模型
    ↓
[工具调用] (仅高级Agent)
    ↓
[记忆存储]
    ↓
返回结果
```

### 会话架构
```
会话启动
    ↓
[事件触发] → start
    ↓
[消息处理] → 用户输入
    ↓
[工具调用] (MCP会话)
    ↓
[事件触发] → tool-call/tool-result
    ↓
[响应生成]
    ↓
[事件触发] → end
    ↓
会话结束
```

---

## ✅ 快速对比

### Agent类型对比
| 特性 | 功能性Agent | 高级Agent |
|------|------------|----------|
| 速度 | ⚡⚡⚡ | ⚡⚡ |
| 成本 | $ | $$$ |
| 工具 | ❌ | ✅ |
| 推理 | 简单 | 强大 |
| 场景 | 问答、生成 | 分析、代码 |

### 会话类型对比
| 特性 | 连续对话 | 模板会话 | MCP会话 |
|------|----------|----------|---------|
| 用途 | 自由对话 | 固定流程 | 工具调用 |
| 灵活性 | 高 | 中 | 高 |
| 工具支持 | ❌ | ❌ | ✅ |
| 事件系统 | ✅ | ✅ | ✅+工具事件 |
| 上下文 | ✅ | ✅ | ✅ |

---

## 🎉 总结

**核心概念**：
- **功能性Agent**：简单任务，快速响应
- **高级Agent**：复杂任务，工具调用
- **连续对话**：自由交流，记忆上下文
- **模板会话**：固定流程，结构化执行
- **MCP会话**：工具集成，外部交互

**使用口诀**：
```
简单任务 → 功能性Agent
复杂任务 → 高级Agent
需要工具 → 高级Agent + MCP会话
自由对话 → 连续对话会话
固定流程 → 模板会话
外部集成 → MCP会话
```

**一行代码创建**：
```typescript
const agent = createAgent('functional', config);     // 简单Agent
const agent = createAgent('advanced', config);       // 复杂Agent
const chat = createChatSession('id', config);        // 对话会话
const template = createTemplateSession('id', flow);  // 模板会话
const mcp = createMCPSession('id', config);          // MCP会话
```

**MCP会话快速开始**：
```typescript
import { createMCPSession, createMCPTool } from './src/core/ai-agent';

const session = createMCPSession('my-mcp', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  tools: [createMCPTool('toolName', '描述', { /* 参数 */ })]
});

await session.start();
await session.sendMessage('@toolName(param=value)');
await session.cancel();
```

**MCP会话优势**：
- 🚀 **快速集成**：轻松连接MCP服务器
- 🛠️ **工具丰富**：支持多种工具定义格式
- 📊 **实时监控**：完整的事件系统
- 🔒 **安全可靠**：参数验证和错误处理
- 📝 **历史管理**：导出/导入会话历史
- 🔄 **灵活扩展**：支持自定义工具处理器