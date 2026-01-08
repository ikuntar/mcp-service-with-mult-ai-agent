/**
 * 测试组织模块清理后的功能
 */

const {
  globalOrganizationManager,
  createCollaborationComponent,
  createOrganizationMember,
  createStandardCollaborationComponent
} = require('./src/index.ts');

async function testOrganization() {
  console.log('🧪 测试清理后的组织模块...\n');

  try {
    // 1. 创建组织成员
    console.log('1️⃣ 创建组织成员');
    const memberA = createOrganizationMember('张三', 'user_token_zhangsan', {
      skills: ['typescript', 'react']
    });
    const memberB = createOrganizationMember('李四', 'user_token_lisi', {
      skills: ['python', 'django']
    });
    console.log('✅ 成员创建成功:', memberA.name, memberB.name);

    // 2. 创建协作组件（使用新架构）
    console.log('\n2️⃣ 创建协作组件（无权限相关配置）...');
    
    // 开发者组件
    const devComponent = await createStandardCollaborationComponent.developer(
      'dev-team',
      '前端开发团队'
    );
    
    // 审查者组件
    const reviewComponent = await createStandardCollaborationComponent.reviewer(
      'review-team',
      '代码审查团队'
    );

    console.log('✅ 协作组件创建成功:');
    console.log('  -', devComponent.name, '(ID:', devComponent.id + ')');
    console.log('  -', reviewComponent.name, '(ID:', reviewComponent.id + ')');

    // 3. 成员加入组件
    console.log('\n3️⃣ 成员加入协作组件...');
    
    globalOrganizationManager.addMemberToComponent(memberA.id, 'dev-team');
    globalOrganizationManager.addMemberToComponent(memberA.id, 'review-team');
    globalOrganizationManager.addMemberToComponent(memberB.id, 'dev-team');
    
    console.log('✅ 成员加入成功');
    console.log('  张三加入:', globalOrganizationManager.getMemberComponents(memberA.id));
    console.log('  李四加入:', globalOrganizationManager.getMemberComponents(memberB.id));

    // 4. 代理执行测试
    console.log('\n4️⃣ 代理执行测试...');
    
    const executionResult = await globalOrganizationManager.proxyExecute(
      'user_token_zhangsan',
      'dev-team',
      'file_read',
      { path: '/src/app.ts' },
      { resource: '/src/app.ts' }
    );
    
    console.log('执行结果:', executionResult.success ? '✅ 成功' : '❌ 失败');
    if (executionResult.success) {
      console.log('  输出:', executionResult.output);
      console.log('  执行时间:', executionResult.executionTime + 'ms');
    } else {
      console.log('  错误:', executionResult.error);
    }

    // 5. 权限管理测试（新功能）
    console.log('\n5️⃣ 协作单元权限管理测试...');
    
    // 编辑协作单元权限
    const editResult = await globalOrganizationManager.editCollaborationUnitPermissions(
      'dev-team',
      {
        tools: ['file_read', 'file_write', 'http_get'],
        resources: ['/src/**', '/project/**'],
        maxConcurrency: 200
      }
    );
    
    console.log('权限编辑:', editResult ? '✅ 成功' : '❌ 失败');

    // 获取协作单元Token信息
    const tokenInfo = globalOrganizationManager.getCollaborationTokenInfo('dev-team');
    if (tokenInfo) {
      console.log('协作单元Token信息:', {
        token: tokenInfo.token.substring(0, 16) + '...',
        role: tokenInfo.role,
        active: tokenInfo.isActive
      });
    }

    // 6. 查询和统计
    console.log('\n6️⃣ 查询和统计...');
    
    const memberInfo = globalOrganizationManager.getMemberAuthorityInfo('user_token_zhangsan');
    if (memberInfo) {
      console.log('张三的权限信息:');
      console.log('  所在组件:', memberInfo.collaborationComponents);
      console.log('  可用工具:', memberInfo.effectivePermissions.tools);
      console.log('  可用资源:', memberInfo.effectivePermissions.resources);
      console.log('  可执行动作:', memberInfo.effectivePermissions.actions);
    }
    
    const stats = globalOrganizationManager.getGlobalStats();
    console.log('全局统计:');
    console.log('  成员总数:', stats.totalMembers);
    console.log('  协作组件总数:', stats.totalCollaborationUnits);
    console.log('  活跃组件:', stats.activeUnits);

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testOrganization().catch(console.error);
}

module.exports = { testOrganization };