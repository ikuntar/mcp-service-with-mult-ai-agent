/**
 * 容器模块
 * 
 * 提供工具容器和配置管理，支持：
 * - 增强工具容器
 * - 角色权限控制
 * - 工具集配置
 */

export {
  EnhancedToolContainer,
  RoleBasedToolGroup,
  RoleBasedExtendedToolSet
} from './enhanced-tool-container';

export {
  ToolsetConfigManager,
  globalToolsetConfigManager,
  ConfigValidator,
  ToolsetConfigBuilder,
  ToolsetTemplates,
  TOOLSET_CONFIGS,
  initializeToolsetConfigs,
  getToolsetConfig,
  setToolsetDisplayMode,
  DEFAULT_TOOLSET_CONFIG
} from './toolset-config';

export type {
  Role,
  ContainerConfig
} from './enhanced-tool-container';

// 从types.ts导入类型定义
export type {
  ToolsetConfig,
  ToolsetDisplayMode
} from '../../types';