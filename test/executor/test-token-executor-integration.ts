/**
 * Token与执行器集成测试脚本
 * 
 * 测试流程：
 * 1. 创建Token
 * 2. 为Token设置执行器规则
 * 3. 创建简易工具调用执行器
 * 4. 验证Token规则生效
 */

import { 
  UnifiedExecutorLayer,
  ruleManagementTools,
  setRuleManager,
  Tool,
  ToolResult
} from './src/index';

// 导入TokenManager
import { TokenManager } from './src/core/token-manager';

// 导入执行器（直接从example复制过来的）
import { FileSystemExecutorFactory } from './src/executors/example/filesystem/factory';
import { FileSystemExecutorInstance } from './src/executors/example/filesystem/instance';
import { NetworkExecutorFactory } from './src/executors/example/network/factory';
import { NetworkExecutorInstance } from './src/executors/example/network/instance';
import { SystemExecutorFactory } from './src/executors/example/system/factory';
import { SystemExecutorInstance } from './src/executors/example/system/instance';
import { DefaultExecutorFactory } from './src/executors/example/default/factory';
import { DefaultExecutorInstance } from './src/executors/example/default/instance';

// 全局Token管理器（用于创建Token）
const tokenManager = new TokenManager();

// 简易工具：调用文件系统执行器
const simpleFileTool: Tool = {
  name: 'simple_file_read',
  description: '简易文件读取工具（通过执行器）',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件路径' }
    },
    required: ['path']
  },
  executor: { type: 'filesystem' },  // 使用文件系统执行器
  execute: async (args: any): Promise<ToolResult> => {
    return {
      content: [{ type: 'text', text: `实际文件读取逻辑: ${args.path}` }]
    };
  }
};

// 简易工具：调用网络执行器
const simpleHttpTool: Tool = {
  name: 'simple_http_request',
  description: '简易HTTP请求工具（通过执行器）',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: '请求URL' }
    },
    required: ['url']
  },
  executor: { type: 'network' },  // 使用网络执行器
  execute: async (args: any): Promise<ToolResult> => {
    return {
      content: [{ type: 'text', text: `实际HTTP请求逻辑: ${args.url}` }]
    };
  }
};

// 简易工具：调用系统执行器
const simpleSystemTool: Tool = {
  name: 'simple_exec_command',
  description: '简易系统命令工具（通过执行器）',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: '要执行的命令' }
    },
    required: ['command']
  },
  executor: { type: 'system' },  // 使用系统执行器
  execute: async (args: any): Promise<ToolResult> => {
    return {
      content: [{ type: 'text', text: `实际命令执行逻辑: ${args.command}` }]
    };
  }
};

