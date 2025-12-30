/**
 * 简化版提示词工厂
 * 快速创建三种提示词：系统提示词、追加提示词、拼接提示词
 */

import { 
  SystemPromptConfig, 
  AppendPromptConfig, 
  ConcatenatePromptConfig,
  PromptFormat, 
  VariableDefinition 
} from './types';

/**
 * 系统提示词工厂
 */
export const SystemPromptFactory = {
  /**
   * 创建固定格式系统提示词
   */
  createFixed(id: string, name: string, content: string): SystemPromptConfig {
    return {
      id,
      name,
      format: 'fixed',
      content,
      metadata: {
        version: '1.0.0',
        author: 'Factory',
        createdAt: new Date().toISOString()
      }
    };
  },

  /**
   * 创建模板格式系统提示词
   */
  createTemplate(
    id: string,
    name: string,
    template: string,
    variables?: VariableDefinition[]
  ): SystemPromptConfig {
    return {
      id,
      name,
      format: 'template',
      template,
      variables: variables || [],
      metadata: {
        version: '1.0.0',
        author: 'Factory',
        createdAt: new Date().toISOString()
      }
    };
  },

  /**
   * 创建角色定义系统提示词
   */
  createRole(
    id: string,
    role: string,
    capabilities: string[] = []
  ): SystemPromptConfig {
    const content = `你是一位专业的${role}。
${capabilities.length > 0 ? `你的能力包括：${capabilities.join('、')}` : ''}
请提供准确、专业的回答。`;

    return this.createFixed(id, `${role}角色`, content);
  },

  /**
   * 创建任务导向系统提示词
   */
  createTask(
    id: string,
    taskName: string,
    requirements: string[] = []
  ): SystemPromptConfig {
    const content = `你是一位专业的助手。
任务：${taskName}
${requirements.length > 0 ? `要求：\n${requirements.map(r => `- ${r}`).join('\n')}` : ''}

请按要求完成任务。`;

    return this.createFixed(id, `${taskName}任务`, content);
  },

  /**
   * 创建代码生成系统提示词
   */
  createCodeGenerator(
    id: string,
    language: string,
    style: string = 'standard'
  ): SystemPromptConfig {
    const template = `你是一位专业的{{language}}开发者。
任务：{{task}}
要求：
- 使用{{language}}最佳实践
- 包含错误处理
- 包含文档注释
- 代码简洁清晰
- 风格：{{style}}

请返回完整代码。`;

    return this.createTemplate(id, `${language}代码生成`, template, [
      { name: 'language', type: 'string', required: true, default: language },
      { name: 'task', type: 'string', required: true },
      { name: 'style', type: 'string', required: false, default: style }
    ]);
  },

  /**
   * 创建分析系统提示词
   */
  createAnalyzer(
    id: string,
    domain: string
  ): SystemPromptConfig {
    const template = `你是一位{{domain}}专家。
数据：{{data}}
问题：{{question}}

请按以下步骤分析：
1. 数据概览
2. 关键发现
3. 深入分析
4. 结论和建议

输出格式：
\`\`\`json
{
  "summary": "摘要",
  "findings": ["发现1", "发现2"],
  "analysis": "详细分析",
  "recommendations": ["建议1", "建议2"]
}
\`\`\``;

    return this.createTemplate(id, `${domain}分析`, template, [
      { name: 'domain', type: 'string', required: true, default: domain },
      { name: 'data', type: 'string', required: true },
      { name: 'question', type: 'string', required: true }
    ]);
  }
};

/**
 * 追加提示词工厂
 */
