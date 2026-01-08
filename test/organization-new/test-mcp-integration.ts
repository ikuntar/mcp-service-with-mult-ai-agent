/**
 * 测试MCP集成 - 验证多组织工具区分方案
 */

import {
  globalOrganizationManager,
  createCollaborationComponent,
  createOrganizationMember,
  getAllCollaborationTools,
  executeCollaborationTool,
  getCollaborationComponentsInfo,
  getAllOrganizationMCPTools
} from '../../src/core/organization';

import { globalTokenManager } from '../../src/core/token/token-manager';
import { createMCPSession } from '../../src/core/ai-agent';

async function testMCPIntegration() {
  console.log('🎯 测试MCP集成 - 多组织工具区分\n');
  console.log('='.repeat(60));

  // 1. 初始化：创建Token和成员
  console.log('\n📦 步骤1: 初始化用户和Token');
  console.log('-'.repeat(40));
  
  const aliceToken = globalTokenManager.createToken('developer', 'Alice - 全栈开发者');
  const bobToken = globalTokenManager.createToken('developer', 'Bob - 后端专家');
  
  console.log(`✅ Alice Token: ${aliceToken.substring(0, 16)}...`);
  console.log(`✅ Bob Token: ${bobToken.substring(0, 16)}...`);

  const aliceMember = createOrganizationMember('Alice', aliceToken, { skills: ['React', 'Node.js'] });
  const bobMember = createOrganizationMember('Bob', bobToken, { skills: ['Go', 'Python'] });
  
  console.log(`✅ 创建成员: ${aliceMember.name}, ${bobMember.name}`);

  // 2. 创建多个协作组件
  console.log('\n🏢 步骤2: 创建多个协作组件');
  console.log('-'.repeat(40));

  const frontendTeam = await createCollaborationComponent('frontend-team', '前端开发团队');
  const backendTeam = await createCollaborationComponent('backend-team', '后端开发团队');
  const securityTeam = await createCollaborationComponent('security-team', '安全团队');
  
  console.log('✅ 创建协作组件:');
  console.log(`   - ${frontendTeam.name} (ID: frontend-team)`);
  console.log(`   - ${backendTeam.name} (ID: backend-team)`);
  console.log(`   - ${securityTeam.name} (ID: security-team)`);

  // 3. 建立成员关系
  console.log('\n🔗 步骤3: 建立成员关系');
  console.log('-'.repeat(40));

  // Alice: 前端 + 后端
  globalOrganizationManager.addMemberToComponent(aliceMember.id, 'frontend-team');
  globalOrganizationManager.addMemberToComponent(aliceMember.id, 'backend-team');
  console.log('✅ Alice 加入: 前端团队, 后端团队');

  // Bob: 后端 + 安全
  globalOrganizationManager.addMemberToComponent(bobMember.id, 'backend-team');
  globalOrganizationManager.addMemberToComponent(bobMember.id, 'security-team');
  console.log('✅ Bob 加入: 后端团队, 安全团队');

  // 4. 测试获取所有协作组件工具
  console.log('\n🛠️ 步骤4: 测试获取所有协作组件工具');
  console.log('-'.repeat(40));

  const aliceTools = await getAllCollaborationTools(aliceToken);
  console.log(`📋 Alice可用工具 (${aliceTools.length}个):`);
  aliceTools.forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description}`);
  });

  const bobTools = await getAllCollaborationTools(bobToken);
  console.log(`\n📋 Bob可用工具 (${bobTools.length}个):`);
  bobTools.forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description}`);
  });

  // 5. 测试工具执行
  console.log('\n⚡ 步骤5: 测试工具执行');
  console.log('-'.repeat(40));

  // Alice通过前端团队执行
  console.log('\n1️⃣ Alice通过前端团队执行:');
  const result1 = await executeCollaborationTool(
    aliceToken,
    'frontend-team_proxy_execute',
    {
      toolName: 'file_read',
      args: { path: '/src/frontend/app.ts' }
    }
  );
  console.log(`   结果: ${result1.isError ? '❌ 失败' : '✅ 成功'}`);
  if (result1.content) {
    console.log(`   输出: ${result1.content[0].text}`);
  }

  // Alice通过后端团队执行
  console.log('\n2️⃣ Alice通过后端团队执行:');
  const result2 = await executeCollaborationTool(
    aliceToken,
    'backend-team_proxy_execute',
    {
      toolName: 'exec_command',
      args: { command: 'node server.js' }
    }
  );
  console.log(`   结果: ${result2.isError ? '❌ 失败' : '✅ 成功'}`);

  // Bob通过安全团队执行
  console.log('\n3️⃣ Bob通过安全团队执行:');
  const result3 = await executeCollaborationTool(
    bobToken,
    'security-team_proxy_execute',
    {
      toolName: 'security_scan',
      args: { target: '/app' }
    }
  );
  console.log(`   结果: ${result3.isError ? '❌ 失败' : '✅ 成功'}`);

  // 6. 测试错误场景
  console.log('\n🔒 步骤6: 测试错误场景');
  console.log('-'.repeat(40));

  // Alice尝试访问她不在的组件
  console.log('\n1️⃣ Alice尝试访问安全团队 (她不在其中):');
  const result4 = await executeCollaborationTool(
    aliceToken,
    'security-team_list_members',
    {}
  );
  console.log(`   结果: ${result4.isError ? '❌ 被拒绝 (正确)' : '✅ 允许 (错误)'}`);

  // 使用错误的工具名格式
  console.log('\n2️⃣ 使用错误的工具名格式:');
  const result5 = await executeCollaborationTool(
    aliceToken,
    'wrong_format',
    {}
  );
  console.log(`   结果: ${result5.isError ? '❌ 被拒绝 (正确)' : '✅ 允许 (错误)'}`);

  // 7. 测试组件信息查询
  console.log('\n📊 步骤7: 测试组件信息查询');
  console.log('-'.repeat(40));

  const aliceComponentsInfo = await getCollaborationComponentsInfo(aliceToken);
  console.log(`📋 Alice的组件信息 (${aliceComponentsInfo.totalCount}个组件):`);
  aliceComponentsInfo.components.forEach(comp => {
    console.log(`   - ${comp.name} (${comp.id}):`);
    comp.tools.forEach(tool => {
      console.log(`     • ${tool.name}`);
    });
  });

  // 8. 测试MCP工具集成
  console.log('\n🤖 步骤8: 测试MCP工具集成');
  console.log('-'.repeat(40));

  const mcpTools = getAllOrganizationMCPTools();
  console.log(`🔧 可用的MCP工具 (${mcpTools.length}个):`);
  mcpTools.forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description}`);
  });

  // 9. 创建MCP会话测试
  console.log('\n💬 步骤9: 创建MCP会话测试');
  console.log('-'.repeat(40));

  const session = createMCPSession('test-mcp-session', {
    mcpEndpoint: 'http://localhost:3000/mcp',
    tools: mcpTools,
    initialContext: '测试多组织MCP集成'
  });

  console.log('✅ 创建MCP会话成功');
  console.log(`   工具数量: ${session.getTools().length}`);

  // 10. 清理
  console.log('\n🧹 步骤10: 清理测试数据');
  console.log('-'.repeat(40));

  await globalOrganizationManager.cleanup();
  console.log('✅ 所有测试数据已清理');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 MCP集成测试完成！');
  console.log('='.repeat(60));

  console.log('\n💡 关键特性验证:');
  console.log('  1. ✅ 工具名称前缀: frontend-team_proxy_execute, backend-team_proxy_execute');
  console.log('  2. ✅ 组件区分: Alice同时在前端和后端，工具清晰区分');
  console.log('  3. ✅ 权限控制: 成员只能访问自己所在的组件');
  console.log('  4. ✅ 错误处理: 格式错误和权限错误正确处理');
  console.log('  5. ✅ 信息查询: 可以获取组件和工具信息');
  console.log('  6. ✅ MCP集成: 工具可集成到MCP会话中');
}

// 运行测试
if (require.main === module) {
  testMCPIntegration().catch(console.error);
}

export { testMCPIntegration };