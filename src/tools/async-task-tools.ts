/**
 * 异步任务管理工具 - 优化版本
 * 
 * 改进点：
 * 1. submit_async_task 返回完整的任务信息
 * 2. 添加 get_task_original_call 方法
 * 3. 返回信息包含执行时间、原始调用等
 */

import type { Tool, ToolResult } from '../types';
import { globalUserSpaceManager } from '../core/user-space/user-space';
import { globalTokenManager } from '../core/token/token-manager';

/**
 * 注册MCP工具为异步任务
 */
export const registerAsyncTaskTool: Tool = {
  name: 'register_async_task',
  description: '将已存在的MCP工具注册为异步任务。用户可以全权管理自己的异步任务执行器。',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token（明确的用户标识）'
      },
      toolName: {
        type: 'string',
        description: '已存在的MCP工具名称'
      },
      toolDescription: {
        type: 'string',
        description: '工具描述'
      },
      inputSchema: {
        type: 'object',
        description: '工具的输入模式'
      }
    },
    required: ['token', 'toolName', 'toolDescription', 'inputSchema']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, toolName, toolDescription, inputSchema } = args;
      
      if (!token || !toolName || !toolDescription || !inputSchema) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token、toolName、toolDescription和inputSchema参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在，请先使用userspace_get创建' }],
          isError: true
        };
      }

      // 创建工具对象
      const tool: Tool = {
        name: toolName,
        description: toolDescription,
        inputSchema: inputSchema,
        execute: async (toolArgs: any) => {
          // 这里需要用户自定义执行逻辑
          return {
            content: [{ type: 'text', text: `工具 ${toolName} 已调用，参数: ${JSON.stringify(toolArgs)}` }],
            isError: false
          };
        }
      };

      // 注册到用户空间的异步任务执行器
      userSpace.asyncTaskExecutor.registerTool(tool);

      return {
        content: [
          {
            type: 'text',
            text: `✅ MCP工具已注册为异步任务\n\n工具名称: ${toolName}\n描述: ${toolDescription}\n\n提示: 使用submit_async_task提交异步任务`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `注册异步任务失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 提交异步任务 - 返回丰富的任务信息
 */
export const submitAsyncTask: Tool = {
  name: 'submit_async_task',
  description: '提交异步任务。返回完整的任务信息，包括任务ID、原始调用数据等。',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token（明确的用户标识）'
      },
      toolName: {
        type: 'string',
        description: '已注册的工具名称'
      },
      toolArgs: {
        type: 'object',
        description: '工具参数'
      },
      metadata: {
        type: 'object',
        description: '任务元数据'
      },
      requestId: {
        type: 'string',
        description: '外部请求ID（可选，用于追踪）'
      }
    },
    required: ['token', 'toolName', 'toolArgs']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, toolName, toolArgs, metadata, requestId } = args;
      
      if (!token || !toolName) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和toolName参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在' }],
          isError: true
        };
      }

      // 提交异步任务
      const task = userSpace.asyncTaskExecutor.submitTask(
        token,
        toolName,
        toolArgs,
        metadata,
        requestId
      );

      // 构建丰富的返回信息
      const resultText = `✅ 异步任务已提交

📊 任务信息:
- 任务ID: ${task.id}
- 工具名称: ${task.toolName}
- 状态: ${task.status}
- 创建时间: ${task.createdAt}

📝 原始调用数据:
- 用户Token: ${task.originalCall.token}
- 工具名称: ${task.originalCall.toolName}
- 工具参数: ${JSON.stringify(task.originalCall.toolArgs)}
- 调用时间: ${task.originalCall.timestamp}
${task.originalCall.requestId ? `- 请求ID: ${task.originalCall.requestId}` : ''}
${task.metadata ? `- 元数据: ${JSON.stringify(task.metadata)}` : ''}

💡 后续操作:
- 使用get_async_task_status查询任务状态
- 使用wait_async_task等待任务完成
- 使用get_task_original_call查看原始调用数据`;

      return {
        content: [{ type: 'text', text: resultText }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `提交异步任务失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 查询异步任务状态 - 包含完整信息
 */
export const getAsyncTaskStatus: Tool = {
  name: 'get_async_task_status',
  description: '查询异步任务状态，包含执行结果、执行时间等完整信息',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      taskId: {
        type: 'string',
        description: '任务ID'
      }
    },
    required: ['token', 'taskId']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, taskId } = args;
      
      if (!token || !taskId) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和taskId参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在' }],
          isError: true
        };
      }

      // 查询任务
      const task = userSpace.asyncTaskExecutor.getTask(taskId);
      if (!task) {
        return {
          content: [{ type: 'text', text: `未找到任务: ${taskId}` }],
          isError: true
        };
      }

      // 验证任务所有权
      if (task.token !== token) {
        return {
          content: [{ type: 'text', text: '错误: 无权访问此任务' }],
          isError: true
        };
      }

      // 构建详细的任务状态信息
      let resultText = `📊 异步任务状态详情

🆔 基本信息:
- 任务ID: ${task.id}
- 工具名称: ${task.toolName}
- 状态: ${task.status}
- 用户Token: ${task.token}

⏱️ 时间信息:
- 创建时间: ${task.createdAt}
${task.startedAt ? `- 开始时间: ${task.startedAt}` : ''}
${task.completedAt ? `- 完成时间: ${task.completedAt}` : ''}
${task.executionTime ? `- 执行时间: ${task.executionTime}ms` : ''}

📝 原始调用:
- 工具参数: ${JSON.stringify(task.toolArgs)}
- 调用时间: ${task.originalCall.timestamp}
${task.originalCall.requestId ? `- 请求ID: ${task.originalCall.requestId}` : ''}
${task.originalCall.metadata ? `- 调用元数据: ${JSON.stringify(task.originalCall.metadata)}` : ''}

`;

      // 根据状态添加结果或错误
      if (task.status === 'completed') {
        resultText += `✅ 执行结果:\n${JSON.stringify(task.result, null, 2)}`;
      } else if (task.status === 'failed') {
        resultText += `❌ 错误信息:\n${task.error}`;
      } else if (task.status === 'cancelled') {
        resultText += `🚫 任务已取消`;
      } else if (task.status === 'running') {
        resultText += `🔄 任务正在执行中...`;
      } else if (task.status === 'pending') {
        resultText += `⏳ 任务等待执行中...`;
      }

      // 添加任务元数据
      if (task.metadata) {
        resultText += `\n\n🏷️ 任务元数据:\n${JSON.stringify(task.metadata, null, 2)}`;
      }

      return {
        content: [{ type: 'text', text: resultText }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `查询任务失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 查看任务原始调用数据
 */
export const getTaskOriginalCall: Tool = {
  name: 'get_task_original_call',
  description: '查看异步任务的原始调用数据，包括完整的输入参数和调用信息',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      taskId: {
        type: 'string',
        description: '任务ID'
      }
    },
    required: ['token', 'taskId']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, taskId } = args;
      
      if (!token || !taskId) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和taskId参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在' }],
          isError: true
        };
      }

      // 获取原始调用数据
      const originalCall = userSpace.asyncTaskExecutor.getTaskOriginalCall(taskId);
      if (!originalCall) {
        return {
          content: [{ type: 'text', text: `未找到任务或任务无原始调用数据: ${taskId}` }],
          isError: true
        };
      }

      // 验证任务所有权
      if (originalCall.token !== token) {
        return {
          content: [{ type: 'text', text: '错误: 无权访问此任务的原始调用数据' }],
          isError: true
        };
      }

      // 构建原始调用数据的详细信息
      const resultText = `📋 任务原始调用数据

🆔 调用标识:
- 用户Token: ${originalCall.token}
- 工具名称: ${originalCall.toolName}
- 调用时间: ${originalCall.timestamp}
${originalCall.requestId ? `- 请求ID: ${originalCall.requestId}` : ''}

📥 输入参数:
- 工具参数: ${JSON.stringify(originalCall.toolArgs, null, 2)}

🏷️ 调用元数据:
${originalCall.metadata ? JSON.stringify(originalCall.metadata, null, 2) : '无元数据'}

💡 说明:
此数据记录了任务创建时的完整调用信息，
可用于：
- 重新执行相同任务
- 调试和问题追踪
- 审计和日志记录
- 上下文恢复`;

      return {
        content: [{ type: 'text', text: resultText }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取原始调用数据失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 等待异步任务完成
 */
export const waitAsyncTask: Tool = {
  name: 'wait_async_task',
  description: '等待异步任务完成（阻塞直到任务完成或超时）',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      taskId: {
        type: 'string',
        description: '任务ID'
      },
      timeout: {
        type: 'number',
        description: '超时时间（毫秒），默认30000'
      }
    },
    required: ['token', 'taskId']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, taskId, timeout = 30000 } = args;
      
      if (!token || !taskId) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和taskId参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在' }],
          isError: true
        };
      }

      // 等待任务完成
      const task = await userSpace.asyncTaskExecutor.waitForTask(taskId, timeout);

      // 构建详细的完成信息
      let resultText = `✅ 任务完成\n\n📊 任务状态:\n- 任务ID: ${task.id}\n- 状态: ${task.status}\n- 执行时间: ${task.executionTime}ms\n\n`;

      if (task.status === 'completed') {
        resultText += `执行结果:\n${JSON.stringify(task.result, null, 2)}`;
      } else if (task.status === 'failed') {
        resultText += `错误信息:\n${task.error}`;
      } else if (task.status === 'cancelled') {
        resultText += `任务已被取消`;
      }

      return {
        content: [{ type: 'text', text: resultText }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `等待任务失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 获取用户所有异步任务
 */
export const getUserAsyncTasks: Tool = {
  name: 'get_user_async_tasks',
  description: '获取用户的所有异步任务',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      }
    },
    required: ['token']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token } = args;
      
      if (!token) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在' }],
          isError: true
        };
      }

      // 获取所有任务
      const tasks = userSpace.asyncTaskExecutor.getUserTasks(token);

      if (tasks.length === 0) {
        return {
          content: [{ type: 'text', text: '暂无异步任务' }]
        };
      }

      // 格式化输出
      const lines = [`用户异步任务列表 (${tasks.length}个):`, ''];
      tasks.forEach((task: any) => {
        const statusIcon = task.status === 'completed' ? '✅' : 
                          task.status === 'failed' ? '❌' : 
                          task.status === 'running' ? '🔄' : 
                          task.status === 'cancelled' ? '🚫' : '⏳';
        
        lines.push(`${statusIcon} ${task.id}`);
        lines.push(`   工具: ${task.toolName}`);
        lines.push(`   状态: ${task.status}`);
        lines.push(`   创建: ${task.createdAt}`);
        if (task.executionTime) {
          lines.push(`   执行时间: ${task.executionTime}ms`);
        }
        if (task.originalCall.requestId) {
          lines.push(`   请求ID: ${task.originalCall.requestId}`);
        }
        lines.push('');
      });

      return {
        content: [{ type: 'text', text: lines.join('\n') }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取任务列表失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 获取异步任务执行器统计
 */
export const getAsyncTaskStats: Tool = {
  name: 'get_async_task_stats',
  description: '获取异步任务执行器统计信息',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      }
    },
    required: ['token']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token } = args;
      
      if (!token) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在' }],
          isError: true
        };
      }

      // 获取统计
      const stats = userSpace.asyncTaskExecutor.getStats(token);

      // 格式化输出
      const lines = ['📊 异步任务执行器统计', ''];
      lines.push(`总任务数: ${stats.total}`);
      lines.push(`已注册工具: ${stats.registeredTools}`);
      lines.push('');
      lines.push('状态分布:');
      
      for (const [status, count] of Object.entries(stats.byStatus)) {
        lines.push(`  ${status}: ${count}`);
      }

      return {
        content: [{ type: 'text', text: lines.join('\n') }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取统计失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 取消异步任务
 */
export const cancelAsyncTask: Tool = {
  name: 'cancel_async_task',
  description: '取消异步任务',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      taskId: {
        type: 'string',
        description: '任务ID'
      }
    },
    required: ['token', 'taskId']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, taskId } = args;
      
      if (!token || !taskId) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和taskId参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在' }],
          isError: true
        };
      }

      // 取消任务
      const success = userSpace.asyncTaskExecutor.cancelTask(taskId);

      if (!success) {
        return {
          content: [{ type: 'text', text: `无法取消任务 ${taskId}（可能已完成或正在运行）` }],
          isError: true
        };
      }

      return {
        content: [{ type: 'text', text: `✅ 任务已取消: ${taskId}` }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `取消任务失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 删除异步任务
 */
export const deleteAsyncTask: Tool = {
  name: 'delete_async_task',
  description: '删除已完成/失败/取消的异步任务',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      },
      taskId: {
        type: 'string',
        description: '任务ID'
      }
    },
    required: ['token', 'taskId']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, taskId } = args;
      
      if (!token || !taskId) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token和taskId参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在' }],
          isError: true
        };
      }

      // 删除任务
      const success = userSpace.asyncTaskExecutor.deleteTask(taskId);

      if (!success) {
        return {
          content: [{ type: 'text', text: `无法删除任务 ${taskId}（可能正在运行或未完成）` }],
          isError: true
        };
      }

      return {
        content: [{ type: 'text', text: `✅ 任务已删除: ${taskId}` }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `删除任务失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 获取已注册的工具列表
 */
export const getRegisteredTools: Tool = {
  name: 'get_registered_tools',
  description: '获取用户已注册的MCP工具列表',
  groups: ['async-task', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token'
      }
    },
    required: ['token']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token } = args;
      
      if (!token) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token参数' }],
          isError: true
        };
      }

      // 验证token
      const role = globalTokenManager.validateToken(token);
      if (!role) {
        return {
          content: [{ type: 'text', text: '错误: Token无效或已过期' }],
          isError: true
        };
      }

      // 获取用户空间
      const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
      if (!userSpace) {
        return {
          content: [{ type: 'text', text: '错误: 用户空间不存在' }],
          isError: true
        };
      }

      // 获取工具列表
      const tools = userSpace.asyncTaskExecutor.getRegisteredTools();

      if (tools.length === 0) {
        return {
          content: [{ type: 'text', text: '暂无注册的MCP工具' }]
        };
      }

      // 格式化输出
      const lines = [`已注册的MCP工具 (${tools.length}个):`, ''];
      tools.forEach((tool: any, index: number) => {
        lines.push(`${index + 1}. ${tool.name}`);
        lines.push(`   描述: ${tool.description}`);
        lines.push('');
      });

      return {
        content: [{ type: 'text', text: lines.join('\n') }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取工具列表失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 所有异步任务管理工具
 */
export const asyncTaskTools: Tool[] = [
  registerAsyncTaskTool,
  submitAsyncTask,
  getAsyncTaskStatus,
  getTaskOriginalCall,  // ✅ 新增：查看原始调用数据
  waitAsyncTask,
  getUserAsyncTasks,
  getAsyncTaskStats,
  cancelAsyncTask,
  deleteAsyncTask,
  getRegisteredTools
];