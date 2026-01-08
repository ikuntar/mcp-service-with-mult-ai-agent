/**
 * 统一权限管理器演示
 * 
 * 演示如何通过集中式权限管理解决角色增长问题
 */

import { globalTokenManager } from '../src/core/token/token-manager.js';
import { globalPermissionManager } from '../src/core/token/permission-manager.js';

async function demonstratePermissionManager() {
  console.log('🎯 统一权限管理器演示\n');
  console.log('问题场景：随着系统发展，需要添加新角色，如何避免权限检查逻辑分散？\n');

  // 1. 展示当前权限配置
  console.log('📊 当前权限配置：');
  console.log('=====================================');
  
  const userPerms = globalPermissionManager.getRolePermissions('user');
  const analystPerms = globalPermissionManager.getRolePermissions('analyst');
  const adminPerms = globalPermissionManager.getRolePermissions('admin');

  console.log(`user角色:`);
  console.log(`  可访问: ${userPerms.canAccess.join(', ')}`);
  console.log(`  不可访问: ${userPerms.cannotAccess.join(', ')}`);

  console.log(`\nanalyst角色:`);
  console.log(`  可访问: ${analystPerms.canAccess.join(', ')}`);
  console.log(`  不可访问: ${analystPerms.cannotAccess.join(', ')}`);

  console.log(`\nadmin角色:`);
  console.log(`  可访问: ${adminPerms.canAccess.join(', ')}`);
  console.log(`  不可访问: ${adminPerms.cannotAccess.join(', ')}`);

  // 2. 模拟新增角色
  console.log('\n\n🔄 模拟新增角色 - "security" (安全专家)\n');
  console.log('传统方式：需要修改多处代码');
  console.log('  ❌ 修改mcp-server.ts中的权限检查逻辑');
  console.log('  ❌ 修改get_all_visible_tools的过滤逻辑');
  console.log('  ❌ 可能遗漏某些地方');
  console.log('  ❌ 容易引入bug\n');

  console.log('统一权限管理器方式：只需修改一处配置');
  console.log('  ✅ 在GROUP_PERMISSIONS中添加新角色配置');
  console.log('  ✅ 其他地方自动生效\n');

  // 3. 实际添加新角色
  console.log('🔧 实际添加新角色：');
  globalPermissionManager.registerPermissionGroup('security-management', ['security', 'admin']);
  globalPermissionManager.registerPermissionGroup('security-audit', ['security', 'analyst', 'admin']);

  // 创建新角色token
  const securityToken = globalTokenManager.createToken('security', '安全专家');
  const securityValidation = globalTokenManager.validateTokenDetailed(securityToken);

  console.log('   ✅ 已注册 security-management 分组');
  console.log('   ✅ 已注册 security-audit 分组\n');

  // 4. 验证新角色权限
  console.log('🔐 验证新角色权限：');
  
  const testTools = [
    { name: 'security_audit_tool', groups: ['security-audit'] },
    { name: 'security_management_tool', groups: ['security-management'] },
    { name: 'admin_tool', groups: ['admin-only'] },
    { name: 'analyst_tool', groups: ['analyst-only'] },
    { name: 'public_tool', groups: ['public'] }
  ];

  console.log('\nsecurity角色访问测试：');
  for (const tool of testTools) {
    const result = globalPermissionManager.checkTokenPermission(securityValidation, tool.groups);
    const status = result.allowed ? '✅ 允许' : '❌ 拒绝';
    console.log(`  ${status} ${tool.name} (${tool.groups.join(', ')})`);
    if (!result.allowed) {
      console.log(`     原因: ${result.reason}`);
    }
  }

  // 5. 工具列表过滤演示
  console.log('\n📋 工具列表过滤演示：');
  const allTools = [
    { name: 'public_tool', groups: ['public'] },
    { name: 'admin_tool', groups: ['admin-only'] },
    { name: 'analyst_tool', groups: ['analyst-only'] },
    { name: 'security_audit', groups: ['security-audit'] },
    { name: 'security_management', groups: ['security-management'] }
  ];

  const securityVisible = globalPermissionManager.filterVisibleTools(allTools, 'security');
  console.log(`security角色可见工具: ${securityVisible.map(t => t.name).join(', ')}`);

  // 6. 展示统一错误处理
  console.log('\n🎯 统一错误处理演示：');
  const invalidToken = 'invalid';
  const invalidValidation = globalTokenManager.validateTokenDetailed(invalidToken);
  const errorResult = globalPermissionManager.checkTokenPermission(invalidValidation, ['public']);
  
  console.log(`无效token错误: ${errorResult.reason}`);

  // 7. 优势总结
  console.log('\n\n📊 优势对比：');
  console.log('=====================================');
  console.log('传统方式的问题：');
  console.log('  • 权限逻辑分散在多个文件');
  console.log('  • 新增角色需要修改多处代码');
  console.log('  • 容易遗漏权限检查点');
  console.log('  • 错误信息不统一');
  console.log('  • 难以维护和调试\n');

  console.log('统一权限管理器的优势：');
  console.log('  ✅ 权限逻辑集中管理');
  console.log('  ✅ 新增角色只需修改配置');
  console.log('  ✅ 自动应用到所有检查点');
  console.log('  ✅ 统一的错误信息');
  console.log('  ✅ 易于维护和扩展');
  console.log('  ✅ 支持动态权限组注册');
  console.log('  ✅ 提供权限信息查询API\n');

  // 8. 未来扩展演示
  console.log('🔮 未来扩展示例：');
  console.log('假设需要添加更多角色：');
  console.log('');
  console.log('// 添加审计员角色');
  console.log('globalPermissionManager.registerPermissionGroup("audit", ["auditor", "admin"]);');
  console.log('');
  console.log('// 添加合规官角色');
  console.log('globalPermissionManager.registerPermissionGroup("compliance", ["compliance-officer", "admin"]);');
  console.log('');
  console.log('// 添加访客角色');
  console.log('globalPermissionManager.registerPermissionGroup("guest-access", ["guest", "user", "analyst", "admin"]);');
  console.log('');
  console.log('✅ 所有现有工具自动支持新角色！');
  console.log('✅ 无需修改任何工具代码！');

  // 清理
  globalTokenManager.deleteToken(securityToken);
  console.log('\n🎉 演示完成！');
}

// 运行演示
demonstratePermissionManager().catch(console.error);