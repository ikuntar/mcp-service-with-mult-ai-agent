# 高级功能示例

这个目录包含MCP框架的高级功能示例，适合深入学习和复杂场景开发。

## 文件说明

### executor-integration.ts
执行器集成高级示例，包含：
- **secureFileTool** - 带执行器配置的文件操作工具
- **httpTool** - 网络请求工具（异步执行器）
- **systemCommandTool** - 系统命令执行工具
- **adminTool** - 管理员操作工具
- **demonstrateExecutorLayer()** - 直接使用执行器层的示例

## 核心概念

### 1. 执行器配置
```typescript
executor: {
  timeout: 15000,      // 超时时间（毫秒）
  needAuth: true,      // 是否需要权限验证
  metadata: {          // 元数据
    operation: 'file-io',
    riskLevel: 'high'
  }
}
```

### 2. 执行器类型
- **BasicExecutor** - 直接执行，无隔离
- **IsolatedExecutor** - 进程隔离执行
- **SandboxExecutor** - 沙箱环境执行
- **AsyncExecutor** - 异步执行

### 3. 权限层级
```
用户请求 → Token验证 → 容器权限 → 执行器验证 → 工具执行
```

## 使用场景

### 场景1：文件操作
```typescript
const fileTool: Tool = {
  name: 'file_operation',
  executor: {
    timeout: 10000,
    needAuth: true,
    metadata: { operation: 'file-io', privileged: false }
  },
  execute: async (args) => {
    // 文件操作逻辑
    return { content: [{ type: 'text', text: '操作完成' }] };
  }
};
```

### 场景2：网络请求
```typescript
const apiTool: Tool = {
  name: 'api_call',
  executor: {
    timeout: 30000,
    needAuth: true,
    metadata: { operation: 'network', protocol: 'https' }
  },
  execute: async (args) => {
    // 网络请求逻辑
    return { content: [{ type: 'text', text: '响应数据' }] };
  }
};
```

### 场景3：系统命令
```typescript
const cmdTool: Tool = {
  name: 'system_cmd',
  executor: {
    timeout: 60000,
    needAuth: true,
    metadata: { operation: 'system', privileged: true }
  },
  execute: async (args) => {
    // 系统命令逻辑
    return { content: [{ type: 'text', text: '执行结果' }] };
  }
};
```

## 高级特性

### 1. Token规则管理
```typescript
import { TokenRuleManager } from '../../src/core/token-rule-manager';
import { FileRuleStorage } from '../../src/core/storage/file-rule-storage';

const storage = new FileRuleStorage('./data/rules.json');
const ruleManager = new TokenRuleManager(storage);

// 为Token添加执行器规则
await ruleManager.addRule('user-token', {
  executorType: 'isolated',
  timeout: 10000,
  allowedOperations: ['read', 'write']
});
```

### 2. 直接使用执行器层
```typescript
import { UnifiedExecutorLayer } from '../../src/core/unified-executor-layer';

const executor = new UnifiedExecutorLayer('./data');
const result = await executor.executeTool(tool, args, token);
```

### 3. 容器集成
```typescript
import { integrateExecutorLayer } from '../../src/core/executor-framework';

const executorContainer = integrateExecutorLayer(container, validator);
const result = await executorContainer.executeWithRoleAndToken(
  'admin', 'admin_operation', { action: 'restart' }, 'admin-token'
);
```

## 安全考虑

### 1. 超时控制
```typescript
executor: {
  timeout: 30000,  // 30秒超时，防止长时间阻塞
  // ...
}
```

### 2. 权限验证
```typescript
executor: {
  needAuth: true,  // 强制权限验证
  // ...
}
```

### 3. 元数据审计
```typescript
executor: {
  metadata: {
    audit: true,   // 需要审计
    privileged: true  // 特权操作
  }
}
```

## 调试技巧

### 1. 查看执行器配置
```typescript
console.log('工具配置:', {
  name: tool.name,
  executor: tool.executor,
  groups: tool.groups
});
```

### 2. 监控执行过程
```typescript
const result = await executorLayer.executeTool(tool, args, token);
console.log('执行结果:', result);
console.log('是否错误:', result.isError);
```

### 3. 错误处理
```typescript
try {
  const result = await executorLayer.executeTool(tool, args, token);
  if (result.isError) {
    console.error('工具执行错误:', result.content);
  }
} catch (error) {
  console.error('执行器错误:', error);
}
```

## 性能优化

### 1. 合理设置超时
```typescript
// 简单操作：5-10秒
executor: { timeout: 5000 }

// 复杂操作：30-60秒
executor: { timeout: 30000 }

// 批量操作：120秒以上
executor: { timeout: 120000 }
```

### 2. 使用适当的执行器
```typescript
// 简单计算：basic
executor: { type: 'basic' }

// 文件操作：isolated
executor: { type: 'isolated' }

// 不可信代码：sandbox
executor: { type: 'sandbox' }

// 网络请求：async
executor: { type: 'async' }
```

### 3. 权限缓存
```typescript
// 避免重复验证
const cachedValidator = TokenValidatorFactory.createCachedValidator();
```

## 测试建议

### 1. 单元测试
```typescript
// 测试工具执行
const result = await executorLayer.executeTool(testTool, args, token);
assert(result.content[0].text === expected);
```

### 2. 权限测试
```typescript
// 测试不同角色的权限
const userResult = await container.executeWithRole('user', 'admin_tool', args);
assert(userResult.isError === true); // 应该被拒绝
```

### 3. 性能测试
```typescript
// 测试执行时间
const start = Date.now();
await executorLayer.executeTool(tool, args, token);
const duration = Date.now() - start;
assert(duration < tool.executor.timeout);
```

## 学习路径

1. **基础示例** - 先掌握 `examples/basic/`
2. **执行器文档** - 阅读 `docs/07_执行器框架使用指南.md`
3. **核心架构** - 阅读 `docs/core/UNIFIED_EXECUTOR_FUSION.md`
4. **本示例代码** - 逐步理解每个工具的设计
5. **执行器实现** - 查看 `examples/executors/` 的完整实现

## 常见问题

### Q: 如何选择执行器类型？
A: 根据操作特性：
- **basic**：纯计算，无副作用
- **isolated**：文件操作，需要隔离
- **sandbox**：不可信代码，高安全
- **async**：网络请求，长时间任务

### Q: 如何调试执行器问题？
A: 
1. 检查Token是否有效
2. 查看执行器配置是否正确
3. 确认权限规则是否匹配
4. 查看超时设置是否合理

### Q: 如何优化性能？
A:
1. 合理设置超时时间
2. 使用缓存避免重复验证
3. 选择合适的执行器类型
4. 优化工具的execute函数

## 下一步

- 研究 `examples/executors/` 中的完整实现
- 阅读 `docs/core/EXECUTOR_LAYER_README.md`
- 尝试修改执行器配置并测试
- 创建自定义执行器类型