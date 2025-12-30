/**
 * 执行器系统测试
 * 演示完整的执行器架构工作流程
 */

import { 
  UnifiedExecutorLayer, 
  ruleManagementTools,
  setRuleManager,
  Tool,
  ToolResult
} from './src/index';

// 模拟Token验证函数
function validateToken(token: string): boolean {
  return !!(token && token.startsWith('token_'));
}

// 示例工具1：文件读取工具（使用文件系统执行器）
const fileReadTool: Tool = {
  name: 'file_read',
  description: '读取文件内容',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件路径' }
    },
    required: ['path']
  },
  executor: { type: 'filesystem' },  // 明确声明使用文件系统执行器
  execute: async (args: any): Promise<ToolResult> => {
    // 这个execute方法不会被直接调用，而是由执行器实例调用
    return {
      content: [{ type: 'text', text: '实际文件读取逻辑' }]
    };
  }
};

// 示例工具2：HTTP请求工具（使用网络执行器）
const httpTool: Tool = {
  name: 'http_request',
  description: '发送HTTP请求',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: '请求URL' },
      method: { type: 'string', description: '请求方法' }
    },
    required: ['url']
  },
  executor: { type: 'network' },  // 明确声明使用网络执行器
  execute: async (args: any): Promise<ToolResult> => {
    return {
      content: [{ type: 'text', text: '实际HTTP请求逻辑' }]
    };
  }
};

// 示例工具3：系统命令工具（使用系统执行器）
const execTool: Tool = {
  name: 'exec_command',
  description: '执行系统命令',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: '要执行的命令' }
    },
    required: ['command']
  },
  executor: { type: 'system' },  // 明确声明使用系统执行器
  execute: async (args: any): Promise<ToolResult> => {
    return {
      content: [{ type: 'text', text: '实际命令执行逻辑' }]
    };
  }
};

// 示例工具4：普通工具（使用默认执行器）
const echoTool: Tool = {
  name: 'echo',
  description: '回显消息',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string', description: '消息内容' }
    },
    required: ['message']
  },
  // 不声明executor，会使用默认执行器
  execute: async (args: any): Promise<ToolResult> => {
    return {
      content: [{ type: 'text', text: `Echo: ${args.message}` }]
    };
  }
};

// 示例工具5：自动推断执行器的工具
const fileWriteTool: Tool = {
  name: 'file_write',
  description: '写入文件',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      content: { type: 'string' }
    },
    required: ['path', 'content']
  },
  // 不声明executor，但文件名以file_开头，会自动推断为filesystem
  execute: async (args: any): Promise<ToolResult> => {
    return {
      content: [{ type: 'text', text: '实际文件写入逻辑' }]
    };
  }
};

