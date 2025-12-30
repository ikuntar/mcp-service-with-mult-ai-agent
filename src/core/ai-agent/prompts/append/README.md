# 追加提示词目录

## 📁 说明

此目录存放**追加提示词**的JSON配置文件。

## 📝 文件格式

每个JSON文件可以包含多个追加提示词：

```json
{
  "appendPrompts": [
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
      "position": "after",  // before/after/replace
      "metadata": {
        "version": "1.0.0",
        "description": "描述",
        "tags": ["tag1", "tag2"]
      }
    }
  ]
}
```

## 📚 已有文件

### default-append.json
- **format-json**: JSON格式要求
- **quality-check**: 质量检查清单

## 🔑 关键字段

### position (追加位置)
- **before**: 在系统提示词之前
- **after**: 在系统提示词之后（默认）
- **replace**: 替换整个提示词

## 🎯 使用示例

```typescript
import { autoLoadPrompts } from '../prompt-engine';

const { manager } = await autoLoadPrompts();

// 组合系统提示词和追加提示词
const result = manager.composePrompt(
  'default-assistant',  // 系统提示词ID
  ['format-json', 'quality-check'],  // 追加提示词IDs
  []  // 拼接提示词IDs
);

console.log(result.content);
```

## 📝 添加新追加提示词

### 示例1：格式要求
```json
{
  "appendPrompts": [
    {
      "id": "markdown-format",
      "name": "Markdown格式",
      "format": "fixed",
      "content": "请使用Markdown格式返回，包含标题、列表和代码块。",
      "position": "after"
    }
  ]
}
```

### 示例2：约束条件
```json
{
  "appendPrompts": [
    {
      "id": "length-constraint",
      "name": "长度限制",
      "format": "fixed",
      "content": "约束条件：\n- 回答不超过200字\n- 使用简洁语言\n- 避免多余解释",
      "position": "after"
    }
  ]
}
```

### 示例3：模板格式
```json
{
  "appendPrompts": [
    {
      "id": "custom-format",
      "name": "自定义格式",
      "format": "template",
      "template": "输出格式：\n```{{format}}\n{{content}}\n```",
      "variables": [
        { "name": "format", "type": "string", "required": true, "default": "json" },
        { "name": "content", "type": "string", "required": true }
      ],
      "position": "after"
    }
  ]
}
```

## 🔄 位置说明

### before 示例
```typescript
// 系统提示词: "你是助手"
// 追加提示词(before): "请用中文回答"
// 结果: "请用中文回答\n\n你是助手"
```

### after 示例
```typescript
// 系统提示词: "你是助手"
// 追加提示词(after): "请用JSON格式"
// 结果: "你是助手\n\n请用JSON格式"
```

### replace 示例
```typescript
// 系统提示词: "你是助手"
// 追加提示词(replace): "你是专家"
// 结果: "你是专家"
```

## 🎨 常见用途

1. **格式要求**：JSON、Markdown、XML等
2. **质量检查**：准确性、完整性、一致性
3. **约束条件**：长度、风格、语言等
4. **示例提供**：给出回答示例
5. **角色强化**：强调专业性

## 📚 相关文档

- [README.md](../README.md) - 主说明文档
- [AI-Agent核心概念.md](../../../docs/设计规划/AI-Agent核心概念.md)