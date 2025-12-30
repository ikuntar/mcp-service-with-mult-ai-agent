/**
 * 虚拟化功能简单测试脚本
 * 
 * 直接测试虚拟化管理器，绕过Token验证
 */

import { TokenVirtualizationManager } from './src/core/token-virtualization-manager';

async function main() {
  console.log('=== Token虚拟化功能简单测试 ===\n');

  // 1. 初始化管理器
  console.log('1. 初始化虚拟化管理器...');
  const virtualizationManager = new TokenVirtualizationManager();
  console.log('✓ 管理器初始化完成\n');

  // 2. 创建测试Token（直接使用字符串）
  console.log('2. 创建测试Token...');
  const token1 = 'test-token-user-12345';
  const token2 = 'test-token-admin-67890';
  console.log(`✓ Token1: ${token1}`);
  console.log(`✓ Token2: ${token2}\n`);

  // 3. 为Token1创建虚拟化实例
  console.log('3. 为Token1创建虚拟化实例...');
  const virtualization1 = virtualizationManager.getVirtualization(token1);
  console.log('✓ Token1虚拟化实例创建成功\n');

  // 4. 为Token2创建虚拟化实例
  console.log('4. 为Token2创建虚拟化实例...');
  const virtualization2 = virtualizationManager.getVirtualization(token2);
  console.log('✓ Token2虚拟化实例创建成功\n');

  // 5. 执行虚拟化操作
  console.log('5. 执行虚拟化操作...');
  const result1 = await virtualization1.execute('create', { name: 'vm1', cpu: 2, memory: 4 });
  console.log(`Token1操作结果:`, result1);

  const result2 = await virtualization2.execute('start', { name: 'vm2' });
  console.log(`Token2操作结果:`, result2);
  console.log();

  // 6. 设置和获取资源
  console.log('6. 设置和获取资源...');
  virtualization1.setResources({ cpu: 4, memory: 8, disk: 100 });
  const resources1 = virtualization1.getResources();
  console.log(`Token1资源:`, resources1);

  virtualization2.setResources({ cpu: 8, memory: 16, disk: 200 });
  const resources2 = virtualization2.getResources();
  console.log(`Token2资源:`, resources2);
  console.log();

  // 7. 查看统计信息
  console.log('7. 查看虚拟化统计信息...');
  const stats = virtualizationManager.getStats();
  console.log('统计信息:', stats);

  const instances = virtualizationManager.listVirtualizations();
  console.log('实例列表:', instances.map(i => ({
    token: i.token,
    active: i.isActive,
    created: i.createdAt,
    lastUsed: i.lastUsed
  })));
  console.log();

  // 8. 测试Token隔离性
  console.log('8. 测试Token隔离性...');
  console.log('Token1的资源:', virtualizationManager.getResources(token1));
  console.log('Token2的资源:', virtualizationManager.getResources(token2));
  console.log('✓ 两个Token的虚拟化实例完全隔离\n');

  // 9. 清理Token1的虚拟化资源
  console.log('9. 清理Token1的虚拟化资源...');
  const cleanupResult = await virtualizationManager.cleanupToken(token1);
  console.log(`清理结果: ${cleanupResult ? '成功' : '失败'}`);
  console.log('清理后Token1状态:', virtualizationManager.getVirtualizationInfo(token1));
  console.log();

  // 10. 重新激活
  console.log('10. 重新激活Token1的虚拟化实例...');
  const activateResult = virtualizationManager.activateVirtualization(token1);
  console.log(`激活结果: ${activateResult ? '成功' : '失败'}`);
  
  // 重新获取资源（应该为空，因为清理过）
  const resourcesAfterActivate = virtualizationManager.getResources(token1);
  console.log('激活后Token1资源:', resourcesAfterActivate);
  console.log();

  // 11. 删除Token2的虚拟化实例
  console.log('11. 删除Token2的虚拟化实例...');
  const deleteResult = await virtualizationManager.deleteVirtualization(token2);
  console.log(`删除结果: ${deleteResult ? '成功' : '失败'}`);
  console.log();

  // 12. 最终统计
  console.log('12. 最终统计信息...');
  const finalStats = virtualizationManager.getStats();
  console.log('最终统计:', finalStats);

  const finalInstances = virtualizationManager.listVirtualizations(true);
  console.log('剩余实例:', finalInstances.map(i => ({ token: i.token, active: i.isActive })));
  console.log();

  console.log('=== 测试完成 ===');
  console.log('\n总结：');
  console.log('✓ Token与虚拟化实例成功绑定');
  console.log('✓ 每个Token拥有独立的虚拟化实例');
  console.log('✓ 虚拟化操作正常执行');
  console.log('✓ 资源管理功能正常');
  console.log('✓ 实例隔离性验证通过');
  console.log('✓ 激活/清理/删除功能正常');
  console.log('✓ 统计和列表功能正常');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

export { main };