export const AppendPromptFactory = {
  /**
   * 创建固定格式追加提示词
   */
  createFixed(
    id: string,
    name: string,
    content: string,
    position: 'before' | 'after' | 'replace' = 'after'
  ): AppendPromptConfig {
    return {
      id,
      name,
      format: 'fixed',
      content,
      position,
      metadata: {
        version: '1.0.0',
        author: 'Factory',
        createdAt: new Date().toISOString()
      }
    };
  },

  /**
   * 创建模板格式追加提示词
   */
  createTemplate(
    id: string,
    name: string,
    template: string,
    variables?: VariableDefinition[],
    position: 'before' | 'after' | 'replace' = 'after'
  ): AppendPromptConfig {
    return {
      id,
      name,
      format: 'template',
      template,
      variables: variables || [],
      position,
      metadata: {
        version: '1.0.0',
        author: 'Factory',
        createdAt: new Date().toISOString()
      }
    };
  },

  /**
   * 创建格式要求追加提示词
   */
  createFormat(
    id: string,
    format: string,
    position: 'after' | 'replace' = 'after'
  ): AppendPromptConfig {
    const content = `输出格式要求：
${format}

请严格遵循以上格式。`;

    return this.createFixed(id, '格式要求', content, position);
  },

  /**
   * 创建示例追加提示词
   */
  createExample(
    id: string,
    example: string,
    position: 'after' = 'after'
  ): AppendPromptConfig {
    const content = `示例：
${example}`;

    return this.createFixed(id, '示例', content, position);
  },

  /**
   * 创建约束条件追加提示词
   */
  createConstraints(
    id: string,
    constraints: string[],
    position: 'before' | 'after' = 'after'
  ): AppendPromptConfig {
    const content = `约束条件：
${constraints.map(c => `- ${c}`).join('\n')}

请严格遵守以上约束。`;

    return this.createFixed(id, '约束条件', content, position);
  },

  /**
   * 创建分步指令追加提示词
   */
  createStepByStep(
    id: string,
    steps: string[],
    position: 'before' | 'after' = 'after'
  ): AppendPromptConfig {
    const content = `请按以下步骤执行：
${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    return this.createFixed(id, '分步指令', content, position);
  },

  /**
   * 创建角色强化追加提示词
   */
  createRoleEnhancement(
    id: string,
    role: string,
    position: 'before' = 'before'
  ): AppendPromptConfig {
    const content = `请以${role}的专业视角回答，保持专业性和准确性。`;

    return this.createFixed(id, `${role}角色强化`, content, position);
  },

  /**
   * 创建输出格式化追加提示词
   */
  createOutputFormat(
    id: string,
    format: 'json' | 'markdown' | 'text' | 'xml',
    position: 'after' = 'after'
  ): AppendPromptConfig {
    let content = '';

    switch (format) {
      case 'json':
        content = `请使用JSON格式返回：
\`\`\`json
{
  "result": "...",
  "confidence": 0.85,
  "metadata": {}
}
\`\`\``;
        break;
      case 'markdown':
        content = `请使用Markdown格式返回，包含：
- 清晰的标题
- 项目符号列表
- 代码块（如果需要）
- 粗体强调重点`;
        break;
      case 'text':
        content = `请使用纯文本格式返回，保持：
- 简洁明了
- 段落分明
- 避免特殊符号`;
        break;
      case 'xml':
        content = `请使用XML格式返回：
\`\`\`xml
<response>
  <result>...</result>
  <confidence>0.85</confidence>
</response>
\`\`\``;
        break;
    }

    return this.createFixed(id, `${format}输出格式`, content, position);
  },

  /**
   * 创建质量检查追加提示词
   */
  createQualityCheck(
    id: string,
    checks: string[] = ['准确性', '完整性', '一致性'],
    position: 'after' = 'after'
  ): AppendPromptConfig {
    const content = `质量检查清单：
${checks.map(c => `- ${c}`).join('\n')}

请确保输出满足以上所有质量标准。`;

    return this.createFixed(id, '质量检查', content, position);
  }
};

/**
 * 拼接提示词工厂
 */
