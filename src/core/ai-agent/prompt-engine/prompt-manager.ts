/**
 * 简化版提示词管理器
 * 统一管理系统提示词、追加提示词和拼接提示词
 */

import { 
  SystemPromptConfig, 
  AppendPromptConfig,
  ConcatenatePromptConfig,
  PromptFormat, 
  RenderOptions, 
  RenderResult,
  ValidationResult,
  VariableDefinition
} from './types';

export class PromptManager {
  private systemPrompts: Map<string, SystemPromptConfig> = new Map();
  private appendPrompts: Map<string, AppendPromptConfig> = new Map();
  private concatenatePrompts: Map<string, ConcatenatePromptConfig> = new Map();
  private config: {
    strictMode?: boolean;
    useDefaults?: boolean;
    autoFormat?: boolean;
  };

  constructor(config?: {
    strictMode?: boolean;
    useDefaults?: boolean;
    autoFormat?: boolean;
  }) {
    this.config = {
      strictMode: config?.strictMode ?? false,
      useDefaults: config?.useDefaults ?? true,
      autoFormat: config?.autoFormat ?? true
    };
  }

  /**
   * 注册系统提示词
   */
  registerSystemPrompt(config: SystemPromptConfig): void {
    const validation = this.validateSystemPrompt(config);
    if (!validation.valid) {
      throw new Error(`Invalid system prompt: ${validation.errors.join(', ')}`);
    }

    if (!config.metadata) config.metadata = {};
    if (!config.metadata.createdAt) config.metadata.createdAt = new Date().toISOString();
    config.metadata.updatedAt = new Date().toISOString();

    this.systemPrompts.set(config.id, config);
  }

  /**
   * 注册追加提示词
   */
  registerAppendPrompt(config: AppendPromptConfig): void {
    const validation = this.validateAppendPrompt(config);
    if (!validation.valid) {
      throw new Error(`Invalid append prompt: ${validation.errors.join(', ')}`);
    }

    if (!config.metadata) config.metadata = {};
    if (!config.metadata.createdAt) config.metadata.createdAt = new Date().toISOString();
    config.metadata.updatedAt = new Date().toISOString();

    this.appendPrompts.set(config.id, config);
  }

  /**
   * 注册拼接提示词
   */
  registerConcatenatePrompt(config: ConcatenatePromptConfig): void {
    const validation = this.validateConcatenatePrompt(config);
    if (!validation.valid) {
      throw new Error(`Invalid concatenate prompt: ${validation.errors.join(', ')}`);
    }

    if (!config.metadata) config.metadata = {};
    if (!config.metadata.createdAt) config.metadata.createdAt = new Date().toISOString();
    config.metadata.updatedAt = new Date().toISOString();

    this.concatenatePrompts.set(config.id, config);
  }

  /**
   * 渲染系统提示词
   */
  renderSystemPrompt(
    id: string, 
    variables?: Record<string, any>, 
    options?: RenderOptions
  ): RenderResult {
    const config = this.systemPrompts.get(id);
    if (!config) {
      return {
        success: false,
        content: '',
        errors: [`System prompt '${id}' not found`]
      };
    }

    return this.renderPrompt(config, variables, options);
  }

  /**
   * 渲染追加提示词
   */
  renderAppendPrompt(
    id: string, 
    variables?: Record<string, any>, 
    options?: RenderOptions
  ): RenderResult {
    const config = this.appendPrompts.get(id);
    if (!config) {
      return {
        success: false,
        content: '',
        errors: [`Append prompt '${id}' not found`]
      };
    }

    return this.renderPrompt(config, variables, options);
  }

  /**
   * 渲染拼接提示词
   */
  renderConcatenatePrompt(
    id: string, 
    variables?: Record<string, any>, 
    options?: RenderOptions
  ): RenderResult {
    const config = this.concatenatePrompts.get(id);
    if (!config) {
      return {
        success: false,
        content: '',
        errors: [`Concatenate prompt '${id}' not found`]
      };
    }

    return this.renderPrompt(config, variables, options);
  }

