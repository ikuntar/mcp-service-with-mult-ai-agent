# 拼接提示词目录

## 📁 说明

此目录存放**拼接提示词**的JSON配置文件。

## 📝 文件格式

每个JSON文件可以包含多个拼接提示词：

```json
{
  "concatenatePrompts": [
    {
      "id": "unique-id",
      "name": "提示词名称",
      "format": "fixed",  // 或 "template"
      "content": "固定内容",
      "template": "{{variable}}模板",
      "variables": [
        {
          "name": "variable",
          "type": "string",
          "required": true,
          "default": "默认值"
        }
      ],
      "target": {
        "promptId": "目标提示词ID",
        "variableName": "目标变量名"
      },
      "mode": "replace",  // prepend/append/replace
      "metadata": {
        "version": "1.0.0",
        "description": "描述",
        "tags": ["tag1", "tag2"]
      }
    }
  ]
}
```

## 🔑 关键字段

### target (目标)
- **promptId**: 要插入的目标提示词ID
- **variableName**: 要插入的变量名

### mode (拼接方式)
- **prepend**: 在变量前插入
- **append**: 在变量后插入
- **replace**: 替换变量（默认）

## 📚 已有文件

### default-concatenate.json
- **dynamic-data**: 动态数据注入
- **extra-info**: 额外信息注入

## 🎯 使用示例

```typescript
import { autoLoadPrompts } from '../prompt-engine';

const { manager } = await autoLoadPrompts();

// 组合系统提示词和拼接提示词
const result = manager.composePrompt(
  'default-assistant',  // 系统提示词ID
  [],  // 追加提示词IDs
  ['dynamic-data']  // 拼接提示词IDs
);

console.log(result.content);
```

## 🔄 拼接方式说明

### replace (替换)
```typescript
// 系统提示词: "你是{{context}}助手"
// 拼接提示词(replace): "用户"
// 目标: { promptId: 'system', variableName: 'context' }
// 结果: "你是用户助手"
```

### prepend (前置)
```typescript
// 系统提示词: "你是{{context}}助手"
// 拼接提示词(prepend): "VIP"
// 目标: { promptId: 'system', variableName: 'context' }
// 结果: "你是VIP{{context}}助手" → "你是VIP助手"
```

### append (后置)
```typescript
// 系统提示词: "你是{{context}}助手"
// 拼接提示词(append): "高级"
// 目标: { promptId: 'system', variableName: 'context' }
// 结果: "你是{{context}}高级助手" → "你是高级助手"
```

## 📝 添加新拼接提示词

### 示例1：用户上下文注入
```json
{
  "concatenatePrompts": [
    {
      "id": "user-context",
      "name": "用户上下文",
      "format": "fixed",
      "content": "{{user_info}}",
      "target": {
        "promptId": "default-assistant",
        "variableName": "context"
      },
      "mode": "append"
    }
  ]
}
```

### 示例2：动态任务注入
```json
{
  "concatenatePrompts": [
    {
      "id": "dynamic-task",
      "name": "动态任务",
      "format": "template",
      "template": "任务：{{task_description}}",
      "variables": [
        { "name": "task_description", "type": "string", "required": true }
      ],
      "target": {
        "promptId": "code-generator",
        "variableName": "task"
      },
      "mode": "prepend"
    }
  ]
}
```

### 示例3：环境信息注入
```json
{
  "concatenatePrompts": [
    {
      "id": "env-info",
      "name": "环境信息",
      "format": "fixed",
      "content": "运行环境：生产环境\n版本：v1.0.0",
      "target": {
        "promptId": "default-assistant",
        "variableName": "env"
      },
      "mode": "replace"
    }
  ]
}
```

## 🎨 使用场景

### 场景1：用户个性化
```typescript
// 系统提示词: "你是{{name}}的助手"
// 拼接提示词: "小明"
// 结果: "你是小明的助手"
```

### 场景2：动态任务
```typescript
// 系统提示词: "任务：{{task}}"
// 拼接提示词: "实现快速排序"
// 结果: "任务：实现快速排序"
```

### 场景3：上下文增强
```typescript
// 系统提示词: "你是一位{{role}}"
// 拼接提示词: "资深Python开发者"
// 结果: "你是一位资深Python开发者"
```

## 🔄 与变量的区别

### 变量（直接提供）
```typescript
manager.renderSystemPrompt('prompt', { name: '小明' });
// 模板: "你好{{name}}" → "你好小明"
```

### 拼接提示词（动态注入）
```typescript
// 1. 注册拼接提示词
manager.registerConcatenatePrompt({
  id: 'inject-name',
  content: '小明',
  target: { promptId: 'prompt', variableName: 'name' },
  mode: 'replace'
});

// 2. 组合使用
manager.composePrompt('prompt', [], ['inject-name']);
// 结果: "你好小明"
```

## 💡 何时使用拼接提示词

**使用拼接提示词**：
- ✅ 需要从外部数据源动态注入
- ✅ 需要条件性插入内容
- ✅ 需要复用相同的注入逻辑
- ✅ 需要版本控制注入内容

**使用直接变量**：
- ✅ 简单的参数替换
- ✅ 运行时确定的值
- ✅ 一次性使用

## 📚 相关文档

- [README.md](../README.md) - 主说明文档
- [AI-Agent核心概念.md](../../../docs/设计规划/AI-Agent核心概念.md)
- [简化版提示词工程说明.md](../../../docs/设计规划/简化版提示词工程说明.md)