export const ConcatenatePromptFactory = {
  /**
   * 创建固定格式拼接提示词
   */
  createFixed(
    id: string,
    name: string,
    content: string,
    target: {
      promptId: string;
      variableName: string;
    },
    mode: 'prepend' | 'append' | 'replace' = 'replace'
  ): ConcatenatePromptConfig {
    return {
      id,
      name,
      format: 'fixed',
      content,
      target,
      mode,
      metadata: {
        version: '1.0.0',
        author: 'Factory',
        createdAt: new Date().toISOString()
      }
    };
  },

  /**
   * 创建模板格式拼接提示词
   */
  createTemplate(
    id: string,
    name: string,
    template: string,
    variables: VariableDefinition[],
    target: {
      promptId: string;
      variableName: string;
    },
    mode: 'prepend' | 'append' | 'replace' = 'replace'
  ): ConcatenatePromptConfig {
    return {
      id,
      name,
      format: 'template',
      template,
      variables,
      target,
      mode,
      metadata: {
        version: '1.0.0',
        author: 'Factory',
        createdAt: new Date().toISOString()
      }
    };
  },

  /**
   * 创建前置拼接提示词
   */
  createPrepend(
    id: string,
    name: string,
    content: string,
    target: {
      promptId: string;
      variableName: string;
    }
  ): ConcatenatePromptConfig {
    return this.createFixed(id, name, content, target, 'prepend');
  },

  /**
   * 创建后置拼接提示词
   */
  createAppend(
    id: string,
    name: string,
    content: string,
    target: {
      promptId: string;
      variableName: string;
    }
  ): ConcatenatePromptConfig {
    return this.createFixed(id, name, content, target, 'append');
  },

  /**
   * 创建替换拼接提示词
   */
  createReplace(
    id: string,
    name: string,
    content: string,
    target: {
      promptId: string;
      variableName: string;
    }
  ): ConcatenatePromptConfig {
    return this.createFixed(id, name, content, target, 'replace');
  },

  /**
   * 创建变量注入拼接提示词
   */
  createVariableInjection(
    id: string,
    variableName: string,
    value: string,
    target: {
      promptId: string;
      variableName: string;
    },
    mode: 'prepend' | 'append' | 'replace' = 'replace'
  ): ConcatenatePromptConfig {
    return this.createFixed(
      id,
      `注入变量${variableName}`,
      `{{${variableName}}}`,
      target,
      mode
    );
  }
};

/**
 * 快速创建组合
 */
export const PromptComposition = {
  /**
   * 创建简单问答组合
   */
  simpleQA: (language: string = '中文') => {
    return {
      system: SystemPromptFactory.createFixed(
        'simple-qa-system',
        '简单问答',
        `你是一位助手。
请用${language}简洁回答问题。`
      ),
      append: [
        AppendPromptFactory.createFormat(
          'simple-qa-format',
          '直接回答，不要多余解释'
        )
      ],
      concatenate: []
    };
  },

  /**
   * 创建代码生成组合
   */
  codeGeneration: (language: string, task: string) => {
    return {
      system: SystemPromptFactory.createCodeGenerator(
        'code-gen-system',
        language,
        'clean'
      ),
      append: [
        AppendPromptFactory.createStepByStep(
          'code-gen-steps',
          ['理解需求', '设计结构', '编写代码', '添加注释', '测试验证']
        ),
        AppendPromptFactory.createOutputFormat('code-gen-format', 'markdown')
      ],
      concatenate: []
    };
  },

  /**
   * 创建数据分析组合
   */
  dataAnalysis: (domain: string) => {
    return {
      system: SystemPromptFactory.createAnalyzer('analysis-system', domain),
      append: [
        AppendPromptFactory.createConstraints(
          'analysis-constraints',
          ['基于数据说话', '提供具体发现', '给出可操作建议']
        ),
        AppendPromptFactory.createQualityCheck('analysis-quality')
      ],
      concatenate: []
    };
  },

  /**
   * 创建创意写作组合
   */
  creativeWriting: (style: string) => {
    return {
      system: SystemPromptFactory.createFixed(
        'creative-system',
        '创意写作',
        `你是一位创意作家。
请创作${style}风格的内容。`
      ),
      append: [
        AppendPromptFactory.createExample(
          'creative-example',
          '示例：在一个遥远的星球上...'
        ),
        AppendPromptFactory.createFormat(
          'creative-format',
          '保持连贯性，包含生动描述'
        )
      ],
      concatenate: []
    };
  },

  /**
   * 创建带拼接的高级组合
   */
  advancedWithConcatenate: (
    role: string,
    task: string,
    extraData: string
  ) => {
    return {
      system: SystemPromptFactory.createTemplate(
        'advanced-system',
        '高级任务',
        `你是一位{{role}}。
任务：{{task}}
额外数据：{{extra_data}}`,
        [
          { name: 'role', type: 'string', required: true, default: role },
          { name: 'task', type: 'string', required: true, default: task },
          { name: 'extra_data', type: 'string', required: false }
        ]
      ),
      append: [
        AppendPromptFactory.createQualityCheck('advanced-quality')
      ],
      concatenate: [
        ConcatenatePromptFactory.createReplace(
          'advanced-concatenate',
          '注入额外数据',
          extraData,
          { promptId: 'advanced-system', variableName: 'extra_data' }
        )
      ]
    };
  }
};