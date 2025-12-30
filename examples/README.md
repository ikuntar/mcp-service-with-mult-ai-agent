# 示例代码目录

这个目录包含MCP框架的各种使用示例，帮助开发者快速理解和使用框架功能。

## 目录结构

```
examples/
├── basic/              # 基础使用示例
├── advanced/           # 高级功能示例
├── executors/          # 执行器使用示例
└── README.md          # 本文档
```

## 示例分类

### 基础使用 (basic/)
包含框架的基础使用示例，适合新手快速入门。

**示例内容**：
- 工具创建和注册
- 基础权限控制
- 简单的Token管理
- 基本的执行器使用

### 高级功能 (advanced/)
包含框架的高级功能示例，适合深入学习和复杂场景。

**示例内容**：
- 插件开发
- 自定义执行器
- 复杂权限模型
- 性能优化技巧

### 执行器示例 (executors/)
包含各种执行器的完整实现示例，直接从 `src/executors/example/` 移动而来。

**示例内容**：
- **filesystem/** - 文件系统执行器
- **network/** - 网络执行器
- **system/** - 系统执行器
- **default/** - 默认执行器

每个执行器示例都包含：
- `factory.ts` - 工厂实现
- `instance.ts` - 实例实现
- `index.ts` - 导出文件
- `README.md` - 使用说明

## 使用方法

### 运行基础示例
```bash
# 查看示例代码
cat examples/basic/example.ts

# 运行示例（需要先编译）
npm run build
node build/examples/basic/example.js
```

### 运行执行器示例
```bash
# 查看执行器实现
cat examples/executors/filesystem/factory.ts
cat examples/executors/filesystem/instance.ts

# 运行测试
node build/test/core/test-executor-framework.js
```

## 学习路径

### 新手推荐
1. 阅读 `docs/00_快速开始.md`
2. 查看 `examples/basic/` 中的基础示例
3. 运行 `examples/executors/default/` 的简单示例

### 进阶学习
1. 阅读 `docs/07_执行器框架使用指南.md`
2. 研究 `examples/executors/` 中的完整实现
3. 尝试 `examples/advanced/` 中的高级功能

### 实战应用
1. 复制 `examples/executors/` 到你的项目
2. 根据需求修改执行器实现
3. 参考 `docs/core/` 中的详细文档

## 重要说明

1. **示例代码**：所有示例都是可运行的，但可能需要根据实际环境调整
2. **执行器示例**：`executors/` 目录的代码是生产级别的实现参考
3. **持续更新**：示例会随着框架更新而维护

## 相关文档

- [执行器框架使用指南](../docs/07_执行器框架使用指南.md)
- [执行器架构说明](../docs/core/EXECUTOR_LAYER_README.md)
- [框架核心架构](../docs/03_框架架构核心.md)