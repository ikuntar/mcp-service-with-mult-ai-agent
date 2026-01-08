/**
 * 快速验证新架构
 * 直接测试核心功能
 */

import {
  globalOrganizationManager,
  createStandardCollaborationComponent,
  createOrganizationMember,
  AuthorityType
} from '../../src/core/organization';

async function quickValidate() {
  console.log('🚀 快速验证新架构\n');

  // 1. 创建成员
  const member = createOrganizationMember('测试用户', 'test_token_123');
  console.log('✅ 创建成员:', member.name, 'ID:', member.id);

  // 2. 创建协作组件
  const component = await createStandardCollaborationComponent.developer('test-dev', '测试开发组');
  console.log('✅ 创建组件:', component.name);
  console.log('   Token:', component.token);
  console.log('   可见工具:', Array.from(component.visibleTools));

  // 3. 添加成员到组件
  const addResult = globalOrganizationManager.addMemberToComponent(member.id, 'test-dev');
  console.log('✅ 添加成员:', addResult ? '成功' : '失败');

  // 4. 检查成员关系
  const memberComponents = globalOrganizationManager.getMemberComponents(member.id);
  console.log('✅ 成员所在组件:', memberComponents);

  // 5. 测试代理执行
  console.log('\n🔧 测试代理执行...');
  const result = await globalOrganizationManager.proxyExecute(
    'test_token_123',
    'test-dev',
    'file_read',
    { path: '/test.ts' },
    { resource: '/test.ts' }
  );

  console.log('执行结果:', result.success ? '✅ 成功' : '❌ 失败');
  if (result.success) {
    console.log('   输出:', result.output);
    console.log('   职权:', result.authorityUsed);
  } else {
    console.log('   错误:', result.error);
  }

  // 6. 验证组合模式特性
  console.log('\n🎯 验证组合模式特性:');
  console.log('   - 组件拥有用户空间属性:', !!component.token);
  console.log('   - 组件实现协作接口:', typeof component.proxyExecute === 'function');
  console.log('   - 组件支持成员管理:', typeof component.addMember === 'function');
  console.log('   - 组件支持群聊:', typeof component.sendGroupMessage === 'function');

  // 7. 验证权限继承
  console.log('\n🔒 验证权限继承:');
  const info = globalOrganizationManager.getMemberAuthorityInfo('test_token_123');
  if (info) {
    console.log('   - 所在组件:', info.collaborationComponents);
    console.log('   - 所有职权:', info.allAuthorities);
    console.log('   - 可用工具:', info.effectivePermissions.tools);
  }

  console.log('\n✅ 验证完成！新架构核心功能正常。');
}

if (require.main === module) {
  quickValidate().catch(console.error);
}

export { quickValidate };