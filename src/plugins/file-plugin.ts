import type { ToolPlugin, Tool, ToolResult, PluginContext } from '../types';

/**
 * 文件操作插件
 * 演示插件化架构：共享文件缓存和状态管理
 */
export class FilePlugin implements ToolPlugin {
  name = 'file-tools';
  description = '文件操作工具集，支持读取、写入、搜索和缓存';
  
  private context?: PluginContext;
  private fileCache?: Map<string, { content: string; timestamp: number }>;
  private cacheTTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 插件初始化
   * 创建共享的文件缓存
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.fileCache = new Map();
    
    // 在共享状态中注册文件缓存，其他插件也可以访问
    context.sharedState.set('fileCache', this.fileCache);
    context.sharedState.set('filePluginInstance', this);
    
    console.log('[FilePlugin] 文件插件初始化完成，缓存已创建');
  }

  /**
   * 获取插件提供的所有工具
   */
  getTools(): Tool[] {
    return [
      this.createReadFileTool(),
      this.createWriteFileTool(),
      this.createSearchFileTool(),
      this.createClearCacheTool()
    ];
  }

  /**
   * 创建读取文件工具
   */
  private createReadFileTool(): Tool {
    return {
      name: 'file_read',
      description: '读取文件内容（支持缓存）',
      groups: ['file-io', 'public'],
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '文件路径'
          },
          useCache: {
            type: 'boolean',
            description: '是否使用缓存',
            default: true
          }
        },
        required: ['path']
      },
      execute: async (args): Promise<ToolResult> => {
        const { path, useCache = true } = args;
        
        // 检查缓存
        if (useCache && this.fileCache?.has(path)) {
          const cached = this.fileCache.get(path)!;
          if (Date.now() - cached.timestamp < this.cacheTTL) {
            console.log(`[FilePlugin] 从缓存读取: ${path}`);
            return {
              content: [{
                type: 'text',
                text: `Cached content from ${path}:\n\n${cached.content}`
              }]
            };
          } else {
            this.fileCache.delete(path);
          }
        }

        // 模拟文件读取（实际项目中使用fs模块）
        const content = await this.simulateFileRead(path);
        
        // 更新缓存
        if (this.fileCache) {
          this.fileCache.set(path, {
            content,
            timestamp: Date.now()
          });
        }

        return {
          content: [{
            type: 'text',
            text: `Content from ${path}:\n\n${content}`
          }]
        };
      }
    };
  }

  /**
   * 创建写入文件工具
   */
  private createWriteFileTool(): Tool {
    return {
      name: 'file_write',
      description: '写入文件内容',
      groups: ['file-io', 'public'],
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '文件路径'
          },
          content: {
            type: 'string',
            description: '文件内容'
          },
          overwrite: {
            type: 'boolean',
            description: '是否覆盖已存在的文件',
            default: true
          }
        },
        required: ['path', 'content']
      },
      execute: async (args): Promise<ToolResult> => {
        const { path, content, overwrite = true } = args;
        
        // 模拟文件写入
        await this.simulateFileWrite(path, content);
        
        // 清除缓存
        if (this.fileCache?.has(path)) {
          this.fileCache.delete(path);
        }

        return {
          content: [{
            type: 'text',
            text: `文件已成功写入: ${path}\n内容长度: ${content.length} 字符`
          }]
        };
      }
    };
  }

  /**
   * 创建文件搜索工具
   */
  private createSearchFileTool(): Tool {
    return {
      name: 'file_search',
      description: '在文件内容中搜索关键词',
      groups: ['file-io', 'public'],
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '文件路径'
          },
          keyword: {
            type: 'string',
            description: '搜索关键词'
          },
          caseSensitive: {
            type: 'boolean',
            description: '是否区分大小写',
            default: false
          }
        },
        required: ['path', 'keyword']
      },
      execute: async (args): Promise<ToolResult> => {
        const { path, keyword, caseSensitive = false } = args;
        
        // 先读取文件（使用缓存）
        const readResult = await this.createReadFileTool().execute({ path, useCache: true });
        const content = readResult.content[0].text || '';
        
        // 执行搜索
        const searchContent = caseSensitive ? content : content.toLowerCase();
        const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
        
        const lines = content.split('\n');
        const matches: string[] = [];
        
        lines.forEach((line, index) => {
          if ((caseSensitive ? line : line.toLowerCase()).includes(searchKeyword)) {
            matches.push(`行 ${index + 1}: ${line.trim()}`);
          }
        });

        if (matches.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `在文件 ${path} 中未找到关键词: "${keyword}"`
            }]
          };
        }

        return {
          content: [{
            type: 'text',
            text: `在文件 ${path} 中找到 ${matches.length} 处匹配:\n\n${matches.join('\n')}`
          }]
        };
      }
    };
  }

  /**
   * 创建清除缓存工具
   */
  private createClearCacheTool(): Tool {
    return {
      name: 'file_clear_cache',
      description: '清除文件缓存',
      groups: ['file-io', 'admin-only'],
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '指定文件路径（可选，不指定则清除所有缓存）'
          }
        },
        required: []
      },
      execute: async (args): Promise<ToolResult> => {
        const { path } = args;
        
        if (!this.fileCache) {
          return {
            content: [{
              type: 'text',
              text: '缓存未初始化'
            }]
          };
        }

        if (path) {
          this.fileCache.delete(path);
          return {
            content: [{
              type: 'text',
              text: `已清除文件缓存: ${path}`
            }]
          };
        } else {
          const size = this.fileCache.size;
          this.fileCache.clear();
          return {
            content: [{
              type: 'text',
              text: `已清除所有文件缓存，共 ${size} 个条目`
            }]
          };
        }
      }
    };
  }

  /**
   * 插件清理
   */
  async cleanup(): Promise<void> {
    if (this.fileCache) {
      console.log(`[FilePlugin] 清理文件缓存，共 ${this.fileCache.size} 个条目`);
      this.fileCache.clear();
    }
  }

  // 模拟文件操作（实际项目中使用fs模块）
  private async simulateFileRead(path: string): Promise<string> {
    // 模拟异步IO操作
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // 返回模拟内容
    const mockContent = `This is the content of ${path}\n\nCreated at: ${new Date().toISOString()}\nLine 1: Sample text\nLine 2: More content\nLine 3: Searchable keywords`;
    return mockContent;
  }

  private async simulateFileWrite(path: string, content: string): Promise<void> {
    // 模拟异步IO操作
    await new Promise(resolve => setTimeout(resolve, 10));
    console.log(`[FilePlugin] 模拟写入文件: ${path}, 内容长度: ${content.length}`);
  }
}