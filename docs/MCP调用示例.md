# MCP调用示例 - 异步任务和消息队列

## 一、异步任务调用示例

### 1. 注册已存在的MCP工具为异步任务

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "register_async_task",
    "arguments": {
      "token": "user-abc123",
      "toolName": "echo",
      "toolDescription": "回声工具，返回输入的消息",
      "inputSchema": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string",
            "description": "要回显的消息"
          }
        },
        "required": ["message"]
      }
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ MCP工具已注册为异步任务\n\n工具名称: echo\n描述: 回声工具，返回输入的消息\n\n提示: 使用submit_async_task提交异步任务"
      }
    ]
  }
}
```

### 2. 提交异步任务

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "submit_async_task",
    "arguments": {
      "token": "user-abc123",
      "toolName": "echo",
      "toolArgs": {
        "message": "Hello, async world!"
      },
      "metadata": {
        "priority": "high",
        "category": "greeting"
      }
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ 异步任务已提交\n\n任务ID: async_task_1766896070783_xyz789\n工具: echo\n状态: pending\n创建时间: 2025-12-28T05:57:21.644Z\n\n提示: 使用get_async_task_status查询任务状态"
      }
    ]
  }
}
```

### 3. 查询任务状态

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_async_task_status",
    "arguments": {
      "token": "user-abc123",
      "taskId": "async_task_1766896070783_xyz789"
    }
  }
}
```

**服务器响应（任务完成时）：**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "📊 异步任务状态\n\n任务ID: async_task_1766896070783_xyz789\n工具: echo\n状态: completed\n创建时间: 2025-12-28T05:57:21.644Z\n开始时间: 2025-12-28T05:57:21.645Z\n完成时间: 2025-12-28T05:57:21.650Z\n结果: {\n  \"content\": [{\"type\": \"text\", \"text\": \"Hello, async world!\"}],\n  \"isError\": false\n}"
      }
    ]
  }
}
```

### 4. 等待任务完成

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "wait_async_task",
    "arguments": {
      "token": "user-abc123",
      "taskId": "async_task_1766896070783_xyz789",
      "timeout": 30000
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ 任务完成\n\n任务ID: async_task_1766896070783_xyz789\n状态: completed\n结果: {\n  \"content\": [{\"type\": \"text\", \"text\": \"Hello, async world!\"}],\n  \"isError\": false\n}"
      }
    ]
  }
}
```

### 5. 获取用户所有异步任务

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_user_async_tasks",
    "arguments": {
      "token": "user-abc123"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "用户异步任务列表 (2个):\n\n✅ async_task_1766896070783_xyz789 | echo | completed | 2025-12-28T05:57:21.644Z\n⏳ async_task_1766896070784_abc123 | data_processor | pending | 2025-12-28T05:57:22.100Z"
      }
    ]
  }
}
```

### 6. 获取异步任务统计

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "get_async_task_stats",
    "arguments": {
      "token": "user-abc123"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "📊 异步任务执行器统计\n\n总任务数: 2\n已注册工具: 3\n\n状态分布:\n  completed: 1\n  pending: 1"
      }
    ]
  }
}
```

### 7. 取消任务

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "cancel_async_task",
    "arguments": {
      "token": "user-abc123",
      "taskId": "async_task_1766896070784_abc123"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ 任务已取消: async_task_1766896070784_abc123"
      }
    ]
  }
}
```

### 8. 删除任务

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "delete_async_task",
    "arguments": {
      "token": "user-abc123",
      "taskId": "async_task_1766896070783_xyz789"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ 任务已删除: async_task_1766896070783_xyz789"
      }
    ]
  }
}
```

### 9. 查看已注册的工具列表

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "tools/call",
  "params": {
    "name": "get_registered_tools",
    "arguments": {
      "token": "user-abc123"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "已注册的MCP工具 (3个):\n\n1. echo\n   描述: 回声工具，返回输入的消息\n\n2. data_processor\n   描述: 数据处理工具\n\n3. file_reader\n   描述: 文件读取工具\n"
      }
    ]
  }
}
```

## 二、消息队列调用示例

### 1. 发布消息

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "tools/call",
  "params": {
    "name": "user_publish_message",
    "arguments": {
      "token": "user-abc123",
      "type": "notification",
      "destination": "user-xyz789",
      "content": {
        "message": "任务已完成",
        "taskId": "async_task_1766896070783_xyz789"
      },
      "priority": "high",
      "ttl": 300
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ 消息已发布\n\n消息ID: msg_1766896070785_def456\n类型: notification\n优先级: high\n源: user-abc123\n目标: user-xyz789\n时间: 2025-12-28T05:57:21.700Z\n\n提示: 使用user_receive_message接收消息"
      }
    ]
  }
}
```

### 2. 接收消息

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "tools/call",
  "params": {
    "name": "user_receive_message",
    "arguments": {
      "token": "user-xyz789",
      "count": 2,
      "filterType": "notification"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "收到 1 条消息:\n\n消息 1:\n  ID: msg_1766896070785_def456\n  类型: notification\n  优先级: high\n  来源: user-abc123\n  时间: 2025-12-28T05:57:21.700Z\n  内容: {\"message\":\"任务已完成\",\"taskId\":\"async_task_1766896070783_xyz789\"}\n"
      }
    ]
  }
}
```

