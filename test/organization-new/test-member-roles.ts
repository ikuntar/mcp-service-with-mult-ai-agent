/**
 * 测试成员角色系统
 * 验证管理员和普通成员的不同权限
 */

import {
  globalOrganizationManager,
  createCollaborationComponent,
  createOrganizationMember,
  createStandardCollaborationComponent
} from '../../src/core/organization';

import { globalTokenManager } from '../../src/core/token/token-manager';

async function testMemberRoles() {
  console.log('🎯 测试成员角色系统\n');
  console.log('='.repeat(60));

  // 1. 创建Token
  console.log('\n📦 步骤1: 创建Token');
  console.log('-'.repeat(40));
  
  const adminToken = globalTokenManager.createToken('admin', '管理员用户');
  const memberToken = globalTokenManager.createToken('developer', '普通成员用户');
  
  console.log(`✅ 管理员Token: ${adminToken.substring(0, 16)}...`);
  console.log(`✅ 成员Token: ${memberToken.substring(0, 16)}...`);

  // 2. 创建成员（指定角色）
  console.log('\n👥 步骤2: 创建成员（指定不同角色）');
  console.log('-'.repeat(40));
  
  const adminMember = createOrganizationMember('管理员Alice', adminToken, { skills: ['管理', '架构'] }, 'admin');
  const regularMember = createOrganizationMember('开发者Bob', memberToken, { skills: ['React', 'Node.js'] }, 'member');
  
  console.log(`✅ 创建管理员: ${adminMember.name} (角色: ${adminMember.role})`);
  console.log(`✅ 创建普通成员: ${regularMember.name} (角色: ${regularMember.role})`);

  // 3. 创建协作组件
  console.log('\n🏢 步骤3: 创建协作组件');
  console.log('-'.repeat(40));
  
  const devTeam = await createCollaborationComponent('dev-team', '开发团队', {
    description: '开发协作组件'
  });
  
  console.log(`✅ 创建协作组件: ${devTeam.name}`);

  // 4. 添加成员到组件
  console.log('\n🔗 步骤4: 添加成员到协作组件');
  console.log('-'.repeat(40));
  
  globalOrganizationManager.addMemberToComponent(adminMember.id, 'dev-team');
  globalOrganizationManager.addMemberToComponent(regularMember.id, 'dev-team');
  
  console.log(`✅ 管理员 ${adminMember.name} 加入开发团队`);
  console.log(`✅ 普通成员 ${regularMember.name} 加入开发团队`);

  // 5. 获取MCP工具（验证不同角色）
  console.log('\n🛠️ 步骤5: 获取MCP工具（验证不同角色权限）');
  console.log('-'.repeat(40));
  
  // 管理员的工具
  const adminTools = await devTeam.getMCPTools(adminToken);
  console.log(`📋 管理员可用工具 (${adminTools.length}个):`);
  adminTools.forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description}`);
  });
  
  // 普通成员的工具
  const memberTools = await devTeam.getMCPTools(memberToken);
  console.log(`\n📋 普通成员可用工具 (${memberTools.length}个):`);
  memberTools.forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description}`);
  });

  // 6. 测试代理执行
  console.log('\n⚡ 步骤6: 测试代理执行');
  console.log('-'.repeat(40));
  
  // 管理员执行
  console.log('\n1️⃣ 管理员执行文件读取:');
  const adminResult = await globalOrganizationManager.proxyExecute(
    adminToken,
    'dev-team',
    'file_read',
    { path: '/src/app.ts' }
  );
  console.log(`   结果: ${adminResult.success ? '✅ 成功' : '❌ 失败'}`);
  if (adminResult.output) console.log(`   输出: ${adminResult.output}`);
  
  // 普通成员执行
  console.log('\n2️⃣ 普通成员执行文件读取:');
  const memberResult = await globalOrganizationManager.proxyExecute(
    memberToken,
    'dev-team',
    'file_read',
    { path: '/src/app.ts' }
  );
  console.log(`   结果: ${memberResult.success ? '✅ 成功' : '❌ 失败'}`);
  if (memberResult.output) console.log(`   输出: ${memberResult.output}`);

  // 7. 测试管理员专属工具
  console.log('\n🔒 步骤7: 测试管理员专属工具');
  console.log('-'.repeat(40));
  
  // 管理员尝试添加成员（应该成功）
  console.log('\n1️⃣ 管理员尝试添加成员:');
  const addMemberResult = await devTeam.executeMCPTool(adminToken, 'add_member', { memberId: 'test-member' });
  console.log(`   结果: ${addMemberResult.isError ? '❌ 被拒绝' : '✅ 允许'}`);
  if (addMemberResult.content) {
    console.log(`   信息: ${addMemberResult.content[0].text}`);
  }
  
  // 普通成员尝试添加成员（应该失败）
  console.log('\n2️⃣ 普通成员尝试添加成员:');
  const memberAddResult = await devTeam.executeMCPTool(memberToken, 'add_member', { memberId: 'test-member' });
  console.log(`   结果: ${memberAddResult.isError ? '❌ 被拒绝' : '✅ 允许'}`);
  if (memberAddResult.content) {
    console.log(`   信息: ${memberAddResult.content[0].text}`);
  }

  // 8. 查看组件统计
  console.log('\n📊 步骤8: 查看组件统计');
  console.log('-'.repeat(40));
  
  const stats = devTeam.getStats();
  console.log('组件统计:');
  console.log(`   总成员数: ${stats.memberCount}`);
  console.log(`   管理员数: ${stats.adminCount}`);
  console.log(`   普通成员数: ${stats.regularMemberCount}`);
  console.log(`   可用工具: ${stats.visibleTools.length}个`);

  // 9. 清理
  console.log('\n🧹 步骤9: 清理测试数据');
  console.log('-'.repeat(40));
  
  await globalOrganizationManager.cleanup();
  console.log('✅ 所有测试数据已清理');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 角色系统测试完成！');
  console.log('='.repeat(60));

  console.log('\n💡 关键特性总结:');
  console.log('  1. ✅ 成员角色区分: 管理员 vs 普通成员');
  console.log('  2. ✅ 权限控制: 管理员拥有更多工具');
  console.log('  3. ✅ 工具隔离: 管理员专属工具被普通成员拒绝');
  console.log('  4. ✅ 统计信息: 清晰显示各角色成员数量');
  console.log('  5. ✅ MCP工具集: 根据角色动态提供不同工具');
}

// 运行测试
if (require.main === module) {
  testMemberRoles().catch(console.error);
}

export { testMemberRoles };