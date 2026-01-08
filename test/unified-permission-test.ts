/**
 * 测试统一权限管理器
 */

import { globalTokenManager } from '../src/core/token/token-manager.js';
import { globalPermissionManager } from '../src/core/token/permission-manager.js';

async function testUnifiedPermissionManager() {
  console.log('🧪 测试统一权限管理器...\n');

  // 创建测试token
  const userToken = globalTokenManager.createToken('user', '普通用户');
  const analystToken = globalTokenManager.createToken('analyst', '分析师');
  const adminToken = globalTokenManager.createToken('admin', '管理员');
  const invalidToken = 'invalid-token';

  console.log('1. 创建测试token:');
  console.log(`   user: ${userToken.substring(0, 12)}...`);
  console.log(`   analyst: ${analystToken.substring(0, 12)}...`);
  console.log(`   admin: ${adminToken.substring(0, 12)}...\n`);

  // 验证token
  const userValidation = globalTokenManager.validateTokenDetailed(userToken);
  const analystValidation = globalTokenManager.validateTokenDetailed(analystToken);
  const adminValidation = globalTokenManager.validateTokenDetailed(adminToken);
  const invalidValidation = globalTokenManager.validateTokenDetailed(invalidToken);

  // 测试各种工具分组的权限检查
  const testCases = [
    {
      name: 'add (public, basic)',
      groups: ['public', 'basic'],
      expected: { user: true, analyst: true, admin: true }
    },
    {
      name: 'token_create (admin-only, token-management)',
      groups: ['admin-only', 'token-management'],
      expected: { user: false, analyst: false, admin: true }
    },
    {
      name: 'demo-tool (advanced, sensitive)',
      groups: ['advanced', 'sensitive'],
      expected: { user: false, analyst: true, admin: true }
    },
    {
      name: 'async_task工具 (async-task, userspace-management)',
      groups: ['async-task', 'userspace-management'],
      expected: { user: true, analyst: true, admin: true }
    },
    {
      name: 'token_validate (public, token-based-fetcher)',
      groups: ['public', 'token-based-fetcher'],
      expected: { user: true, analyst: true, admin: true }
    }
  ];

  console.log('2. 权限检查测试:\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`   测试: ${testCase.name}`);
    
    // user角色检查
    const userResult = globalPermissionManager.checkTokenPermission(userValidation, testCase.groups);
    const userPass = userResult.allowed === testCase.expected.user;
    console.log(`     user: ${userPass ? '✅' : '❌'} ${userResult.allowed ? '允许' : '拒绝'} (预期: ${testCase.expected.user ? '允许' : '拒绝'})`);
    if (userPass) passed++; else failed++;

    // analyst角色检查
    const analystResult = globalPermissionManager.checkTokenPermission(analystValidation, testCase.groups);
    const analystPass = analystResult.allowed === testCase.expected.analyst;
    console.log(`     analyst: ${analystPass ? '✅' : '❌'} ${analystResult.allowed ? '允许' : '拒绝'} (预期: ${testCase.expected.analyst ? '允许' : '拒绝'})`);
    if (analystPass) passed++; else failed++;

    // admin角色检查
    const adminResult = globalPermissionManager.checkTokenPermission(adminValidation, testCase.groups);
    const adminPass = adminResult.allowed === testCase.expected.admin;
    console.log(`     admin: ${adminPass ? '✅' : '❌'} ${adminResult.allowed ? '允许' : '拒绝'} (预期: ${testCase.expected.admin ? '允许' : '拒绝'})`);
    if (adminPass) passed++; else failed++;

    console.log('');
  }

  // 测试无效token
  console.log('3. 无效token测试:');
  const invalidResult = globalPermissionManager.checkTokenPermission(invalidValidation, ['public']);
  console.log(`   无效token访问public工具: ${!invalidResult.allowed ? '✅' : '❌'} ${invalidResult.reason}`);
  if (!invalidResult.allowed) passed++; else failed++;
  console.log('');

  // 测试工具列表过滤
  console.log('4. 工具列表过滤测试:');
  const mockTools = [
    { name: 'add', groups: ['public', 'basic'] },
    { name: 'token_create', groups: ['admin-only', 'token-management'] },
    { name: 'demo-tool', groups: ['advanced', 'sensitive'] },
    { name: 'token_validate', groups: ['public', 'token-based-fetcher'] }
  ];

  const userVisible = globalPermissionManager.filterVisibleTools(mockTools, 'user');
  const analystVisible = globalPermissionManager.filterVisibleTools(mockTools, 'analyst');
  const adminVisible = globalPermissionManager.filterVisibleTools(mockTools, 'admin');

  console.log(`   user可见: ${userVisible.map(t => t.name).join(', ')}`);
  console.log(`   analyst可见: ${analystVisible.map(t => t.name).join(', ')}`);
  console.log(`   admin可见: ${adminVisible.map(t => t.name).join(', ')}`);

  // 验证过滤结果
  const userExpected = ['add', 'token_validate'];
  const analystExpected = ['add', 'demo-tool', 'token_validate'];
  const adminExpected = ['add', 'token_create', 'demo-tool', 'token_validate'];

  if (JSON.stringify(userVisible.map(t => t.name).sort()) === JSON.stringify(userExpected.sort())) {
    console.log('   ✅ user过滤正确');
    passed++;
  } else {
    console.log('   ❌ user过滤错误');
    failed++;
  }

  if (JSON.stringify(analystVisible.map(t => t.name).sort()) === JSON.stringify(analystExpected.sort())) {
    console.log('   ✅ analyst过滤正确');
    passed++;
  } else {
    console.log('   ❌ analyst过滤错误');
    failed++;
  }

  if (JSON.stringify(adminVisible.map(t => t.name).sort()) === JSON.stringify(adminExpected.sort())) {
    console.log('   ✅ admin过滤正确');
    passed++;
  } else {
    console.log('   ❌ admin过滤错误');
    failed++;
  }

  console.log('');

  // 测试权限信息获取
  console.log('5. 权限信息获取测试:');
  const userPermissions = globalPermissionManager.getRolePermissions('user');
  const analystPermissions = globalPermissionManager.getRolePermissions('analyst');
  const adminPermissions = globalPermissionManager.getRolePermissions('admin');

  console.log(`   user角色: ${userPermissions.canAccess.length}个可访问分组`);
  console.log(`   analyst角色: ${analystPermissions.canAccess.length}个可访问分组`);
  console.log(`   admin角色: ${adminPermissions.canAccess.length}个可访问分组`);

  if (userPermissions.canAccess.length > 0 && analystPermissions.canAccess.length > 0 && adminPermissions.canAccess.length > 0) {
    console.log('   ✅ 权限信息获取正确');
    passed++;
  } else {
    console.log('   ❌ 权限信息获取错误');
    failed++;
  }

  console.log('');

  // 测试动态注册权限组
  console.log('6. 动态权限组注册测试:');
  globalPermissionManager.registerPermissionGroup('custom-test', ['analyst', 'admin']);
  const customValidation = globalTokenManager.validateTokenDetailed(analystToken);
  const customResult = globalPermissionManager.checkTokenPermission(customValidation, ['custom-test']);
  
  if (customResult.allowed) {
    console.log('   ✅ 动态注册权限组成功');
    passed++;
  } else {
    console.log('   ❌ 动态注册权限组失败');
    failed++;
  }

  // 清理测试数据
  globalTokenManager.deleteToken(userToken);
  globalTokenManager.deleteToken(analystToken);
  globalTokenManager.deleteToken(adminToken);

  console.log('\n📊 测试总结:');
  console.log(`   通过: ${passed}`);
  console.log(`   失败: ${failed}`);
  console.log(`   总计: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 统一权限管理器测试通过！');
    console.log('\n💡 优势总结:');
    console.log('   ✅ 权限逻辑集中管理');
    console.log('   ✅ 新增角色只需修改配置');
    console.log('   ✅ 避免权限检查逻辑分散');
    console.log('   ✅ 提供统一的错误信息');
    console.log('   ✅ 支持动态权限组注册');
  } else {
    console.log('\n❌ 部分测试失败');
  }
}

// 运行测试
testUnifiedPermissionManager().catch(console.error);