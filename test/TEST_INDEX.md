# 测试脚本完整索引

## 📊 测试脚本统计

**总测试脚本数：** 11个  
**新架构测试：** 5个  
**旧架构测试：** 6个  
**已归档：** 1个  

---

## 🚀 新架构测试（推荐使用）

### 异步队列和消息队列测试
| 测试文件 | 状态 | 说明 | 运行命令 |
|---------|------|------|----------|
| `test-async-queue-final.ts` | ✅ 完整 | 最终版本，验证所有功能 | `npx ts-node test/async-queue/test-async-queue-final.ts` |
| `test-async-queue-integration.ts` | ✅ 完整 | 集成测试，MCP工具集成 | `npx ts-node test/async-queue/test-async-queue-integration.ts` |
| `test-async-task-usage.ts` | ✅ 完整 | 使用测试，工具管理 | `npx ts-node test/async-queue/test-async-task-usage.ts` |

### 用户空间架构测试
| 测试文件 | 状态 | 说明 | 运行命令 |
|---------|------|------|----------|
| `test-optimized-architecture.ts` | ✅ 完整 | 优化架构，无需注册 | `npx ts-node test/user-space/test-optimized-architecture.ts` |
| `test-user-space-architecture.ts` | ✅ 完整 | 完整用户空间功能 | `npx ts-node test/user-space/test-user-space-architecture.ts` |

---

## 📚 旧架构测试（参考学习）

### 执行器系统测试
| 测试文件 | 状态 | 说明 | 运行命令 |
|---------|------|------|----------|
| `test-executor-system.ts` | ✅ 有效 | 执行器系统完整测试 | `npx ts-node test/executor/test-executor-system.ts` |
| `test-mcp-executor-flow.ts` | ✅ 有效 | MCP调用流程测试 | `npx ts-node test/executor/test-mcp-executor-flow.ts` |
| `test-token-executor-integration.ts` | ✅ 有效 | Token执行器集成 | `npx ts-node test/executor/test-token-executor-integration.ts` |

### 虚拟化测试
| 测试文件 | 状态 | 说明 | 运行命令 |
|---------|------|------|----------|
| `test-virtualization-simple.ts` | ✅ 有效 | 虚拟化简单测试 | `npx ts-node test/virtualization/test-virtualization-simple.ts` |
| `test-virtualization.ts` | ✅ 有效 | 虚拟化完整测试 | `npx ts-node test/virtualization/test-virtualization.ts` |

### 归档测试
| 测试文件 | 状态 | 说明 | 运行命令 |
|---------|------|------|----------|
| `test-simple-integration.ts` | ⚠️ 归档 | 简单集成测试（旧架构） | `npx ts-node test/archived/test-simple-integration.ts` |

---

## 🎯 测试功能对比

### 新架构特性
```
✅ 基于对象的异步执行队列
✅ 消息队列系统
✅ 原始调用数据完整存储
✅ 丰富的返回信息
✅ 用户Token明确标识
✅ 用户隔离
✅ 无需预先注册工具
✅ 工具容器集成
✅ 简化API设计
```

### 旧架构特性
```
✅ Token与执行器规则绑定
✅ 执行器权限控制
✅ 虚拟化资源管理
✅ 规则持久化
✅ 多执行器类型
✅ 批量执行支持
```

---

## 🏃 快速开始

### 推荐测试流程

1. **先运行优化架构测试**（了解最新设计）
```bash
npx ts-node test/user-space/test-optimized-architecture.ts
```

2. **再运行异步队列测试**（验证核心功能）
```bash
npx ts-node test/async-queue/test-async-queue-final.ts
```

3. **最后运行完整架构测试**（了解所有功能）
```bash
npx ts-node test/user-space/test-user-space-architecture.ts
```

### 学习旧架构

如果需要了解历史设计：
```bash
# 执行器系统
npx ts-node test/executor/test-executor-system.ts

# 虚拟化功能
npx ts-node test/virtualization/test-virtualization-simple.ts
```

---

## 📋 测试输出示例

### 新架构测试输出特点
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

### 旧架构测试输出特点
```
=== 执行器系统测试 ===
1. 初始化统一执行器层...
✓ 统一执行器层初始化完成
2. 设置Token规则...
  - 文件系统规则: 自动审批，1MB限制
  - 网络规则: 需要审批
  - 系统规则: 只允许ls, cat, echo
3. 测试工具执行...
测试1: Token1执行文件读取
  结果: 模拟读取文件: /tmp/test.txt
  状态: ✅ 成功
=== 测试完成 ===
```

---

## 🔍 故障排除

### 常见问题

1. **导入路径错误**
   ```
   ❌ 错误: Cannot find module './src/core/...'
   ✅ 解决: 新架构测试使用模块化路径，确保src目录结构完整
   ```

2. **编译错误**
   ```
   ❌ 错误: TS2802: Type 'Map<string, Message>' can only be iterated...
   ✅ 解决: 这是TypeScript配置问题，不影响运行
   ```

3. **运行时错误**
   ```
   ❌ 错误: Cannot find module '...'
   ✅ 解决: 确保在项目根目录运行，使用npx ts-node
   ```

### 调试建议

1. **查看详细输出** - 所有测试都有详细的步骤输出
2. **检查任务状态** - 使用getTask()查看任务详情
3. **验证原始数据** - 使用getTaskOriginalCall()查看原始调用
4. **检查用户隔离** - 创建多个用户验证隔离效果

---

## 📖 相关文档

- [测试脚本说明](README.md)
- [用户空间架构说明](../docs/用户空间架构说明.md)
- [MCP工具开发指南](../docs/MCP工具开发指南.md)
- [最新架构说明](../docs/最新架构说明.md)

---

## 🎯 测试覆盖目标

### 功能完整性
- [x] 异步任务执行队列
- [x] 消息队列系统
- [x] 原始调用数据存储
- [x] 用户隔离
- [x] 权限控制
- [x] 错误处理

### 架构优势
- [x] 简化API（无需预先注册）
- [x] 工具容器集成
- [x] 丰富的返回信息
- [x] 完整的上下文保留

### 兼容性
- [x] 新旧架构对比
- [x] 迁移指南
- [x] 最佳实践示例