/**
 * 增强插件示例 - 演示支持两种展开方式的插件
 */

import { 
  EnhancedPluginBase, 
  PluginTemplates,
  createEnhancedPlugin 
} from '../../src/core/container/enhanced-plugin';

import type { Tool, ToolResult, EnhancedToolPlugin, ToolsetConfig } from '../../src/types';

/**
 * 示例1：使用类继承方式创建增强插件
 */
export class DemoPlugin extends EnhancedPluginBase {
  constructor() {
    // 使用展开模式配置
    const config = PluginTemplates.expanded(
      '演示插件',
      '这是一个支持两种展开方式的演示插件'
    );
    
    super('demo-plugin', '演示插件', config);
    
    // 注册工具
    this.registerTools([
      this.createTool1(),
      this.createTool2(),
      this.createTool3()
    ]);
  }

  private createTool1(): Tool {
    return {
      name: 'demo_tool_1',
      description: '演示工具1 - 基础功能',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: '输入消息'
          }
        },
        required: ['message']
      },
      execute: async (args: any): Promise<ToolResult> => {
        return {
          content: [{
            type: 'text',
            text: `工具1收到: ${args.message}`
          }]
        };
      }
    };
  }

  private createTool2(): Tool {
    return {
      name: 'demo_tool_2',
      description: '演示工具2 - 高级功能',
      inputSchema: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            description: '重复次数'
          }
        },
        required: ['count']
      },
      execute: async (args: any): Promise<ToolResult> => {
        const result = Array(args.count).fill('Hello').map((msg, i) => `${i+1}. ${msg}`).join('\n');
        return {
          content: [{
            type: 'text',
            text: result
          }]
        };
      }
    };
  }

  private createTool3(): Tool {
    return {
      name: 'demo_tool_3',
      description: '演示工具3 - 数据处理',
      inputSchema: {
        type: 'object',
        properties: {
          data: {
            type: 'string',
            description: '要处理的数据'
          }
        },
        required: ['data']
      },
      execute: async (args: any): Promise<ToolResult> => {
        return {
          content: [{
            type: 'text',
            text: `处理结果: ${args.data.toUpperCase()}`
          }]
        };
      }
    };
  }
}

/**
 * 示例2：使用便捷函数创建增强插件
 */
export function createDemoPlugin(): EnhancedToolPlugin {
  return createEnhancedPlugin(
    'demo-plugin-factory',
    '使用工厂函数创建的演示插件',
    () => [
      {
        name: 'factory_tool_1',
        description: '工厂工具1',
        inputSchema: { type: 'object', properties: {} },
        execute: async (): Promise<ToolResult> => ({
          content: [{ type: 'text', text: '工厂工具1执行结果' }]
        })
      },
      {
        name: 'factory_tool_2',
        description: '工厂工具2',
        inputSchema: { type: 'object', properties: {} },
        execute: async (): Promise<ToolResult> => ({
          content: [{ type: 'text', text: '工厂工具2执行结果' }]
        })
      }
    ],
    PluginTemplates.expanded('工厂插件', '使用工厂函数创建的插件')
  );
}

/**
 * 示例3：扁平模式插件
 */
export class FlatModePlugin extends EnhancedPluginBase {
  constructor() {
    // 使用扁平模式配置
    const config = PluginTemplates.flat(
      '扁平插件',
      '直接显示所有工具，不包含展开命令'
    );
    
    super('flat-plugin', '扁平插件', config);
    
    this.registerTools([
      {
        name: 'flat_tool_1',
        description: '扁平工具1',
        inputSchema: { type: 'object', properties: {} },
        execute: async (): Promise<ToolResult> => ({
          content: [{ type: 'text', text: '扁平工具1结果' }]
        })
      },
      {
        name: 'flat_tool_2',
        description: '扁平工具2',
        inputSchema: { type: 'object', properties: {} },
        execute: async (): Promise<ToolResult> => ({
          content: [{ type: 'text', text: '扁平工具2结果' }]
        })
      }
    ]);
  }
}

/**
 * 演示函数
 */
export function demoEnhancedPlugin() {
  console.log('=== 增强插件演示 ===\n');
  
  // 示例1：展开模式
  const expandedPlugin = new DemoPlugin();
  console.log('1. 展开模式插件:');
  console.log(`   插件名称: ${expandedPlugin.name}`);
  console.log(`   显示模式: ${expandedPlugin.getConfig()?.displayMode}`);
  console.log(`   工具数量: ${expandedPlugin.size}`);
  console.log(`   包含展开命令: ${expandedPlugin.hasExpandCommand()}`);
  
  const expandedTools = expandedPlugin.getTools();
  console.log(`   总工具数(含展开命令): ${expandedTools.length}`);
  expandedTools.forEach(tool => {
    const isExpandCmd = tool.name === expandedPlugin.getExpandCommand()?.name;
    console.log(`     ${isExpandCmd ? '📦' : '🔧'} ${tool.name}: ${tool.description}`);
  });
  console.log('');
  
  // 示例2：工厂函数
  const factoryPlugin = createDemoPlugin();
  console.log('2. 工厂函数创建的插件:');
  console.log(`   插件名称: ${factoryPlugin.name}`);
  console.log(`   工具数量: ${factoryPlugin.size}`);
  const factoryTools = factoryPlugin.getTools();
  if (Array.isArray(factoryTools)) {
    factoryTools.forEach(tool => {
      console.log(`     🔧 ${tool.name}: ${tool.description}`);
    });
  }
  console.log('');
  
  // 示例3：扁平模式
  const flatPlugin = new FlatModePlugin();
  console.log('3. 扁平模式插件:');
  console.log(`   插件名称: ${flatPlugin.name}`);
  console.log(`   显示模式: ${flatPlugin.getConfig()?.displayMode}`);
  console.log(`   包含展开命令: ${flatPlugin.hasExpandCommand()}`);
  
  const flatTools = flatPlugin.getTools();
  console.log(`   工具数量: ${flatTools.length}`);
  if (Array.isArray(flatTools)) {
    flatTools.forEach(tool => {
      console.log(`     🔧 ${tool.name}: ${tool.description}`);
    });
  }
  console.log('');
  
  // 演示动态切换配置
  console.log('4. 动态切换配置:');
  console.log('   切换为扁平模式...');
  expandedPlugin.setConfig(PluginTemplates.flat('演示插件', '已切换为扁平模式'));
  console.log(`   新显示模式: ${expandedPlugin.getConfig()?.displayMode}`);
  console.log(`   新工具数量: ${expandedPlugin.getTools().length}`);
  console.log('');
  
  // 演示执行工具
  console.log('5. 执行工具演示:');
  expandedPlugin.execute('demo_tool_1', { message: 'Hello World' }).then(result => {
    console.log(`   demo_tool_1 结果: ${result.content[0].text}`);
  });
}

// 如果直接运行此文件
if (require.main === module) {
  demoEnhancedPlugin();
}