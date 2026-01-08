# AI-Agent架构指南

## 🎯 架构概述

**AI-Agent系统**是重构后的对话推理框架，提供两种Agent类型和三种会话模式，实现了职责分离和配置简化。

### 核心设计思想

```
AI-Agent系统
├── Agent层 (对话推理)
│   ├── FunctionalAgent (无Token生态)
│   └── AdvancedAgent (完整Token生态)
│
└── Session层 (会话管理)
    ├── ChatSession (连续对话)
    ├── TemplateSession (模板流程)
    └── MCPSession (工具调用)
```

**关键特性**：
- ✅ **职责分离** - Token生态外部管理
- ✅ **配置简化** - 快速创建，即开即用
- ✅ **接口统一** - 所有Agent共享对话API
- ✅ **协作清晰** - 模板系统 + 会话系统

---

## 🏗️ 模块结构

### 目录结构

```
src/core/ai-agent/
├── base/
│   ├── functional-agent.ts      # 功能性Agent
│   ├── advanced-agent.ts        # 高级Agent
│   ├── model-factory.ts         # 模型工厂
│   └── types.ts                 # 基础类型
├── session/
│   ├── base-session.ts          # 会话基类
│   ├── chat-session.ts          # 连续对话
│   ├── template-session.ts      # 模板会话
│   ├── mcp-session.ts           # 工具会话
│   └── index.ts                 # 统一导出
├── memory/
│   └── simple-memory.ts         # 记忆系统
└── index.ts                     # 主入口
```

### 模块依赖关系

```
AI-Agent系统
│
├── 内部依赖
│   ├── ModelFactory (模型工厂)
│   │   └── 提供模型实例
│   ├── SimpleMemory (记忆系统)
│   │   └── 存储思考和经验
│   └── Session System (会话系统)
│       ├── ChatSession (连续对话)
│       ├── TemplateSession (模板流程)
│       └── MCPSession (工具执行)
│
└── 外部依赖
    ├── Token生态 (外部管理)
    │   ├── Token获取
    │   ├── 工具清单
    │   └── 可见性控制
    └── MCP服务器 (外部服务)
        └── 工具执行
```

---

## 🔧 核心组件

### 1. Agent类型

#### 功能性Agent (FunctionalAgent)
```typescript
const agent = createFunctionalQuickAgent('助手', {
  role: '助手',
  personality: '友好'
});
```

**设计特点**：
- **本质**: 对话生成器，无Token生态
- **能力**: 文本生成、连续对话
- **配置**: 无需Token，最小化配置
- **场景**: 简单问答、内容生成

**内部组件**：
```
FunctionalAgent
├── ModelInterface (推理引擎)
├── SimpleMemory (内部记忆)
└── ConversationHistory (对话历史)
```

#### 高级Agent (AdvancedAgent)
```typescript
const agent = createAdvancedQuickAgent('专家', {
  role: '工具专家',
  token: process.env.MCP_TOKEN
});
```

**设计特点**：
- **本质**: Token持有者，完整生态
- **能力**: 对话 + 工具调用
- **配置**: 需要Token，工具由Token决定
- **场景**: 复杂任务、工具集成

**内部组件**：
```
AdvancedAgent
├── Token (内部持有)
├── ModelInterface (推理引擎)
├── SimpleMemory (内部记忆)
└── MCPSession (工具会话)
```

### 2. 会话类型

#### 连续对话会话 (ChatSession)
```typescript
await agent.startChat();
const response = await agent.sendMessage('你好！');
await agent.stopChat();
```

**设计特点**：
- **控制权**: Agent全权处理
- **流程控制**: ✅ 完整（start/stop/reset/undo）
- **工具支持**: ❌ 不支持
- **适用场景**: 自由对话、多轮交互

#### 模板会话 (TemplateSession)
```typescript
const session = createQuickTemplate('流程', steps, vars);
await session.start();
const results = session.getResults();
```

**设计特点**：
- **控制权**: 状态获取 + 中断
- **流程控制**: ❌ 受限（无jumpToStep等）
- **工具支持**: ❌ 不支持
- **适用场景**: 固定流程、结构化执行

#### MCP工具会话 (MCPSession)
```typescript
const session = createMCPSession('mcp', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  tools: []  // 由Token决定
});
```