  /**
   * 组合完整提示词（支持拼接提示词）
   */
  composePrompt(
    systemPromptId: string,
    appendPromptIds: string[] = [],
    concatenatePromptIds: string[] = [],
    variables?: Record<string, any>,
    options?: RenderOptions
  ): RenderResult {
    // 1. 渲染系统提示词
    const systemResult = this.renderSystemPrompt(systemPromptId, variables, options);
    if (!systemResult.success) {
      return systemResult;
    }

    // 2. 处理拼接提示词（插入到系统提示词的变量中）
    let systemContent = systemResult.content;
    for (const concatId of concatenatePromptIds) {
      const concatConfig = this.concatenatePrompts.get(concatId);
      if (!concatConfig) {
        return {
          success: false,
          content: '',
          errors: [`Concatenate prompt '${concatId}' not found`]
        };
      }

      // 渲染拼接提示词
      const concatResult = this.renderConcatenatePrompt(concatId, variables, options);
      if (!concatResult.success) {
        return concatResult;
      }

      // 执行拼接
      systemContent = this.applyConcatenate(
        systemContent,
        concatConfig,
        concatResult.content
      );
    }

    // 3. 渲染追加提示词
    const appendContents: string[] = [];
    for (const id of appendPromptIds) {
      const result = this.renderAppendPrompt(id, variables, options);
      if (!result.success) {
        return result;
      }
      appendContents.push(result.content);
    }

    // 4. 组合所有内容
    let finalContent = systemContent;
    
    // 按位置处理追加提示词
    for (const id of appendPromptIds) {
      const config = this.appendPrompts.get(id)!;
      const content = appendContents[appendPromptIds.indexOf(id)];

      switch (config.position) {
        case 'before':
          finalContent = content + '\n\n' + finalContent;
          break;
        case 'replace':
          finalContent = content;
          break;
        case 'after':
        default:
          finalContent = finalContent + '\n\n' + content;
          break;
      }
    }

    // 自动格式化
    if (this.config.autoFormat && options?.autoFormat !== false) {
      finalContent = this.formatContent(finalContent);
    }

    return {
      success: true,
      content: finalContent,
      warnings: [...systemResult.warnings || [], ...appendContents.flatMap(() => [])]
    };
  }

  /**
   * 应用拼接提示词
   */
  private applyConcatenate(
    baseContent: string,
    concatConfig: ConcatenatePromptConfig,
    concatContent: string
  ): string {
    const { target, mode } = concatConfig;
    
    // 查找目标提示词的变量占位符
    const targetPrompt = this.systemPrompts.get(target.promptId) || 
                        this.appendPrompts.get(target.promptId) ||
                        this.concatenatePrompts.get(target.promptId);
    
    if (!targetPrompt) {
      return baseContent; // 如果找不到目标，返回原内容
    }

    // 在baseContent中查找变量占位符
    const placeholder = `{{${target.variableName}}}`;
    
    if (!baseContent.includes(placeholder)) {
      return baseContent; // 如果没有占位符，返回原内容
    }

    // 根据模式拼接
    switch (mode) {
      case 'prepend':
        return baseContent.split(placeholder).join(concatContent + placeholder);
      case 'append':
        return baseContent.split(placeholder).join(placeholder + concatContent);
      case 'replace':
      default:
        return baseContent.split(placeholder).join(concatContent);
    }
  }

