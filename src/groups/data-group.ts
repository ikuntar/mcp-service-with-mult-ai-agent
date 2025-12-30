import { Tool, ToolResult } from '../types';

/**
 * 数据处理工具组
 * 演示分组管理架构：逻辑相关的工具集合
 */

/**
 * 过滤工具 - 根据条件过滤数组数据
 */
export const filterTool: Tool = {
  name: 'data_filter',
  description: '根据条件过滤数组数据',
  groups: ['data-group', 'sensitive'],
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        description: '要过滤的数据数组'
      },
      field: {
        type: 'string',
        description: '要过滤的字段名'
      },
      operator: {
        type: 'string',
        description: '比较操作符: eq, neq, gt, gte, lt, lte, contains',
        enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains']
      },
      value: {
        description: '比较值',
        anyOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' }
        ]
      }
    },
    required: ['data', 'field', 'operator', 'value']
  },
  execute: async (args): Promise<ToolResult> => {
    const { data, field, operator, value } = args;
    
    if (!Array.isArray(data)) {
      throw new Error('data必须是数组');
    }

    const filtered = data.filter(item => {
      const itemValue = item[field];
      
      switch (operator) {
        case 'eq':
          return itemValue === value;
        case 'neq':
          return itemValue !== value;
        case 'gt':
          return itemValue > value;
        case 'gte':
          return itemValue >= value;
        case 'lt':
          return itemValue < value;
        case 'lte':
          return itemValue <= value;
        case 'contains':
          return String(itemValue).includes(String(value));
        default:
          return false;
      }
    });

    return {
      content: [{
        type: 'text',
        text: `过滤结果 (${filtered.length}/${data.length} 条):\n${JSON.stringify(filtered, null, 2)}`
      }],
      structuredContent: {
        original: data.length,
        filtered: filtered.length,
        result: filtered
      }
    };
  }
};

/**
 * 排序工具 - 对数组进行排序
 */
export const sortTool: Tool = {
  name: 'data_sort',
  description: '对数组进行排序',
  groups: ['data-group'],
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        description: '要排序的数据数组'
      },
      field: {
        type: 'string',
        description: '排序字段名'
      },
      order: {
        type: 'string',
        description: '排序顺序',
        enum: ['asc', 'desc'],
        default: 'asc'
      },
      numeric: {
        type: 'boolean',
        description: '是否按数值排序',
        default: false
      }
    },
    required: ['data', 'field']
  },
  execute: async (args): Promise<ToolResult> => {
    const { data, field, order = 'asc', numeric = false } = args;
    
    if (!Array.isArray(data)) {
      throw new Error('data必须是数组');
    }

    const sorted = [...data].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      if (numeric) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return {
      content: [{
        type: 'text',
        text: `排序结果 (${sorted.length} 条):\n${JSON.stringify(sorted, null, 2)}`
      }],
      structuredContent: {
        order,
        field,
        result: sorted
      }
    };
  }
};

/**
 * 转换工具 - 对数组元素进行转换
 */
export const transformTool: Tool = {
  name: 'data_transform',
  description: '对数组元素进行转换操作',
  groups: ['data-group'],
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        description: '要转换的数据数组'
      },
      operation: {
        type: 'string',
        description: '转换操作',
        enum: ['upper', 'lower', 'capitalize', 'length', 'parseNumber', 'stringify']
      },
      field: {
        type: 'string',
        description: '要转换的字段名（可选，不指定则转换整个元素）'
      }
    },
    required: ['data', 'operation']
  },
  execute: async (args): Promise<ToolResult> => {
    const { data, operation, field } = args;
    
    if (!Array.isArray(data)) {
      throw new Error('data必须是数组');
    }

    const applyTransformation = (value: any, op: string): any => {
      switch (op) {
        case 'upper':
          return String(value).toUpperCase();
        case 'lower':
          return String(value).toLowerCase();
        case 'capitalize':
          return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
        case 'length':
          return String(value).length;
        case 'parseNumber':
          return Number(value);
        case 'stringify':
          return JSON.stringify(value);
        default:
          return value;
      }
    };

    const transformed = data.map(item => {
      if (field) {
        // 转换指定字段
        const value = item[field];
        const transformedValue = applyTransformation(value, operation);
        return { ...item, [field]: transformedValue };
      } else {
        // 转换整个元素
        return applyTransformation(item, operation);
      }
    });

    return {
      content: [{
        type: 'text',
        text: `转换结果 (${transformed.length} 条):\n${JSON.stringify(transformed, null, 2)}`
      }],
      structuredContent: {
        operation,
        field,
        result: transformed
      }
    };
  }
};

/**
 * 聚合工具 - 计算统计数据
 */
export const aggregateTool: Tool = {
  name: 'data_aggregate',
  description: '计算数组的统计数据（总和、平均值、最大值、最小值）',
  groups: ['data-group'],
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        description: '要计算的数据数组'
      },
      field: {
        type: 'string',
        description: '要计算的字段名'
      },
      operations: {
        type: 'array',
        description: '要执行的计算操作',
        items: {
          type: 'string',
          enum: ['sum', 'avg', 'max', 'min', 'count']
        }
      }
    },
    required: ['data', 'field']
  },
  execute: async (args): Promise<ToolResult> => {
    const { data, field, operations = ['sum', 'avg', 'max', 'min', 'count'] } = args;
    
    if (!Array.isArray(data)) {
      throw new Error('data必须是数组');
    }

    const values = data.map(item => Number(item[field])).filter(v => !isNaN(v));
    
    const results: Record<string, number> = {};
    
    if (operations.includes('sum')) {
      results.sum = values.reduce((a, b) => a + b, 0);
    }
    if (operations.includes('avg')) {
      results.avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }
    if (operations.includes('max')) {
      results.max = Math.max(...values);
    }
    if (operations.includes('min')) {
      results.min = Math.min(...values);
    }
    if (operations.includes('count')) {
      results.count = values.length;
    }

    return {
      content: [{
        type: 'text',
        text: `聚合统计结果:\n${JSON.stringify(results, null, 2)}`
      }],
      structuredContent: results
    };
  }
};

/**
 * 数据处理工具数组
 */
export const dataTools = [filterTool, sortTool, transformTool, aggregateTool];