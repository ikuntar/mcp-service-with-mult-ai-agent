# 用户空间架构测试

这些测试验证了优化后的用户空间架构，展示了如何简化异步任务的使用。

## 测试文件说明

### test-optimized-architecture.ts
**优化架构测试** - 演示最简化的使用方式：
- ✅ 无需预先注册工具
- ✅ 直接使用工具容器中的工具
- ✅ 一步完成任务提交
- ✅ 完整的原始调用数据
- ✅ 丰富的返回信息
- ✅ 自动权限检查
- ✅ 用户隔离正常

**运行命令：**
```bash
npx ts-node test/user-space/test-optimized-architecture.ts
```

### test-user-space-architecture.ts
**用户空间架构测试** - 完整的用户空间功能测试：
- ✅ 用户空间统一执行器
- ✅ Token与用户空间绑定
- ✅ 执行器规则管理
- ✅ 工具可见性控制
- ✅ 虚拟化资源管理
- ✅ 容器配置
- ✅ 批量执行
- ✅ 角色动态更新
- ✅ 生命周期管理

**运行命令：**
```bash
npx ts-node test/user-space/test-user-space-architecture.ts
```

## 核心功能验证

### 1. 优化架构（无需预先注册）
```typescript
// 1. 创建工具容器并注册工具（只需一次）
const container = new EnhancedToolContainer('测试容器', 'test', config);
container.register(testTool);
container.register(anotherTool);

// 2. 创建用户空间（自动集成工具容器）
const userSpace = globalOptimizedUserSpaceManager.getUserSpace(token, 'user', container);

// 3. 直接提交异步任务（无需预先注册！）
const task = userSpace.asyncTaskExecutor.submitTask(
  token,
  'test_async_tool',  // 直接指定工具名
  { delay: 500, message: 'Hello' },
  { priority: 'high' },
  'request-001'
);
```

### 2. 用户空间统一执行器
```typescript
// 初始化
const executor = new UserSpaceUnifiedExecutor();

// 执行工具（自动处理Token验证、规则检查、执行器选择）
const result = await executor.executeTool(tool, args, token, role);

// 批量执行
const results = await executor.executeBatch([
  { tool: tool1, args: args1, token: token1, role: role1 },
  { tool: tool2, args: args2, token: token2, role: role2 }
]);
```

### 3. 执行器规则管理
```typescript
// 设置规则
await userSpaceManagementTools[1].execute({
  token: token1,
  executorId: 'filesystem',
  rules: { autoApprove: true, maxFileSize: 1024 * 1024 }
});

// 查看规则
const rules = await userSpaceManagementTools[1].execute({ token: token1 });
```

### 4. 虚拟化资源管理
```typescript
// 设置资源
await userSpaceManagementTools[7].execute({
  token: token1,
  resources: { cpu: 4, memory: 8, disk: 100 }
});

// 执行虚拟化操作
await userSpaceManagementTools[5].execute({
  token: token1,
  action: 'create',
  args: { name: 'vm1' }
});
```

## 测试重点

### 架构简化
- ✅ 消除"先注册后调用"的冗余
- ✅ 工具容器自动集成
- ✅ 一步完成任务提交

### 权限控制
- ✅ Token与用户空间绑定
- ✅ 执行器规则生效
- ✅ 工具可见性控制

### 资源管理
- ✅ 虚拟化资源隔离
- ✅ 容器配置管理
- ✅ 生命周期控制

## 预期输出

### 优化架构测试
```
🚀 开始优化架构测试

1️⃣ 创建用户Token
✅ Token: test-token...

2️⃣ 创建工具容器并注册工具
✅ 工具容器创建完成，注册了 2 个工具

3️⃣ 创建用户空间
✅ 用户空间创建完成

4️⃣ 直接提交异步任务（无需注册）
✅ 任务1提交成功
   任务ID: xxx
   工具: test_async_tool
   状态: pending
   原始调用: {"token":"...","toolName":"test_async_tool",...}

... (更多步骤)

📊 优化架构优势总结
✅ 无需预先注册工具
✅ 直接使用工具容器中的工具
✅ 一步完成任务提交
✅ 完整的原始调用数据
✅ 丰富的返回信息
✅ 自动权限检查
✅ 用户隔离正常

🎉 优化架构测试完成！
```

### 用户空间架构测试
```
=== 用户空间架构测试 ===

1. 初始化用户空间统一执行器...
✓ 执行器初始化完成

2. 创建测试Token...
✓ Token1 (user): ...
✓ Token2 (admin): ...

3. 为Token1设置用户空间...
  - 创建用户空间: 成功
  - 文件系统规则: 自动审批，1MB限制
  - 网络规则: 需要审批
  - 系统规则: 只允许ls, cat, echo

... (更多测试)

=== 测试完成 ===

总结：
✓ 用户空间架构成功实现
✓ Token与用户空间完美绑定
✓ 执行器规则正常工作
✓ 工具可见性控制有效
✓ 虚拟化资源管理正常
✓ 容器配置功能完整
✓ 批量执行支持
✓ 角色动态更新
✓ 生命周期管理完整
✓ 架构简化成功（减少层级）
```

## 架构对比

### 旧架构
```
用户 → Token → 用户空间 → 注册工具 → 提交任务 → 执行器 → 规则检查 → 执行
```

### 新架构
```
用户 → Token → 用户空间 → 工具容器 → 直接提交 → 执行器 → 规则检查 → 执行
```

**优势：**
- 减少一个层级
- 无需预先注册
- 更直观的API
- 更好的工具管理

## 故障排除

### 常见问题
1. **工具容器未集成** - 确保创建用户空间时传入容器
2. **规则不生效** - 检查Token是否正确绑定
3. **虚拟化操作失败** - 确保先设置资源

### 调试建议
1. 查看详细的步骤输出
2. 验证Token绑定状态
3. 检查规则配置