**设计特点**：
- **控制权**: 工具执行
- **流程控制**: N/A
- **工具支持**: ✅ 完整
- **适用场景**: 工具调用、外部集成

---

## 🔄 协作流程

### 场景1: 简单对话 (FunctionalAgent)

```
用户输入: "你好"
    ↓
[1. FunctionalAgent接收]
    ↓
[2. Model思考] → 生成回复
    ↓
[3. 记忆存储] → 保存对话
    ↓
返回: "你好！有什么可以帮你的吗？"
```

**组件协作**：
```
FunctionalAgent
    ├── 调用 → model.think(input)
    ├── 调用 → memory.store(dialogue)
    └── 返回 → 生成的回复
```

### 场景2: 工具调用 (AdvancedAgent)

```
用户输入: "计算 100+200"
    ↓
[1. AdvancedAgent接收]
    ↓
[2. Model思考] → 检测工具调用
    ↓
[3. 记忆存储] → 保存思考过程
    ↓
[4. 工具执行] → session.callTool("calculate")
    ↓
[5. 记忆存储] → 保存执行经验
    ↓
返回: "计算结果: 300"
```

**组件协作**：
```
AdvancedAgent
    ├── 调用 → model.think(input)
    ├── 调用 → memory.store(thought)
    ├── 调用 → session.callTool(tool)
    ├── 调用 → memory.store(experience)
    └── 返回 → 工具结果
```

### 场景3: 模板流程 (TemplateSession)

```
启动流程
    ↓
[1. 执行步骤1] → 生成提示词
    ↓
[2. 模拟执行] → 获取结果
    ↓
[3. 更新变量] → 传递数据
    ↓
[4. 执行步骤2] → 继续流程
    ↓
[5. 完成所有步骤]
    ↓
返回: 所有步骤结果
```

**组件协作**：
```
TemplateSession
    ├── 调用 → prepareStepPrompt(step)
    ├── 调用 → executeStep(step)
    ├── 调用 → updateVariables(output)
    └── 返回 → stepResults[]
```

---

## 📊 架构对比

### Agent类型对比

| 特性 | 功能性Agent | 高级Agent |
|------|------------|----------|
| **Token生态** | ❌ 无 | ✅ 完整 |
| **工具调用** | ❌ 不支持 | ✅ 由Token决定 |
| **配置复杂度** | 低 | 中 |
| **适用场景** | 简单对话 | 复杂任务 |

### 会话类型对比

| 特性 | 连续对话 | 模板会话 | MCP会话 |
|------|----------|----------|---------|
| **控制权** | Agent全权 | 状态+中断 | 工具执行 |
| **流程控制** | ✅ 完整 | ❌ 受限 | N/A |
| **工具支持** | ❌ | ❌ | ✅ |
| **适用场景** | 自由对话 | 固定流程 | 工具调用 |

### 组件依赖对比

| 组件 | 功能性Agent | 高级Agent |
|------|------------|----------|
| **ModelFactory** | ✅ | ✅ |
| **SimpleMemory** | ✅ | ✅ |
| **MCPSession** | ❌ | ✅ |
| **Token** | ❌ | ✅ |

---

## 💡 使用模式

### 模式1: 快速对话
```typescript
// 1. 创建Agent
const agent = createFunctionalQuickAgent('助手');

// 2. 执行任务
const result = await agent.execute({
  id: 'task-1',
  input: '你好'
});

// 3. 连续对话
await agent.startChat();
await agent.sendMessage('今天天气如何？');
await agent.stopChat();
```

### 模式2: 工具集成
```typescript
// 外部管理Token生态
const tokenManager = {
  getToken: () => process.env.MCP_TOKEN,
  getTools: (token) => [...],  // 根据Token返回工具
  applyConstraints: (agent) => {...}
};

// Agent内部处理
const token = tokenManager.getToken();
const agent = createAdvancedQuickAgent('专家', { token });

// 自动工具调用
const result = await agent.execute({
  id: 'task-1',
  input: '计算 100+200'
});

// 外部控制可见性
const visibleTools = tokenManager.getTools(token);
```

