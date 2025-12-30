# 会话系统

## 📋 概述

会话系统提供两种类型的会话管理：

1. **模板会话** - 按照固定工作流执行的会话
2. **连续对话会话** - 支持多轮对话的会话

## 🏗️ 架构

```
src/core/ai-agent/session/
├── types.ts              # 类型定义
├── base-session.ts       # 基类（通用功能）
├── template-session.ts   # 模板会话
├── chat-session.ts       # 连续对话会话
└── index.ts             # 主入口
```

## 🎯 核心特性

### 1. 模板会话 (TemplateSession)

**特点**：
- ✅ 固定工作流执行
- ✅ 步骤间变量传递
- ✅ 自动/手动控制流程
- ✅ 步骤重试机制
- ✅ 输出验证
- ✅ JSON或代码定义工作流

**使用场景**：
- 数据分析流程
- 代码审查流程
- 报告生成流程
- 任何需要固定步骤的任务

### 2. 连续对话会话 (ChatSession)

**特点**：
- ✅ 多轮对话支持
- ✅ 记忆窗口管理
- ✅ 上下文维护
- ✅ 超时自动重置
- ✅ 消息历史管理
- ✅ 撤销/修改功能

**使用场景**：
- 客服对话
- 助手交互
- 任何需要持续对话的场景

## 🚀 快速开始

### 1. 模板会话 - 代码定义

```typescript
import { TemplateSession, createSimpleWorkflow } from './src/core/ai-agent/session';

// 创建工作流
const workflow = createSimpleWorkflow('my-workflow', [
  {
    name: '数据收集',
    prompt: '请分析: {{data}}',
    variables: { data: 'string' }
  },
  {
    name: '生成报告',
    prompt: '基于以上分析生成报告',
    expectedOutput: 'json'
  }
]);

// 创建会话
const session = new TemplateSession('session-1', {
  workflow,
  timeout: 60000,
  initialVariables: { data: '销售数据' }
});

// 执行
const result = await session.waitUntilEnd();
console.log(result.output);
```

### 2. 模板会话 - JSON定义

```json
// workflow.json
{
  "id": "analysis-workflow",
  "name": "数据分析工作流",
  "steps": [
    {
      "id": "step1",
      "name": "数据收集",
      "prompt": "分析数据: {{data}}",
      "variables": { "data": "string" }
    },
    {
      "id": "step2",
      "name": "生成报告",
      "prompt": "生成JSON报告",
      "expectedOutput": "json"
    }
  ],
  "options": {
    "autoContinue": true,
    "strictOrder": true,
    "maxRetries": 3
  }
}
```

```typescript
import { TemplateSession, loadWorkflowFromJSON } from './src/core/ai-agent/session';

const workflow = loadWorkflowFromJSON('./workflow.json');
const session = new TemplateSession('session-2', {
  workflow,
  initialVariables: { data: '测试数据' }
});

const result = await session.waitUntilEnd();
```

### 3. 连续对话会话

```typescript
import { ChatSession } from './src/core/ai-agent/session';

const session = new ChatSession('chat-1', {
  systemPrompt: '你是一个友好的助手',
  timeout: 300000, // 5分钟
  memoryWindow: 10, // 记忆最近10条消息
  initialContext: '用户正在咨询产品问题'
});

// 开始会话
await session.start();

// 发送消息
const reply1 = await session.sendMessage('你好');
const reply2 = await session.sendMessage('产品价格是多少？');

// 等待结束（超时或手动取消）
const result = await session.waitUntilEnd();

// 或者手动取消
await session.cancel();
```

## 🔧 高级功能

### 1. 事件监听

```typescript
session.on((event) => {
  switch (event.type) {
    case 'start':
      console.log('会话开始');
      break;
    case 'step':
      console.log('步骤:', event.data);
      break;
    case 'message':
      console.log('消息:', event.data);
      break;
    case 'timeout':
      console.log('超时');
      break;
    case 'error':
      console.log('错误:', event.data.error);
      break;
    case 'end':
      console.log('结束');
      break;
  }
});
```

### 2. 手动控制流程

```typescript
// 配置为手动控制
const workflow = createSimpleWorkflow('manual', [
  { name: '步骤1', prompt: '第一步' },
  { name: '步骤2', prompt: '第二步' }
], {
  options: { autoContinue: false }
});

const session = new TemplateSession('manual-session', { workflow });

session.on(async (event) => {
  if (event.type === 'step' && event.data.type === 'step-success') {
    // 步骤完成，决定是否继续
    if (confirm('继续下一步？')) {
      await session.continue();
    } else {
      await session.cancel();
    }
  }
});

await session.waitUntilEnd();
```

### 3. 跳转到指定步骤

```typescript
// 在会话运行中跳转
await session.jumpToStep('step2');
```

### 4. 聊天会话高级功能

```typescript
// 获取对话历史
const history = session.getConversationHistory();

// 导出/导入历史
const exported = session.exportHistory();
session.importHistory(exported);

// 撤销最后一条消息
session.undo();

// 修改消息
session.modifyLastMessage('修改后的内容');

// 获取上下文
const context = session.getContext();

// 清空上下文
session.clearContext();

// 重置会话（保留系统提示词）
session.reset();
```

### 5. 自定义AI实现

```typescript
// 模板会话
class MyTemplateSession extends TemplateSession {
  async executeStep(step, prompt) {
    // 调用你的AI模型
    const response = await myAI.generate(prompt);
    return response;
  }
}

// 聊天会话
class MyChatSession extends ChatSession {
  async generateResponse(input, context) {
    // 调用你的AI模型
    const response = await myAI.chat(input, context);
    return response;
  }
}
```

