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

### 组织模块测试
- **test-unified-permission-test.ts** - 统一权限管理器测试
  - 权限检查逻辑
  - 角色权限验证
  - 工具列表过滤
  - 动态权限组注册

### 新组织架构测试
- **test/organization-new/test-hierarchical.ts** - 分层管理器测试
- **test/organization-new/demo-complete.ts** - 完整流程演示
- **test/organization-new/test-token-conflict.ts** - Token冲突检测
- **test/organization-new/test-mcp-integration.ts** - MCP集成测试

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

### 核心组件测试
- **core/test-fused-executor.ts** - 融合执行器测试
- **core/test-executor-framework.ts** - 执行器框架测试

### AI Agent测试
- **ai-agent/test-mvp-agent.ts** - MVP代理测试
- **ai-agent/test-simple-refactored.ts** - 简化重构测试
- **ai-agent/test-refactored.ts** - 重构测试
- **ai-agent/test-new-architecture.ts** - 新架构测试
- **ai-agent/test-mcp-session.ts** - MCP会话测试
- **ai-agent/test-multi-provider.ts** - 多提供商测试

### 用户空间测试
- **user-space/test-user-space-architecture.ts** - 用户空间架构测试
- **user-space/test-optimized-architecture.ts** - 优化架构测试

### 异步队列测试
- **async-queue/test-async-queue-final.ts** - 异步队列最终测试
- **async-queue/test-async-queue-integration.ts** - 异步队列集成测试
- **async-queue/test-async-task-usage.ts** - 异步任务使用测试

### 执行器测试
- **executor/test-executor-system.ts** - 执行器系统测试
- **executor/test-mcp-executor-flow.ts** - MCP执行器流程测试
- **executor/test-token-executor-integration.ts** - Token执行器集成测试

### 虚拟化测试
- **virtualization/test-virtualization-simple.ts** - 虚拟化简单测试
- **virtualization/test-virtualization.ts** - 虚拟化完整测试

### 组织模块测试
- **organization/test-organization.ts** - 组织模块测试

### 新组织架构测试
- **organization-new/test-hierarchical.ts** - 分层管理器测试
- **organization-new/demo-complete.ts** - 完整流程演示
- **organization-new/quick-conflict-test.ts** - 快速冲突测试
- **organization-new/quick-validate-new.ts** - 快速验证测试
- **organization-new/test-mcp-integration.ts** - MCP集成测试
- **organization-new/test-member-roles.ts** - 成员角色测试
- **organization-new/test-new-architecture.ts** - 新架构测试
- **organization-new/test-token-conflict.ts** - Token冲突测试

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

# 统一权限管理器测试
npx ts-node test/unified-permission-test.ts

# 新组织架构测试
npx ts-node test/organization-new/test-hierarchical.ts
npx ts-node test/organization-new/demo-complete.ts
```

### 运行旧架构测试
```bash
# 执行器系统测试
npx ts-node test/executor/test-executor-system.ts

# 虚拟化测试
npx ts-node test/virtualization/test-virtualization-simple.ts

# AI Agent测试
npx ts-node test/ai-agent/test-mvp-agent.ts
npx ts-node test/ai-agent/test-simple-refactored.ts
```

### 运行核心组件测试
```bash
# 融合执行器测试
npx ts-node test/core/test-fused-executor.ts

# 执行器框架测试
npx ts-node test/core/test-executor-framework.ts
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
- [用户空间架构说明](../docs/08_用户空间架构说明.md)
- [MCP调用示例](../docs/MCP调用示例.md)
- [组织模块API分析](../docs/organization-module-api-analysis.md)
- [权限管理系统说明](../docs/权限管理系统说明.md)

---

**文档版本**: v4.0.0
**最后更新**: 2026-01-08
**维护状态**: ✅ 活跃

## 📋 测试清理说明

**已删除的临时/过时测试**:
- ❌ refactor-test.ts - 重构测试（过时）
- ❌ permission-test.ts - 旧权限测试（重复）
- ❌ permission-fix-test.ts - 旧权限修复测试（过时）
- ❌ analyze-tool-prefix.ts - 前缀分析（临时）
- ❌ prefix-relationship-demo.ts - 前缀演示（临时）
- ❌ mcp-organization-flow.ts - MCP流程测试（临时）
- ❌ organization-plugin-test.ts - 旧组织插件测试（重复）
- ❌ enhanced-plugin-test.ts - 增强插件测试（重复）
- ❌ prompt-engine-three-types.js - 提示词测试（过时）
- ❌ simple-prompt-engine.js - 简化提示词测试（过时）
- ❌ duplication-examples.ts - 重复示例（临时）
- ❌ code-duplication-analysis.md - 重复分析（临时）

**保留的核心测试**: 1个根级测试 + 按功能分类的完整测试套件