  /**
   * 渲染单个提示词（内部方法）
   */
  private renderPrompt(
    config: SystemPromptConfig | AppendPromptConfig | ConcatenatePromptConfig,
    variables?: Record<string, any>,
    options?: RenderOptions
  ): RenderResult {
    const opts = {
      strict: this.config.strictMode,
      useDefaults: this.config.useDefaults,
      ...options
    };

    // 固定格式
    if (config.format === 'fixed') {
      if (!('content' in config) || !config.content) {
        return {
          success: false,
          content: '',
          errors: ['Fixed format requires content']
        };
      }
      return {
        success: true,
        content: config.content
      };
    }

    // 模板格式
    if (config.format === 'template') {
      if (!('template' in config) || !config.template) {
        return {
          success: false,
          content: '',
          errors: ['Template format requires template']
        };
      }

      // 准备变量
      const preparedVars = this.prepareVariables(
        config.variables || [],
        variables || {},
        opts
      );

      // 验证变量
      if (opts.strict) {
        const validation = this.validateVariables(config.variables || [], preparedVars);
        if (!validation.valid) {
          return {
            success: false,
            content: '',
            errors: validation.errors
          };
        }
      }

      // 执行渲染
      let content = config.template;
      for (const [name, value] of Object.entries(preparedVars)) {
        const placeholder = `{{${name}}}`;
        const formattedValue = this.formatValue(value);
        content = content.split(placeholder).join(formattedValue);
      }

      // 自动格式化
      if (opts.autoFormat) {
        content = this.formatContent(content);
      }

      return {
        success: true,
        content,
        warnings: []
      };
    }

    return {
      success: false,
      content: '',
      errors: ['Unknown format']
    };
  }

  /**
   * 准备变量
   */
  private prepareVariables(
    definitions: VariableDefinition[],
    provided: Record<string, any>,
    options: { useDefaults: boolean }
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const def of definitions) {
      const value = provided[def.name];

      // 1. 使用提供的值
      if (value !== undefined && value !== null) {
        result[def.name] = value;
        continue;
      }

      // 2. 使用默认值
      if (options.useDefaults && def.default !== undefined) {
        result[def.name] = def.default;
        continue;
      }

      // 3. 必填变量未提供
      if (def.required) {
        if (options.useDefaults) {
          result[def.name] = this.getEmptyValue(def.type);
        } else {
          throw new Error(`Missing required variable: ${def.name}`);
        }
      } else {
        // 可选变量：使用空值
        result[def.name] = this.getEmptyValue(def.type);
      }
    }