### 3. 回复消息

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tools/call",
  "params": {
    "name": "user_reply_message",
    "arguments": {
      "token": "user-xyz789",
      "messageId": "msg_1766896070785_def456",
      "content": {
        "reply": "收到，感谢通知",
        "status": "confirmed"
      },
      "priority": "normal"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ 回复已发送\n\n回复ID: msg_1766896070786_ghi789\n原始消息: msg_1766896070785_def456\n目标: user-abc123\n类型: tool-response\n\n提示: 对方可使用user_receive_message接收"
      }
    ]
  }
}
```

### 4. 查看待处理消息

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 13,
  "method": "tools/call",
  "params": {
    "name": "user_get_pending_messages",
    "arguments": {
      "token": "user-abc123"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 13,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "待处理消息 (2条):\n\n🔴 1. notification | high | user-abc123 → user-xyz789\n   ID: msg_1766896070785_def456 | 时间: 2025-12-28T05:57:21.700Z\n   内容: {\"message\":\"任务已完成\",\"taskId\":\"async_task_1766896070783_xyz789\"}\n\n🟡 2. tool-request | normal | user-xyz789 → user-abc123\n   ID: msg_1766896070787_jkl012 | 时间: 2025-12-28T05:57:22.000Z\n   内容: {\"tool\":\"echo\",\"args\":{\"message\":\"test\"}}\n"
      }
    ]
  }
}
```

### 5. 获取消息统计

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 14,
  "method": "tools/call",
  "params": {
    "name": "user_get_message_stats",
    "arguments": {
      "token": "user-abc123"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 14,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "📊 用户消息队列统计\n\n总消息数: 3\n待处理: 2\n\n按类型分布:\n  notification: 1\n  tool-request: 1\n  tool-response: 1\n\n按优先级分布:\n  high: 1\n  normal: 2"
      }
    ]
  }
}
```

### 6. 清理过期消息

**AI发送的JSON-RPC请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 15,
  "method": "tools/call",
  "params": {
    "name": "user_cleanup_expired_messages",
    "arguments": {
      "token": "user-abc123"
    }
  }
}
```

**服务器响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 15,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ 已清理 0 条过期消息"
      }
    ]
  }
}
```

## 三、完整工作流程示例

### 场景：AI助手需要处理用户请求并通知结果

```json
// 步骤1: 注册数据处理工具
{"method": "tools/call", "params": {"name": "register_async_task", "arguments": {
  "token": "ai-assistant",
  "toolName": "data_analyzer",
  "toolDescription": "数据分析工具",
  "inputSchema": {"type": "object", "properties": {"data": {"type": "array"}}}
}}}

// 步骤2: 提交异步分析任务
{"method": "tools/call", "params": {"name": "submit_async_task", "arguments": {
  "token": "ai-assistant",
  "toolName": "data_analyzer",
  "toolArgs": {"data": [1, 2, 3, 4, 5]},
  "metadata": {"requestId": "req-001"}
}}}
// 响应: 任务ID: async_task_123_abc

// 步骤3: 等待分析完成
{"method": "tools/call", "params": {"name": "wait_async_task", "arguments": {
  "token": "ai-assistant",
  "taskId": "async_task_123_abc",
  "timeout": 60000
}}}
// 响应: 结果: {"sum": 15, "avg": 3, "count": 5}

// 步骤4: 通知用户
{"method": "tools/call", "params": {"name": "user_publish_message", "arguments": {
  "token": "ai-assistant",
  "type": "notification",
  "destination": "user-client",
  "content": {"result": {"sum": 15, "avg": 3, "count": 5}, "status": "completed"},
  "priority": "high"
}}}

// 步骤5: 用户接收通知
{"method": "tools/call", "params": {"name": "user_receive_message", "arguments": {
  "token": "user-client",
  "count": 1
}}}
```

## 四、错误处理示例

### 任务执行失败

**查询状态时的响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 16,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "📊 异步任务状态\n\n任务ID: async_task_456_def\n工具: data_analyzer\n状态: failed\n创建时间: 2025-12-28T05:57:21.644Z\n错误: 数据格式不正确，期望JSON数组"
      }
    ]
  }
}
```

### 工具未注册

**提交任务时的响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "错误: 提交异步任务失败: MCP工具未注册: unknown_tool"
      }
    ],
    "isError": true
  }
}
```

### 任务超时

**等待任务时的响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 18,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "错误: 等待任务失败: 任务等待超时"
      }
    ],
    "isError": true
  }
}
```

## 五、最佳实践

### 1. 异步任务使用模式
```typescript
// 1. 注册工具（一次）
await register_async_task({...});

// 2. 提交任务（立即返回任务ID）
const result = await submit_async_task({...});
const taskId = extractTaskId(result);

// 3. 轮询或等待
const task = await wait_async_task({taskId, timeout: 60000});

// 4. 处理结果
if (task.status === 'completed') {
  // 使用 task.result
} else if (task.status === 'failed') {
  // 处理错误 task.error
}
```

### 2. 消息队列使用模式
```typescript
// 发送方
await user_publish_message({...});

// 接收方
const messages = await user_receive_message({count: 1});
if (messages.length > 0) {
  // 处理消息
  await user_reply_message({...}); // 可选回复
}
```

### 3. 错误处理
```typescript
try {
  const task = await submit_async_task({...});
  const result = await wait_async_task({taskId: task.id});
  
  if (result.status === 'failed') {
    console.error('任务失败:', result.error);
  }
} catch (error) {
  console.error('调用失败:', error.message);
}
```

这个完整的调用示例展示了如何通过MCP协议使用异步任务和消息队列功能！