/**
 * JSON配置加载器
 * 自动扫描并加载JSON文件中的提示词配置
 */

import * as fs from 'fs';
import * as path from 'path';
import { PromptManager } from './prompt-manager';
import { 
  SystemPromptConfig, 
  AppendPromptConfig, 
  ConcatenatePromptConfig 
} from './types';

export interface JSONLoaderConfig {
  /**
   * 扫描的根目录
   * @default 'src/core/ai-agent/prompts'
   */
  rootDir?: string;
  
  /**
   * 是否递归扫描子目录
   * @default true
   */
  recursive?: boolean;
  
  /**
   * 文件匹配模式
   * @default '*.json'
   */
  pattern?: string;
  
  /**
   * 是否自动加载默认配置
   * @default true
   */
  autoLoadDefaults?: boolean;
}

export class JSONLoader {
  private manager: PromptManager;
  private config: Required<JSONLoaderConfig>;

  constructor(manager: PromptManager, config?: JSONLoaderConfig) {
    this.manager = manager;
    this.config = {
      rootDir: config?.rootDir || path.join(__dirname, '..', 'prompts'),
      recursive: config?.recursive ?? true,
      pattern: config?.pattern || '*.json',
      autoLoadDefaults: config?.autoLoadDefaults ?? true
    };
  }

  /**
   * 自动扫描并加载所有JSON配置
   */
  async autoLoad(): Promise<LoadResult> {
    const result: LoadResult = {
      success: true,
      loaded: {
        system: 0,
        append: 0,
        concatenate: 0
      },
      errors: [],
      files: []
    };

    try {
      // 检查目录是否存在
      if (!fs.existsSync(this.config.rootDir)) {
        result.errors.push(`目录不存在: ${this.config.rootDir}`);
        result.success = false;
        return result;
      }

      // 扫描JSON文件
      const jsonFiles = this.scanJSONFiles(this.config.rootDir);
      
      // 加载每个文件
      for (const file of jsonFiles) {
        try {
          const loadResult = await this.loadFile(file);
          result.files.push(file);
          result.loaded.system += loadResult.system;
          result.loaded.append += loadResult.append;
          result.loaded.concatenate += loadResult.concatenate;
        } catch (error) {
          result.errors.push(`加载失败 ${file}: ${error.message}`);
          result.success = false;
        }
      }

      // 如果启用且没有加载任何内容，加载默认配置
      if (this.config.autoLoadDefaults && 
          result.loaded.system === 0 && 
          result.loaded.append === 0 && 
          result.loaded.concatenate === 0) {
        await this.loadDefaults();
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`自动加载失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 加载单个JSON文件
   */
  async loadFile(filePath: string): Promise<{
    system: number;
    append: number;
    concatenate: number;
  }> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const json = JSON.parse(content);
    
    let systemCount = 0;
    let appendCount = 0;
    let concatenateCount = 0;

    // 加载系统提示词
    if (json.systemPrompts && Array.isArray(json.systemPrompts)) {
      for (const config of json.systemPrompts) {
        this.manager.registerSystemPrompt(config);
        systemCount++;
      }
    }

    // 加载追加提示词
    if (json.appendPrompts && Array.isArray(json.appendPrompts)) {
      for (const config of json.appendPrompts) {
        this.manager.registerAppendPrompt(config);
        appendCount++;
      }
    }

    // 加载拼接提示词
    if (json.concatenatePrompts && Array.isArray(json.concatenatePrompts)) {
      for (const config of json.concatenatePrompts) {
        this.manager.registerConcatenatePrompt(config);
        concatenateCount++;
      }
    }

    return {
      system: systemCount,
      append: appendCount,
      concatenate: concatenateCount
    };
  }

  /**
   * 扫描JSON文件
   */
  private scanJSONFiles(dir: string): string[] {
    const files: string[] = [];
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && this.config.recursive) {
        // 递归扫描子目录
        files.push(...this.scanJSONFiles(fullPath));
      } else if (entry.isFile() && this.matchesPattern(entry.name)) {
        // 匹配的JSON文件
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * 检查文件名是否匹配模式
   */
  private matchesPattern(filename: string): boolean {
    if (this.config.pattern === '*.json') {
      return filename.endsWith('.json');
    }
    
    // 简单的通配符匹配
    const regex = new RegExp(
      '^' + 
      this.config.pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*') + 
      '$'
    );
    
    return regex.test(filename);
  }

  /**
   * 加载默认配置
   */
  private async loadDefaults(): Promise<void> {
    const defaultPaths = [
      path.join(this.config.rootDir, 'system', 'default-system.json'),
      path.join(this.config.rootDir, 'append', 'default-append.json'),
      path.join(this.config.rootDir, 'concatenate', 'default-concatenate.json')
    ];

    for (const filePath of defaultPaths) {
      if (fs.existsSync(filePath)) {
        await this.loadFile(filePath);
      }
    }
  }

  /**
   * 导出所有配置到JSON文件
   */
  async exportToJSON(targetDir?: string): Promise<string[]> {
    const exportDir = targetDir || this.config.rootDir;
    
    // 确保目录存在
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exported: string[] = [];
    const data = this.manager.export();

    // 导出系统提示词
    if (data.systemPrompts.length > 0) {
      const systemDir = path.join(exportDir, 'system');
      if (!fs.existsSync(systemDir)) {
        fs.mkdirSync(systemDir, { recursive: true });
      }
      
      const systemFile = path.join(systemDir, 'exported-system.json');
      fs.writeFileSync(
        systemFile,
        JSON.stringify({ systemPrompts: data.systemPrompts }, null, 2)
      );
      exported.push(systemFile);
    }

    // 导出追加提示词
    if (data.appendPrompts.length > 0) {
      const appendDir = path.join(exportDir, 'append');
      if (!fs.existsSync(appendDir)) {
        fs.mkdirSync(appendDir, { recursive: true });
      }
      
      const appendFile = path.join(appendDir, 'exported-append.json');
      fs.writeFileSync(
        appendFile,
        JSON.stringify({ appendPrompts: data.appendPrompts }, null, 2)
      );
      exported.push(appendFile);
    }

    // 导出拼接提示词
    if (data.concatenatePrompts.length > 0) {
      const concatenateDir = path.join(exportDir, 'concatenate');
      if (!fs.existsSync(concatenateDir)) {
        fs.mkdirSync(concatenateDir, { recursive: true });
      }
      
      const concatenateFile = path.join(concatenateDir, 'exported-concatenate.json');
      fs.writeFileSync(
        concatenateFile,
        JSON.stringify({ concatenatePrompts: data.concatenatePrompts }, null, 2)
      );
      exported.push(concatenateFile);
    }

    return exported;
  }

  /**
   * 获取配置信息
   */
  getConfig(): Required<JSONLoaderConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<JSONLoaderConfig>): void {
    Object.assign(this.config, config);
  }
}

/**
 * 加载结果接口
 */
export interface LoadResult {
  success: boolean;
  loaded: {
    system: number;
    append: number;
    concatenate: number;
  };
  errors: string[];
  files: string[];
}

/**
 * 快速加载函数
 */
export async function loadPromptsFromJSON(
  manager: PromptManager,
  config?: JSONLoaderConfig
): Promise<LoadResult> {
  const loader = new JSONLoader(manager, config);
  return await loader.autoLoad();
}