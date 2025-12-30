# AI-Agent快速指南

## 🎯 一句话理解

**功能性Agent** = 简单任务 + 快速响应  
**高级Agent** = 复杂任务 + 工具调用

---

## 🚀 3分钟上手

### 1. 功能性Agent（简单问答）
```typescript
import { FunctionalAgent } from './src/core/ai-agent';

const agent = new FunctionalAgent({
  id: 'bot',
  name: '助手',
  role: 'Assistant',
  modelId: 'functional-model'
});

const result = await agent.execute({
  id: 'task',
  input: '什么是AI?'
});
```

### 2. 高级Agent（带工具）
```typescript
import { AdvancedAgent } from './src/core/ai-agent';

const agent = new AdvancedAgent({
  id: 'expert',
  name: '专家',
  role: 'Analyst',
  modelId: 'advanced-model',
  tools: [{
    name: 'readFile',
    description: '读取文件',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' } }
    }
  }]
});

const result = await agent.execute({
  id: 'task',
  input: '分析data.csv'
});
```

---

## 📊 选择指南

| 需求 | 选择 |
|------|------|
| 简单问答 | 功能性Agent |
| 文本生成 | 功能性Agent |
| 数据分析 | 高级Agent |
| 文件操作 | 高级Agent |
| 代码生成 | 高级Agent |
| 多步骤任务 | 高级Agent |

---

## 🔧 核心特性

### 功能性Agent
- ✅ 快速响应
- ✅ 低资源消耗
- ❌ 不支持工具

### 高级Agent
- ✅ 自动推理
- ✅ 工具调用
- ✅ 复杂任务
- ⚠️ 资源消耗较高

---

## 💡 使用场景

### 功能性Agent
```
用户: 什么是AI?
Agent: 人工智能是...
```

### 高级Agent
```
用户: 分析sales.csv
Agent: [调用readFile] → [分析数据] → 生成报告
```

---

## 📦 快速创建

### 工厂函数
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

---

## 🎯 记忆系统

所有Agent都自动支持：
- ✅ 思考过程存储
- ✅ 执行经验记录
- ✅ 历史检索
- ✅ 统计分析

```typescript
const stats = await agent.getMemoryStats();
const recent = await agent.getRecentMemories(5);
```

---

## ⚙️ 状态管理

```typescript
agent.getState() // 'idle' | 'planning' | 'executing' | ...
agent.stop()     // 停止执行
agent.getInfo()  // 获取信息
```

---

## 🎉 总结

**记住3点**：
1. **简单任务** → 功能性Agent
2. **复杂任务** → 高级Agent
3. **需要工具** → 高级Agent

**一行代码创建**：
```typescript
const agent = new FunctionalAgent(config);  // 简单
const agent = new AdvancedAgent(config);    // 复杂