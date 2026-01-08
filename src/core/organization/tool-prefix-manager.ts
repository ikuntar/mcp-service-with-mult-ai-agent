/**
 * 工具前缀管理器
 * 统一管理协作组件工具的前缀逻辑，消除重复代码
 */

/**
 * 解析后的工具名称
 */
export interface ParsedToolName {
  componentId: string;
  toolName: string;
}

/**
 * 工具前缀管理器
 * 提供统一的前缀添加、解析和验证方法
 */
export class ToolPrefixManager {
  /** 前缀分隔符 */
  static readonly SEPARATOR = '_';

  /**
   * 为工具名称添加组件前缀
   * @param componentId 组件ID
   * @param toolName 工具名称
   * @returns 带前缀的完整工具名
   */
  static addPrefix(componentId: string, toolName: string): string {
    return `${componentId}${this.SEPARATOR}${toolName}`;
  }

  /**
   * 解析带前缀的工具名称
   * @param fullToolName 完整工具名（componentId_toolName）
   * @returns 解析结果，如果格式错误返回null
   */
  static parsePrefix(fullToolName: string): ParsedToolName | null {
    const separatorIndex = fullToolName.indexOf(this.SEPARATOR);
    if (separatorIndex === -1) {
      return null;
    }

    return {
      componentId: fullToolName.substring(0, separatorIndex),
      toolName: fullToolName.substring(separatorIndex + 1)
    };
  }

  /**
   * 验证工具名称格式
   * @param toolName 工具名称
   * @returns 是否包含前缀分隔符
   */
  static validateFormat(toolName: string): boolean {
    return toolName.includes(this.SEPARATOR);
  }

  /**
   * 创建格式错误消息
   * @returns 标准错误消息
   */
  static createFormatErrorMessage(): string {
    return `错误: 工具名称格式错误，应为: componentId${this.SEPARATOR}toolName`;
  }

  /**
   * 检查工具是否为协作组件工具
   * @param toolName 工具名称
   * @returns 是否为协作组件工具
   */
  static isCollaborationTool(toolName: string): boolean {
    // 排除基础工具和管理员工具
    if (toolName.startsWith('org_') || toolName.startsWith('admin_')) {
      return false;
    }
    return this.validateFormat(toolName);
  }

  /**
   * 获取工具的组件ID
   * @param toolName 工具名称
   * @returns 组件ID，如果不是协作组件工具返回null
   */
  static getComponentId(toolName: string): string | null {
    if (!this.isCollaborationTool(toolName)) {
      return null;
    }
    const parsed = this.parsePrefix(toolName);
    return parsed ? parsed.componentId : null;
  }
}