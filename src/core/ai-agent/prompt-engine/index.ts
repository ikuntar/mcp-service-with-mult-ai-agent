/**
 * AI-Agent提示词工程 - 主入口
 * 包含三种提示词：系统提示词、追加提示词、拼接提示词
 */

import { PromptManager } from './prompt-manager';
import { SystemPromptFactory, AppendPromptFactory, ConcatenatePromptFactory, PromptComposition } from './factory';
import { JSONLoader, loadPromptsFromJSON } from './json-loader';
import {
  SystemPromptConfig,
  AppendPromptConfig,
  ConcatenatePromptConfig,
  PromptFormat,
  VariableDefinition,
  RenderOptions,
  RenderResult,
  ValidationResult,
  PromptEngineConfig,
  JSONLoaderConfig,
  LoadResult
} from './types';

export { PromptManager } from './prompt-manager';
export { SystemPromptFactory, AppendPromptFactory, ConcatenatePromptFactory, PromptComposition } from './factory';
export { JSONLoader, loadPromptsFromJSON } from './json-loader';

export type {
  SystemPromptConfig,
  AppendPromptConfig,
  ConcatenatePromptConfig,
  PromptFormat,
  VariableDefinition,
  RenderOptions,
  RenderResult,
  ValidationResult,
  PromptComposition as PromptCompositionConfig,
  PromptEngineConfig,
  JSONLoaderConfig,
  LoadResult
} from './types';

/**
 * 快速创建提示词管理器
 */
export function createPromptManager(config?: {
  strictMode?: boolean;
  useDefaults?: boolean;
  autoFormat?: boolean;
}): PromptManager {
  return new PromptManager(config);
}

/**
 * 从JSON文件自动加载提示词
 */
export async function autoLoadPrompts(
  config?: JSONLoaderConfig
): Promise<{
  manager: PromptManager;
  loadResult: LoadResult;
}> {
  const manager = new PromptManager();
  const loader = new JSONLoader(manager, config);
  const loadResult = await loader.autoLoad();
  return { manager, loadResult };
}

/**
 * 创建并自动加载提示词管理器
 */
export async function createPromptManagerWithJSON(
  config?: {
    strictMode?: boolean;
    useDefaults?: boolean;
    autoFormat?: boolean;
  },
  loaderConfig?: JSONLoaderConfig
): Promise<{
  manager: PromptManager;
  loadResult: LoadResult;
}> {
  const manager = new PromptManager(config);
  const loader = new JSONLoader(manager, loaderConfig);
  const loadResult = await loader.autoLoad();
  return { manager, loadResult };
}

/**
 * 简化API - 一行代码创建和使用
 */
export const SimplePrompt = {
  /**
   * 快速渲染系统提示词
   */
  system: (
    content: string,
    variables?: Record<string, any>,
    options?: RenderOptions
  ): string => {
    const manager = new PromptManager(options);
    manager.registerSystemPrompt({
      id: 'quick-system',
      name: 'Quick System',
      format: 'fixed',
      content
    });
    const result = manager.renderSystemPrompt('quick-system', variables, options);
    return result.content;
  },

  /**
   * 快速渲染追加提示词
   */
  append: (
    content: string,
    position: 'before' | 'after' | 'replace' = 'after',
    variables?: Record<string, any>,
    options?: RenderOptions
  ): string => {
    const manager = new PromptManager(options);
    manager.registerAppendPrompt({
      id: 'quick-append',
      name: 'Quick Append',
      format: 'fixed',
      content,
      position
    });
    const result = manager.renderAppendPrompt('quick-append', variables, options);
    return result.content;
  },

  /**
   * 快速渲染拼接提示词
   */
  concatenate: (
    content: string,
    targetPromptId: string,
    targetVariableName: string,
    mode: 'prepend' | 'append' | 'replace' = 'replace',
    variables?: Record<string, any>,
    options?: RenderOptions
  ): string => {
    const manager = new PromptManager(options);
    manager.registerConcatenatePrompt({
      id: 'quick-concatenate',
      name: 'Quick Concatenate',
      format: 'fixed',
      content,
      target: {
        promptId: targetPromptId,
        variableName: targetVariableName
      },
      mode
    });
    const result = manager.renderConcatenatePrompt('quick-concatenate', variables, options);
    return result.content;
  },

  /**
   * 快速组合提示词
   */
  compose: (
    systemContent: string,
    appendContents: string | string[] = [],
    concatenateConfigs?: Array<{
      content: string;
      targetPromptId: string;
      targetVariableName: string;
      mode?: 'prepend' | 'append' | 'replace';
    }>,
    options?: {
      appendPosition?: 'before' | 'after' | 'replace';
      variables?: Record<string, any>;
      renderOptions?: RenderOptions;
    }
  ): string => {
    const manager = new PromptManager(options?.renderOptions);
    
    // 注册系统提示词
    const systemId = 'quick-system';
    manager.registerSystemPrompt({
      id: systemId,
      name: 'Quick System',
      format: 'fixed',
      content: systemContent
    });

    // 注册拼接提示词
    const concatenateIds: string[] = [];
    if (concatenateConfigs) {
      concatenateConfigs.forEach((config, index) => {
        const id = `quick-concatenate-${index}`;
        manager.registerConcatenatePrompt({
          id,
          name: `Quick Concatenate ${index}`,
          format: 'fixed',
          content: config.content,
          target: {
            promptId: config.targetPromptId,
            variableName: config.targetVariableName
          },
          mode: config.mode || 'replace'
        });
        concatenateIds.push(id);
      });
    }

    // 注册追加提示词
    const appendIds: string[] = [];
    const appendContentsArray = Array.isArray(appendContents) ? appendContents : [appendContents];
    
    appendContentsArray.forEach((content, index) => {
      if (content) { // 只有非空内容才注册
        const id = `quick-append-${index}`;
        manager.registerAppendPrompt({
          id,
          name: `Quick Append ${index}`,
          format: 'fixed',
          content,
          position: options?.appendPosition || 'after'
        });
        appendIds.push(id);
      }
    });

    // 组合并渲染
    const result = manager.composePrompt(
      systemId,
      appendIds,
      concatenateIds,
      options?.variables,
      options?.renderOptions
    );

    return result.content;
  }
};

