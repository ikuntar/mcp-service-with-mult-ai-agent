/**
 * Token冲突防护测试
 * 
 * 测试协作单元Token和用户Token的冲突检测和防护机制
 */

import {
  globalOrganizationManager,
  createCollaborationUnit,
  createOrganizationMember,
  AuthorityType,
  globalTokenConflictGuard,
  TokenConflictGuard
} from '../../src/core/organization';

import { globalTokenManager } from '../../src/core/token/token-manager';

async function testTokenConflict() {
  console.log('\n=== Token冲突防护测试 ===\n');

  // 清理现有数据
  await globalOrganizationManager.cleanup();
  globalTokenManager.clear();

  // 测试1：正常注册（无冲突）
  console.log('🧪 测试1: 正常注册（无冲突）');
  try {
    const token1 = globalTokenManager.createToken('user_alice', '用户Alice');
    const member1 = globalOrganizationManager.createOrganizationMember('Alice', token1);
    console.log('✅ 用户Alice创建成功，Token:', token1.substring(0, 16) + '...');

    const unit1 = await globalOrganizationManager.registerCollaborationUnit({
      id: 'frontend-team',
      name: '前端开发团队',
      authorities: [AuthorityType.READ, AuthorityType.WRITE, AuthorityType.EXECUTE],
      permissionBoundaries: {
        allowedTools: ['file_*', 'http_*'],
        allowedResources: ['*'],
        maxConcurrency: 5
      },
      chatConfig: {
        enabled: true,
        name: '前端团队群聊'
      }
    });
    console.log('✅ 协作单元frontend-team创建成功');
  } catch (error: any) {
    console.log('❌ 测试1失败:', error.message);
  }

  // 测试2：协作单元Token冲突
  console.log('\n🧪 测试2: 协作单元Token冲突检测');
  try {
    // 手动创建一个与协作单元冲突的Token
    const conflictToken = 'collab_backend-team';
    globalTokenManager.createToken('user_bob', '用户Bob', null);
    
    // 尝试创建同名协作单元
    const unit2 = await globalOrganizationManager.registerCollaborationUnit({
      id: 'backend-team',
      name: '后端开发团队',
      authorities: [AuthorityType.READ, AuthorityType.WRITE],
      permissionBoundaries: {
        allowedTools: ['database_*'],
        allowedResources: ['*'],
        maxConcurrency: 3
      }
    });
    console.log('❌ 测试2失败: 应该检测到冲突但未检测到');
  } catch (error: any) {
    console.log('✅ 测试2通过: 正确检测到冲突 -', error.message);
  }

  // 测试3：用户Token使用保留前缀
  console.log('\n🧪 测试3: 用户Token使用保留前缀');
  try {
    const conflictCheck = globalTokenConflictGuard.checkUserToken('collab_test', '测试用户');
    if (conflictCheck.hasConflict) {
      console.log('✅ 测试3通过: 正确检测到保留前缀冲突');
      console.log('   建议:', conflictCheck.suggestion);
    } else {
      console.log('❌ 测试3失败: 未检测到保留前缀冲突');
    }
  } catch (error: any) {
    console.log('❌ 测试3异常:', error.message);
  }

  // 测试4：协作单元ID过于通用
  console.log('\n🧪 测试4: 协作单元ID过于通用');
  try {
    const conflictCheck = globalTokenConflictGuard.checkCollaborationToken('admin', '管理员团队');
    if (conflictCheck.hasConflict) {
      console.log('✅ 测试4通过: 正确检测到通用名称冲突');
      console.log('   建议:', conflictCheck.suggestion);
    } else {
      console.log('❌ 测试4失败: 未检测到通用名称冲突');
    }
  } catch (error: any) {
    console.log('❌ 测试4异常:', error.message);
  }

  // 测试5：安全注册协作单元
  console.log('\n🧪 测试5: 安全注册协作单元');
  try {
    const result = await globalTokenConflictGuard.safeRegisterCollaborationToken(
      'security-team',
      '安全团队',
      '负责安全审查的团队'
    );
    
    if (result.success) {
      console.log('✅ 测试5通过: 安全注册成功');
      console.log('   Token:', result.token);
    } else {
      console.log('❌ 测试5失败:', result.error);
    }
  } catch (error: any) {
    console.log('❌ 测试5异常:', error.message);
  }

  // 测试6：冲突自动修复建议
  console.log('\n🧪 测试6: 冲突自动修复建议');
  try {
    const conflict = globalTokenConflictGuard.checkCollaborationToken('admin', '管理员团队');
    if (conflict.hasConflict) {
      const fixedId = globalTokenConflictGuard.autoFixConflict('admin', conflict);
      if (fixedId) {
        console.log('✅ 测试6通过: 自动修复建议有效');
        console.log('   原ID: admin -> 新ID:', fixedId);
      } else {
        console.log('❌ 测试6失败: 无法自动修复');
      }
    } else {
      console.log('❌ 测试6失败: 未检测到冲突');
    }
  } catch (error: any) {
    console.log('❌ 测试6异常:', error.message);
  }

  // 测试7：冲突报告
  console.log('\n🧪 测试7: 冲突报告');
  try {
    const report = globalTokenConflictGuard.getConflictReport();
    console.log('✅ 测试7通过: 冲突报告生成成功');
    console.log('   用户Token冲突数:', report.userTokens.length);
    console.log('   协作单元Token冲突数:', report.collaborationTokens.length);
  } catch (error: any) {
    console.log('❌ 测试7异常:', error.message);
  }

  // 测试8：完整流程 - 演示冲突防护
  console.log('\n🧪 测试8: 完整流程演示');
  try {
    // 清理
    await globalOrganizationManager.cleanup();
    globalTokenManager.clear();

    // 创建用户
    const userToken1 = globalTokenManager.createToken('user_charlie', '用户Charlie');
    const member1 = globalOrganizationManager.createOrganizationMember('Charlie', userToken1);
    console.log('✅ 创建用户Charlie');

    // 尝试创建冲突的协作单元
    try {
      await globalOrganizationManager.registerCollaborationUnit({
        id: 'charlie', // 与用户名冲突
        name: 'Charlie团队',
        authorities: [AuthorityType.READ],
        permissionBoundaries: {
          allowedTools: ['file_read'],
          allowedResources: ['*'],
          maxConcurrency: 1
        }
      });
      console.log('❌ 应该检测到冲突');
    } catch (error: any) {
      console.log('✅ 检测到冲突，建议使用修复后的ID');
      
      // 使用修复后的ID
      const fixedId = globalTokenConflictGuard.autoFixConflict('charlie', {
        hasConflict: true,
        conflictType: 'duplicate',
        details: '冲突',
        suggestion: '使用不同ID'
      });
      
      if (fixedId) {
        await globalOrganizationManager.registerCollaborationUnit({
          id: fixedId,
          name: 'Charlie团队',
          authorities: [AuthorityType.READ],
          permissionBoundaries: {
            allowedTools: ['file_read'],
            allowedResources: ['*'],
            maxConcurrency: 1
          }
        });
        console.log('✅ 使用修复ID创建成功:', fixedId);
      }
    }
  } catch (error: any) {
    console.log('❌ 测试8异常:', error.message);
  }

  console.log('\n=== Token冲突防护测试完成 ===\n');
}

// 如果直接运行此文件
if (require.main === module) {
  testTokenConflict().catch(console.error);
}

export { testTokenConflict };