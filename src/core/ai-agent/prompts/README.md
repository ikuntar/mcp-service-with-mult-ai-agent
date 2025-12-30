# 提示词JSON配置目录

## 📁 目录结构

```
src/core/ai-agent/prompts/
├── system/              # 系统提示词
│   ├── default-system.json
│   └── README.md
├── append/             # 追加提示词
│   ├── default-append.json
│   └── README.md
└── concatenate/        # 拼接提示词
    ├── default-concatenate.json
    └── README.md
```

## 📝 JSON配置格式

### 系统提示词 (system/*.json)

```json
{
  "systemPrompts": [
    {
      "id": "prompt-id",
      "name": "提示词名称",
      "format": "fixed",  // 或 "template"
      "content": "固定内容",  // 固定格式
      "template": "{{variable}}模板",  // 模板格式
      "variables": [  // 模板变量定义
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

### 追加提示词 (append/*.json)

```json
{
  "appendPrompts": [
    {
      "id": "prompt-id",
      "name": "提示词名称",
      "format": "fixed",
      "content": "追加内容",
      "position": "after",  // before/after/replace
      "metadata": {
        "version": "1.0.0",
        "description": "描述"
      }
    }
  ]
}
```

### 拼接提示词 (concatenate/*.json)

```json
{
  "concatenatePrompts": [
    {
      "id": "prompt-id",
      "name": "提示词名称",
      "format": "fixed",
      "content": "拼接内容",
      "target": {
        "promptId": "目标提示词ID",
        "variableName": "目标变量名"
      },
      "mode": "replace",  // prepend/append/replace
      "metadata": {
        "version": "1.0.0",
        "description": "描述"
      }
    }
  ]
}
```

## 🚀 使用方法

### 1. 自动加载

```typescript
import { autoLoadPrompts } from './src/core/ai-agent/prompt-engine';

const { manager, loadResult } = await autoLoadPrompts();

if (loadResult.success) {
  console.log(`加载了 ${loadResult.loaded.system} 个系统提示词`);
  console.log(`加载了 ${loadResult.loaded.append} 个追加提示词`);
  console.log(`加载了 ${loadResult.loaded.concatenate} 个拼接提示词`);
}
```

### 2. 自定义目录

```typescript
import { createPromptManagerWithJSON } from './src/core/ai-agent/prompt-engine';

const { manager, loadResult } = await createPromptManagerWithJSON(
  { strictMode: false },
  { rootDir: './custom/prompts' }
);
```

### 3. 手动加载单个文件

```typescript
import { JSONLoader } from './src/core/ai-agent/prompt-engine';
import { PromptManager } from './src/core/ai-agent/prompt-engine';

const manager = new PromptManager();
const loader = new JSONLoader(manager);

const result = await loader.loadFile('./prompts/system/my-prompt.json');
console.log(`加载了 ${result.system} 个系统提示词`);
```

### 4. 导出配置

```typescript
import { JSONLoader } from './src/core/ai-agent/prompt-engine';

const loader = new JSONLoader(manager);
const exported = await loader.exportToJSON('./export-dir');

console.log('导出文件:', exported);
```

## 📋 默认配置文件

### default-system.json
- **default-assistant**: 默认助手提示词
- **code-generator**: 代码生成器提示词

### default-append.json
- **format-json**: JSON格式要求
- **quality-check**: 质量检查清单

### default-concatenate.json
- **dynamic-data**: 动态数据注入
- **extra-info**: 额外信息注入

## 🎯 使用场景

### 场景1：快速启动
```typescript
const { manager } = await autoLoadPrompts();
const result = manager.renderSystemPrompt('default-assistant');
// 立即获得默认助手提示词
```

### 场景2：自定义配置
```typescript
// 1. 修改JSON文件
// 2. 重新加载
const { manager } = await autoLoadPrompts();
// 配置立即生效，无需重启
```

### 场景3：多环境配置
```typescript
// 开发环境
const { manager } = await autoLoadPrompts({
  rootDir: './config/prompts/dev'
});

// 生产环境
const { manager } = await autoLoadPrompts({
  rootDir: './config/prompts/prod'
});
```

### 场景4：A/B测试
```typescript
// 版本A
const { manager: managerA } = await autoLoadPrompts({
  rootDir: './prompts/version-a'
});

// 版本B
const { manager: managerB } = await autoLoadPrompts({
  rootDir: './prompts/version-b'
});
```

## 🔧 高级配置

### 扫描选项
```typescript
const { manager } = await autoLoadPrompts({
  rootDir: './custom/path',      // 自定义根目录
  recursive: true,               // 递归扫描子目录
  pattern: '*.json',             // 文件匹配模式
  autoLoadDefaults: true         // 自动加载默认配置
});
```

### 管理器配置
```typescript
const { manager } = await createPromptManagerWithJSON(
  {
    strictMode: true,      // 严格模式
    useDefaults: true,     // 使用默认值
    autoFormat: true       // 自动格式化
  },
  {
    rootDir: './prompts'
  }
);
```

## 📝 添加新提示词

### 步骤1：创建JSON文件
在对应目录创建JSON文件，例如：
```json
// system/my-custom.json
{
  "systemPrompts": [
    {
      "id": "my-custom",
      "name": "我的自定义提示词",
      "format": "template",
      "template": "你是一位{{role}}，擅长{{skill}}",
      "variables": [
        { "name": "role", "type": "string", "required": true },
        { "name": "skill", "type": "string", "required": true }
      ]
    }
  ]
}
```

### 步骤2：自动加载
```typescript
const { manager } = await autoLoadPrompts();
// 新提示词自动加载
```

### 步骤3：使用
```typescript
const result = manager.renderSystemPrompt('my-custom', {
  role: '设计师',
  skill: 'UI/UX设计'
});
```

## 🔄 迁移指南

### 从代码初始化迁移到JSON

**原代码**：
```typescript
const prompt = SystemPromptFactory.createFixed(
  'my-prompt',
  '我的提示词',
  '内容'
);
manager.registerSystemPrompt(prompt);
```

**新方式**：
```json
// system/my-prompt.json
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

**加载**：
```typescript
const { manager } = await autoLoadPrompts();
```

## 💡 最佳实践

1. **命名规范**：使用小写和连字符，如 `code-generator`
2. **版本管理**：在metadata中记录版本号
3. **文档注释**：在metadata中添加描述
4. **分类标签**：使用tags组织提示词
5. **测试验证**：加载后验证提示词是否正确

## 📚 相关文档

- [AI-Agent核心概念.md](../docs/设计规划/AI-Agent核心概念.md)
- [简化版提示词工程说明.md](../docs/设计规划/简化版提示词工程说明.md)
- [JSON初始化vs代码初始化对比.md](../docs/设计规划/JSON初始化vs代码初始化对比.md)