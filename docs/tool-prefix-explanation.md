# 工具前缀机制详解

## 前缀的作用

工具前缀 `componentId_toolName` 是为了解决 **多组织环境下的工具区分问题**。

### 问题场景

想象一个AI Agent需要管理多个团队：
- **前端团队** 有工具：`deploy`, `build`, `test`
- **后端团队** 也有工具：`deploy`, `build`, `test`
- **安全团队** 有工具：`scan`, `audit`

**如果没有前缀**，AI Agent会看到：
```
deploy
build  
test
scan
audit
```

AI Agent无法区分哪个 `deploy` 属于哪个团队！

**有了前缀**，AI Agent看到：
```
frontend-team_deploy
frontend-team_build
frontend-team_test
backend-team_deploy
backend-team_build
backend-team_test
security-team_scan
security-team_audit
```

现在AI Agent可以明确指定：`frontend-team_deploy`

## 前缀的关联组件

### 1. 协作组件 (Collaboration Component)

```typescript
// 创建协作组件
const frontendComponent = await globalOrganizationManager.registerCollaborationComponent({
  id: 'frontend-team',      // 组件ID - 这就是前缀
  name: '前端开发团队',
  description: '负责前端开发'
});
```

### 2. 组件的MCP工具

```typescript
// 协作组件提供的工具
async getMCPTools(memberToken: string): Promise<Tool[]> {
  return [
    {
      name: 'proxy_execute',     // 原始工具名
      description: '代理执行工具'
    },
    {
      name: 'list_members',      // 原始工具名
      description: '列出成员'
    }
  ];
}
```

### 3. 前缀包装器

```typescript
// tool-wrapper.ts - 为工具添加前缀
const wrappedTools = await wrapCollaborationComponentTools(
  component,          // 协作组件实例
  memberToken,        // 成员Token
  'frontend-team'     // 组件ID - 作为前缀
);

// 结果：
// [
//   { name: 'frontend-team_proxy_execute', description: '[前端开发团队] 代理执行工具' },
//   { name: 'frontend-team_list_members', description: '[前端开发团队] 列出成员' }
// ]
```

## 完整流程示例

### 场景：Alice需要部署前端代码

```typescript
// 1. Alice的Token
const aliceToken = 'user-alice-token-123';

// 2. Alice加入了两个团队
//    - frontend-team (前端团队)
//    - backend-team (后端团队)

// 3. 获取Alice可用的所有工具
const tools = await getAllCollaborationTools(aliceToken);
// 返回：
// [
//   { name: 'frontend-team_proxy_execute', ... },
//   { name: 'frontend-team_list_members', ... },
//   { name: 'backend-team_proxy_execute', ... },
//   { name: 'backend-team_list_members', ... }
// ]

// 4. AI Agent选择使用前端团队的部署工具
await executeCollaborationTool(
  aliceToken,
  'frontend-team_proxy_execute',  // 明确指定团队
  { toolName: 'deploy', args: { version: 'v1.0' } }
);

// 5. 系统执行流程：
//    a. 解析前缀：componentId = 'frontend-team', toolName = 'proxy_execute'
//    b. 验证Alice在frontend-team中 ✓
//    c. 通过前端团队的代理执行
//    d. 赋予前端团队的权限
//    e. 执行实际的deploy操作
```

## 前缀的三层含义

### 1. **身份标识**
```
frontend-team_ → 这个工具属于前端团队
```

### 2. **权限范围**
```
frontend-team_deploy → 使用前端团队的权限执行deploy
```

### 3. **资源隔离**
```
frontend-team_file_read → 只能读取前端团队的文件
```

## 实际应用示例

### 用户视角

```typescript
// 用户Alice
{
  id: 'alice',
  token: 'user-token-123',
  collaborationComponents: ['frontend-team', 'backend-team']
}

// Alice可用的工具（带前缀）：
// - frontend-team_deploy
// - frontend-team_build
// - backend-team_deploy
// - backend-team_build
```

### AI Agent视角

```typescript
// AI Agent看到的工具列表：
const availableTools = [
  {
    name: 'frontend-team_deploy',
    description: '[前端团队] 部署应用',
    execute: async (args) => { /* ... */ }
  },
  {
    name: 'backend-team_deploy',  
    description: '[后端团队] 部署服务',
    execute: async (args) => { /* ... */ }
  }
];

// AI Agent可以明确调用：
await callTool('frontend-team_deploy', { version: 'v1.0' });
```

### 系统执行视角

```typescript
// 1. 解析工具名
const parsed = parseToolPrefix('frontend-team_deploy');
// { componentId: 'frontend-team', toolName: 'deploy' }

// 2. 验证权限
const member = findMemberByToken(userToken);
if (!member.collaborationComponents.has('frontend-team')) {
  throw new Error('无权访问前端团队工具');
}

// 3. 获取组件
const component = getCollaborationComponent('frontend-team');

// 4. 通过组件代理执行
const result = await component.executeMCPTool(
  userToken,
  'deploy',  // 原始工具名
  { version: 'v1.0' }
);
```

## 为什么需要前缀？

### 问题1：工具名称冲突
```
❌ 无前缀：deploy, build, test (冲突)
✅ 有前缀：frontend-team_deploy, backend-team_deploy (清晰)
```

### 问题2：权限混淆
```
❌ 无前缀：用户不知道使用哪个团队的权限
✅ 有前缀：明确指定团队，使用对应权限
```

### 问题3：资源隔离
```
❌ 无前缀：无法区分操作的资源范围
✅ 有前缀：frontend-team_file_read 只能读前端团队文件
```

## 前缀格式规范

### 标准格式
```
{componentId}_{toolName}
```

### 示例
```
frontend-team_deploy
backend-team_build  
security-team_scan
code-review-team_list_members
```

### 特殊规则
- 组件ID不能包含 `_`
- 工具名可以包含 `_`
- 使用第一个 `_` 作为分隔符

## 总结

**工具前缀的核心作用**：
1. **解决命名冲突** - 不同团队可以有同名工具
2. **明确权限范围** - 每个前缀对应一个协作组件的权限
3. **支持多对多关系** - 一个用户可以在多个团队，使用不同工具

**前缀关联的组件**：
- **协作组件** - 提供工具和权限
- **组织成员** - 持有Token，加入多个组件
- **全局管理器** - 聚合所有组件的工具

这就是为什么需要工具前缀机制的原因！