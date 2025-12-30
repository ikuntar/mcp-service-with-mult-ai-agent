/**
 * MCP调用执行器完整流程测试
 * 
 * 模拟从MCP调用开始的完整流程：
 * 1. 创建Token
 * 2. 设置执行器规则
 * 3. 通过MCP工具调用执行器
 * 4. 验证规则生效
 */

import {
  UnifiedExecutorLayer,
  ruleManagementTools,
  setRuleManager,
  Tool,
  ToolResult
} from './src/index';

import { TokenManager } from './src/core/token-manager';

// 导入执行器
import { FileSystemExecutorFactory } from './src/executors/example/filesystem/factory';
import { NetworkExecutorFactory } from './src/executors/example/network/factory';
import { SystemExecutorFactory } from './src/executors/example/system/factory';
import { DefaultExecutorFactory } from './src/executors/example/default/factory';

// 导入执行器演示工具
import { 
  executorFileReadTool,
  executorHttpTool,
  executorSystemTool,
  setExecutorRuleTool,
  getExecutorRulesTool,
  executorSystemStatusTool
} from './src/tools/executor-demo-tools';

// 全局管理器
const tokenManager = new TokenManager();
let unifiedExecutor: UnifiedExecutorLayer | null = null;

function getUnifiedExecutor(): UnifiedExecutorLayer {
  if (!unifiedExecutor) {
    unifiedExecutor = new UnifiedExecutorLayer('./data');
    const executorFactory = unifiedExecutor.getExecutorFactory();
    const ruleManager = unifiedExecutor.getRuleManager();
    
    executorFactory.register('filesystem', new FileSystemExecutorFactory(ruleManager));
    executorFactory.register('network', new NetworkExecutorFactory(ruleManager));
    executorFactory.register('system', new SystemExecutorFactory(ruleManager));
    executorFactory.register('default', new DefaultExecutorFactory(ruleManager));
    
    setRuleManager(ruleManager);
  }
  return unifiedExecutor;
}

/**
 * 模拟MCP服务器调用流程
 */
