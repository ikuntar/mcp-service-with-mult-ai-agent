/**
 * 消息队列模块
 * 
 * 提供用户空间内的消息传递能力，支持：
 * - 请求-响应模式
 * - 消息优先级管理
 * - 消息过期管理
 * - 用户隔离
 */

export { MessageQueue, globalMessageQueue } from './message-queue';

export type {
  Message,
  MessageType,
  MessagePriority
} from './message-queue';