/**
 * 与Agent集成的便捷方法
 */
export class AgentPromptEngine {
  private manager: PromptManager;

  constructor(config?: PromptEngineConfig) {
    this.manager = new PromptManager(config);
  }

  /**
   * 为Agent创建系统提示词
   */
  createAgentSystemPrompt(
    role: string,
    capabilities: string[] = []
  ): string {
    const prompt = SystemPromptFactory.createRole(
      'agent-system',
      role,
      capabilities
    );
    this.manager.registerSystemPrompt(prompt);
    return prompt.id;
  }

  /**
   * 为Agent创建任务提示词
   */
  createAgentTaskPrompt(
    task: string,
    requirements: string[] = []
  ): string {
    const prompt = SystemPromptFactory.createTask(
      'agent-task',
      task,
      requirements
    );
    this.manager.registerSystemPrompt(prompt);
    return prompt.id;
  }

  /**
   * 为Agent添加格式要求
   */
  addAgentFormat(
    format: 'json' | 'markdown' | 'text' | 'xml'
  ): string {
    const prompt = AppendPromptFactory.createOutputFormat(
      'agent-format',
      format
    );
    this.manager.registerAppendPrompt(prompt);
    return prompt.id;
  }

  /**
   * 为Agent添加质量检查
   */
  addAgentQualityCheck(checks: string[] = ['准确性', '完整性']): string {
    const prompt = AppendPromptFactory.createQualityCheck(
      'agent-quality',
      checks
    );
    this.manager.registerAppendPrompt(prompt);
    return prompt.id;
  }

  /**
   * 为Agent添加拼接提示词
   */
  addAgentConcatenate(
    content: string,
    targetPromptId: string,
    targetVariableName: string,
    mode: 'prepend' | 'append' | 'replace' = 'replace'
  ): string {
    const prompt = ConcatenatePromptFactory.createFixed(
      'agent-concatenate',
      'Agent拼接',
      content,
      { promptId: targetPromptId, variableName: targetVariableName },
      mode
    );
    this.manager.registerConcatenatePrompt(prompt);
    return prompt.id;
  }

  /**
   * 组合Agent完整提示词
   */
  composeAgentPrompt(
    systemId: string,
    appendIds: string[] = [],
    concatenateIds: string[] = [],
    variables?: Record<string, any>
  ): string {
    const result = this.manager.composePrompt(
      systemId,
      appendIds,
      concatenateIds,
      variables
    );
    return result.content;
  }

  /**
   * 快速创建Agent提示词
   */
  quickAgentPrompt(
    role: string,
    task: string,
    format: 'json' | 'markdown' | 'text' = 'json'
  ): string {
    const systemId = this.createAgentSystemPrompt(role);
    const formatId = this.addAgentFormat(format);
    
    // 创建任务提示词
    const taskPrompt = SystemPromptFactory.createFixed(
      'agent-task-quick',
      '任务',
      `任务：${task}`
    );
    this.manager.registerSystemPrompt(taskPrompt);

    return this.manager.composePrompt(
      taskPrompt.id,
      [systemId, formatId],
      []
    ).content;
  }

  /**
   * 创建带变量的Agent提示词
   */
  createVariableAgentPrompt(
    role: string,
    template: string,
    variables: VariableDefinition[]
  ): string {
    const prompt = SystemPromptFactory.createTemplate(
      'agent-variable',
      `${role}变量提示词`,
      template,
      variables
    );
    this.manager.registerSystemPrompt(prompt);
    return prompt.id;
  }

  /**
   * 渲染变量Agent提示词
   */
  renderVariableAgentPrompt(
    promptId: string,
    variables: Record<string, any>
  ): string {
    const result = this.manager.renderSystemPrompt(promptId, variables);
    return result.content;
  }
}