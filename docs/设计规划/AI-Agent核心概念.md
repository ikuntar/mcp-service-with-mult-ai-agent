# AI-Agent核心概念

## 🎯 什么是AI-Agent？

AI-Agent是一个能够**自主推理**和**执行任务**的智能系统。

### 两种Agent类型

#### 1. 功能性Agent (Functional Agent)
- **用途**：简单任务，快速响应
- **特点**：不支持工具调用，低资源消耗
- **场景**：问答、文本生成、简单分析

#### 2. 高级Agent (Advanced Agent)
- **用途**：复杂任务，自动推理
- **特点**：支持工具调用，强大推理能力
- **场景**：数据分析、代码生成、多步骤任务

---

## 🏗️ 核心架构

```
用户任务
    ↓
[Agent选择] → 功能性Agent 或 高级Agent
    ↓
[模型推理] → 功能性模型 或 高级模型
    ↓
[工具调用] (仅高级Agent)
    ↓
[记忆存储] → SimpleMemory
    ↓
返回结果
```

---

## 🔧 核心组件

### 1. Agent核心 (agent-core.ts)
```typescript
// 基础Agent类
export class AgentCore {
  protected state: AgentState;      // 状态管理
  protected memory: SimpleMemory;   // 记忆系统
  protected model: ModelInterface;  // 模型接口
  
  async execute(task: Task): Promise<ActionResult> {
    // 1. 状态转换
    // 2. 模型推理
    // 3. 记忆存储
    // 4. 返回结果
  }
}
```

### 2. 功能性Agent (functional-agent.ts)
```typescript
export class FunctionalAgent extends AgentCore {
  // 简单推理，不支持工具
  async execute(task: Task): Promise<ActionResult> {
    const response = await this.model.think(task.input);
    return this.simulateExecution(response);
  }
}
```

### 3. 高级Agent (advanced-agent.ts)
```typescript
export class AdvancedAgent extends AgentCore {
  protected tools: ToolDefinition[];  // 工具列表
  
  async execute(task: Task): Promise<ActionResult> {
    const response = await this.model.thinkWithTools(task.input, this.tools);
    
    if (response.toolCalls) {
      return await this.handleToolCalls(response.toolCalls);
    }
    
    return this.simulateExecution(response);
  }
}
```

### 4. 模型工厂 (model-factory.ts)
```typescript
// 创建模型实例
const model = ModelFactory.create({
  type: 'advanced',
  provider: 'openai',
  endpoint: 'https://api.example.com',
  apiKey: 'sk-...',
  models: {
    primary: 'gpt-4',
    backup: 'gpt-3.5-turbo'
  }
});
```

### 5. 记忆系统 (simple-memory.ts)
```typescript
export class SimpleMemory {
  // 存储思考和经验
  async store(item: MemoryItem): Promise<void>;
  
  // 检索最近记忆
  async getRecent(count: number): Promise<MemoryItem[]>;
  
  // 获取统计
  async getStats(): Promise<MemoryStats>;
}
```

---

## 🔄 执行流程

### 功能性Agent流程
```
1. 接收任务
2. 状态: planning
3. 模型推理 (think)
4. 状态: executing
5. 模拟执行
6. 存储记忆
7. 状态: idle
8. 返回结果
```

### 高级Agent流程
```
1. 接收任务
2. 状态: planning
3. 模型推理 + 工具调用 (thinkWithTools)
4. 状态: executing
5. 执行工具 (handleToolCalls)
6. 存储记忆
7. 状态: idle
8. 返回结果
```

---

## 📊 状态管理

```typescript
type AgentState = 
  | 'initialized'  // 初始状态
  | 'idle'         // 空闲
  | 'planning'     // 规划中
  | 'executing'    // 执行中
  | 'learning'     // 学习中
  | 'error'        // 错误
  | 'stopped';     // 已停止
```

**状态转换**：
```
initialized → idle → planning → executing → idle
                      ↓            ↓
                    error → idle  learning → idle
```

---

## 🛠️ 工具系统

### 工具定义
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
    }>;
  };
}
```

### 工具调用
```typescript
interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}
```

---

## 🎯 使用场景

### 功能性Agent适用
- ✅ 简单问答
- ✅ 文本生成
- ✅ 格式转换
- ✅ 快速响应

### 高级Agent适用
- ✅ 数据分析
- ✅ 代码生成
- ✅ 文件操作
- ✅ 多步骤任务
- ✅ 工具集成

---

## 🚀 快速开始

### 创建功能性Agent
```typescript
import { FunctionalAgent } from './src/core/ai-agent/base/functional-agent';

const agent = new FunctionalAgent({
  id: 'simple-bot',
  name: '简单助手',
  role: 'Assistant',
  modelId: 'functional-model'
});

const result = await agent.execute({
  id: 'task-1',
  input: '什么是AI?'
});
```

### 创建高级Agent
```typescript
import { AdvancedAgent } from './src/core/ai-agent/base/advanced-agent';

const agent = new AdvancedAgent({
  id: 'expert-bot',
  name: '专家助手',
  role: 'Senior Analyst',
  modelId: 'advanced-model',
  tools: [
    {
      name: 'readFile',
      description: '读取文件',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' }
        }
      }
    }
  ]
});

const result = await agent.execute({
  id: 'task-1',
  input: '分析sales.csv文件'
});
```

---

## 💡 核心原则

1. **简单即美**：最小化复杂度
2. **清晰分层**：职责明确
3. **生产就绪**：包含错误处理、重试、监控
4. **易于扩展**：模块化设计

---

## 📁 文件结构

```
src/core/ai-agent/
├── base/
│   ├── agent-core.ts           # 基础核心
│   ├── functional-agent.ts     # 功能性Agent
│   ├── advanced-agent.ts       # 高级Agent
│   ├── model-factory.ts        # 模型工厂
│   ├── model-interface.ts      # 模型接口
│   ├── types.ts                # 类型定义
│   └── real-model.ts           # 真实模型
├── memory/
│   └── simple-memory.ts        # 记忆系统
└── index.ts                    # 主入口
```

---

## 🎉 总结

**AI-Agent的核心**：
```
Agent = 推理能力 + 工具调用 + 记忆系统 + 状态管理
```

**选择指南**：
- 简单任务 → 功能性Agent
- 复杂任务 → 高级Agent
- 需要工具 → 高级Agent
- 快速响应 → 功能性Agent