# 组织模块MCP API分析

## 一、组织插件 (OrganizationPlugin) 的MCP API

### 1. 基础工具 (所有成员都有)

#### `org_get_my_info`
- **描述**: 获取当前用户在组织中的信息
- **权限**: 所有成员（member + admin）
- **返回**: 用户ID、名称、角色、状态、所在组件列表
- **用途**: 用户查看自己的组织信息

#### `org_list_my_components`
- **描述**: 列出当前用户加入的所有协作组件
- **权限**: 所有成员（member + admin）
- **返回**: 组件ID和名称列表
- **用途**: 用户查看自己能访问哪些组件

#### `org_get_global_stats`
- **描述**: 获取组织全局统计信息
- **权限**: 所有成员（member + admin）
- **返回**: 总成员数、活跃成员数、组件数等
- **用途**: 了解组织整体状况

### 2. 管理员工具 (仅admin有)

#### `admin_create_component`
- **描述**: 创建新的协作组件
- **权限**: 仅管理员（admin）
- **参数**: id, name, description
- **用途**: 管理组织结构

#### `admin_delete_component`
- **描述**: 删除协作组件
- **权限**: 仅管理员（admin）
- **参数**: componentId
- **用途**: 清理无用组件

#### `admin_create_member`
- **描述**: 创建组织成员
- **权限**: 仅管理员（admin）
- **参数**: name, userToken, role
- **用途**: 管理组织成员

#### `admin_add_member_to_component`
- **描述**: 将成员添加到协作组件
- **权限**: 仅管理员（admin）
- **参数**: memberId, componentId
- **用途**: 分配成员到团队

### 3. 协作组件工具 (动态过滤)

#### `{componentId}_proxy_execute`
- **描述**: 通过协作组件代理执行工具
- **权限**: 成员必须在该组件中
- **参数**: toolName, args
- **用途**: 使用组件权限执行其他工具

#### `{componentId}_list_members`
- **描述**: 列出协作组件的所有成员
- **权限**: 成员必须在该组件中
- **返回**: 成员ID、名称、角色、状态
- **用途**: 查看团队成员

#### `{componentId}_get_component_info`
- **描述**: 获取协作组件详细信息
- **权限**: 成员必须在该组件中
- **返回**: 组件统计信息
- **用途**: 了解组件详情

## 二、标准协作组件 (StandardCollaborationComponent) 的MCP API

### 1. 基础工具 (所有成员都有)

#### `proxy_execute`
- **描述**: 通过协作组件代理执行工具调用
- **权限**: 组件内所有成员
- **参数**: toolName, args
- **用途**: 使用组件职权执行工具

#### `list_members`
- **描述**: 列出协作组件的所有成员
- **权限**: 组件内所有成员
- **返回**: 成员列表
- **用途**: 查看团队成员

#### `get_component_info`
- **描述**: 获取协作组件的详细信息
- **权限**: 组件内所有成员
- **返回**: 组件统计信息
- **用途**: 了解组件详情

### 2. 管理员专属工具 (仅组件内admin有)

#### `add_member`
- **描述**: 添加成员到协作组件
- **权限**: 组件内管理员
- **参数**: memberId
- **用途**: 管理团队成员

#### `remove_member`
- **描述**: 从协作组件移除成员
- **权限**: 组件内管理员
- **参数**: memberId
- **用途**: 管理团队成员

#### `set_component_active`
- **描述**: 设置协作组件的激活状态
- **权限**: 组件内管理员
- **参数**: active (boolean)
- **用途**: 启用/停用组件

## 三、全局工具提供器 (Global Tool Provider)

### 1. 工具获取

#### `getAllCollaborationTools(memberToken)`
- **描述**: 获取成员所有协作组件的带前缀工具
- **权限**: 需要有效token
- **返回**: 所有组件工具（已添加前缀）
- **用途**: 为AI Agent提供完整工具列表

### 2. 工具执行

#### `executeCollaborationTool(memberToken, fullToolName, args)`
- **描述**: 执行协作组件工具
- **权限**: 成员必须在对应组件中
- **参数**: 完整工具名（componentId_toolName）
- **用途**: 统一的工具执行入口

### 3. 信息查询

#### `getCollaborationComponentsInfo(memberToken)`
- **描述**: 获取协作组件信息（带工具列表）
- **权限**: 需要有效token
- **返回**: 组件详情和工具列表
- **用途**: 了解可用组件和工具

## 四、权限分析

### 1. 基础权限（所有成员）
- ✅ 查看自己的信息
- ✅ 查看自己所在的组件
- ✅ 查看组织统计
- ✅ 查看组件内成员
- ✅ 获取组件信息

### 2. 组件权限（成员资格）
- ✅ 使用组件代理执行工具
- ❌ 管理组件成员（需要admin）

### 3. 管理权限（管理员）
- ✅ 创建/删除组件
- ✅ 创建成员
- ✅ 分配成员到组件
- ✅ 在组件内添加/移除成员
- ✅ 控制组件激活状态

### 4. 权限验证点
1. **MCP服务器入口**: 统一权限管理器验证
2. **插件getTools()**: 根据token过滤可见工具
3. **插件execute()**: 验证工具执行权限
4. **协作组件**: 验证成员资格和角色

## 五、重复问题总结

### 重复的API逻辑
1. **前缀解析**: global-tool-provider 和 organization-plugin 都解析 componentId_toolName
2. **权限验证**: 两者都验证成员是否在组件中
3. **工具执行**: 两者都调用 component.executeMCPTool()

### 建议改进
- 协作组件直接返回带前缀工具
- 统一前缀管理器
- 简化插件，只委托不重复