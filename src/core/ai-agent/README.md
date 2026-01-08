# AI-Agent系统

## 📦 模块结构

```
src/core/ai-agent/
├── base/
│   ├── functional-agent.ts      # 功能性Agent（无Token生态）
│   ├── advanced-agent.ts        # 高级Agent（完整Token生态）
│   ├── model-factory.ts         # 模型工厂
│   └── types.ts                 # 基础类型
├── session/
│   ├── base-session.ts          # 会话基类
│   ├── chat-session.ts          # 连续对话
│   ├── template-session.ts      # 模板会话（状态+中断）
│   ├── mcp-session.ts           # 工具会话
│   └── index.ts                 # 会话导出
├── memory/
│   └── simple-memory.ts         # 记忆系统
└── index.ts                     # 主入口
```

## 🏗️ 核心设计

### Agent类型

#### 功能性Agent
```typescript
const agent = createFunctionalQuickAgent('助手', {
  role: '助手',
  personality: '友好'
});
```
- **本质**: 仅对话生成，无Token生态
- **能力**: 文本生成、连续对话
- **场景**: 简单问答、内容生成

#### 高级Agent
```typescript
const agent = createAdvancedQuickAgent('专家', {
  role: '工具专家',
  token: process.env.MCP_TOKEN  // Token决定工具可见性
});
```
- **本质**: 持有完整Token生态
- **能力**: 对话 + 工具调用（由Token决定）
- **场景**: 复杂任务、工具集成

### 会话类型

#### 连续对话会话
```typescript
await agent.startChat();
const response = await agent.sendMessage('你好！');
await agent.stopChat();
```
- **控制**: Agent API全权处理
- **功能**: 消息历史、撤销、修改

#### 模板会话
```typescript
const session = createQuickTemplate('流程', steps, vars);
await session.start();
const results = session.getResults();
```
- **控制**: 仅状态获取 + 中断
- **限制**: 不提供流程编程控制

#### MCP工具会话
```typescript
const session = createMCPSession('mcp', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  tools: []  // 由Token决定可见性
});
```
- **用途**: 工具调用执行
- **协作**: 与Agent配合使用

## 🔌 模块依赖

### 内部依赖
```
AI-Agent
├── ModelFactory (模型工厂)
├── SimpleMemory (记忆系统)
└── Session System (会话系统)
    ├── ChatSession
    ├── TemplateSession
    └── MCPSession
```

### 外部依赖
```
AI-Agent
├── Token生态 (外部管理)
│   ├── Token获取
│   ├── 工具清单
│   └── 可见性控制
└── MCP服务器 (外部服务)
    └── 工具执行
```

## 🎯 使用模式

### 模式1: 简单对话
```typescript
const agent = createFunctionalQuickAgent('助手');
await agent.execute({ id: 'task', input: '你好' });
```

### 模式2: 工具调用
```typescript
// 外部管理Token生态
const token = process.env.MCP_TOKEN;
const agent = createAdvancedQuickAgent('专家', { token });

// Agent内部自动处理工具调用
await agent.execute({ id: 'task', input: '计算 100+200' });
```

### 模式3: 固定流程
```typescript
const session = createQuickTemplate('流程', [
  { name: '步骤1', prompt: '处理: {{data}}' }
], { data: '初始值' });

await session.start();
const results = session.getResults();
```

## 📊 架构对比

| 特性 | 功能性Agent | 高级Agent |
|------|------------|----------|
| Token生态 | ❌ 无 | ✅ 完整 |
| 工具调用 | ❌ 不支持 | ✅ 由Token决定 |
| 对话能力 | ✅ 基础 | ✅ 高级 |
| 配置复杂度 | 低 | 中 |

| 会话类型 | 连续对话 | 模板对话 | MCP会话 |
|----------|----------|----------|---------|
| 控制权 | Agent全权 | 状态+中断 | 工具执行 |
| 流程控制 | ✅ 完整 | ❌ 受限 | N/A |
| 工具支持 | ❌ | ❌ | ✅ |

## 🔧 核心API

### Agent API
```typescript
// 执行任务
await agent.execute({ id: 'task', input: '...' });

// 连续对话
await agent.startChat();
await agent.sendMessage('...');
await agent.stopChat();

// 状态访问
agent.getState();
agent.getInfo();
agent.getConversationHistory();
```

### 模板会话 API
```typescript
// 执行控制
await session.start();
await session.cancel();
await session.resetSession();

// 状态获取
session.getStatus();
session.getResults();
session.getWorkflowInfo();
```

## 🎨 设计原则

1. **职责分离**
   - Token生态由外部管理
   - Agent仅负责对话和工具调用
   - 模板会话仅提供状态和中断

2. **接口简化**
   - 对外仅暴露对话接口
   - 隐藏Token和工具细节
   - 统一的状态访问

3. **协作清晰**
   - 模板系统 + 会话系统
   - Agent + MCP会话
   - 外部组件 + 内部实现

## 📝 开发者指南

### 选择合适的Agent
- **简单任务** → `FunctionalAgent`
- **复杂任务** → `AdvancedAgent`
- **需要工具** → `AdvancedAgent` + Token生态

### 选择合适的会话
- **自由对话** → 连续对话
- **固定流程** → 模板会话
- **工具调用** → MCP会话

### 理解Token生态
```
外部组件管理:
1. Token获取 (环境变量/配置)
2. 工具清单 (根据Token)
3. 可见性控制 (权限策略)
4. 约束应用 (安全策略)

Agent内部:
- 持有Token
- 使用工具 (由Token决定)
- 执行任务
- 返回结果
```

## ✅ 重构总结

### 核心改进
- ✅ **拆分Agent**: 功能性 vs 高级
- ✅ **Token内部化**: 高级Agent持有Token
- ✅ **工具外部化**: 由Token决定可见性
- ✅ **接口统一**: 所有Agent共享对话API
- ✅ **模板限制**: 仅状态+中断，无流程控制

### 架构优势
- **清晰**: 职责分离明确
- **简单**: 配置最小化
- **灵活**: 易于扩展
- **安全**: Token生态隔离