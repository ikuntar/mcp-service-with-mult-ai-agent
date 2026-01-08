/**
 * MCP服务器实现 - 使用统一权限管理器的版本
 * 
 * 这个版本使用集中式的PermissionManager来处理所有权限检查
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express';
import { randomUUID } from 'crypto';

// 导入所有工具
import { addTool } from './tools/add';
import { echoTool } from './tools/echo';
import { demoTool } from './tools/demo-tool';
import { tokenManagementTools } from './tools/token-management';
import { userSpaceManagementTools } from './tools/user-space-tools';
import { asyncTaskTools } from './tools/async-task-tools';
import { userMessageQueueTools } from './tools/user-message-queue-tools';
import { virtualizationManagementTools } from './tools/token-virtualization-tools';
import { ruleManagementTools } from './tools/executor-rule-management';
import { executorDemoTools } from './tools/executor-demo-tools';
import { dataTools } from './groups/data-group';
import { FilePlugin } from './plugins/file-plugin';
import { OrganizationPlugin } from './plugins/organization-plugin';

// 导入核心系统
import { globalTokenManager } from './core/token/token-manager';
import { globalUserSpaceManager } from './core/user-space/user-space';
import { globalOrganizationManager } from './core/organization/global-manager';
import { globalToolsetConfigManager } from './core/container/toolset-config';
import { globalPermissionManager } from './core/token/permission-manager';

// 导入类型
import type { Tool, ToolResult } from './types';

/**
 * MCP服务器配置
 */
export interface MCPServerConfig {
  name?: string;
  version?: string;
  port?: number;
  enableAuth?: boolean;
  enableOrganization?: boolean;
}

/**
 * MCP服务器实现 - 使用统一权限管理器
 */
export class FrameworkMCPServer {
  private server: McpServer;
  private transport: StreamableHTTPServerTransport;
  private config: Required<MCPServerConfig>;
  private allTools: Map<string, Tool> = new Map();

  constructor(config: MCPServerConfig = {}) {
    this.config = {
      name: config.name || 'mcp-framework-server',
      version: config.version || '1.0.0',
      port: config.port || 3000,
      enableAuth: config.enableAuth !== false,
      enableOrganization: config.enableOrganization !== false
    };

    // 创建MCP服务器
    this.server = new McpServer(
      {
        name: this.config.name,
        version: this.config.version,
        description: '基于Token和组织架构的MCP工具框架服务器',
        icons: [],
        websiteUrl: 'https://github.com/modelcontextprotocol/typescript-sdk'
      },
      {
        capabilities: {
          tools: {},
          logging: {},
          prompts: {}
        }
      }
    );
  }

  /**
   * 初始化所有工具
   */
  private async initializeTools(): Promise<void> {
    console.log('[MCP Server] 初始化工具系统...');

    // 1. 基础工具
    this.registerTool(addTool);
    this.registerTool(echoTool);
    this.registerTool(demoTool);

    // 2. Token管理工具
    tokenManagementTools.forEach(tool => this.registerTool(tool));

    // 3. 用户空间管理工具
    userSpaceManagementTools.forEach(tool => this.registerTool(tool));

    // 4. 异步任务工具
    asyncTaskTools.forEach(tool => this.registerTool(tool));

    // 5. 用户消息队列工具
    userMessageQueueTools.forEach(tool => this.registerTool(tool));

    // 6. 虚拟化管理工具
    virtualizationManagementTools.forEach(tool => this.registerTool(tool));

    // 7. 执行器规则管理工具
    ruleManagementTools.forEach(tool => this.registerTool(tool));

    // 8. 执行器演示工具
    executorDemoTools.forEach(tool => this.registerTool(tool));

    // 9. 数据处理工具
    dataTools.forEach(tool => this.registerTool(tool));

    // 10. 文件插件工具
    const filePlugin = new FilePlugin();
    filePlugin.getTools().forEach(tool => this.registerTool(tool));

    // 11. 组织架构工具（使用增强插件）
    if (this.config.enableOrganization) {
      // 创建组织插件实例
      const organizationPlugin = new OrganizationPlugin();
      
      // 初始化插件
      const context = {
        toolSet: {
          register: (tool: Tool) => this.registerTool(tool),
          find: (name: string) => this.allTools.get(name),
          execute: async (name: string, args: any) => {
            const tool = this.allTools.get(name);
            if (!tool) throw new Error(`Tool ${name} not found`);
            return await tool.execute(args);
          },
          getAllTools: () => Array.from(this.allTools.values()),
          has: (name: string) => this.allTools.has(name),
          get size() { return this.allTools.size; }
        },
        sharedState: new Map(),
        config: {}
      };
      
      if (organizationPlugin.initialize) {
        await organizationPlugin.initialize(context);
      }
      
      // 注册插件的基础工具
      const baseTools = organizationPlugin.getTools();
      baseTools.forEach(tool => this.registerTool(tool));
      
      console.log(`[MCP Server] 组织架构插件已注册 ${baseTools.length} 个基础工具`);
      
      // 注册协作组件工具（动态，需要token）
      // 这些工具将在用户请求时通过getAllCollaborationTools动态获取
      // 这里我们添加一个特殊的工具来提供协作工具列表
      const getCollaborationToolsTool: Tool = {
        name: 'get_collaboration_tools',
        description: '获取当前用户的所有协作组件工具（需要token）',
        groups: ['organization', 'collaboration'],
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
        execute: async (args: any): Promise<ToolResult> => {
          try {
            const { getAllCollaborationTools } = await import('./core/organization/global-tool-provider');
            const tools = await getAllCollaborationTools(args.token);
            return {
              content: [{
                type: 'text',
                text: `可用协作工具 (${tools.length}个):\n${tools.map(t => `  • ${t.name}: ${t.description}`).join('\n')}`
              }]
            };
          } catch (error) {
            return {
              content: [{ type: 'text', text: `获取协作工具失败: ${error instanceof Error ? error.message : String(error)}` }],
              isError: true
            };
          }
        }
      };
      
      this.registerTool(getCollaborationToolsTool);
      console.log('[MCP Server] 已注册协作工具获取工具');
    }

    // 12. 添加获取所有可见工具的工具
    this.registerGetAllVisibleTools();

    console.log(`[MCP Server] 已注册 ${this.allTools.size} 个工具`);
  }

