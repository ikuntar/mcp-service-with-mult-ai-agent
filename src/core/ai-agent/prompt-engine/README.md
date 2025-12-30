# AI-Agent提示词工程

## 🎯 定位

**集成在AI-Agent系统中的提示词工程**

与AI-Agent无缝协作，提供提示词模板和组合能力。

---

## 📦 组件

```
src/core/ai-agent/prompt-engine/
├── types.ts              # 类型定义
├── prompt-manager.ts     # 核心管理器
├── factory.ts           # 工厂方法
├── index.ts             # 主入口（含Agent集成）
└── README.md            # 说明文档
```

---

## 🚀 与Agent集成

### 方式1：独立使用
```typescript
import { PromptManager } from './src/core/ai-agent/prompt-engine';

const manager = new PromptManager();
// ... 使用提示词工程
```

### 方式2：Agent集成
```typescript
import { AgentPromptEngine } from './src/core/ai-agent/prompt-engine';

const engine = new AgentPromptEngine();

// 快速创建Agent提示词
const prompt = engine.quickAgentPrompt(
  '数据分析专家',
  '分析sales.csv文件',
  'json'
);

// 使用Agent执行
const result = await agent.execute({ id: 'task', input: prompt });
```

---

## 🎯 核心功能

### 1. 系统提示词
```typescript
// 角色定义
const id = engine.createAgentSystemPrompt('编程专家', ['Python', 'Java']);

// 任务导向
const id = engine.createAgentTaskPrompt('数据分析', ['准确', '详细']);
```

### 2. 追加提示词
```typescript
// 格式要求
const id = engine.addAgentFormat('json');

// 质量检查
const id = engine.addAgentQualityCheck(['准确性', '完整性']);
```

### 3. 组合提示词
```typescript
const prompt = engine.composeAgentPrompt(
  systemId,
  [formatId, qualityId],
  { data: 'sales.csv' }
);
```

---

## 🎨 使用场景

### 场景1：代码生成Agent
```typescript
const engine = new AgentPromptEngine();

const prompt = engine.quickAgentPrompt(
  'Python开发专家',
  '编写用户登录验证函数',
  'markdown'
);

// 交给高级Agent执行
const result = await advancedAgent.execute({ id: 'code', input: prompt });
```

### 场景2：数据分析Agent
```typescript
const engine = new AgentPromptEngine();

const systemId = engine.createAgentSystemPrompt('数据分析师', ['统计', '可视化']);
const formatId = engine.addAgentFormat('json');
const qualityId = engine.addAgentQualityCheck(['准确性', '完整性']);

const prompt = engine.composeAgentPrompt(systemId, [formatId, qualityId], {
  data: 'sales.csv',
  question: '销售趋势分析'
});

const result = await advancedAgent.execute({ id: 'analysis', input: prompt });
```

### 场景3：问答Agent
```typescript
const engine = new AgentPromptEngine();

const prompt = engine.quickAgentPrompt(
  '知识助手',
  '回答用户问题',
  'text'
);

const result = await functionalAgent.execute({ id: 'qa', input: prompt });
```

---

## 📊 与独立提示词工程的区别

| 特性 | 独立提示词工程 | Agent集成提示词工程 |
|------|---------------|-------------------|
| 位置 | `src/core/prompt-engine/simple/` | `src/core/ai-agent/prompt-engine/` |
| 用途 | 通用提示词管理 | 专为Agent优化 |
| API | 基础API | Agent专用API |
| 集成 | 需要手动集成 | 与Agent无缝协作 |

---

## 💡 设计理念

**"Agent优先"**

- 所有API都为Agent场景优化
- 快速创建Agent专用提示词
- 与Agent状态管理集成
- 支持Agent记忆系统

---

## 🎯 快速对比

### 独立使用
```typescript
import { SimplePrompt } from './src/core/prompt-engine/simple';

const prompt = SimplePrompt.compose(
  '你是一位专家。',
  ['请提供代码。']
);
```

### Agent集成
```typescript
import { AgentPromptEngine } from './src/core/ai-agent/prompt-engine';

const engine = new AgentPromptEngine();
const prompt = engine.quickAgentPrompt('专家', '提供代码');
```

---

## ✅ 核心优势

1. **无缝集成**：与AI-Agent系统完美配合
2. **快速创建**：一行代码生成Agent提示词
3. **场景优化**：针对Agent使用场景设计
4. **易于扩展**：基于原有提示词工程

---

## 🚀 开始使用

```typescript
// 1. 创建引擎
const engine = new AgentPromptEngine();

// 2. 生成提示词
const prompt = engine.quickAgentPrompt('角色', '任务');

// 3. Agent执行
const result = await agent.execute({ id: 'task', input: prompt });
```

**就这么简单！**