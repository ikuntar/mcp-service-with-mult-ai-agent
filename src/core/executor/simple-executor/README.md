# 简化执行器框架

## 🎯 设计目标

提供一个简化的执行器层，只负责包装常规的阻塞前台命令，接收上层token，直接对接普通阻塞式MCP。

## 📦 核心组件

### 1. 接口定义 (`interface.ts`)
- `IExecutor` - 执行器基础接口
- `BlockingExecutor` - 阻塞式执行器接口
- `ExecutorConfig` - 执行配置
- `TokenValidationResult` - Token验证结果
- `ExecutionContext` - 执行上下文

### 2. 核心实现 (`implementation.ts`)
- `BasicBlockingExecutor` - 基础阻塞执行器
- `SimpleExecutorManager` - 简单执行器管理器
- `EnhancedExecutorManager` - 增强执行器管理器
- `TokenValidatorFactory` - Token验证器工厂
- `ExecutorConfigBuilder` - 配置构建器
- `ExecutorError` - 执行器错误类型

### 3. 主入口 (`index.ts`)
统一导出所有组件

## 🚀 快速开始

```typescript
import { 
  EnhancedExecutorManager, 
  TokenValidatorFactory 
} from './src/core/simple-executor';

// 1. 创建Token验证器
const validator = TokenValidatorFactory.createRoleBasedValidator({
  'user_token': 'user',
  'admin_token': 'admin'
});

// 2. 创建工具查找器
const toolFinder = {
  findTool(name: string) {
    // 从你的容器中查找工具
    return yourToolContainer.findRaw(name);
  }
};

// 3. 创建执行器管理器
const manager = new EnhancedExecutorManager(validator, toolFinder);

// 4. 执行工具
const result = await manager.blockingExecute('add', { a: 10, b: 20 }, 'user_token');
```

## 🔧 使用示例

### 基础执行器
```typescript
const executor = new BasicBlockingExecutor(
  TokenValidatorFactory.createAlwaysValidValidator('user')
);

const result = await executor.execute(tool, args, 'token', {
  timeout: 5000,
  needAuth: true
});
```

### 批量执行
```typescript
const tasks = [
  { toolName: 'add', args: { a: 1, b: 2 }, token: 'token' },
  { toolName: 'echo', args: { message: 'test' }, token: 'token' }
];

const results = await manager.batchExecute(tasks);
```

### 事件监听
```typescript
const listener = {
  onExecuteStart: (context) => console.log('开始执行:', context.toolName),
  onExecuteComplete: (result) => console.log('执行完成，耗时:', result.duration),
  onExecuteError: (error) => console.error('执行失败:', error.message)
};

executor.addListener(listener);
```

## 🔍 执行流程

```
用户请求 → Token验证 → 事件通知 → 阻塞执行 → 结果包装 → 返回结果
```

## ⚠️ 错误处理

所有错误使用 `ExecutorError` 类型：

- `TOKEN_INVALID` - Token验证失败
- `TIMEOUT` - 执行超时
- `EXECUTION_FAILED` - 执行失败
- `TOOL_NOT_FOUND` - 工具不存在
- `PERMISSION_DENIED` - 权限不足

## 📝 配置说明

```typescript
interface ExecutorConfig {
  timeout?: number;      // 超时时间（毫秒）
  needAuth?: boolean;    // 是否需要认证
  metadata?: object;     // 额外元数据
}
```

## 🎯 与MCP集成

```typescript
// 在MCP服务器中使用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const token = request.params?._meta?.token || 'default';
  
  return await manager.blockingExecute(name, args, token);
});
```

## ✅ 测试验证

运行测试：
```bash
cd /home/admin/project/mcp_tmp
npm run build
node -e "
const { EnhancedExecutorManager, TokenValidatorFactory } = require('./build/core/simple-executor');
// 测试代码...
"
```

## 📦 导出内容

```typescript
// 接口
export type {
  IExecutor, BlockingExecutor, ExecutorConfig,
  TokenValidationResult, ExecutionContext, WrappedExecutionResult,
  ExecutorEventListener, TokenValidator, ExecutorFactory, ExecutorManager
};

// 实现
export {
  BasicBlockingExecutor, SimpleExecutorManager, EnhancedExecutorManager,
  TokenValidatorFactory, ExecutorConfigBuilder, ExecutorError
};

// 工具类型
export type { ToolFinder };
```

## 🎯 特点

- ✅ **简化设计** - 只保留阻塞式执行
- ✅ **Token集成** - 接收上层token
- ✅ **统一接口** - 标准化执行入口
- ✅ **事件监听** - 支持执行监控
- ✅ **错误处理** - 统一错误类型
- ✅ **配置灵活** - 多级配置支持

## 📞 支持

如有问题，请查看源码中的详细注释和类型定义。