# MCP会话系统

MCP会话系统为AI-Agent提供了与MCP（Model Context Protocol）服务器交互的能力，支持工具调用、上下文管理和事件驱动的会话流程。

## 核心特性

### 1. 工具调用支持
- **多种调用格式**: 支持 `@toolName(params)`、`JSON格式`、`toolName: params` 等多种调用方式
- **参数验证**: 自动验证工具参数类型和必填字段
- **错误处理**: 完善的错误处理和反馈机制

### 2. 事件系统
- **工具调用事件**: `tool-call`、`tool-result`、`tool-error`
- **标准会话事件**: `start`、`step`、`message`、`end`、`timeout`、`error`
- **实时监控**: 可以监听所有会话事件进行监控和日志记录

### 3. 上下文管理
- **持久化上下文**: 会话期间保持上下文信息
- **上下文操作**: 支持设置、获取、清空上下文
- **历史记录**: 完整的消息历史和工具调用记录

### 4. 消息操作
- **撤销/修改**: 支持撤销最后一条消息或修改消息内容
- **重置**: 可以重置会话但保留工具和上下文
- **导出/导入**: 会话历史的序列化和恢复

## 快速开始

### 1. 创建MCP会话

```typescript
import { createMCPSession, createMCPTool } from '@mcp-ai-agent';

// 定义工具
const tools = [
  createMCPTool('readFile', '读取文件', {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件路径' }
    },
    required: ['path']
  })
];

// 创建会话
const session = createMCPSession('my-session', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  mcpHeaders: { 'Authorization': 'Bearer token' },
  tools: tools,
  initialContext: '文件助手'
});
```

### 2. 使用会话

```typescript
// 监听事件
session.on((event) => {
  console.log(`事件: ${event.type}`, event.data);
});

// 启动会话
await session.start();

// 发送消息（自动解析工具调用）
await session.sendMessage('@readFile(path=/tmp/test.txt)');

// 普通对话
await session.sendMessage('你好，能帮我做什么？');

// 取消会话
await session.cancel();
```

## 工具调用格式

### 1. @符号格式
```
@toolName(param1=value1, param2=value2)
```

示例：
```
@readFile(path=/tmp/test.txt)
@calculate(expression=100+200)
```

### 2. JSON格式
```json
{
  "tool": "toolName",
  "params": {
    "param1": "value1",
    "param2": 123
  }
}
```

### 3. 冒号格式
```
toolName: param1=value1, param2=value2
```

## 参数类型支持

- **字符串**: `param=value` 或 `param="quoted value"`
- **数字**: `param=123` 或 `param=3.14`
- **布尔**: `param=true` 或 `param=false`
- **null**: `param=null`

## 事件类型

### 工具相关事件
- `tool-call`: 工具调用开始
- `tool-result`: 工具调用成功
- `tool-error`: 工具调用失败

### 会话相关事件
- `start`: 会话开始
- `step`: 步骤执行
- `message`: 消息添加
- `end`: 会话结束
- `timeout`: 会话超时
- `error`: 错误发生

## API参考

### 创建函数

#### createMCPSession(id, config)
创建MCP会话实例。

**参数:**
- `id`: 会话ID
- `config`: 配置对象
  - `mcpEndpoint`: MCP端点URL
  - `mcpHeaders`: 请求头
  - `tools`: 工具定义数组
  - `initialContext`: 初始上下文
  - `timeout`: 超时时间（毫秒）

**返回:** `MCPSession` 实例

#### createMCPTool(name, description, parameters)
创建工具定义。

**参数:**
- `name`: 工具名称
- `description`: 工具描述
- `parameters`: 参数定义（JSON Schema格式）

**返回:** `MCPToolDefinition` 对象

### MCPSessionFactory

#### create(id, config)
快速创建MCP会话。

#### createFromToolDefinitions(id, endpoint, tools, headers?)
从工具定义数组创建。

#### createWithSystemPrompt(id, config)
创建带系统提示的会话。

### MCPSession 实例方法

#### 会话控制
- `start()`: 启动会话
- `cancel()`: 取消会话
- `waitUntilEnd()`: 等待会话结束

#### 消息处理
- `sendMessage(content)`: 发送消息
- `handleMessage(content)`: 处理消息（内部）

#### 工具管理
- `addTool(tool)`: 添加工具
- `addTools(tools)`: 批量添加工具
- `getTools()`: 获取工具列表

#### 上下文管理
- `getContext()`: 获取上下文
- `setContext(context)`: 设置上下文
- `clearContext()`: 清空上下文

#### 消息操作
- `undo()`: 撤销最后一条消息
- `modifyLastMessage(content, role?)`: 修改消息
- `reset()`: 重置会话

#### 历史记录
- `exportHistory()`: 导出历史
- `importHistory(history)`: 导入历史

#### 端点管理
- `updateMCPEndpoint(endpoint, headers?)`: 更新端点

#### 事件系统
- `on(handler)`: 添加事件处理器
- `off(handler)`: 移除事件处理器

## 使用示例

### 1. 文件操作助手

