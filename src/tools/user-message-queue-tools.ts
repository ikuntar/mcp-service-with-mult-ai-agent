/**
 * 用户消息队列管理工具
 * 
 * 用户可以全权处理自己的消息队列
 * 提供完整的消息发布、接收、回复功能
 */

import type { Tool, ToolResult } from '../types';
import { globalUserSpaceManager } from '../core/user-space/user-space';
import { globalTokenManager } from '../core/token/token-manager';
import type { MessageType, MessagePriority } from '../core/message-queue';

/**
 * 发布消息到用户消息队列
 * 
 * 用户可以向自己的消息队列发布消息
 */
export const userPublishMessage: Tool = {
  name: 'user_publish_message',
  description: '向用户消息队列发布消息。用户可以全权处理自己的消息队列，支持请求-响应模式。',
  groups: ['user-message-queue', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token（消息来源）'
      },
      type: {
        type: 'string',
        description: '消息类型',
        enum: ['tool-request', 'tool-response', 'notification', 'event', 'error']
      },
      destination: {
        type: 'string',
        description: '目标用户Token（或"all"表示广播）'
      },
      content: {
        type: 'object',
        description: '消息内容'
      },
      priority: {
        type: 'string',
        description: '消息优先级',
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal'
      },
      ttl: {
        type: 'number',
        description: '消息有效期（秒）'
      },
      metadata: {
        type: 'object',
        description: '消息元数据'
      },
      responseTo: {
        type: 'string',
        description: '响应的消息ID（用于回复模式）'
      }
    },
    required: ['token', 'type', 'destination', 'content']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, type, destination, content, priority = 'normal', ttl, metadata, responseTo } = args;
      
      if (!token || !type || !destination || !content) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token、type、destination和content参数' }],
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

      // 发布消息
      const message = userSpace.messageQueue.publish(
        type as MessageType,
        token,
        destination,
        content,
        priority as MessagePriority,
        ttl,
        metadata,
        responseTo
      );

      return {
        content: [
          {
            type: 'text',
            text: `✅ 消息已发布\n\n消息ID: ${message.id}\n类型: ${message.type}\n优先级: ${message.priority}\n源: ${message.source}\n目标: ${message.destination}\n时间: ${message.timestamp}\n${responseTo ? `响应: ${responseTo}` : ''}\n\n提示: 使用user_receive_message接收消息`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `发布消息失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 从用户消息队列接收消息
 */
export const userReceiveMessage: Tool = {
  name: 'user_receive_message',
  description: '从用户消息队列接收消息。用户可以全权处理自己的消息队列。',
  groups: ['user-message-queue', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '用户Token（接收者）'
      },
      count: {
        type: 'number',
        description: '接收消息数量，默认1',
        default: 1
      },
      filterType: {
        type: 'string',
        description: '按类型过滤消息',
        enum: ['tool-request', 'tool-response', 'notification', 'event', 'error']
      }
    },
    required: ['token']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, count = 1, filterType } = args;
      
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

      // 接收消息
      const filter = filterType ? (msg: any) => msg.type === filterType : undefined;
      const messages = userSpace.messageQueue.receiveMessages(token, count, filter);

      if (messages.length === 0) {
        return {
          content: [{ type: 'text', text: '暂无消息' }]
        };
      }

      // 格式化输出
      const lines = [`收到 ${messages.length} 条消息:`, ''];
      messages.forEach((msg, index) => {
        lines.push(`消息 ${index + 1}:`);
        lines.push(`  ID: ${msg.id}`);
        lines.push(`  类型: ${msg.type}`);
        lines.push(`  优先级: ${msg.priority}`);
        lines.push(`  来源: ${msg.source}`);
        lines.push(`  时间: ${msg.timestamp}`);
        if (msg.responseTo) {
          lines.push(`  响应: ${msg.responseTo}`);
        }
        lines.push(`  内容: ${JSON.stringify(msg.content)}`);
        if (msg.metadata) {
          lines.push(`  元数据: ${JSON.stringify(msg.metadata)}`);
        }
        lines.push('');
      });

      return {
        content: [{ type: 'text', text: lines.join('\n') }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `接收消息失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 回复用户消息
 */
export const userReplyMessage: Tool = {
  name: 'user_reply_message',
  description: '回复用户消息队列中的消息。自动设置responseTo字段并发送到原消息的来源。',
  groups: ['user-message-queue', 'userspace-management'],
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: '回复者Token'
      },
      messageId: {
        type: 'string',
        description: '要回复的消息ID'
      },
      content: {
        type: 'object',
        description: '回复内容'
      },
      priority: {
        type: 'string',
        description: '消息优先级',
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal'
      },
      ttl: {
        type: 'number',
        description: '消息有效期（秒）'
      },
      metadata: {
        type: 'object',
        description: '回复元数据'
      }
    },
    required: ['token', 'messageId', 'content']
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { token, messageId, content, priority = 'normal', ttl, metadata } = args;
      
      if (!token || !messageId || !content) {
        return {
          content: [{ type: 'text', text: '错误: 必须提供token、messageId和content参数' }],
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

      // 查找原始消息
      const pendingMessages = userSpace.messageQueue.getPendingMessages(token);
      const originalMessage = pendingMessages.find(msg => msg.id === messageId);
      
      if (!originalMessage) {
        return {
          content: [{ type: 'text', text: `未找到消息: ${messageId}` }],
          isError: true
        };
      }

      // 发送回复
      const replyMessage = userSpace.messageQueue.reply(
        originalMessage,
        token,
        content,
        priority as MessagePriority,
        ttl,
        metadata
      );

      return {
        content: [
          {
            type: 'text',
            text: `✅ 回复已发送\n\n回复ID: ${replyMessage.id}\n原始消息: ${messageId}\n目标: ${originalMessage.source}\n类型: ${replyMessage.type}\n\n提示: 对方可使用user_receive_message接收`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `回复消息失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 查看用户待处理消息
 */
export const userGetPendingMessages: Tool = {
  name: 'user_get_pending_messages',
  description: '查看用户消息队列中的待处理消息列表（不从队列中移除）',
  groups: ['user-message-queue', 'userspace-management'],
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

      // 获取待处理消息
      const messages = userSpace.messageQueue.getPendingMessages(token);

      if (messages.length === 0) {
        return {
          content: [{ type: 'text', text: '暂无待处理消息' }]
        };
      }

      // 格式化输出
      const lines = [`待处理消息 (${messages.length}条):`, ''];
      messages.forEach((msg, index) => {
        const priorityIcon = msg.priority === 'critical' ? '🔴' : 
                            msg.priority === 'high' ? '🟠' : 
                            msg.priority === 'normal' ? '🟡' : '🟢';
        
        lines.push(`${priorityIcon} ${index + 1}. ${msg.type} | ${msg.priority} | ${msg.source} → ${msg.destination}`);
        lines.push(`   ID: ${msg.id} | 时间: ${msg.timestamp}`);
        if (msg.responseTo) {
          lines.push(`   响应: ${msg.responseTo}`);
        }
        lines.push(`   内容: ${JSON.stringify(msg.content)}`);
        lines.push('');
      });

      return {
        content: [{ type: 'text', text: lines.join('\n') }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `获取待处理消息失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 获取用户消息队列统计
 */
export const userGetMessageStats: Tool = {
  name: 'user_get_message_stats',
  description: '获取用户消息队列统计信息',
  groups: ['user-message-queue', 'userspace-management'],
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
      const stats = userSpace.messageQueue.getStats(token);

      // 格式化输出
      const lines = ['📊 用户消息队列统计', ''];
      lines.push(`总消息数: ${stats.total}`);
      lines.push(`待处理: ${stats.pending}`);
      lines.push('');
      lines.push('按类型分布:');
      
      for (const [type, count] of Object.entries(stats.byType)) {
        lines.push(`  ${type}: ${count}`);
      }
      
      lines.push('');
      lines.push('按优先级分布:');
      
      for (const [priority, count] of Object.entries(stats.byPriority)) {
        lines.push(`  ${priority}: ${count}`);
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
 * 清理用户过期消息
 */
export const userCleanupExpiredMessages: Tool = {
  name: 'user_cleanup_expired_messages',
  description: '清理用户消息队列中的过期消息',
  groups: ['user-message-queue', 'userspace-management'],
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

      // 清理过期消息
      const count = userSpace.messageQueue.cleanupExpiredMessages();

      return {
        content: [{ type: 'text', text: `✅ 已清理 ${count} 条过期消息` }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `清理过期消息失败: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  }
};

/**
 * 所有用户消息队列管理工具
 */
export const userMessageQueueTools: Tool[] = [
  userPublishMessage,
  userReceiveMessage,
  userReplyMessage,
  userGetPendingMessages,
  userGetMessageStats,
  userCleanupExpiredMessages
];