## 📊 会话状态

### 会话状态枚举

```typescript
enum SessionStatus {
  PENDING = 'pending',      // 等待开始
  RUNNING = 'running',      // 运行中
  PAUSED = 'paused',        // 暂停
  COMPLETED = 'completed',  // 正常结束
  TIMEOUT = 'timeout',      // 超时
  ERROR = 'error',          // 错误终止
  CANCELLED = 'cancelled'   // 用户取消
}
```

### 获取状态信息

```typescript
// 基本信息
const status = session.getStatus();
const messages = session.getMessages();
const result = session.getResult();

// 快照
const snapshot = session.getSnapshot();

// 模板会话特有
const stepResults = session.getStepResults();
const workflow = session.getWorkflow();

// 聊天会话特有
const history = session.getConversationHistory();
const context = session.getContext();
const count = session.getMessageCount();
```

## ⚙️ 配置选项

### 会话配置 (SessionConfig)

```typescript
interface SessionConfig {
  timeout?: number;              // 超时时间（毫秒），默认300000（5分钟）
  maxMessages?: number;          // 最大消息数，默认50
  saveHistory?: boolean;         // 保存历史，默认true
  autoCleanup?: boolean;         // 自动清理旧消息，默认false
  cleanupThreshold?: number;     // 清理阈值，默认40
  cleanup保留?: number;          // 保留数量，默认10
}
```

### 模板会话配置 (TemplateSessionConfig)

```typescript
interface TemplateSessionConfig extends SessionConfig {
  workflow: WorkflowTemplate | string;  // 工作流或JSON文件路径
  initialVariables?: Record<string, any>; // 初始变量
  passVariables?: boolean;                // 步骤间传递变量，默认true
}
```

### 聊天会话配置 (ChatSessionConfig)

```typescript
interface ChatSessionConfig extends SessionConfig {
  systemPrompt?: string;      // 系统提示词
  initialContext?: string;    // 初始上下文
  memoryWindow?: number;      // 记忆窗口大小，默认10
}
```

## 🎨 工作流定义

### WorkflowTemplate

```typescript
interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  steps: SessionStep[];
  options?: {
    autoContinue?: boolean;   // 自动继续
    strictOrder?: boolean;    // 严格顺序
    maxRetries?: number;      // 最大重试次数
  };
}
```

### SessionStep

```typescript
interface SessionStep {
  id: string;
  name: string;
  prompt: string;
  variables?: Record<string, any>;
  expectedOutput?: string;    // 期望输出格式
  timeout?: number;           // 步骤超时
}
```

## 🔍 示例工作流

### 1. 代码审查

```json
{
  "id": "code-review",
  "name": "代码审查流程",
  "steps": [
    {
      "id": "analyze",
      "name": "代码分析",
      "prompt": "分析以下代码的潜在问题:\n{{code}}",
      "variables": { "code": "string" }
    },
    {
      "id": "suggest",
      "name": "提供改进建议",
      "prompt": "基于以上分析，提供改进建议"
    },
    {
      "id": "summary",
      "name": "生成报告",
      "prompt": "生成JSON格式的审查报告",
      "expectedOutput": "json"
    }
  ]
}
```

### 2. 数据分析

```json
{
  "id": "data-analysis",
  "name": "数据分析流程",
  "steps": [
    {
      "id": "explore",
      "name": "数据探索",
      "prompt": "探索数据集: {{dataset}}"
    },
    {
      "id": "statistics",
      "name": "统计分析",
      "prompt": "提供统计摘要"
    },
    {
      "id": "visualize",
      "name": "可视化建议",
      "prompt": "建议可视化方案"
    },
    {
      "id": "conclusion",
      "name": "结论",
      "prompt": "总结分析结果"
    }
  ]
}
```

## 📝 最佳实践

### 1. 错误处理

```typescript
try {
  const session = new TemplateSession('my-session', { workflow });
  const result = await session.waitUntilEnd();
  
  if (result.status === SessionStatus.ERROR) {
    console.error('会话失败:', result.error);
  } else if (result.status === SessionStatus.TIMEOUT) {
    console.warn('会话超时');
  } else {
    console.log('成功:', result.output);
  }
} catch (error) {
  console.error('执行错误:', error);
}
```

### 2. 超时管理

```typescript
// 设置合适的超时时间
const session = new TemplateSession('session', {
  workflow,
  timeout: 120000 // 2分钟
});

// 监听超时事件
session.on((event) => {
  if (event.type === 'timeout') {
    console.log('处理超时逻辑');
    // 保存进度
    // 发送通知
  }
});
```

### 3. 资源清理

```typescript
const session = new TemplateSession('session', { workflow });

try {
  await session.waitUntilEnd();
} finally {
  // 清理资源
  session.cleanup();
}
```

### 4. 聊天会话内存管理

```typescript
const session = new ChatSession('chat', {
  memoryWindow: 5, // 只记住最近5条消息
  autoCleanup: true,
  cleanupThreshold: 20
});
```

## 🚨 注意事项

1. **阻塞行为**：`waitUntilEnd()` 会阻塞直到会话结束
2. **超时处理**：确保设置合理的超时时间
3. **资源清理**：会话结束后调用 `cleanup()`
4. **事件监听**：及时移除不需要的监听器
5. **自定义AI**：必须重写 `executeStep()` 或 `generateResponse()`

## 📚 相关文档

- [AI-Agent核心概念.md](../docs/设计规划/AI-Agent核心概念.md)
- [简化版提示词工程说明.md](../docs/设计规划/简化版提示词工程说明.md)
- [JSON初始化vs代码初始化对比.md](../docs/设计规划/JSON初始化vs代码初始化对比.md)