### 模式3: 固定流程
```typescript
// 1. 定义流程
const session = createQuickTemplate('数据分析', [
  { name: '读取数据', prompt: '读取文件: {{filename}}' },
  { name: '分析趋势', prompt: '分析数据: {{data}}' },
  { name: '生成报告', prompt: '生成总结' }
], { filename: 'sales.csv' });

// 2. 执行控制
await session.start();           // 开始执行
const results = session.getResults(); // 获取结果

// 3. 状态管理
const status = session.getStatus();   // 获取状态
await session.cancel();               // 中断执行
await session.resetSession();         // 重置
```

---

## 🎯 设计原则

### 1. 职责分离
```
外部组件:
├── Token生态管理 (获取、工具、约束)
└── MCP服务器 (工具执行)

内部组件:
├── Agent (对话推理)
├── Session (会话管理)
└── Memory (记忆存储)
```

### 2. 接口简化
```typescript
// 对外仅暴露必要接口
agent.execute()      // 执行任务
agent.startChat()    // 开始对话
agent.sendMessage()  // 发送消息
agent.stopChat()     // 停止对话

session.start()      // 开始执行
session.cancel()     // 中断执行
session.getResults() // 获取结果
```

### 3. 配置最小化
```typescript
// 功能性Agent - 无需配置
const agent = createFunctionalQuickAgent('助手');

// 高级Agent - 只需要Token
const agent = createAdvancedQuickAgent('专家', { token });

// 模板会话 - 只需要流程定义
const session = createQuickTemplate('流程', steps);
```

### 4. 协作清晰
```
Agent + Session = 完整能力
├── Agent负责: 推理、决策、状态
└── Session负责: 执行、管理、结果
```

---

## 📦 导出组件

```typescript
// Agent类型
export { FunctionalAgent, AdvancedAgent }

// 快速创建函数
export { 
  createFunctionalQuickAgent,
  createAdvancedQuickAgent,
  createQuickTemplate 
}

// 会话类型
export { 
  ChatSession,
  TemplateSession,
  MCPSession
}

// 模型系统
export { ModelFactory, ModelConfigManager }
```

---

## ⚠️ 注意事项

### 1. Token管理
- Token由外部组件管理
- Agent内部持有Token
- 工具可见性由Token决定

### 2. 状态管理
- Agent有明确的生命周期
- 状态转换有验证逻辑
- 非法转换会警告

### 3. 工具调用
- 工具必须在MCP端点可用
- 参数需要符合定义
- 错误会被捕获并返回

### 4. 模板限制
- 模板会话无流程控制API
- 只能获取状态和结果
- 不能编程控制流程

---

## 🎯 最佳实践

### 1. 选择合适的Agent
```typescript
// 简单任务 → FunctionalAgent
const agent = createFunctionalQuickAgent('助手');

// 复杂任务 → AdvancedAgent
const agent = createAdvancedQuickAgent('专家', { token });
```

### 2. 合理使用会话
```typescript
// 自由对话 → 连续对话
await agent.startChat();

// 固定流程 → 模板会话
const session = createQuickTemplate('流程', steps);

// 工具调用 → MCP会话（通过Agent）
```

### 3. 错误处理
```typescript
try {
  const result = await agent.execute(task);
  if (!result.success) {
    console.error('执行失败:', result.error);
  }
} catch (error) {
  console.error('Agent错误:', error);
}
```

### 4. 外部组件协作
```typescript
// 1. 外部管理Token
const token = tokenManager.getToken();

// 2. 创建Agent
const agent = createAdvancedQuickAgent('专家', { token });

// 3. 外部控制可见性
const tools = tokenManager.getTools(token);

// 4. 执行任务
const result = await agent.execute(task);
```

---

## 🎉 总结

### 核心价值

**AI-Agent系统通过职责分离和配置简化，实现了：**

1. **清晰架构** - Agent和Session职责明确
2. **简单使用** - 快速创建，即开即用
3. **灵活协作** - 支持多种使用模式
4. **易于扩展** - 模块化设计

### 使用口诀

```
简单任务 → FunctionalAgent
复杂任务 → AdvancedAgent + Token
自由对话 → 连续对话
固定流程 → 模板会话
工具调用 → AdvancedAgent自动处理
```

### 一行代码创建

```typescript
// 简单对话
const agent = createFunctionalQuickAgent('助手');

// 工具调用
const agent = createAdvancedQuickAgent('专家', { token });

// 固定流程
const session = createQuickTemplate('流程', steps);
```

**AI-Agent架构是平衡了简洁性和功能性的最佳实践，适用于大多数对话推理场景！**