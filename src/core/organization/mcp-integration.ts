/**
 * MCP集成 - 为AI Agent提供带组件前缀的MCP工具
 * 解决多组织环境下的工具区分问题
 */

import { createMCPTool } from '../ai-agent';
import { getAllCollaborationTools, executeCollaborationTool, getCollaborationComponentsInfo } from './global-tool-provider';

/**
 * 创建获取协作组件工具的MCP工具
 * 这个工具本身会被暴露给AI Agent
 */
export function createCollaborationToolsProvider() {
  return createMCPTool(
    'get_collaboration_tools',
    '获取当前用户所有协作组件的MCP工具列表，每个工具名称都包含组件前缀',
    {
      type: 'object',
      properties: {
        memberToken: {
          type: 'string',
          description: '成员的用户Token'
        }
      },
      required: ['memberToken']
    }
  );
}

/**
 * 创建执行协作组件工具的MCP工具
 * 用于执行带前缀的工具调用
 */
export function createCollaborationToolExecutor() {
  return createMCPTool(
    'execute_collaboration_tool',
    '执行协作组件工具，需要指定完整的工具名称（包含组件前缀）',
    {
      type: 'object',
      properties: {
        memberToken: {
          type: 'string',
          description: '成员的用户Token'
        },
        fullToolName: {
          type: 'string',
          description: '完整的工具名称，格式: componentId_toolName'
        }
      },
      required: ['memberToken', 'fullToolName']
    }
  );
}

/**
 * 创建获取协作组件信息的MCP工具
 * 帮助AI Agent了解可用的组件和工具
 */
export function createCollaborationComponentsInfoProvider() {
  return createMCPTool(
    'get_collaboration_components_info',
    '获取协作组件的详细信息，包括每个组件的工具列表',
    {
      type: 'object',
      properties: {
        memberToken: {
          type: 'string',
          description: '成员的用户Token'
        }
      },
      required: ['memberToken']
    }
  );
}

/**
 * 获取所有MCP工具
 * 用于集成到AI Agent系统中
 */
export function getAllOrganizationMCPTools() {
  return [
    createCollaborationToolsProvider(),
    createCollaborationToolExecutor(),
    createCollaborationComponentsInfoProvider()
  ];
}