  /**
   * 注册单个工具 - 使用统一权限管理器
   */
  private registerTool(tool: Tool): void {
    // 检查是否已注册
    if (this.allTools.has(tool.name)) {
      console.warn(`[MCP Server] 工具 ${tool.name} 已存在，跳过`);
      return;
    }

    // 存储工具
    this.allTools.set(tool.name, tool);

    // 包装执行函数以支持权限检查和日志
    const wrappedExecute = async (args: any, extra?: any) => {
      const startTime = Date.now();
      const token = args?.token || extra?.token;

      // 记录调用
      console.log(`[MCP Server] 工具调用: ${tool.name}`, {
        token: token ? `${token.substring(0, 8)}...` : '无token',
        args,
        timestamp: new Date().toISOString()
      });

      try {
        // 如果启用了认证，使用统一权限管理器检查权限
        if (this.config.enableAuth && token) {
          const validationResult = globalTokenManager.validateTokenDetailed(token);
          const permissionCheck = globalPermissionManager.validateToolAccess(
            validationResult,
            tool.groups || []
          );

          if (!permissionCheck.allowed) {
            return {
              content: [{ type: 'text', text: `❌ ${permissionCheck.error}` }],
              isError: true
            };
          }
        }

        // 执行原始工具
        const result = await tool.execute(args);

        // 记录执行时间
        const executionTime = Date.now() - startTime;
        console.log(`[MCP Server] 工具执行完成: ${tool.name} (${executionTime}ms)`);

        return result;

      } catch (error) {
        console.error(`[MCP Server] 工具执行失败: ${tool.name}`, error);
        return {
          content: [{ type: 'text', text: `执行失败: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    };

    // 注册到MCP服务器
    this.server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
          title: tool.name,
          readOnlyHint: !tool.inputSchema?.properties?.content,
          destructiveHint: tool.inputSchema?.properties?.action === 'delete'
        }
      },
      async (args: any, extra?: any) => {
        // 执行工具
        const result = await wrappedExecute(args, extra);
        
        // 转换为MCP SDK要求的格式
        const mcpResult: any = {
          content: result.content.map((c: any) => {
            const content: any = { type: c.type };
            if (c.text) content.text = c.text;
            if (c.data) content.data = c.data;
            if (c.mimeType) content.mimeType = c.mimeType;
            return content;
          })
        };
        
        if (result.isError) {
          mcpResult.isError = true;
        }
        
        return mcpResult;
      }
    );
  }

  /**
   * 注册获取所有可见工具的工具 - 使用统一权限管理器
   */
  private registerGetAllVisibleTools(): void {
    const getAllVisibleTools: Tool = {
      name: 'get_all_visible_tools',
      description: '获取当前用户可见的所有MCP工具列表',
      groups: ['public', 'tool-discovery'],
      inputSchema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: '用户Token（可选，用于权限过滤）'
          },
          includeGroups: {
            type: 'array',
            items: { type: 'string' },
            description: '包含的工具分组（可选）'
          }
        },
        required: []
      },
      execute: async (args): Promise<ToolResult> => {
        try {
          const { token, includeGroups } = args;
          
          let tools = Array.from(this.allTools.values());
          
          // 如果提供了token，根据角色过滤
          if (token) {
            // 使用统一的验证方法
            const validationResult = globalTokenManager.validateTokenDetailed(token);
            if (!validationResult.isValid) {
              return {
                content: [{ type: 'text', text: '❌ Token无效或已过期' }],
                isError: true
              };
            }

            // 获取用户空间的可见工具设置
            const userSpace = globalUserSpaceManager.getUserSpaceIfExists(token);
            const userSpaceVisible = userSpace?.visibleTools;

            // 使用统一权限管理器过滤工具
            tools = globalPermissionManager.filterVisibleTools(
              tools.map(tool => ({ name: tool.name, groups: tool.groups })),
              validationResult.role,
              userSpaceVisible
            ).map(filtered => this.allTools.get(filtered.name)!);
          }

          // 如果指定了分组，过滤工具
          if (includeGroups && includeGroups.length > 0) {
            tools = tools.filter(tool => 
              tool.groups?.some(g => includeGroups.includes(g))
            );
          }

          // 格式化输出
          const lines = [`可见MCP工具列表 (${tools.length}个):`, ''];
          
          tools.forEach((tool, index) => {
            const groups = tool.groups || [];
            lines.push(`${index + 1}. ${tool.name}`);
            lines.push(`   描述: ${tool.description}`);
            lines.push(`   分组: [${groups.join(', ')}]`);
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

    this.registerTool(getAllVisibleTools);
  }

  /**
   * 启动MCP服务器
   */
  async start(): Promise<void> {
    // 初始化工具系统（在启动前）
    await this.initializeTools();
    
    console.log(`🚀 启动MCP服务器: ${this.config.name} v${this.config.version}`);
    console.log(`📊 工具总数: ${this.allTools.size}`);
    console.log(`🔐 认证: ${this.config.enableAuth ? '启用' : '禁用'}`);
    console.log(`🏢 组织架构: ${this.config.enableOrganization ? '启用' : '禁用'}`);
    console.log(`🛡️  权限管理: 统一权限管理器`);

    // 创建传输层
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        console.log(`[MCP Server] Session initialized: ${sessionId}`);
      }
    });

    // 连接服务器到传输层
    await this.server.connect(this.transport);

    // 创建HTTP服务器
    const app = createMcpExpressApp();

    // MCP端点
    app.post('/mcp', async (req, res) => {
      await this.transport.handleRequest(req, res, req.body);
    });

    app.get('/mcp', async (req, res) => {
      await this.transport.handleRequest(req, res);
    });

    app.delete('/mcp', async (req, res) => {
      await this.transport.handleRequest(req, res);
    });

    // 健康检查端点
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        name: this.config.name,
        version: this.config.version,
        tools: this.allTools.size,
        timestamp: new Date().toISOString()
      });
    });

    // 工具列表端点（方便查看）
    app.get('/tools', (req, res) => {
      const tools = Array.from(this.allTools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        groups: tool.groups || []
      }));
      res.json({
        total: tools.length,
        tools
      });
    });

    // 权限信息端点（新增）
    app.get('/permissions', (req, res) => {
      res.json({
        manager: 'PermissionManager',
        roleHierarchy: {
          user: 1,
          analyst: 2,
          admin: 3
        },
        groupPermissions: require('./core/token/permission-manager').GROUP_PERMISSIONS
      });
    });

    // 启动服务器
    return new Promise((resolve) => {
      app.listen(this.config.port, () => {
        console.log(`✅ MCP服务器运行在 http://localhost:${this.config.port}`);
        console.log(`🔗 MCP端点: http://localhost:${this.config.port}/mcp`);
        console.log(`🔍 健康检查: http://localhost:${this.config.port}/health`);
        console.log(`📋 工具列表: http://localhost:${this.config.port}/tools`);
        console.log(`🛡️  权限信息: http://localhost:${this.config.port}/permissions`);
        console.log('');
        console.log('💡 使用方法:');
        console.log('   1. 通过HTTP请求调用MCP工具');
        console.log('   2. 使用工具列表查看可用工具');
        console.log('   3. 通过token参数进行权限验证');
        console.log('   4. 权限配置集中管理，易于扩展');
        resolve();
      });
    });
  }

  /**
   * 停止MCP服务器
   */
  async stop(): Promise<void> {
    console.log('[MCP Server] 正在停止...');
    
    if (this.transport) {
      await this.transport.close();
    }
    
    await this.server.close();
    console.log('[MCP Server] 已停止');
  }

  /**
   * 获取服务器信息
   */
  getInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      port: this.config.port,
      tools: this.allTools.size,
      enableAuth: this.config.enableAuth,
      enableOrganization: this.config.enableOrganization,
      uptime: process.uptime(),
      permissionManager: 'PermissionManager'
    };
  }

  /**
   * 获取所有工具名称
   */
  getToolNames(): string[] {
    return Array.from(this.allTools.keys());
  }

  /**
   * 按分组获取工具
   */
  getToolsByGroup(group: string): Tool[] {
    return Array.from(this.allTools.values()).filter(tool => 
      tool.groups?.includes(group)
    );
  }
}

/**
 * 创建并启动MCP服务器（便捷函数）
 */
export async function createMCPServer(config: MCPServerConfig = {}): Promise<FrameworkMCPServer> {
  const server = new FrameworkMCPServer(config);
  await server.start();
  return server;
}

/**
 * 默认导出 - 创建MCP服务器实例
 */
export default FrameworkMCPServer;