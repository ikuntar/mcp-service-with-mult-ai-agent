/**
 * 组织架构管理组件测试
 * 演示基于高级Agent的组织管理系统
 */

import {
  OrganizationManager,
  StructureManager,
  OrganizationMemberImpl,
  OrganizationRole,
  OrganizationLevel,
  MemberStatus,
  RelationshipType,
  createOrganization,
  createMember,
  createTeam,
  createDepartment
} from '../../src/core/organization';

import { getOrganizationHealth, generateOrganizationReport, getCollaborationNetwork } from '../../src/core/organization/utils';

async function testOrganization() {
  console.log('🧪 开始测试组织架构管理组件...\n');
  
  // 1. 创建组织管理器
  console.log('1️⃣ 创建组织管理器');
  const manager = OrganizationManager.getInstance();
  console.log('✅ 组织管理器创建成功\n');
  
  // 2. 创建组织
  console.log('2️⃣ 创建组织结构');
  const org = createOrganization(
    'tech-company',
    '科技公司',
    OrganizationLevel.ORGANIZATION
  );
  console.log('✅ 组织创建成功:', org.toJSON().name, '\n');
  
  // 3. 创建团队
  console.log('3️⃣ 创建团队');
  const frontendTeam = createTeam('frontend-team', '前端团队');
  const backendTeam = createTeam('backend-team', '后端团队');
  const dataTeam = createTeam('data-team', '数据团队');
  
  // 添加到组织
  org.addSubStructure(frontendTeam.getInternalStructure());
  org.addSubStructure(backendTeam.getInternalStructure());
  org.addSubStructure(dataTeam.getInternalStructure());
  console.log('✅ 团队创建成功\n');
  
  // 4. 创建成员（基于高级Agent）
  console.log('4️⃣ 创建成员（基于高级Agent）');
  
  const techLead = createMember('张三', OrganizationRole.TECH_LEAD, OrganizationLevel.TEAM, {
    teamId: 'frontend-team',
    capabilities: ['typescript', 'react', 'architecture'],
    permissions: ['read', 'write', 'execute', 'review', 'design'],
    modelId: 'default',
    mcpEndpoint: 'http://localhost:3000'
  });
  
  const seniorDev = createMember('李四', OrganizationRole.LEAD_ENGINEER, OrganizationLevel.TEAM, {
    teamId: 'backend-team',
    capabilities: ['nodejs', 'python', 'database'],
    permissions: ['read', 'write', 'execute', 'review'],
    modelId: 'default',
    mcpEndpoint: 'http://localhost:3000'
  });
  
  const juniorDev = createMember('王五', OrganizationRole.MEMBER, OrganizationLevel.TEAM, {
    teamId: 'frontend-team',
    capabilities: ['typescript', 'react'],
    permissions: ['read', 'execute'],
    modelId: 'default',
    mcpEndpoint: 'http://localhost:3000'
  });
  
  const dataAnalyst = createMember('赵六', OrganizationRole.MEMBER, OrganizationLevel.TEAM, {
    teamId: 'data-team',
    capabilities: ['python', 'sql', 'ml'],
    permissions: ['read', 'execute'],
    modelId: 'default',
    mcpEndpoint: 'http://localhost:3000'
  });
  
  console.log('✅ 成员创建成功:');
  console.log(`   - ${techLead.name} (${techLead.role})`);
  console.log(`   - ${seniorDev.name} (${seniorDev.role})`);
  console.log(`   - ${juniorDev.name} (${juniorDev.role})`);
  console.log(`   - ${dataAnalyst.name} (${dataAnalyst.role})\n`);
  
  // 5. 添加成员到团队
  console.log('5️⃣ 添加成员到团队');
  frontendTeam.addMember(techLead);
  frontendTeam.addMember(juniorDev);
  backendTeam.addMember(seniorDev);
  dataTeam.addMember(dataAnalyst);
  console.log('✅ 成员添加完成\n');
  
  // 6. 建立组织关系
  console.log('6️⃣ 建立组织关系');
  
  // 汇报关系
  frontendTeam.addRelationship(
    juniorDev.id,
    techLead.id,
    RelationshipType.REPORTING,
    1.0
  );
  
  backendTeam.addRelationship(
    seniorDev.id,
    techLead.id, // 假设张三也是后端负责人
    RelationshipType.REPORTING,
    0.9
  );
  
  // 协作关系
  frontendTeam.addRelationship(
    techLead.id,
    seniorDev.id,
    RelationshipType.CROSS_FUNCTIONAL,
    0.8,
    { project: 'fullstack-app' }
  );
  
  console.log('✅ 组织关系建立完成');
  console.log(`   - 汇报关系: ${juniorDev.name} → ${techLead.name}`);
  console.log(`   - 协作关系: ${techLead.name} ↔ ${seniorDev.name}\n`);
  
  // 7. 测试成员能力
  console.log('7️⃣ 测试成员能力');
  
  console.log(`   ${techLead.name}:`);
  console.log(`     - 角色检查: ${techLead.hasRole(OrganizationRole.TECH_LEAD)}`);
  console.log(`     - 能力检查: ${techLead.hasCapability('typescript')}`);
  console.log(`     - 权限检查: ${techLead.hasPermission('review')}`);
  console.log(`     - 活跃状态: ${techLead.isActive()}`);
  
  // 测试任务执行
  const task = {
    id: 'task-001',
    input: '分析前端架构并提出优化建议',
    metadata: { priority: 'high', deadline: '2024-01-15' }
  };
  
  console.log(`\n   测试任务执行: "${task.input}"`);
  const result = await techLead.executeOrganizationTask(task);
  console.log(`     - 执行结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
  if (result.error) {
    console.log(`     - 错误: ${result.error}`);
  }
  console.log('');
  
  // 8. 查询功能
  console.log('8️⃣ 查询功能测试');
  
  const techLeads = frontendTeam.queryMembers({ role: OrganizationRole.TECH_LEAD });
  console.log(`   - 技术负责人: ${techLeads.map(m => m.name).join(', ')}`);
  
  const tsDevs = frontendTeam.queryMembers({ capabilities: ['typescript'] });
  console.log(`   - TypeScript开发者: ${tsDevs.map(m => m.name).join(', ')}`);
  
  const reports = frontendTeam.getDirectReports(techLead.id);
  console.log(`   - ${techLead.name} 的下属: ${reports.map(m => m.name).join(', ')}`);
  
  const superiors = frontendTeam.getSuperiors(juniorDev.id);
  console.log(`   - ${juniorDev.name} 的上级: ${superiors.map(m => m.name).join(', ')}\n`);
  
  // 9. 统计信息
  console.log('9️⃣ 组织统计');
  const stats = frontendTeam.getStats();
  console.log(`   - 总成员: ${stats.totalMembers}`);
  console.log(`   - 活跃成员: ${stats.activeMembers}`);
  console.log(`   - 关系数量: ${stats.totalRelationships}`);
  console.log(`   - 角色分布:`, stats.memberCountByRole);
  console.log('');
  
  // 10. 健康度检查
  console.log('🔟 组织健康度检查');
  const health = getOrganizationHealth(frontendTeam);
  console.log(`   - 健康评分: ${health.score}/100`);
  console.log(`   - 关键因素:`, health.factors);
  if (health.issues.length > 0) {
    console.log(`   - 问题:`, health.issues);
  }
  console.log('');
  
  // 11. 协作网络
  console.log('1️⃣1️⃣ 协作网络分析');
  const network = getCollaborationNetwork(frontendTeam, techLead.id);
  console.log(`   - ${techLead.name} 的协作网络: ${network.map(m => m.name).join(', ')}`);
  console.log('');
  
  // 12. 生成报告
  console.log('1️⃣2️⃣ 生成组织报告');
  const report = generateOrganizationReport(frontendTeam);
  console.log('   报告内容:');
  console.log('   ' + report.split('\n').join('\n   '));
  console.log('');
  
  // 13. 跨组织查询
  console.log('1️⃣3️⃣ 跨组织查询');
  const allMembers = manager.searchMembersAcrossOrganizations({});
  console.log(`   - 跨组织成员总数: ${allMembers.length}`);
  
  const found = manager.findMemberAcrossOrganizations(techLead.id);
  if (found) {
    console.log(`   - 找到成员: ${found.member.name} 在 ${found.organization.toJSON().name}`);
  }
  console.log('');
  
  // 14. 全局统计
  console.log('1️⃣4️⃣ 全局统计');
  const globalStats = manager.getGlobalStats();
  console.log(`   - 组织数量: ${globalStats.totalOrganizations}`);
  console.log(`   - 总成员: ${globalStats.totalMembers}`);
  console.log(`   - 活跃成员: ${globalStats.totalActiveMembers}`);
  console.log('');
  
  // 15. 序列化测试
  console.log('1️⃣5️⃣ 序列化测试');
  const orgJSON = org.toJSON();
  console.log('   组织JSON结构:');
  console.log(`   - ID: ${orgJSON.id}`);
  console.log(`   - 名称: ${orgJSON.name}`);
  console.log(`   - 层级: ${orgJSON.level}`);
  console.log(`   - 成员数: ${orgJSON.members.length}`);
  console.log(`   - 子结构: ${orgJSON.subStructures.length}`);
  console.log(`   - 关系数: ${orgJSON.relationships}`);
  console.log('');
  
  // 16. 验证
  console.log('1️⃣6️⃣ 结构验证');
  const validation = org.validate();
  console.log(`   - 验证结果: ${validation.isValid ? '✅ 通过' : '❌ 失败'}`);
  if (validation.warnings.length > 0) {
    console.log(`   - 警告:`, validation.warnings);
  }
  if (validation.suggestions.length > 0) {
    console.log(`   - 建议:`, validation.suggestions);
  }
  console.log('');
  
  console.log('🎉 所有测试完成！');
  
  // 返回测试对象供进一步使用
  return {
    manager,
    org,
    frontendTeam,
    backendTeam,
    dataTeam,
    members: { techLead, seniorDev, juniorDev, dataAnalyst }
  };
}

// 如果直接运行此文件
if (require.main === module) {
  testOrganization().catch(console.error);
}

export { testOrganization };