    return result;
  }

  /**
   * 验证变量
   */
  private validateVariables(
    definitions: VariableDefinition[],
    values: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const def of definitions) {
      const value = values[def.name];

      // 检查必填
      if (def.required && (value === undefined || value === null || value === '')) {
        errors.push(`Missing required variable: ${def.name}`);
        continue;
      }

      // 跳过未提供的非必填变量
      if (value === undefined || value === null) {
        continue;
      }

      // 类型检查
      if (typeof value !== def.type && def.type !== 'array' && def.type !== 'object') {
        errors.push(`Variable ${def.name} must be of type ${def.type}, got ${typeof value}`);
      }

      // 数组类型检查
      if (def.type === 'array' && !Array.isArray(value)) {
        errors.push(`Variable ${def.name} must be an array`);
      }

      // 对象类型检查
      if (def.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(`Variable ${def.name} must be an object`);
      }

      // 自定义验证
      if (def.validation && !def.validation(value)) {
        errors.push(`Variable ${def.name} failed custom validation`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证系统提示词配置
   */
  private validateSystemPrompt(config: SystemPromptConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.id) errors.push('ID is required');
    if (!config.name) errors.push('Name is required');
    if (!config.format) errors.push('Format is required');

    if (config.format === 'template') {
      if (!config.template) errors.push('Template is required for template format');
      if (!config.variables || !Array.isArray(config.variables)) {
        warnings.push('Variables should be provided for template format');
      }
    }

    if (config.format === 'fixed') {
      if (!config.content) errors.push('Content is required for fixed format');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 验证追加提示词配置
   */
  private validateAppendPrompt(config: AppendPromptConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.id) errors.push('ID is required');
    if (!config.name) errors.push('Name is required');
    if (!config.format) errors.push('Format is required');

    if (config.format === 'template') {
      if (!config.template) errors.push('Template is required for template format');
    }

    if (config.format === 'fixed') {
      if (!config.content) errors.push('Content is required for fixed format');
    }

    if (config.position && !['before', 'after', 'replace'].includes(config.position)) {
      errors.push('Position must be one of: before, after, replace');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 验证拼接提示词配置
   */
  private validateConcatenatePrompt(config: ConcatenatePromptConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.id) errors.push('ID is required');
    if (!config.name) errors.push('Name is required');
    if (!config.format) errors.push('Format is required');
    if (!config.target) errors.push('Target is required');
    
    if (config.target) {
      if (!config.target.promptId) errors.push('Target.promptId is required');
      if (!config.target.variableName) errors.push('Target.variableName is required');
    }

    if (config.format === 'template') {
      if (!config.template) errors.push('Template is required for template format');
    }

    if (config.format === 'fixed') {
      if (!config.content) errors.push('Content is required for fixed format');
    }

    if (config.mode && !['prepend', 'append', 'replace'].includes(config.mode)) {
      errors.push('Mode must be one of: prepend, append, replace');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 获取空值
   */
  private getEmptyValue(type: string): any {
    switch (type) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'array': return [];
      case 'object': return {};
      default: return '';
    }
  }

  /**
   * 格式化值
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value)) return value.map(v => this.formatValue(v)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  /**
   * 格式化内容
   */
  private formatContent(content: string): string {
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.split('\n').map(line => line.trim()).join('\n');
    if (!content.endsWith('\n')) content += '\n';
    return content;
  }

  /**
   * 获取所有提示词列表
   */
  getSystemPrompts(): SystemPromptConfig[] {
    return Array.from(this.systemPrompts.values());
  }

  getAppendPrompts(): AppendPromptConfig[] {
    return Array.from(this.appendPrompts.values());
  }

  getConcatenatePrompts(): ConcatenatePromptConfig[] {
    return Array.from(this.concatenatePrompts.values());
  }

  /**
   * 获取单个提示词
   */
  getSystemPrompt(id: string): SystemPromptConfig | undefined {
    return this.systemPrompts.get(id);
  }

  getAppendPrompt(id: string): AppendPromptConfig | undefined {
    return this.appendPrompts.get(id);
  }

  getConcatenatePrompt(id: string): ConcatenatePromptConfig | undefined {
    return this.concatenatePrompts.get(id);
  }

  /**
   * 移除提示词
   */
  removeSystemPrompt(id: string): boolean {
    return this.systemPrompts.delete(id);
  }

  removeAppendPrompt(id: string): boolean {
    return this.appendPrompts.delete(id);
  }

  removeConcatenatePrompt(id: string): boolean {
    return this.concatenatePrompts.delete(id);
  }

  /**
   * 清空所有
   */
  clear(): void {
    this.systemPrompts.clear();
    this.appendPrompts.clear();
    this.concatenatePrompts.clear();
  }

  /**
   * 导出配置
   */
  export(): {
    systemPrompts: SystemPromptConfig[];
    appendPrompts: AppendPromptConfig[];
    concatenatePrompts: ConcatenatePromptConfig[];
  } {
    return {
      systemPrompts: Array.from(this.systemPrompts.values()),
      appendPrompts: Array.from(this.appendPrompts.values()),
      concatenatePrompts: Array.from(this.concatenatePrompts.values())
    };
  }

  /**
   * 导入配置
   */
  import(data: {
    systemPrompts?: SystemPromptConfig[];
    appendPrompts?: AppendPromptConfig[];
    concatenatePrompts?: ConcatenatePromptConfig[];
  }): void {
    if (data.systemPrompts) {
      for (const config of data.systemPrompts) {
        this.registerSystemPrompt(config);
      }
    }

    if (data.appendPrompts) {
      for (const config of data.appendPrompts) {
        this.registerAppendPrompt(config);
      }
    }

    if (data.concatenatePrompts) {
      for (const config of data.concatenatePrompts) {
        this.registerConcatenatePrompt(config);
      }
    }
  }
}