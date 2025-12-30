# 05_Token管理系统

## 🎯 学习目标
- 理解Token生命周期管理
- 掌握Token创建、验证、续期操作
- 学会Token规则管理

## 🔐 Token核心概念

### Token生命周期

```
创建 → 激活 → 使用 → 续期 → 停用 → 清理 → 删除
```

### Token数据结构

```typescript
interface TokenInfo {
  token: string;           // Token字符串
  role: string;            // 关联角色
  description: string;     // Token描述
  createdAt: string;       // 创建时间
  expiresAt?: string;      // 过期时间
  isActive: boolean;       // 是否激活
  lastUsed?: string;       // 最后使用时间
  usageCount: number;      // 使用次数
}
```

## 🛠️ Token管理工具（9个）

### 基础操作
- `token_create` - 创建Token
- `token_validate` - 验证Token
- `token_info` - 获取Token信息
- `token_delete` - 删除Token

### 状态管理
- `token_deactivate` - 停用Token
- `token_activate` - 激活Token
- `token_renew` - 续期Token

### 维护操作
- `token_cleanup` - 清理过期Token
- `token_stats` - Token统计信息

## 💡 使用示例

### 1. 创建Token

```typescript
import { tokenManagementTools } from './src/index';

// 创建Token（需要admin角色）
const result = await tokenManagementTools[0].execute({
  role: 'analyst',
  description: '数据分析专用Token',
  expiresIn: '2h'  // 2小时后过期
});

// 返回: { token: 'abc123...', info: { ... } }
const token = result.content[0].text;
```

### 2. 验证Token

```typescript
// 验证Token有效性
const validationResult = await tokenManagementTools[1].execute({
  token: 'abc123...'
});

// 返回: { isValid: true, role: 'analyst' }
const role = validationResult.structuredContent.role;
```

### 3. 获取Token信息

```typescript
// 查看Token详细信息
const infoResult = await tokenManagementTools[2].execute({
  token: 'abc123...'
});

// 返回Token的所有信息
const tokenInfo = infoResult.structuredContent;
```

### 4. Token状态管理

```typescript
// 停用Token
await tokenManagementTools[3].execute({
  token: 'abc123...'
});

// 激活Token
await tokenManagementTools[4].execute({
  token: 'abc123...'
});

// 续期Token（延长2小时）
await tokenManagementTools[5].execute({
  token: 'abc123...',
  expiresIn: '2h'
});
```

### 5. 维护操作

```typescript
// 清理过期Token
await tokenManagementTools[6].execute({});

// 获取统计信息
const stats = await tokenManagementTools[7].execute({});
// 返回: { total: 10, active: 8, expired: 2, usage: { ... } }
```

## 🔐 Token与权限集成

### 使用Token获取工具列表

```bash
# 1. 创建Token
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"token_create","arguments":{"role":"analyst","description":"测试","expiresIn":"2h"}}}' | node build/index.js

# 2. 使用Token获取工具列表
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{"_meta":{"token":"your-token"}}}' | node build/index.js

# 3. 使用Token执行工具
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"echo","arguments":{"message":"hello"},"_meta":{"token":"your-token"}}}' | node build/index.js
```

### Token与执行器规则

```typescript
// Token可以与执行器规则结合使用
// 1. 创建Token
const token = await tokenManagementTools[0].execute({
  role: 'user',
  description: '用户Token'
});

// 2. 设置执行器规则
await ruleManagementTools[0].execute({
  token: token.content[0].text,
  executorId: 'filesystem',
  rules: { autoApprove: true, maxFileSize: 1024 * 1024 }
});

// 3. 使用Token执行工具（自动应用规则）
const executor = new UnifiedExecutorLayer('./data');
await executor.executeTool(tool, args, token.content[0].text);
```

## 📊 Token生命周期管理

### 1. 创建策略

```typescript
// 短期Token（测试用）
const shortToken = await tokenManagementTools[0].execute({
  role: 'user',
  description: '测试Token',
  expiresIn: '30m'  // 30分钟
});

// 长期Token（生产用）
const longToken = await tokenManagementTools[0].execute({
  role: 'analyst',
  description: '数据分析Token',
  expiresIn: '7d'  // 7天
});

// 永不过期（谨慎使用）
const permanentToken = await tokenManagementTools[0].execute({
  role: 'admin',
  description: '管理Token',
  expiresIn: 'never'
});
```

### 2. 监控和维护

