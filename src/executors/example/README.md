# 示例执行器集合

这个目录包含了所有执行器的示例实现，用于参考和学习。

## 目录结构

```
example/
├── filesystem/    # 文件系统执行器示例
├── network/       # 网络执行器示例
├── system/        # 系统执行器示例
└── default/       # 默认执行器示例
```

## 使用说明

这些执行器示例展示了如何：
1. 实现 `IExecutorFactory` 接口
2. 实现 `ExecutorInstance` 接口
3. 根据Token获取规则
4. 检查规则并执行操作

## 快速开始

### 1. 查看示例代码

```bash
# 查看文件系统执行器
cat src/executors/example/filesystem/factory.ts
cat src/executors/example/filesystem/instance.ts

# 查看网络执行器
cat src/executors/example/network/factory.ts
cat src/executors/example/network/instance.ts
```

### 2. 运行测试

```bash
# 运行完整的执行器系统测试
npx ts-node test-executor-system.ts
```

### 3. 在自己的项目中使用

```typescript
import { 
  UnifiedExecutorLayer,
  FileSystemExecutorFactory,
  NetworkExecutorFactory,
  TokenRuleManager,
  FileRuleStorage
} from './src/index';

// 1. 初始化
const ruleStorage = new FileRuleStorage('./data/rules.json');
const ruleManager = new TokenRuleManager(ruleStorage);
const executorFactory = new ExecutorFactory(ruleManager);

// 2. 注册自定义执行器
executorFactory.register('custom', new CustomExecutorFactory(ruleManager));

// 3. 创建统一执行器层
const unifiedExecutor = new UnifiedExecutorLayer('./data');

// 4. 执行工具
const result = await unifiedExecutor.executeTool(tool, args, token);
```

## 执行器类型说明

### FileSystemExecutor
- **工具前缀**: `file_`
- **功能**: 文件读写删除等操作
- **规则**: autoApprove, maxFileSize, maxCalls

### NetworkExecutor  
- **工具前缀**: `http_`
- **功能**: HTTP请求、下载等操作
- **规则**: autoApprove, timeout, allowedDomains, maxCalls

### SystemExecutor
- **工具前缀**: `exec_`
- **功能**: 系统命令执行
- **规则**: autoApprove, approver, allowedCommands, maxCalls

### DefaultExecutor
- **默认类型**: 未指定时使用
- **功能**: 直接调用工具的execute方法
- **规则**: autoApprove, maxCalls

## 规则管理

使用提供的MCP工具管理规则：

```typescript
import { ruleManagementTools, setRuleManager } from './src/index';

// 设置管理器
setRuleManager(ruleManager);

// 设置规则
await ruleManagementTools[0].execute({
  token: 'token_user1',
  executorId: 'filesystem',
  rules: { autoApprove: true, maxFileSize: 1024 * 1024 }
});

// 查看规则
await ruleManagementTools[1].execute({ token: 'token_user1' });

// 删除规则
await ruleManagementTools[2].execute({
  token: 'token_user1',
  executorId: 'system'
});

// 设置默认规则
await ruleManagementTools[3].execute({
  executorId: 'filesystem',
  rules: { autoApprove: true, maxFileSize: 1024 * 1024 }
});

// 查看默认规则
await ruleManagementTools[4].execute({ executorId: 'filesystem' });
```

## 设计原则

1. **单向调用**: 工具 → 统一执行层 → 执行器工厂 → 执行器实例
2. **Token中心**: 每个Token有独立的规则
3. **规则自管理**: 执行器实例根据Token获取规则
4. **直接执行**: 不使用队列，同步执行
5. **易于扩展**: 添加新执行器只需实现工厂和实例

## 注意事项

- 这些是示例实现，实际使用时需要根据需求修改
- 文件系统、网络、系统执行器包含模拟操作，实际使用需要替换为真实实现
- 规则检查逻辑可以根据业务需求扩展
- 建议在生产环境中添加更完善的错误处理和日志记录

## 下一步

1. 根据业务需求修改执行器实现
2. 添加自定义的执行器类型
3. 扩展规则检查逻辑
4. 集成到现有的MCP服务器中