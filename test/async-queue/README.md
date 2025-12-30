# 异步队列和消息队列测试

这些测试验证了基于对象的异步执行队列和消息队列功能，这是用户空间架构的核心特性。

## 测试文件说明

### test-async-queue-final.ts
**最终版本测试** - 最全面的测试，验证所有核心功能：
- ✅ 异步任务执行队列的完整生命周期
- ✅ 消息队列的发布、接收、回复功能
- ✅ 原始调用数据的完整存储和访问
- ✅ 丰富的返回信息（包含所有上下文）
- ✅ 用户Token明确标识
- ✅ 多用户隔离验证
- ✅ 任务所有权验证
- ✅ 统计信息获取

**运行命令：**
```bash
npx ts-node test/async-queue/test-async-queue-final.ts
```

### test-async-queue-integration.ts
**集成测试** - 测试异步队列与消息队列的集成：
- ✅ 用户空间创建
- ✅ 执行器注册和任务提交
- ✅ 消息队列操作
- ✅ MCP工具集成测试
- ✅ 清理和验证

**运行命令：**
```bash
npx ts-node test/async-queue/test-async-queue-integration.ts
```

### test-async-task-usage.ts
**使用测试** - 验证用户如何使用异步任务和消息队列：
- ✅ 注册MCP工具为异步任务
- ✅ 提交异步任务
- ✅ 任务状态管理
- ✅ 消息队列操作
- ✅ 工具管理

**运行命令：**
```bash
npx ts-node test/async-queue/test-async-task-usage.ts
```

## 核心功能验证

### 1. 异步执行队列
```typescript
// 提交任务
const task = userSpace.asyncTaskExecutor.submitTask(
  token,
  'tool_name',
  { arg1: 'value' },
  { priority: 'high' },
  'request-id'
);

// 等待完成
const result = await userSpace.asyncTaskExecutor.waitForTask(task.id);

// 查看原始调用
const originalCall = userSpace.asyncTaskExecutor.getTaskOriginalCall(task.id);
```

### 2. 消息队列
```typescript
// 发布消息
const message = globalMessageQueue.publish(
  'notification',
  token,
  destination,
  content,
  'high'
);

// 接收消息
const received = globalMessageQueue.receiveMessage(token);

// 回复消息
const reply = globalMessageQueue.reply(originalMessage, token, replyContent);
```

### 3. 原始调用数据
每个任务都包含完整的原始调用信息：
```typescript
{
  token: '用户Token',
  toolName: '工具名称',
  toolArgs: { /* 原始参数 */ },
  timestamp: '调用时间',
  requestId: '请求ID',
  metadata: { /* 元数据 */ }
}
```

## 测试重点

### 数据完整性
- ✅ 原始调用数据不丢失
- ✅ 返回信息包含所有必要字段
- ✅ 时间戳和请求ID正确

### 用户隔离
- ✅ 不同用户的任务相互隔离
- ✅ 消息队列按用户隔离
- ✅ 统计信息按用户统计

### 错误处理
- ✅ 任务超时处理
- ✅ 无效Token处理
- ✅ 工具不存在处理

## 预期输出

所有测试应该显示：
```
🚀 开始异步队列和消息队列最终测试

1️⃣ 创建用户空间
✅ 用户空间创建成功
   Token: test-token...
   角色: user

2️⃣ 验证用户Token
✅ Token验证成功
   角色: user

... (更多步骤)

📊 测试总结
✅ 异步执行队列功能完整
✅ 消息队列功能完整
✅ 原始调用数据存储完整
✅ 返回信息丰富
✅ 用户Token明确标识
✅ 支持查看原始调用
✅ 用户隔离正常
✅ MCP工具集成正常

🎉 所有测试通过！
```

## 故障排除

### 常见问题
1. **导入路径错误** - 确保使用新架构的模块路径
2. **Token过期** - 测试会自动创建有效Token
3. **端口冲突** - 无网络依赖，不会冲突

### 调试建议
1. 查看控制台输出的详细步骤
2. 检查任务状态和原始调用数据
3. 验证用户隔离效果