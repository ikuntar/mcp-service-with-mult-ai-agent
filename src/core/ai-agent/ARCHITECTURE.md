# AI-Agent架构概览

## 设计目标

- **职责分离**: Token生态外部管理，Agent仅负责对话
- **接口简化**: 对外仅暴露对话和状态访问
- **协作清晰**: 模板系统 + 会话系统

## 模块结构

```
src/core/ai-agent/
├── base/
│   ├── functional-agent.ts      # 无Token生态，仅对话
│   ├── advanced-agent.ts        # 完整Token生态，对话+工具
│   └── types.ts
├── session/
│   ├── chat-session.ts          # 连续对话（Agent全权控制）
│   ├── template-session.ts      # 模板会话（状态+中断）
│   ├── mcp-session.ts           # 工具会话
│   └── index.ts
├── memory/
│   └── simple-memory.ts
└── index.ts
```

## 核心组件

### 1. Agent类型

| 类型 | 本质 | 能力 | 配置 |
|------|------|------|------|
| 功能性Agent | 对话生成器 | 文本生成 | 无需Token |
| 高级Agent | Token持有者 | 对话+工具 | 需要Token |

### 2. 会话类型

| 类型 | 控制权 | 流程控制 | 工具支持 |
|------|--------|----------|----------|
| 连续对话 | Agent全权 | ✅ 完整 | ❌ |
| 模板会话 | 状态+中断 | ❌ 受限 | ❌ |
| MCP会话 | 工具执行 | N/A | ✅ |

## 依赖关系

```
AI-Agent
├── 内部依赖
│   ├── ModelFactory (模型)
│   ├── SimpleMemory (记忆)
│   └── Session System (会话)
│
└── 外部依赖
    ├── Token生态 (外部管理)
    │   ├── Token获取
    │   ├── 工具清单
    │   └── 可见性控制
    └── MCP服务器 (外部服务)
```

## 使用模式

### 简单对话
```typescript
const agent = createFunctionalQuickAgent('助手');
await agent.execute({ id: 'task', input: '你好' });
```

### 工具调用
```typescript
// 外部: 管理Token生态
const token = process.env.MCP_TOKEN;

// 内部: Agent自动处理
const agent = createAdvancedQuickAgent('专家', { token });
await agent.execute({ id: 'task', input: '计算 100+200' });
```

### 固定流程
```typescript
const session = createQuickTemplate('流程', steps, vars);
await session.start();
const results = session.getResults();
```

## 设计原则

1. **对外暴露最小化**: 仅对话接口 + 状态访问
2. **内部实现封装化**: Token生态、工具调用、流程执行
3. **外部组件协作化**: Token管理由外部完成

## 架构优势

- ✅ **清晰**: 职责分离明确
- ✅ **简单**: 配置最小化  
- ✅ **灵活**: 易于扩展
- ✅ **安全**: 生态隔离