async function main() {
  console.log('=== 执行器系统测试 ===\n');

  // 1. 初始化统一执行器层
  console.log('1. 初始化统一执行器层...');
  const unifiedExecutor = new UnifiedExecutorLayer('./data');
  
  // 为规则管理工具设置管理器
  setRuleManager(unifiedExecutor.getRuleManager());
  console.log('✓ 统一执行器层初始化完成\n');

  // 2. 设置规则
  console.log('2. 设置Token规则...');
  
  // Token1: 文件系统自动审批，网络需要审批，系统不允许
  const token1 = 'token_user1';
  
  // 通过规则管理工具设置规则
  const setRuleResult1 = await ruleManagementTools[0].execute({
    token: token1,
    executorId: 'filesystem',
    rules: { autoApprove: true, maxFileSize: 1024 * 1024 }
  });
  console.log('  - 文件系统规则:', setRuleResult1.content[0].text);

  const setRuleResult2 = await ruleManagementTools[0].execute({
    token: token1,
    executorId: 'network',
    rules: { autoApprove: false, approver: 'admin', timeout: 30000 }
  });
  console.log('  - 网络规则:', setRuleResult2.content[0].text);

  const setRuleResult3 = await ruleManagementTools[0].execute({
    token: token1,
    executorId: 'system',
    rules: { autoApprove: false, approver: 'security-team', allowedCommands: ['ls', 'cat'] }
  });
  console.log('  - 系统规则:', setRuleResult3.content[0].text);

  // Token2: 所有操作自动审批
  const token2 = 'token_user2';
  const setRuleResult4 = await ruleManagementTools[0].execute({
    token: token2,
    executorId: 'default',
    rules: { autoApprove: true, maxCalls: 1000 }
  });
  console.log('  - Token2默认规则:', setRuleResult4.content[0].text);
  console.log('✓ 规则设置完成\n');

  // 3. 查看规则
  console.log('3. 查看Token1的所有规则...');
  const getRulesResult = await ruleManagementTools[1].execute({ token: token1 });
  console.log(getRulesResult.content[0].text);
  console.log();

  // 4. 测试工具执行
  console.log('4. 测试工具执行...\n');

  // 测试1: Token1执行文件读取（应该成功）
  console.log('测试1: Token1执行文件读取');
  const result1 = await unifiedExecutor.executeTool(fileReadTool, { path: '/tmp/test.txt' }, token1);
  console.log('  结果:', result1.content[0].text);
  console.log('  状态:', result1.isError ? '❌ 被拒绝' : '✅ 成功');
  console.log();

  // 测试2: Token1执行HTTP请求（应该被拒绝，需要审批）
  console.log('测试2: Token1执行HTTP请求');
  const result2 = await unifiedExecutor.executeTool(httpTool, { url: 'https://example.com' }, token1);
  console.log('  结果:', result2.content[0].text);
  console.log('  状态:', result2.isError ? '❌ 被拒绝' : '✅ 成功');
  console.log();

  // 测试3: Token1执行系统命令（不在白名单，应该被拒绝）
  console.log('测试3: Token1执行系统命令（rm）');
  const result3 = await unifiedExecutor.executeTool(execTool, { command: 'rm -rf /' }, token1);
  console.log('  结果:', result3.content[0].text);
  console.log('  状态:', result3.isError ? '❌ 被拒绝' : '✅ 成功');
  console.log();

  // 测试4: Token1执行白名单命令（应该成功）
  console.log('测试4: Token1执行系统命令（ls）');
  const result4 = await unifiedExecutor.executeTool(execTool, { command: 'ls -la' }, token1);
  console.log('  结果:', result4.content[0].text);
  console.log('  状态:', result4.isError ? '❌ 被拒绝' : '✅ 成功');
  console.log();

  // 测试5: Token2执行普通工具（应该成功）
  console.log('测试5: Token2执行Echo工具');
  const result5 = await unifiedExecutor.executeTool(echoTool, { message: 'Hello World' }, token2);
  console.log('  结果:', result5.content[0].text);
  console.log('  状态:', result5.isError ? '❌ 被拒绝' : '✅ 成功');
  console.log();

  // 测试6: 自动推断执行器（file_write -> filesystem）
  console.log('测试6: Token1执行file_write（自动推断为filesystem）');
  const result6 = await unifiedExecutor.executeTool(fileWriteTool, { path: '/tmp/out.txt', content: 'data' }, token1);
  console.log('  结果:', result6.content[0].text);
  console.log('  状态:', result6.isError ? '❌ 被拒绝' : '✅ 成功');
  console.log();

  // 5. 测试规则修改
  console.log('5. 测试动态规则修改...');
  
  // 修改Token1的文件系统规则，限制文件大小
  await ruleManagementTools[0].execute({
    token: token1,
    executorId: 'filesystem',
    rules: { autoApprove: true, maxFileSize: 10 }  // 限制为10字节
  });

  console.log('  已将Token1的文件大小限制改为10字节');
  
  // 再次尝试文件读取（应该成功，因为读取操作不涉及内容大小）
  const result7 = await unifiedExecutor.executeTool(fileReadTool, { path: '/tmp/test.txt' }, token1);
  console.log('  文件读取:', result7.isError ? '❌' : '✅');
  
  // 尝试文件写入大内容（应该失败）
  const result8 = await unifiedExecutor.executeTool(fileWriteTool, { path: '/tmp/out.txt', content: '这是一个很长的内容，超过10字节' }, token1);
  console.log('  文件写入大内容:', result8.isError ? '❌ 被拒绝' : '✅ 成功');
  console.log('  拒绝原因:', result8.content[0].text);
  console.log();

  // 6. 测试默认规则
  console.log('6. 测试默认规则...');
  
  // 查看文件系统的默认规则
  const defaultRuleResult = await ruleManagementTools[4].execute({ executorId: 'filesystem' });
  console.log(defaultRuleResult.content[0].text);
  console.log();

  // 7. 测试未设置规则的Token
  console.log('7. 测试未设置规则的Token...');
  const unknownToken = 'token_unknown';
  
  // 文件读取（应该使用默认规则，自动审批）
  const result9 = await unifiedExecutor.executeTool(fileReadTool, { path: '/tmp/test.txt' }, unknownToken);
  console.log('  未设置规则的Token执行文件读取:', result9.isError ? '❌' : '✅');
  console.log();

  // 8. 删除规则
  console.log('8. 删除规则...');
  const deleteResult = await ruleManagementTools[2].execute({ token: token1, executorId: 'system' });
  console.log(deleteResult.content[0].text);
  
  // 验证删除
  const verifyResult = await ruleManagementTools[1].execute({ token: token1 });
  console.log('  删除后Token1的规则:', verifyResult.content[0].text);
  console.log();

  console.log('=== 测试完成 ===');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

export { main };