```typescript
// 定期检查Token状态
async function monitorTokens() {
  // 获取统计信息
  const stats = await tokenManagementTools[7].execute({});
  
  // 清理过期Token
  if (stats.expired > 0) {
    await tokenManagementTools[6].execute({});
  }
  
  // 检查即将过期的Token
  const allTokens = await tokenManagementTools[2].execute({});
  // 发送预警通知
}

// 设置定时任务
setInterval(monitorTokens, 60 * 60 * 1000); // 每小时检查一次
```

### 3. 安全最佳实践

```typescript
// 1. Token描述要清晰
const token = await tokenManagementTools[0].execute({
  role: 'analyst',
  description: '数据分析团队-张三-2025-12-27',
  expiresIn: '1d'
});

// 2. 定期轮换Token
async function rotateToken(oldToken) {
  // 创建新Token
  const newToken = await tokenManagementTools[0].execute({
    role: 'analyst',
    description: '轮换后的Token',
    expiresIn: '1d'
  });
  
  // 验证新Token
  await tokenManagementTools[1].execute({
    token: newToken.content[0].text
  });
  
  // 停用旧Token
  await tokenManagementTools[3].execute({
    token: oldToken
  });
  
  return newToken.content[0].text;
}

// 3. 最小权限原则
const minimalToken = await tokenManagementTools[0].execute({
  role: 'user',  // 使用最低权限角色
  description: '只读操作Token',
  expiresIn: '4h'
});
```

## 🧪 Token测试

### 测试Token创建和验证

```typescript
async function testTokenLifecycle() {
  try {
    // 1. 创建Token
    const createResult = await tokenManagementTools[0].execute({
      role: 'analyst',
      description: '测试Token',
      expiresIn: '1h'
    });
    const token = createResult.content[0].text;
    console.log('✓ Token创建成功:', token);

    // 2. 验证Token
    const validateResult = await tokenManagementTools[1].execute({ token });
    console.log('✓ Token验证成功:', validateResult.structuredContent);

    // 3. 获取信息
    const infoResult = await tokenManagementTools[2].execute({ token });
    console.log('✓ Token信息:', infoResult.structuredContent);

    // 4. 续期
    await tokenManagementTools[5].execute({ token, expiresIn: '2h' });
    console.log('✓ Token续期成功');

    // 5. 停用
    await tokenManagementTools[3].execute({ token });
    console.log('✓ Token停用成功');

    // 6. 激活
    await tokenManagementTools[4].execute({ token });
    console.log('✓ Token激活成功');

    // 7. 删除
    await tokenManagementTools[3].execute({ token });
    console.log('✓ Token删除测试完成');

  } catch (error) {
    console.error('✗ Token测试失败:', error.message);
  }
}
```

### 集成测试

```bash
# 完整测试流程
# 1. 创建Token
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"token_create","arguments":{"role":"analyst","description":"集成测试","expiresIn":"1h"}}}' | node build/index.js

# 2. 验证Token
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"validate_token","arguments":{"token":"your-token"}}}' | node build/index.js

# 3. 获取信息
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"token_info","arguments":{"token":"your-token"}}}' | node build/index.js

# 4. 使用Token获取工具列表
echo '{"jsonrpc":"2.0","id":4,"method":"tools/list","params":{"_meta":{"token":"your-token"}}}' | node build/index.js

# 5. 续期
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"token_renew","arguments":{"token":"your-token","expiresIn":"2h"}}}' | node build/index.js

# 6. 统计
echo '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"token_stats","arguments":{}}}' | node build/index.js
```

## 🎯 核心优势

### 完整生命周期管理
- **创建** - 灵活的过期时间设置
- **验证** - 实时有效性检查
- **续期** - 动态延长有效期
- **状态管理** - 激活/停用控制
- **清理** - 自动维护

### 与权限系统集成
- **角色绑定** - Token与RBAC角色关联
- **规则支持** - 可与执行器规则结合
- **工具可见性** - 自动应用权限过滤

### 安全特性
- **过期机制** - 自动失效
- **状态控制** - 可停用可疑Token
- **使用追踪** - 记录使用情况
- **统计分析** - 监控Token状态

## ⚠️ 注意事项

1. **过期时间** - 根据使用场景合理设置
2. **角色权限** - Token角色决定可用工具
3. **安全存储** - 妥善保管Token字符串
4. **定期维护** - 清理过期和无用Token
5. **权限最小化** - 使用最低必要权限

## 📚 相关文档

- **权限控制**：[02_权限控制详解.md](02_权限控制详解.md)
- **执行器框架**：[03_框架架构核心.md](03_框架架构核心.md)
- **用户空间架构**：[08_用户空间架构说明.md](08_用户空间架构说明.md)

---

**下一步**: 学习 [04_配置系统使用.md](04_配置系统使用.md)