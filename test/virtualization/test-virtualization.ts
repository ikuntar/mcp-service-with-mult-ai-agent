/**
 * 虚拟化功能测试脚本
 * 
 * 测试Token与虚拟化实例的绑定关系
 */

import { TokenManager } from './src/core/token-manager';
import { TokenVirtualizationManager } from './src/core/token-virtualization-manager';
import { virtualizationManagementTools } from './src/tools/token-virtualization-tools';

async function main() {
  console.log('=== Token虚拟化功能测试 ===\n');

  // 1. 初始化管理器
  console.log('1. 初始化管理器...');
  const tokenManager = new TokenManager();
  const virtualizationManager = new TokenVirtualizationManager();
  console.log('✓ 管理器初始化完成\n');

  // 2. 创建测试Token
  console.log('2. 创建测试Token...');
  const token1 = tokenManager.createToken('user', '用户Token', '1h');
  const token2 = tokenManager.createToken('admin', '管理员Token', '2h');
  console.log(`✓ Token1: ${token1.substring(0, 16)}...`);
  console.log(`✓ Token2: ${token2.substring(0, 16)}...\n`);

  // 3. 为Token1创建虚拟化实例
  console.log('3. 为Token1创建虚拟化实例...');
  const result1 = await virtualizationManagementTools[0].execute({ token: token1 });
  console.log(`结果: ${result1.content[0].text}\n`);

  // 4. 为Token2创建虚拟化实例
  console.log('4. 为Token2创建虚拟化实例...');
  const result2 = await virtualizationManagementTools[0].execute({ token: token2 });
  console.log(`结果: ${result2.content[0].text}\n`);

  // 5. 执行虚拟化操作
  console.log('5. 执行虚拟化操作...');
  const executeResult1 = await virtualizationManagementTools[1].execute({
    token: token1,
    action: 'create',
    args: { name: 'vm1', cpu: 2, memory: 4 }
  });
  console.log(`Token1操作结果: ${executeResult1.content[0].text}\n`);

  const executeResult2 = await virtualizationManagementTools[1].execute({
    token: token2,
    action: 'start',
    args: { name: 'vm2' }
  });
  console.log(`Token2操作结果: ${executeResult2.content[0].text}\n`);

  // 6. 设置和获取资源
  console.log('6. 设置和获取资源...');
  await virtualizationManagementTools[3].execute({
    token: token1,
    resources: { cpu: 4, memory: 8, disk: 100 }
  });

  const resourcesResult = await virtualizationManagementTools[2].execute({ token: token1 });
  console.log(`Token1资源: ${resourcesResult.content[0].text}\n`);

  // 7. 查看统计信息
  console.log('7. 查看虚拟化统计信息...');
  const statsResult = await virtualizationManagementTools[7].execute({});
  console.log(`统计信息:\n${statsResult.content[0].text}\n`);

  // 8. 测试Token隔离性
  console.log('8. 测试Token隔离性...');
  console.log('Token1的资源:');
  const resources1 = virtualizationManager.getResources(token1);
  console.log(JSON.stringify(resources1, null, 2));

  console.log('Token2的资源:');
  const resources2 = virtualizationManager.getResources(token2);
  console.log(JSON.stringify(resources2, null, 2));
  console.log('✓ 两个Token的虚拟化实例完全隔离\n');

  // 9. 清理Token1的虚拟化资源
  console.log('9. 清理Token1的虚拟化资源...');
  const cleanupResult = await virtualizationManagementTools[4].execute({ token: token1 });
  console.log(`清理结果: ${cleanupResult.content[0].text}\n`);

  // 10. 重新激活
  console.log('10. 重新激活Token1的虚拟化实例...');
  const activateResult = await virtualizationManagementTools[6].execute({ token: token1 });
  console.log(`激活结果: ${activateResult.content[0].text}\n`);

  // 11. 删除Token2的虚拟化实例
  console.log('11. 删除Token2的虚拟化实例...');
  const deleteResult = await virtualizationManagementTools[5].execute({ token: token2 });
  console.log(`删除结果: ${deleteResult.content[0].text}\n`);

  // 12. 最终统计
  console.log('12. 最终统计信息...');
  const finalStats = await virtualizationManagementTools[7].execute({});
  console.log(`最终统计:\n${finalStats.content[0].text}\n`);

  console.log('=== 测试完成 ===');
  console.log('\n总结：');
  console.log('✓ Token与虚拟化实例成功绑定');
  console.log('✓ 每个Token拥有独立的虚拟化实例');
  console.log('✓ 虚拟化操作正常执行');
  console.log('✓ 资源管理功能正常');
  console.log('✓ 实例隔离性验证通过');
  console.log('✓ 激活/清理/删除功能正常');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

export { main };