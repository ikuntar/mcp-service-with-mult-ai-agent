# 基础使用示例

这个目录包含MCP框架的基础使用示例，适合新手快速入门。

## 文件说明

### simple-tool.ts
包含4个基础工具示例：
- **echo** - 简单的消息回显工具
- **calculate** - 数学计算工具
- **get_system_info** - 系统信息工具
- **file_read** - 带执行器配置的文件读取工具

## 快速开始

### 1. 查看示例代码
```bash
cat examples/basic/simple-tool.ts
```

### 2. 编译项目
```bash
npm run build
```

### 3. 运行测试
```bash
# 测试echo工具
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"echo","arguments":{"message":"Hello!"}}}' | node build/index.js

# 测试calculate工具
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"calculate","arguments":{"expression":"2 + 3 * 4"}}}' | node build/index.js
```

## 工具详解

### Echo工具
```typescript
export const echoTool: Tool = {
  name: 'echo',
  description: '回显用户输入的消息',
  groups: ['public'],  // 所有角色可访问
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  },
  execute: async (args) => ({
    content: [{ type: 'text', text: `Echo: ${args.message}` }]
  })
};
```

### Calculator工具
```typescript
export const calculatorTool: Tool = {
  name: 'calculate',
  description: '执行简单的数学计算',
  groups: ['basic'],  // user及以上角色可访问
  // ... 其他配置
  execute: async (args) => {
    const result = eval(args.expression);
    return { content: [{ type: 'text', text: `结果: ${result}` }] };
  }
};
```

### 带执行器配置的工具
```typescript
export const fileReadTool: Tool = {
  name: 'file_read',
  description: '读取文件内容（模拟）',
  groups: ['sensitive'],
  executor: {
    timeout: 10000,    // 10秒超时
    needAuth: true     // 需要权限验证
  },
  // ... 其他配置
};
```

## 权限模型

### 角色权限
- **user**: 可访问 `public`, `basic` 组
- **analyst**: 可访问 `public`, `basic`, `advanced` 组
- **admin**: 可访问所有组

### 工具分组
- `public` - 公共工具（所有角色）
- `basic` - 基础工具（user+）
- `advanced` - 高级工具（analyst+）
- `sensitive` - 敏感工具（admin）
- `file-io` - 文件操作（admin）
- `network` - 网络操作（analyst+）
- `admin-only` - 管理员专用

## 注册工具

### 方式1：直接注册到容器
```typescript
import { EnhancedToolContainer } from '../../src/core/enhanced-tool-container';
import { echoTool, calculatorTool } from './simple-tool';

const container = new EnhancedToolContainer({
  name: 'my-container',
  defaultRole: 'user',
  roles: {
    user: { name: 'user', allowedGroups: ['public', 'basic'] },
    analyst: { name: 'analyst', allowedGroups: ['public', 'basic', 'advanced'] },
    admin: { name: 'admin', allowedGroups: ['*'] }
  }
});

// 注册工具
container.register(echoTool);
container.register(calculatorTool);
```

### 方式2：使用注册函数
```typescript
import { registerBasicTools } from './simple-tool';

registerBasicTools(container);
```

## 执行工具

### 使用容器执行
```typescript
// 切换角色
await container.executeWithRole('user', 'switch_role', { role: 'analyst' });

// 执行工具
const result = await container.executeWithRole('analyst', 'calculate', {
  expression: '2 + 3 * 4'
});

console.log(result);
```

### 使用执行器层执行
```typescript
import { UnifiedExecutorLayer } from '../../src/core/unified-executor-layer';
import { echoTool } from './simple-tool';

const executor = new UnifiedExecutorLayer('./data');
const result = await executor.executeTool(
  echoTool,
  { message: 'Hello!' },
  'user-token'
);
```

## 学习路径

1. **理解基础概念** - 阅读 `docs/00_快速开始.md`
2. **学习工具开发** - 阅读 `docs/01_工具开发基础.md`
3. **理解权限模型** - 阅读 `docs/02_权限控制详解.md`
4. **运行本示例** - 实践上面的代码
5. **查看高级示例** - 进入 `examples/advanced/`
6. **研究执行器** - 查看 `examples/executors/`

## 常见问题

### Q: 工具不可见？
A: 检查：
1. 工具的 `groups` 是否正确
2. 当前角色的 `allowedGroups` 是否包含该组
3. 工具是否正确注册到容器

### Q: 权限拒绝？
A: 确认：
1. 当前Token的角色
2. 工具所需的组权限
3. 角色的组权限配置

### Q: 执行失败？
A: 检查：
1. 参数是否符合 `inputSchema`
2. 执行器配置是否正确
3. Token是否有效

## 下一步

- 查看 `examples/advanced/executor-integration.ts` 学习高级功能
- 查看 `examples/executors/` 学习执行器实现
- 阅读 `docs/07_执行器框架使用指南.md` 深入理解执行器