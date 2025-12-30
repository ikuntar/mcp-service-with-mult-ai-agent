/**
 * 提示词引擎与AI-Agent集成示例
 * 展示如何使用JSON配置初始化提示词引擎
 */

import { 
  createPromptManagerWithJSON, 
  autoLoadPrompts,
  JSONLoader,
  PromptManager 
} from './prompt-engine';

/**
 * 提示词引擎集成器
 * 为AI-Agent提供便捷的提示词管理
 */
export class PromptEngineIntegration {
  private manager: PromptManager | null = null;
  private loaded = false;

  /**
   * 自动加载JSON配置
   */
  async initialize(config?: {
    strictMode?: boolean;
    useDefaults?: boolean;
    autoFormat?: boolean;
  }): Promise<{
    success: boolean;
    loaded: {
      system: number;
      append: number;
      concatenate: number;
    };
    errors: string[];
  }> {
    const result = await createPromptManagerWithJSON(config);
    
    this.manager = result.manager;
    this.loaded = result.loadResult.success;

    return {
      success: result.loadResult.success,
      loaded: result.loadResult.loaded,
      errors: result.loadResult.errors
    };
  }

  /**
   * 获取提示词管理器
   */
  getManager(): PromptManager {
    if (!this.manager) {
      throw new Error('提示词引擎未初始化，请先调用 initialize()');
    }
    return this.manager;
  }

  /**
   * 渲染系统提示词
   */
  renderSystem(id: string, variables?: Record<string, any>): string {
    const manager = this.getManager();
    const result = manager.renderSystemPrompt(id, variables);
    
    if (!result.success) {
      throw new Error(`渲染系统提示词失败: ${result.errors?.join(', ')}`);
    }
    
    return result.content;
  }

  /**
   * 渲染追加提示词
   */
  renderAppend(id: string, variables?: Record<string, any>): string {
    const manager = this.getManager();
    const result = manager.renderAppendPrompt(id, variables);
    
    if (!result.success) {
      throw new Error(`渲染追加提示词失败: ${result.errors?.join(', ')}`);
    }
    
    return result.content;
  }

  /**
   * 组合完整提示词
   */
  compose(
    systemId: string,
    appendIds: string[] = [],
    concatenateIds: string[] = [],
    variables?: Record<string, any>
  ): string {
    const manager = this.getManager();
    const result = manager.composePrompt(
      systemId,
      appendIds,
      concatenateIds,
      variables
    );
    
    if (!result.success) {
      throw new Error(`组合提示词失败: ${result.errors?.join(', ')}`);
    }
    
    return result.content;
  }

  /**
   * 快速创建Agent提示词
   */
  createAgentPrompt(
    role: string,
    task: string,
    options: {
      format?: 'json' | 'markdown' | 'text';
      qualityCheck?: boolean;
      extraData?: string;
    } = {}
  ): string {
    const manager = this.getManager();
    
    // 系统提示词
    const systemId = 'agent-system-' + Date.now();
    manager.registerSystemPrompt({
      id: systemId,
      name: `Agent-${role}`,
      format: 'fixed',
      content: `你是一位专业的${role}。任务：${task}`
    });

    const appendIds: string[] = [];

    // 格式要求
    if (options.format) {
      const formatId = 'agent-format-' + Date.now();
      let formatContent = '';
      
      switch (options.format) {
        case 'json':
          formatContent = '请使用JSON格式返回：\n```json\n{"result": "...", "confidence": 0.85}\n```';
          break;
        case 'markdown':
          formatContent = '请使用Markdown格式返回，包含标题、列表和代码块。';
          break;
        case 'text':
          formatContent = '请使用纯文本格式返回，保持简洁。';
          break;
      }

      manager.registerAppendPrompt({
        id: formatId,
        name: '格式要求',
        format: 'fixed',
        content: formatContent,
        position: 'after'
      });
      appendIds.push(formatId);
    }

    // 质量检查
    if (options.qualityCheck) {
      const qualityId = 'agent-quality-' + Date.now();
      manager.registerAppendPrompt({
        id: qualityId,
        name: '质量检查',
        format: 'fixed',
        content: '质量检查：\n- 准确性\n- 完整性\n- 一致性',
        position: 'after'
      });
      appendIds.push(qualityId);
    }

    // 额外数据（使用拼接提示词）
    const concatenateIds: string[] = [];
    if (options.extraData) {
      const extraId = 'agent-extra-' + Date.now();
      manager.registerConcatenatePrompt({
        id: extraId,
        name: '额外数据',
        format: 'fixed',
        content: options.extraData,
        target: {
          promptId: systemId,
          variableName: 'context'
        },
        mode: 'append'
      });
      concatenateIds.push(extraId);
    }

    return this.compose(systemId, appendIds, concatenateIds);
  }

  /**
   * 导出当前配置
   */
  async exportConfig(targetDir?: string): Promise<string[]> {
    const manager = this.getManager();
    const loader = new JSONLoader(manager);
    return await loader.exportToJSON(targetDir);
  }

  /**
   * 获取所有提示词列表
   */
  getAllPrompts() {
    const manager = this.getManager();
    return manager.export();
  }

  /**
   * 检查是否已加载特定提示词
   */
  hasPrompt(id: string, type: 'system' | 'append' | 'concatenate' = 'system'): boolean {
    const manager = this.getManager();
    
    switch (type) {
      case 'system':
        return !!manager.getSystemPrompt(id);
      case 'append':
        return !!manager.getAppendPrompt(id);
      case 'concatenate':
        return !!manager.getConcatenatePrompt(id);
    }
  }

  /**
   * 获取加载状态
   */
  getStatus() {
    return {
      initialized: this.manager !== null,
      loaded: this.loaded,
      promptCount: this.manager ? {
        system: this.manager.getSystemPrompts().length,
        append: this.manager.getAppendPrompts().length,
        concatenate: this.manager.getConcatenatePrompts().length
      } : null
    };
  }
}

/**
 * 快速创建集成器
 */
export async function createPromptIntegration(
  config?: {
    strictMode?: boolean;
    useDefaults?: boolean;
    autoFormat?: boolean;
  }
): Promise<PromptEngineIntegration> {
  const integration = new PromptEngineIntegration();
  await integration.initialize(config);
  return integration;
}

/**
 * 示例：与AI-Agent核心集成
 */
export class AIAgentWithPromptEngine {
  private integration: PromptEngineIntegration;

  constructor() {
    this.integration = new PromptEngineIntegration();
  }

  /**
   * 初始化Agent
   */
  async initialize(): Promise<void> {
    const result = await this.integration.initialize({
      strictMode: false,
      useDefaults: true,
      autoFormat: true
    });

    if (!result.success) {
      console.warn('提示词加载警告:', result.errors);
    }

    console.log(`✅ Agent提示词引擎初始化完成`);
    console.log(`   - 系统提示词: ${result.loaded.system}`);
    console.log(`   - 追加提示词: ${result.loaded.append}`);
    console.log(`   - 拼接提示词: ${result.loaded.concatenate}`);
  }

  /**
   * 执行任务
   */
  async executeTask(
    role: string,
    task: string,
    context?: Record<string, any>
  ): Promise<{
    prompt: string;
    metadata: any;
  }> {
    // 生成提示词
    const prompt = this.integration.createAgentPrompt(role, task, {
      format: 'json',
      qualityCheck: true,
      extraData: context ? JSON.stringify(context) : undefined
    });

    return {
      prompt,
      metadata: {
        role,
        task,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 获取系统信息
   */
  getInfo() {
    return this.integration.getStatus();
  }
}