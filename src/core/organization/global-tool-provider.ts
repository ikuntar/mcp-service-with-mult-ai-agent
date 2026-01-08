/**
 * 全局工具提供器 - 为AI Agent提供带组件前缀的MCP工具
 * 解决多组织环境下的工具区分问题
 */

import { globalOrganizationManager } from './global-manager';
import { ToolPrefixManager } from './tool-prefix-manager';
import { Tool, ToolResult } from '../../types';

/**
 * 获取成员所有协作组件的MCP工具
 * 这是暴露给AI Agent的统一入口
 * @param memberToken 成员Token
 * @returns 所有组件的工具列表（已添加前缀）
 */
export async function getAllCollaborationTools(memberToken: string): Promise<Tool[]> {
  // 1. 验证成员身份
  const member = globalOrganizationManager.findMemberByToken(memberToken);
  if (!member) {
    throw new Error('成员不存在或Token无效');
  }

  // 2. 获取成员所在的所有组件ID
  const componentIds = Array.from(member.collaborationComponents);
  
  if (componentIds.length === 0) {
    return [];
  }

  // 3. 获取每个组件的带前缀工具
  const allTools: Tool[] = [];
  
  for (const componentId of componentIds) {
    const component = globalOrganizationManager.getCollaborationComponent(componentId);
    if (!component) continue;
    
    // 使用协作组件的新API直接获取带前缀的工具
    const prefixedTools = await component.getMCPToolsWithPrefix(memberToken);
    allTools.push(...prefixedTools);
  }

  return allTools;
}

/**
 * 执行协作组件工具
 * @param memberToken 成员Token
 * @param fullToolName 完整工具名（componentId_toolName）
 * @param args 工具参数
 * @returns 执行结果
 */
export async function executeCollaborationTool(
  memberToken: string,
  fullToolName: string,
  args: any
): Promise<ToolResult> {
  // 1. 验证成员身份
  const member = globalOrganizationManager.findMemberByToken(memberToken);
  if (!member) {
    return {
      content: [{ type: 'text', text: '错误: 成员不存在或Token无效' }],
      isError: true
    };
  }

  // 2. 解析组件ID和工具名
  const parsed = ToolPrefixManager.parsePrefix(fullToolName);
  if (!parsed) {
    return {
      content: [{ type: 'text', text: ToolPrefixManager.createFormatErrorMessage() }],
      isError: true
    };
  }
  
  const { componentId, toolName } = parsed;

  // 3. 验证成员是否在该组件中
  if (!member.collaborationComponents.has(componentId)) {
    return {
      content: [{ type: 'text', text: `错误: 成员未加入协作组件: ${componentId}` }],
      isError: true
    };
  }

  // 4. 获取组件并执行
  const component = globalOrganizationManager.getCollaborationComponent(componentId);
  if (!component) {
    return {
      content: [{ type: 'text', text: `错误: 协作组件不存在: ${componentId}` }],
      isError: true
    };
  }

  try {
    // 执行原始工具
    return await component.executeMCPTool(memberToken, toolName, args);
  } catch (error) {
    return {
      content: [{ type: 'text', text: `执行失败: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true
    };
  }
}

/**
 * 获取协作组件信息（带工具列表）
 * @param memberToken 成员Token
 * @returns 组件信息
 */
export async function getCollaborationComponentsInfo(memberToken: string): Promise<{
  components: Array<{
    id: string;
    name: string;
    description?: string;
    tools: Array<{ name: string; description: string }>;
  }>;
  totalCount: number;
}> {
  const member = globalOrganizationManager.findMemberByToken(memberToken);
  if (!member) {
    throw new Error('成员不存在或Token无效');
  }

  const componentIds = Array.from(member.collaborationComponents);
  const componentsInfo = [];

  for (const componentId of componentIds) {
    const component = globalOrganizationManager.getCollaborationComponent(componentId);
    if (!component) continue;

    // 使用新API获取带前缀的工具
    const prefixedTools = await component.getMCPToolsWithPrefix(memberToken);

    componentsInfo.push({
      id: componentId,
      name: component.name,
      description: component.description,
      tools: prefixedTools.map(t => ({
        name: t.name,
        description: t.description
      }))
    });
  }

  return {
    components: componentsInfo,
    totalCount: componentsInfo.length
  };
}