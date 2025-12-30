# 测试脚本索引

本目录包含所有测试脚本，按功能和架构版本分类。

## 📁 目录结构

```
test/
├── async-queue/          # 异步队列和消息队列测试（新架构）
├── user-space/           # 用户空间架构测试（新架构）
├── executor/             # 执行器系统测试（旧架构）
├── virtualization/       # 虚拟化功能测试（旧架构）
├── archived/             # 归档的旧测试脚本
└── core/                 # 核心组件测试
```

## 🚀 新架构测试（推荐）

### 异步队列和消息队列
这些测试验证了基于对象的异步执行队列和消息队列功能：

- **test-async-queue-final.ts** - 最终版本测试，验证完整功能
  - 异步任务执行队列
  - 消息队列
  - 原始调用数据存储
  - 丰富的返回信息
  - 用户隔离

- **test-async-queue-integration.ts** - 集成测试
  - 异步执行队列与消息队列集成
  - MCP工具集成测试

- **test-async-task-usage.ts** - 使用测试
  - 异步任务注册和提交
  - 消息队列操作
  - 工具管理

### 用户空间架构
这些测试验证了优化后的用户空间架构：

- **test-optimized-architecture.ts** - 优化架构测试
  - 无需预先注册工具
  - 直接使用工具容器
  - 一步任务提交
  - 完整的原始调用数据

- **test-user-space-architecture.ts** - 用户空间架构测试
  - 用户空间统一执行器
  - Token与用户空间绑定
  - 执行器规则
  - 工具可见性
  - 虚拟化资源管理

## 📚 旧架构测试（参考）

### 执行器系统测试
- **executor/test-executor-system.ts** - 完整执行器系统测试
- **executor/test-mcp-executor-flow.ts** - MCP调用流程测试
- **executor/test-token-executor-integration.ts** - Token执行器集成测试

### 虚拟化测试
- **virtualization/test-virtualization-simple.ts** - 虚拟化简单测试
- **virtualization/test-virtualization.ts** - 虚拟化完整测试

### 归档测试
- **archived/test-simple-integration.ts** - 简单集成测试（旧架构）

## 🧪 运行测试

### 运行新架构测试
```bash
# 异步队列测试
npx ts-node test/async-queue/test-async-queue-final.ts

# 用户空间优化架构测试
npx ts-node test/user-space/test-optimized-architecture.ts

# 用户空间架构测试
npx ts-node test/user-space/test-user-space-architecture.ts
```

### 运行旧架构测试
```bash
# 执行器系统测试
npx ts-node test/executor/test-executor-system.ts

# 虚拟化测试
npx ts-node test/virtualization/test-virtualization-simple.ts
```

## 📋 测试覆盖

### 新架构特性
- ✅ 基于对象的异步执行队列
- ✅ 消息队列系统
- ✅ 原始调用数据完整存储
- ✅ 丰富的返回信息
- ✅ 用户Token明确标识
- ✅ 用户隔离
- ✅ 无需预先注册工具
- ✅ 工具容器集成

### 旧架构特性
- ✅ Token与执行器规则绑定
- ✅ 执行器权限控制
- ✅ 虚拟化资源管理
- ✅ 规则持久化

## 🔧 开发指南

### 添加新测试
1. 根据功能选择合适的目录
2. 使用新架构（推荐）或旧架构
3. 遵循现有测试的代码风格
4. 确保导入路径正确

### 测试命名规范
- 功能描述清晰
- 使用小写字母和连字符
- 包含架构版本标识

## 📖 相关文档
- [用户空间架构说明](../docs/用户空间架构说明.md)
- [MCP工具开发指南](../docs/MCP工具开发指南.md)
- [最新架构说明](../docs/最新架构说明.md)