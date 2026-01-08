/**
 * 快速冲突防护验证
 */

import { globalTokenManager } from '../../src/core/token/token-manager';
import { globalTokenConflictGuard } from '../../src/core/organization/token-conflict-guard';

async function quickTest() {
  console.log('\n=== 快速冲突防护验证 ===\n');

  // 清理
  globalTokenManager.clear();

  // 1. 创建用户Token
  const userToken1 = globalTokenManager.createToken('user_alice', '用户Alice');
  console.log('1. 创建用户Token:', userToken1);

  // 2. 检查协作单元charlie（应该无冲突）
  const check1 = globalTokenConflictGuard.checkCollaborationToken('charlie', 'Charlie团队');
  console.log('2. 检查协作单元charlie:', check1.hasConflict ? '❌ 冲突' : '✅ 无冲突');

  // 3. 手动创建一个token为charlie的用户
  (globalTokenManager as any).tokens.set('charlie', {
    token: 'charlie',
    role: 'user_charlie',
    description: '手动创建的charlie用户',
    createdAt: new Date().toISOString(),
    expiresAt: null,
    isActive: true
  });
  console.log('3. 手动创建token为charlie的用户');

  // 4. 检查协作单元charlie（应该冲突）
  const check2 = globalTokenConflictGuard.checkCollaborationToken('charlie', 'Charlie团队');
  console.log('4. 检查协作单元charlie:', check2.hasConflict ? '✅ 检测到冲突' : '❌ 未检测到冲突');
  if (check2.hasConflict) {
    console.log('   冲突详情:', check2.details);
    console.log('   建议:', check2.suggestion);
  }

  // 5. 手动创建collab_charlie
  (globalTokenManager as any).tokens.set('collab_charlie', {
    token: 'collab_charlie',
    role: 'collaboration_unit_charlie',
    description: '已存在的协作单元',
    createdAt: new Date().toISOString(),
    expiresAt: null,
    isActive: true
  });
  console.log('5. 手动创建collab_charlie');

  // 6. 再次检查（应该检测到collab_charlie已存在）
  const check3 = globalTokenConflictGuard.checkCollaborationToken('charlie', 'Charlie团队');
  console.log('6. 再次检查协作单元charlie:', check3.hasConflict ? '✅ 检测到冲突' : '❌ 未检测到冲突');
  if (check3.hasConflict) {
    console.log('   冲突详情:', check3.details);
  }

  // 7. 检查collab_charlie（应该无冲突，因为是协作单元）
  const check4 = globalTokenConflictGuard.checkCollaborationToken('collab_charlie', '测试');
  console.log('7. 检查协作单元collab_charlie:', check4.hasConflict ? '❌ 冲突' : '✅ 无冲突');

  // 8. 检查admin（通用名称）
  const check5 = globalTokenConflictGuard.checkCollaborationToken('admin', '管理员');
  console.log('8. 检查协作单元admin:', check5.hasConflict ? '✅ 检测到通用名称' : '❌ 未检测到');

  // 9. 检查用户Token使用保留前缀
  const check6 = globalTokenConflictGuard.checkUserToken('collab_test', '测试用户');
  console.log('9. 用户Token使用保留前缀:', check6.hasConflict ? '✅ 检测到冲突' : '❌ 未检测到');

  console.log('\n=== 验证完成 ===\n');
}

quickTest().catch(console.error);