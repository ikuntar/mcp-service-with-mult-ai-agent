# 系统提示词目录

## 📁 说明

此目录存放**系统提示词**的JSON配置文件。

## 📝 文件格式

每个JSON文件可以包含多个系统提示词：

```json
{
  "systemPrompts": [
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

### default-system.json
- **default-assistant**: 默认助手
- **code-generator**: 代码生成器

## ➕ 添加新提示词

### 方法1：添加到现有文件
```json
{
  "systemPrompts": [
    // ... 现有提示词
    {
      "id": "new-prompt",
      "name": "新提示词",
      "format": "fixed",
      "content": "新内容"
    }
  ]
}
```

### 方法2：创建新文件
```json
// new-prompts.json
{
  "systemPrompts": [
    {
      "id": "my-prompt",
      "name": "我的提示词",
      "format": "fixed",
      "content": "内容"
    }
  ]
}
```

## 🎯 使用示例

```typescript
import { autoLoadPrompts } from '../prompt-engine';

const { manager } = await autoLoadPrompts();

// 使用默认助手
const assistant = manager.renderSystemPrompt('default-assistant');

// 使用代码生成器
const codeGen = manager.renderSystemPrompt('code-generator', {
  language: 'Python',
  task: '实现冒泡排序'
});
```

## 🔍 验证加载

```typescript
const { manager, loadResult } = await autoLoadPrompts();

console.log('系统提示词:', loadResult.loaded.system);
console.log('文件:', loadResult.files);
```

## 📚 相关文档

- [README.md](../README.md) - 主说明文档
- [AI-Agent核心概念.md](../../../docs/设计规划/AI-Agent核心概念.md)