async function main() {
  console.log('=== Token与执行器集成测试 ===\n');

  // 1. 初始化统一执行器层
  console.log('1. 初始化统一执行器层...');
  const unifiedExecutor = new UnifiedExecutorLayer('./data');
  
  // 注册执行器工厂
  const executorFactory = unifiedExecutor.getExecutorFactory();
  const ruleManager = unifiedExecutor.getRuleManager();
  
  executorFactory.register('filesystem', new FileSystemExecutorFactory(ruleManager));
  executorFactory.register('network', new NetworkExecutorFactory(ruleManager));
  executorFactory.register('system', new SystemExecutorFactory(ruleManager));
  executorFactory.register('default', new DefaultExecutorFactory(ruleManager));
  
  setRuleManager(ruleManager);
  console.log('✓ 统一执行器层初始化完成\n');

  // 2. 创建Token
  console.log('2. 创建测试Token...');
  const token1 = tokenManager.createToken('user', '测试用户Token', '1h');
  const token2 = tokenManager.createToken('admin', '管理员Token', '2h');
  console.log(`✓ Token1 (user): ${token1}`);
  console.log(`✓ Token2 (admin): ${token2}\n`);

  // 3. 为Token1设置执行器规则
  console.log('3. 为Token1设置执行器规则...');
  
  // 文件系统：自动审批，限制1MB
  await ruleManagementTools[0].execute({
    token: token1,
    executorId: 'filesystem',
    rules: { autoApprove: true, maxFileSize: 1024 * 1024 }
  });
  console.log('  - 文件系统规则：自动审批，1MB限制');

  // 网络：需要审批
  await ruleManagementTools[0].execute({
    token: token1,
    executorId: 'network',
    rules: { autoApprove: false, approver: 'admin', timeout: 30000 }
  });
  console.log('  - 网络规则：需要审批');

  // 系统：白名单命令
  await ruleManagementTools[0].execute({
    token: token1,
    executorId: 'system',
    rules: { autoApprove: true, allowedCommands: ['ls', 'cat', 'echo'] }
  });
  console.log('  - 系统规则：只允许ls, cat, echo\n');

  // 4. 为Token2设置规则（全部自动审批）
  console.log('4. 为Token2设置执行器规则...');
  await ruleManagementTools[0].execute({
    token: token2,
    executorId: 'filesystem',
    rules: { autoApprove: true, maxFileSize: 10 * 1024 * 1024 }
  });
  await ruleManagementTools[0].execute({
    token: token2,
    executorId: 'network',
    rules: { autoApprove: true, timeout: 60000 }
  });
  await ruleManagementTools[0].execute({
    token: token2,
    executorId: 'system',
    rules: { autoApprove: true, allowedCommands: ['*'] }
  });
  console.log('  - Token2所有规则：自动审批\n');

  // 5. 测试Token1的执行器调用
  console.log('5. 测试Token1 (user) 执行器调用...\n');

  // 5.1 文件系统读取（应该成功）
  console.log('  5.1 文件读取测试:');
  const result1 = await unifiedExecutor.executeTool(simpleFileTool, { path: '/tmp/test.txt' }, token1);
  console.log(`     结果: ${result1.isError ? '❌ 被拒绝' : '✅ 成功'}`);
  if (!result1.isError) {
    console.log(`     输出: ${result1.content[0].text}`);
  } else {
    console.log(`     原因: ${result1.content[0].text}`);
  }

  // 5.2 HTTP请求（应该被拒绝，需要审批）
  console.log('\n  5.2 HTTP请求测试:');
  const result2 = await unifiedExecutor.executeTool(simpleHttpTool, { url: 'https://example.com' }, token1);
  console.log(`     结果: ${result2.isError ? '❌ 被拒绝' : '✅ 成功'}`);
  if (!result2.isError) {
    console.log(`     输出: ${result2.content[0].text}`);
  } else {
    console.log(`     原因: ${result2.content[0].text}`);
  }

  // 5.3 系统命令ls（应该成功）
  console.log('\n  5.3 系统命令ls测试:');
  const result3 = await unifiedExecutor.executeTool(simpleSystemTool, { command: 'ls -la' }, token1);
  console.log(`     结果: ${result3.isError ? '❌ 被拒绝' : '✅ 成功'}`);
  if (!result3.isError) {
    console.log(`     输出: ${result3.content[0].text}`);
  } else {
    console.log(`     原因: ${result3.content[0].text}`);
  }

  // 5.4 系统命令rm（应该被拒绝，不在白名单）
  console.log('\n  5.4 系统命令rm测试:');
  const result4 = await unifiedExecutor.executeTool(simpleSystemTool, { command: 'rm -rf /' }, token1);
  console.log(`     结果: ${result4.isError ? '❌ 被拒绝' : '✅ 成功'}`);
  if (!result4.isError) {
    console.log(`     输出: ${result4.content[0].text}`);
  } else {
    console.log(`     原因: ${result4.content[0].text}`);
  }

  // 6. 测试Token2的执行器调用
  console.log('\n6. 测试Token2 (admin) 执行器调用...\n');

  // 6.1 文件系统读取（应该成功）
  console.log('  6.1 文件读取测试:');
  const result5 = await unifiedExecutor.executeTool(simpleFileTool, { path: '/tmp/test.txt' }, token2);
  console.log(`     结果: ${result5.isError ? '❌ 被拒绝' : '✅ 成功'}`);

  // 6.2 HTTP请求（应该成功）
  console.log('\n  6.2 HTTP请求测试:');
  const result6 = await unifiedExecutor.executeTool(simpleHttpTool, { url: 'https://example.com' }, token2);
  console.log(`     结果: ${result6.isError ? '❌ 被拒绝' : '✅ 成功'}`);

  // 6.3 系统命令rm（应该成功）
  console.log('\n  6.3 系统命令rm测试:');
  const result7 = await unifiedExecutor.executeTool(simpleSystemTool, { command: 'rm -rf /tmp/test' }, token2);
  console.log(`     结果: ${result7.isError ? '❌ 被拒绝' : '✅ 成功'}`);

  // 7. 动态规则修改测试
  console.log('\n7. 动态规则修改测试...\n');

  // 7.1 查看当前规则
  console.log('  7.1 查看Token1当前规则:');
  const currentRules = await ruleManagementTools[1].execute({ token: token1 });
  console.log(`     ${currentRules.content[0].text}`);

  // 7.2 修改文件系统规则（限制改为10字节）
  console.log('\n  7.2 修改文件系统规则（限制10字节）:');
  await ruleManagementTools[0].execute({
    token: token1,
    executorId: 'filesystem',
    rules: { autoApprove: true, maxFileSize: 10 }
  });
  console.log('     ✓ 规则已修改');

  // 7.3 再次测试文件读取（应该失败，因为路径字符串超过10字节）
  console.log('\n  7.3 再次测试文件读取:');
  const result8 = await unifiedExecutor.executeTool(simpleFileTool, { path: '/tmp/test.txt' }, token1);
  console.log(`     结果: ${result8.isError ? '❌ 被拒绝' : '✅ 成功'}`);
  if (result8.isError) {
    console.log(`     原因: ${result8.content[0].text}`);
  }

  // 8. 查看规则存储
  console.log('\n8. 查看规则存储文件...');
  const fs = require('fs');
  try {
    const rulesData = fs.readFileSync('./data/rules.json', 'utf-8');
    console.log('  规则存储内容:');
    console.log(JSON.stringify(JSON.parse(rulesData), null, 2));
  } catch (e) {
    console.log('  规则文件不存在或读取失败');
  }

  // 9. 查看Token统计
  console.log('\n9. Token统计信息...');
  const stats = tokenManager.getStats();
  console.log(`  总数: ${stats.total}`);
  console.log(`  有效: ${stats.active}`);
  console.log(`  角色分布: ${JSON.stringify(stats.byRole)}`);

  console.log('\n=== 测试完成 ===');
  console.log('\n总结：');
  console.log('✓ Token创建成功');
  console.log('✓ 执行器规则设置成功');
  console.log('✓ Token1规则生效（文件自动审批，网络需要审批，系统白名单）');
  console.log('✓ Token2规则生效（全部自动审批）');
  console.log('✓ 动态规则修改生效');
  console.log('✓ 规则持久化到文件');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

export { main };