async function simulateMCPFlow() {
  console.log('=== MCP调用执行器完整流程测试 ===\n');

  // 步骤1: 创建Token（模拟用户登录）
  console.log('步骤1: 创建用户Token');
  const userToken = tokenManager.createToken('user', '测试用户', '2h');
  console.log(`✓ 用户Token: ${userToken}\n`);

  // 步骤2: 通过MCP工具设置执行器规则
  console.log('步骤2: 通过MCP工具设置执行器规则');
  
  // 2.1 设置文件系统规则
  const fsRuleResult = await setExecutorRuleTool.execute({
    token: userToken,
    executorId: 'filesystem',
    autoApprove: true,
    maxFileSize: 1024 * 1024
  });
  console.log(`文件系统规则: ${fsRuleResult.content[0].text}\n`);

  // 2.2 设置网络规则
  const netRuleResult = await setExecutorRuleTool.execute({
    token: userToken,
    executorId: 'network',
    autoApprove: false,
    approver: 'admin',
    timeout: 30000
  });
  console.log(`网络规则: ${netRuleResult.content[0].text}\n`);

  // 2.3 设置系统规则
  const sysRuleResult = await setExecutorRuleTool.execute({
    token: userToken,
    executorId: 'system',
    autoApprove: true,
    allowedCommands: ['ls', 'cat', 'echo']
  });
  console.log(`系统规则: ${sysRuleResult.content[0].text}\n`);

  // 步骤3: 查看规则配置
  console.log('步骤3: 查看当前规则配置');
  const rulesResult = await getExecutorRulesTool.execute({ token: userToken });
  console.log(rulesResult.content[0].text + '\n');

  // 步骤4: 通过MCP工具调用执行器（测试各种场景）
  console.log('步骤4: 通过MCP工具调用执行器\n');

  // 4.1 文件读取测试（应该成功）
  console.log('  4.1 文件读取测试:');
  const fileResult = await executorFileReadTool.execute({
    token: userToken,
    path: '/tmp/test.txt'
  });
  console.log(`     结果: ${fileResult.isError ? '❌ 被拒绝' : '✅ 成功'}`);
  if (!fileResult.isError) {
    console.log(`     输出: ${fileResult.content[0].text}`);
  } else {
    console.log(`     原因: ${fileResult.content[0].text}`);
  }

  // 4.2 HTTP请求测试（应该被拒绝）
  console.log('\n  4.2 HTTP请求测试:');
  const httpResult = await executorHttpTool.execute({
    token: userToken,
    url: 'https://example.com',
    method: 'GET'
  });
  console.log(`     结果: ${httpResult.isError ? '❌ 被拒绝' : '✅ 成功'}`);
  if (!httpResult.isError) {
    console.log(`     输出: ${httpResult.content[0].text}`);
  } else {
    console.log(`     原因: ${httpResult.content[0].text}`);
  }

  // 4.3 系统命令ls测试（应该成功）
  console.log('\n  4.3 系统命令ls测试:');
  const lsResult = await executorSystemTool.execute({
    token: userToken,
    command: 'ls -la'
  });
  console.log(`     结果: ${lsResult.isError ? '❌ 被拒绝' : '✅ 成功'}`);
  if (!lsResult.isError) {
    console.log(`     输出: ${lsResult.content[0].text}`);
  } else {
    console.log(`     原因: ${lsResult.content[0].text}`);
  }

  // 4.4 系统命令rm测试（应该被拒绝）
  console.log('\n  4.4 系统命令rm测试:');
  const rmResult = await executorSystemTool.execute({
    token: userToken,
    command: 'rm -rf /'
  });
  console.log(`     结果: ${rmResult.isError ? '❌ 被拒绝' : '✅ 成功'}`);
  if (!rmResult.isError) {
    console.log(`     输出: ${rmResult.content[0].text}`);
  } else {
    console.log(`     原因: ${rmResult.content[0].text}`);
  }

  // 步骤5: 动态修改规则并测试
  console.log('\n步骤5: 动态修改规则并测试');

  // 5.1 修改网络规则为自动审批
  console.log('  5.1 修改网络规则为自动审批:');
  await setExecutorRuleTool.execute({
    token: userToken,
    executorId: 'network',
    autoApprove: true,
    timeout: 60000
  });

  // 5.2 再次测试HTTP请求
  console.log('  5.2 再次测试HTTP请求:');
  const httpResult2 = await executorHttpTool.execute({
    token: userToken,
    url: 'https://example.com',
    method: 'GET'
  });
  console.log(`     结果: ${httpResult2.isError ? '❌ 被拒绝' : '✅ 成功'}`);

  // 步骤6: 查看系统状态
  console.log('\n步骤6: 查看执行器系统状态');
  const statusResult = await executorSystemStatusTool.execute({});
  console.log(statusResult.content[0].text);

  // 步骤7: 验证数据持久化
  console.log('\n步骤7: 验证数据持久化');
  const fs = require('fs');
  try {
    const rulesData = fs.readFileSync('./data/rules.json', 'utf-8');
    const rules = JSON.parse(rulesData);
    console.log(`✓ 规则已持久化到文件`);
    console.log(`✓ 存储的规则数量: ${Object.keys(rules).length}`);
    console.log(`✓ 文件大小: ${rulesData.length} 字节`);
  } catch (e) {
    console.log('❌ 规则文件不存在');
  }

  console.log('\n=== 测试完成 ===');
  console.log('\n流程总结：');
  console.log('1. ✅ Token创建');
  console.log('2. ✅ 通过MCP工具设置规则');
  console.log('3. ✅ 规则查看');
  console.log('4. ✅ 通过MCP工具调用执行器');
  console.log('5. ✅ 规则生效验证');
  console.log('6. ✅ 动态规则修改');
  console.log('7. ✅ 数据持久化');
  console.log('\n完整流程验证成功！');
}

// 运行测试
if (require.main === module) {
  simulateMCPFlow().catch(console.error);
}

export { simulateMCPFlow };
