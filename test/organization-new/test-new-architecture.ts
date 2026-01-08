/**
 * 新架构测试
 * 验证协作组件接口和组合模式
 */

import {
  newGlobalOrganizationManager,
  createCollaborationComponent,
  createOrganizationMember,
  createStandardCollaborationComponent,
  AuthorityType
} from '../../src/core/organization';

async function testNewArchitecture() {
  console.log('🧪 测试新组织架构（组合模式）\n');

  try {
    // 1. 创建组织成员
    console.log('1️⃣ 创建组织成员...');
    const memberA = createOrganizationMember('张三', 'user_token_zhangsan', {
      skills: ['typescript', 'react']
    });
    const memberB = createOrganizationMember('李四', 'user_token_lisi', {
      skills: ['python', 'django']
    });
    console.log('✅ 成员创建成功:', memberA.name, memberB.name);

    // 2. 创建协作组件（使用新架构）
    console.log('\n2️⃣ 创建协作组件（组合模式）...');
    
    // 开发者组件（继承生态权限）
    const devComponent = await createStandardCollaborationComponent.developer(
      'dev-team',
      '前端开发团队'
    );
    
    // 审查者组件
    const reviewComponent = await createStandardCollaborationComponent.reviewer(
      'review-team',
      '代码审查团队'
    );
    
    // 自定义组件（不继承生态权限）
    const customComponent = await createStandardCollaborationComponent.custom(
      'custom-team',
      '自定义团队',
      ['file_read', 'http_get'],
      ['/config/**'],
      [AuthorityType.READ, AuthorityType.EXECUTE]
    );

    console.log('✅ 协作组件创建成功:');
    console.log('  -', devComponent.name, '(ID:', devComponent.id + ')');
    console.log('  -', reviewComponent.name, '(ID:', reviewComponent.id + ')');
    console.log('  -', customComponent.name, '(ID:', customComponent.id + ')');

    // 3. 验证组合模式特性
    console.log('\n3️⃣ 验证组合模式特性...');
    
    // 检查用户空间属性
    console.log('开发者组件用户空间:');
    console.log('  Token:', devComponent.token);
    console.log('  Role:', devComponent.role);
    console.log('  可见工具:', Array.from(devComponent.visibleTools));
    
    // 检查配置
    console.log('自定义组件配置:');
    console.log('  继承生态权限:', customComponent.config.inheritToken生态权限);
    console.log('  额外工具:', customComponent.config.additionalTools);
    console.log('  额外职权:', customComponent.config.additionalAuthorities);

    // 4. 成员加入组件
    console.log('\n4️⃣ 成员加入协作组件...');
    
    newGlobalOrganizationManager.addMemberToComponent(memberA.id, 'dev-team');
    newGlobalOrganizationManager.addMemberToComponent(memberA.id, 'review-team');
    newGlobalOrganizationManager.addMemberToComponent(memberB.id, 'dev-team');
    
    console.log('✅ 成员加入成功');
    console.log('  张三加入:', newGlobalOrganizationManager.getMemberComponents(memberA.id));
    console.log('  李四加入:', newGlobalOrganizationManager.getMemberComponents(memberB.id));

    // 5. 代理执行测试
    console.log('\n5️⃣ 代理执行测试...');
    
    const executionResult = await newGlobalOrganizationManager.proxyExecute(
      'user_token_zhangsan',
      'dev-team',
      'file_read',
      { path: '/src/app.ts' },
      { resource: '/src/app.ts' }
    );
    
    console.log('执行结果:', executionResult.success ? '✅ 成功' : '❌ 失败');
    if (executionResult.success) {
      console.log('  输出:', executionResult.output);
      console.log('  使用职权:', executionResult.authorityUsed);
      console.log('  执行时间:', executionResult.executionTime + 'ms');
    } else {
      console.log('  错误:', executionResult.error);
    }

    // 6. 群聊功能测试
    console.log('\n6️⃣ 群聊功能测试...');
    
    await newGlobalOrganizationManager.sendGroupMessage(
      'user_token_zhangsan',
      'dev-team',
      '大家好，今天完成组件重构',
      'text',
      'high'
    );
    
    console.log('✅ 消息发送成功');

    // 7. 查询和统计
    console.log('\n7️⃣ 查询和统计...');
    
    const memberInfo = newGlobalOrganizationManager.getMemberAuthorityInfo('user_token_zhangsan');
    if (memberInfo) {
      console.log('张三的职权信息:');
      console.log('  所在组件:', memberInfo.collaborationUnits);
      console.log('  所有职权:', memberInfo.allAuthorities);
      console.log('  可用工具:', memberInfo.effectivePermissions.tools);
    }
    
    const stats = newGlobalOrganizationManager.getGlobalStats();
    console.log('全局统计:');
    console.log('  成员总数:', stats.totalMembers);
    console.log('  协作组件总数:', stats.totalCollaborationUnits);
    console.log('  活跃组件:', stats.activeUnits);

    // 8. 验证权限约束
    console.log('\n8️⃣ 验证权限约束...');
    
    // 测试无权访问
    const unauthorizedResult = await newGlobalOrganizationManager.proxyExecute(
      'user_token_zhangsan',
      'review-team',  // 审查团队，没有file_write权限
      'file_write',
      { path: '/src/app.ts' },
      { resource: '/src/app.ts' }
    );
    
    console.log('无权访问测试:', unauthorizedResult.success ? '❌ 失败' : '✅ 正确拒绝');
    if (!unauthorizedResult.success) {
      console.log('  拒绝原因:', unauthorizedResult.error);
    }

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testNewArchitecture().catch(console.error);
}

export { testNewArchitecture };