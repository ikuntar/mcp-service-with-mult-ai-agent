/**
 * 完整演示：精简版组织架构
 * 展示协作单元、代理执行等核心特性
 */

import {
  globalOrganizationManager,
  createCollaborationComponent,
  createOrganizationMember,
  createStandardCollaborationComponent
} from '../../src/core/organization';

import { globalTokenManager } from '../../src/core/token/token-manager';

async function completeDemo() {
  console.log('🎯 精简版组织架构完整演示\n');
  console.log('='.repeat(60));

  // 1. 初始化：创建Token和成员
  console.log('\n📦 步骤1: 初始化用户和Token');
  console.log('-'.repeat(40));
  
  const tokens = {
    alice: globalTokenManager.createToken('developer', 'Alice - 全栈开发者'),
    bob: globalTokenManager.createToken('developer', 'Bob - 后端专家'),
    charlie: globalTokenManager.createToken('reviewer', 'Charlie - 代码审查员'),
    diana: globalTokenManager.createToken('manager', 'Diana - 项目经理')
  };

  console.log('✅ 创建Token:');
  Object.entries(tokens).forEach(([name, token]) => {
    console.log(`   ${name}: ${token.substring(0, 16)}...`);
  });

  const members = {
    alice: createOrganizationMember('Alice', tokens.alice, { skills: ['React', 'Node.js', 'TypeScript'] }),
    bob: createOrganizationMember('Bob', tokens.bob, { skills: ['Go', 'Python', 'Architecture'] }),
    charlie: createOrganizationMember('Charlie', tokens.charlie, { skills: ['Code Review', 'Security'] }),
    diana: createOrganizationMember('Diana', tokens.diana, { skills: ['Management', 'Planning'] })
  };

  console.log('✅ 创建成员:');
  Object.values(members).forEach(m => {
    console.log(`   ${m.name} (${m.id.substring(0, 12)}...)`);
  });

  // 2. 创建协作组件
  console.log('\n🏢 步骤2: 创建协作组件');
  console.log('-'.repeat(40));

  // 使用标准组件工厂
  const frontendComponent = await createStandardCollaborationComponent.developer(
    'frontend-team',
    '前端开发团队'
  );

  const backendComponent = await createStandardCollaborationComponent.developer(
    'backend-team', 
    '后端开发团队'
  );

  const reviewComponent = await createStandardCollaborationComponent.reviewer(
    'code-review-team',
    '代码审查团队'
  );

  // 自定义组件
  const securityComponent = await createCollaborationComponent(
    'security-team',
    '安全团队',
    {
      description: '负责安全审计',
      additionalTools: ['security_scan', 'audit_log'],
      additionalResources: ['/security/**', '/logs/**']
    }
  );

  console.log('✅ 创建协作组件:');
  [frontendComponent, backendComponent, reviewComponent, securityComponent].forEach(comp => {
    console.log(`   ${comp.name} (${comp.id})`);
    console.log(`      工具: ${Array.from(comp.visibleTools).join(', ')}`);
  });

  // 3. 建立成员关系
  console.log('\n🔗 步骤3: 建立成员关系');
  console.log('-'.repeat(40));

  // Alice: 前端 + 后端
  globalOrganizationManager.addMemberToComponent(members.alice.id, 'frontend-team');
  globalOrganizationManager.addMemberToComponent(members.alice.id, 'backend-team');
  console.log('✅ Alice 加入: 前端团队, 后端团队');

  // Bob: 后端 + 审查
  globalOrganizationManager.addMemberToComponent(members.bob.id, 'backend-team');
  globalOrganizationManager.addMemberToComponent(members.bob.id, 'code-review-team');
  console.log('✅ Bob 加入: 后端团队, 代码审查团队');

  // Charlie: 审查
  globalOrganizationManager.addMemberToComponent(members.charlie.id, 'code-review-team');
  console.log('✅ Charlie 加入: 代码审查团队');

  // Diana: 所有组件（管理者）
  globalOrganizationManager.addMemberToComponent(members.diana.id, 'frontend-team');
  globalOrganizationManager.addMemberToComponent(members.diana.id, 'backend-team');
  globalOrganizationManager.addMemberToComponent(members.diana.id, 'code-review-team');
  globalOrganizationManager.addMemberToComponent(members.diana.id, 'security-team');
  console.log('✅ Diana 加入: 所有团队（管理者）');

  // 4. 代理执行演示
  console.log('\n⚡ 步骤4: 代理执行演示');
  console.log('-'.repeat(40));

  console.log('📝 执行场景:');
  
  // 场景1: Alice 通过前端组件执行
  console.log('\n1️⃣ Alice 通过前端团队执行文件读取:');
  console.log(`   用户: ${members.alice.name}`);
  console.log(`   组件: 前端团队`);
  console.log(`   工具: file_read`);
  const result1 = await globalOrganizationManager.proxyExecute(
    tokens.alice,
    'frontend-team',
    'file_read',
    { path: '/src/frontend/app.ts' }
  );
  console.log(`   结果: ${result1.success ? '✅ 成功' : '❌ 失败'}`);
  if (result1.output) console.log(`   输出: ${result1.output}`);

  // 场景2: Bob 通过后端组件执行
  console.log('\n2️⃣ Bob 通过后端团队执行命令:');
  console.log(`   用户: ${members.bob.name}`);
  console.log(`   组件: 后端团队`);
  console.log(`   工具: exec_command`);
  const result2 = await globalOrganizationManager.proxyExecute(
    tokens.bob,
    'backend-team',
    'exec_command',
    { command: 'node server.js' }
  );
  console.log(`   结果: ${result2.success ? '✅ 成功' : '❌ 失败'}`);

  // 场景3: Charlie 尝试执行写操作（应该失败）
  console.log('\n3️⃣ Charlie 尝试通过审查团队写文件:');
  console.log(`   用户: ${members.charlie.name}`);
  console.log(`   组件: 代码审查团队`);
  console.log(`   工具: file_write`);
  const result3 = await globalOrganizationManager.proxyExecute(
    tokens.charlie,
    'code-review-team',
    'file_write',
    { path: '/src/app.ts', content: 'test' }
  );
  console.log(`   结果: ${result3.success ? '✅ 成功' : '❌ 失败'}`);
  if (result3.error) console.log(`   错误: ${result3.error}`);

  // 场景4: Alice 尝试访问审查工具（应该失败）
  console.log('\n4️⃣ Alice 尝试访问安全扫描工具:');
  console.log(`   用户: ${members.alice.name}`);
  console.log(`   组件: 安全团队`);
  console.log(`   工具: security_scan`);
  const result4 = await globalOrganizationManager.proxyExecute(
    tokens.alice,
    'security-team',
    'security_scan',
    { target: '/app' }
  );
  console.log(`   结果: ${result4.success ? '✅ 成功' : '❌ 失败'}`);
  if (result4.error) console.log(`   错误: ${result4.error}`);

  // 5. 查询功能演示
  console.log('\n🔍 步骤5: 查询功能演示');
  console.log('-'.repeat(40));

  // 查询所有协作组件
  const allComponents = globalOrganizationManager.queryComponents({});
  console.log(`📊 所有协作组件 (${allComponents.length}):`);
  allComponents.forEach(c => {
    console.log(`   - ${c.name}: ${c.getMembers().size} 成员`);
  });

  // 查询包含Alice的组件
  const aliceComponents = globalOrganizationManager.queryComponents({ hasMember: members.alice.id });
  console.log(`\n📊 Alice所在的组件 (${aliceComponents.length}):`);
  aliceComponents.forEach(c => console.log(`   - ${c.name}`));

  // 查询前端团队的成员
  const frontendMembers = globalOrganizationManager.queryMembers({ componentId: 'frontend-team' });
  console.log(`\n📊 前端团队成员 (${frontendMembers.length}):`);
  frontendMembers.forEach(m => console.log(`   - ${m.name}`));

  // 6. 统计信息
  console.log('\n📈 步骤6: 统计信息');
  console.log('-'.repeat(40));

  const stats = globalOrganizationManager.getGlobalStats();
  console.log('📊 全局统计:');
  console.log(`   总成员数: ${stats.totalMembers}`);
  console.log(`   活跃成员数: ${stats.activeMembers}`);
  console.log(`   协作组件数: ${stats.totalCollaborationUnits}`);
  console.log(`   活跃组件数: ${stats.activeUnits}`);

  // 7. 关系可视化
  console.log('\n🌐 步骤7: 关系可视化');
  console.log('-'.repeat(40));

  console.log('关系图:');
  console.log('');
  console.log('                    ┌─────────────────┐');
  console.log('                    │  全局组织管理器  │');
  console.log('                    └────────┬────────┘');
  console.log('                             │');
  console.log('        ┌────────────────────┼────────────────────┐');
  console.log('        │                    │                    │');
  console.log('   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐');
  console.log('   │ 前端    │         │ 后端    │         │ 审查    │');
  console.log('   │ 团队    │         │ 团队    │         │ 团队    │');
  console.log('   └────┬────┘         └────┬────┘         └────┬────┘');
  console.log('        │                    │                    │');
  console.log('   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐');
  console.log('   │ Alice   │          │ Alice   │          │ Charlie │');
  console.log('   │ Diana   │          │ Bob     │          │ Bob     │');
  console.log('   │         │          │ Diana   │          │ Diana   │');
  console.log('   └─────────┘          └─────────┘          └─────────┘');
  console.log('');
  console.log('说明:');
  console.log('  - Alice 同时在前端和后端团队');
  console.log('  - Bob 同时在后端和审查团队');
  console.log('  - Diana 在所有团队（管理者）');
  console.log('  - 每个团队都有独立的职权和工具权限');

  // 8. 清理演示
  console.log('\n🧹 步骤8: 清理演示');
  console.log('-'.repeat(40));

  await globalOrganizationManager.deleteMember(members.charlie.id);
  console.log('✅ 删除成员: Charlie');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 演示完成！');
  console.log('='.repeat(60));

  console.log('\n💡 关键特性总结:');
  console.log('  1. ✅ 精简架构：只保留成员关系和Token生态约束');
  console.log('  2. ✅ 组合模式：协作组件组合用户空间实现职权');
  console.log('  3. ✅ 代理执行：通过协作组件代理，获得组件职权');
  console.log('  4. ✅ 多对多关系：成员可同时在多个组件中');
  console.log('  5. ✅ 权限约束：两层防御（Token生态 + 组件约束）');
  console.log('  6. ✅ 标准组件：预定义开发者、审查者、管理者等类型');
}

// 运行演示
if (require.main === module) {
  completeDemo().catch(console.error);
}

export { completeDemo };