```typescript
const session = createMCPSession('file-assistant', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  tools: [
    createMCPTool('readFile', '读取文件', {
      type: 'object',
      properties: {
        path: { type: 'string' }
      },
      required: ['path']
    }),
    createMCPTool('writeFile', '写入文件', {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' }
      },
      required: ['path', 'content']
    })
  ]
});

await session.start();

// 调用工具
await session.sendMessage('@readFile(path=/tmp/notes.txt)');
await session.sendMessage('writeFile(path=/tmp/notes.txt, content=Hello World)');

await session.cancel();
```

### 2. 计算助手

```typescript
const session = MCPSessionFactory.create('calc-assistant', {
  mcpEndpoint: 'http://localhost:3000/mcp',
  tools: [
    createMCPTool('calculate', '计算器', {
      type: 'object',
      properties: {
        expression: { type: 'string' }
      },
      required: ['expression']
    })
  ]
});

await session.start();

// 自然语言调用
await session.sendMessage('计算 15 + 27');
// 会自动解析为 @calculate(expression=15+27)

await session.cancel();
```

### 3. 事件监控

```typescript
const session = createMCPSession('monitored', config);

session.on((event) => {
  switch (event.type) {
    case 'tool-call':
      console.log(`🔧 调用: ${event.data.tool}`, event.data.arguments);
      break;
    case 'tool-result':
      console.log(`✅ 结果:`, event.data.result);
      break;
    case 'tool-error':
      console.log(`❌ 错误:`, event.data.error);
      break;
  }
});

await session.start();
// ... 使用会话
```

## 最佳实践

### 1. 错误处理
```typescript
try {
  const response = await session.sendMessage('@toolName(params)');
  if (response.includes('失败') || response.includes('错误')) {
    // 处理错误
  }
} catch (error) {
  console.error('会话错误:', error);
}
```

### 2. 事件监听
```typescript
// 监控关键事件
session.on((event) => {
  if (event.type === 'tool-error') {
    // 记录错误
    logger.error('工具调用失败', event.data);
  }
});
```

### 3. 会话生命周期管理
```typescript
// 确保会话正确关闭
process.on('SIGINT', async () => {
  await session.cancel();
  process.exit(0);
});
```

### 4. 参数验证
```typescript
// 在调用前验证参数
const tool = session.getTools().find(t => t.name === 'readFile');
if (tool && tool.parameters) {
  // 检查参数是否符合要求
}
```

## 故障排除

### 常见问题

1. **工具调用无响应**
   - 检查MCP端点是否可访问
   - 验证工具名称是否正确
   - 确认参数格式是否正确

2. **参数验证失败**
   - 检查必填参数是否提供
   - 验证参数类型是否匹配
   - 查看错误消息获取详细信息

3. **事件未触发**
   - 确认事件处理器是否正确注册
   - 检查事件类型拼写
   - 验证会话状态

### 调试技巧

```typescript
// 启用详细日志
session.on((event) => {
  console.log(`[DEBUG] ${event.type}:`, JSON.stringify(event.data, null, 2));
});

// 检查会话状态
console.log('状态:', session.getStatus());
console.log('工具:', session.getTools());
console.log('消息数:', session.getMessages().length);
```

## 扩展功能

### 自定义工具处理器

```typescript
class CustomMCPSession extends MCPSession {
  protected async executeToolCall(toolCall: MCPToolCall): Promise<string> {
    // 自定义工具调用逻辑
    if (toolCall.name === 'customTool') {
      return await this.handleCustomTool(toolCall.arguments);
    }
    return super.executeToolCall(toolCall);
  }
}
```

### 事件过滤器

```typescript
function createFilteredSession(config, eventFilter) {
  const session = createMCPSession('filtered', config);
  const originalOn = session.on.bind(session);
  
  session.on = (handler) => {
    return originalOn((event) => {
      if (eventFilter(event)) {
        handler(event);
      }
    });
  };
  
  return session;
}
```

## 性能优化

1. **批量工具调用**: 合并多个工具调用减少网络请求
2. **连接复用**: 保持MCP连接，避免重复建立
3. **缓存结果**: 对频繁调用的工具结果进行缓存
4. **异步处理**: 使用异步处理避免阻塞

## 安全考虑

1. **参数验证**: 始终验证工具参数
2. **端点认证**: 使用安全的认证机制
3. **输入清理**: 清理用户输入防止注入
4. **权限控制**: 限制可用工具范围

## 与其他系统集成

### 与执行器集成

```typescript
import { UnifiedExecutorLayer } from '../executor';

const executor = new UnifiedExecutorLayer({
  // 配置
});

// 将MCP会话作为工具提供给执行器
executor.registerTool('mcp-session', async (config) => {
  const session = createMCPSession('executor-session', config);
  await session.start();
  return session;
});
```

### 与消息队列集成

```typescript
import { globalMessageQueue } from '../message-queue';

// 发送MCP事件到消息队列
session.on((event) => {
  if (event.type === 'tool-result') {
    globalMessageQueue.publish('mcp.result', event.data);
  }
});
```

这个MCP会话系统为AI-Agent提供了强大的外部工具集成能力，支持复杂的交互模式和灵活的扩展机制。