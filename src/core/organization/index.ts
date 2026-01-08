/**
 * 组织架构 - 主入口（精简版）
 */

// 类型定义
export {
  OrganizationEventType
} from './types';

export type {
  CollaborationComponentConfig,
  OrganizationMember,
  ProxyExecutionContext,
  ProxyExecutionResult,
  OrganizationEvent,
  GlobalOrganizationManagerConfig,
  OrganizationStats
} from './types';

// 协作组件接口
export type { CollaborationComponent } from './collaboration-component';

// 核心组件
export { StandardCollaborationComponent } from './standard-collaboration-component';
export { GlobalOrganizationManager, globalOrganizationManager } from './global-manager';

// 工厂函数
export {
  createCollaborationComponent,
  createOrganizationMember,
  createProxyExecution,
  createStandardCollaborationComponent,
  createCustomCollaborationComponent,
  createStandardMember
} from './factory';

// 工具前缀管理器
export { ToolPrefixManager } from './tool-prefix-manager';

// 全局工具提供器
export {
  getAllCollaborationTools,
  executeCollaborationTool,
  getCollaborationComponentsInfo
} from './global-tool-provider';

// MCP集成
export {
  createCollaborationToolsProvider,
  createCollaborationToolExecutor,
  createCollaborationComponentsInfoProvider,
  getAllOrganizationMCPTools
} from './mcp-integration';