#!/usr/bin/env node

/**
 * 完整流程演示脚本
 * 展示从创建token到使用token获取工具列表的完整流程
 */

const { spawn } = require('child_process');
const { globalTokenManager } = require('./build/core/token-manager.js');

console.log('🚀 完整Token系统流程演示\n');

// 步骤1: 创建token
console.log('步骤 1: 创建Token');
console.log('-'.repeat(50));

const analystToken = globalTokenManager.createToken('analyst', '演示用分析师token', '1h');
console.log(`✅ 创建分析师token: ${analystToken}`);
console.log(`   短token: ${analystToken.substring(0, 16)}...`);

// 步骤2: 验证token
console.log('\n步骤 2: 验证Token');
console.log('-'.repeat(50));

const role = globalTokenManager.validateToken(analystToken);
console.log(`✅ Token验证成功，角色: ${role}`);

// 步骤3: 获取token信息
console.log('\n步骤 3: 获取Token详细信息');
console.log('-'.repeat(50));

const info = globalTokenManager.getTokenInfo(analystToken);
console.log(`📊 Token信息:`);
console.log(`   角色: ${info.role}`);
console.log(`   描述: ${info.description}`);
console.log(`   创建: ${info.createdAt}`);
console.log(`   过期: ${info.expiresAt || '永久'}`);
console.log(`   状态: ${info.isActive ? '✅ 有效' : '❌ 无效'}`);

// 步骤4: 演示工具权限差异
console.log('\n步骤 4: 不同角色的工具权限对比');
console.log('-'.repeat(50));

const rolePermissions = {
  'user': ['echo', 'add', 'validate_token', 'get_token_role_info', 'file_read', 'file_write', 'file_search'],
  'analyst': ['echo', 'add', 'demo_tool', 'validate_token', 'get_token_role_info', 'data_filter', 'data_sort', 'data_transform', 'data_aggregate', 'file_read', 'file_write', 'file_search'],
  'admin': ['所有工具 + Token管理工具']
};

console.log('用户角色 (user):');
console.log('  ', rolePermissions.user.join(', '));

console.log('\n分析师角色 (analyst):');
console.log('  ', rolePermissions.analyst.join(', '));

console.log('\n管理员角色 (admin):');
console.log('  ', rolePermissions.admin.join(', '));

// 步骤5: 演示基于token的工具获取
console.log('\n步骤 5: 基于Token的工具获取流程');
console.log('-'.repeat(50));

console.log('流程说明:');
console.log('  1️⃣ 客户端调用 fetch_tools_by_token(token)');
console.log('  2️⃣ 工具验证token有效性');
console.log('  3️⃣ 根据token角色获取对应工具列表');
console.log('  4️⃣ 返回过滤后的工具列表');

console.log('\n示例请求:');
const exampleRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "fetch_tools_by_token",
    arguments: {
      token: analystToken,
      include_details: true,
      tool_type: "all"
    }
  }
};

console.log('  ', JSON.stringify(exampleRequest, null, 2).split('\n').join('\n  '));

// 步骤6: 演示主服务器工具列表请求
console.log('\n步骤 6: 主服务器工具列表请求');
console.log('-'.repeat(50));

console.log('使用token获取工具列表:');
const listRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {
    _meta: {
      token: analystToken
    }
  }
};

console.log('  ', JSON.stringify(listRequest, null, 2).split('\n').join('\n  '));

console.log('\n服务器处理流程:');
console.log('  1. 解析请求中的token参数');
console.log('  2. 验证token并获取角色');
console.log('  3. 根据角色过滤各容器的工具');
console.log('  4. 返回可见工具列表');

// 步骤7: Token管理工具演示
console.log('\n步骤 7: Token管理工具（管理员专用）');
console.log('-'.repeat(50));

const adminToken = globalTokenManager.createToken('admin', '管理员token', '2h');
console.log('管理员token:', adminToken.substring(0, 16) + '...');

const tokenTools = [
  'token_create - 创建新token',
  'token_validate - 验证token',
  'token_info - 获取token信息',
  'token_delete - 删除token',
  'token_deactivate - 禁用token',
  'token_activate - 激活token',
  'token_renew - 续期token',
  'token_cleanup - 清理过期token',
  'token_stats - 获取统计信息'
];

console.log('可用的Token管理工具:');
tokenTools.forEach(tool => {
  console.log(`  • ${tool}`);
});

// 步骤8: 时效性功能演示
console.log('\n步骤 8: 时效性功能演示');
console.log('-'.repeat(50));

const tempToken = globalTokenManager.createToken('user', '临时token', '3s');
console.log(`创建临时token: ${tempToken.substring(0, 16)}... (3秒后过期)`);

setTimeout(() => {
  const expiredRole = globalTokenManager.validateToken(tempToken);
  console.log(`3秒后验证: ${expiredRole === null ? '✅ 已过期' : '❌ 仍然有效'}`);
  
  // 续期演示
  globalTokenManager.renewToken(tempToken, '10s');
  const renewedRole = globalTokenManager.validateToken(tempToken);
  console.log(`续期后验证: ${renewedRole === 'user' ? '✅ 续期成功' : '❌ 续期失败'}`);
  
  // 最终统计
  console.log('\n步骤 9: 最终统计');
  console.log('-'.repeat(50));
  
  const stats = globalTokenManager.getStats();
  console.log('Token系统状态:');
  console.log(`  总数: ${stats.total}`);
  console.log(`  有效: ${stats.active}`);
  console.log(`  过期: ${stats.expired}`);
  console.log(`  禁用: ${stats.inactive}`);
  console.log(`  角色分布: ${JSON.stringify(stats.byRole)}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 完整流程演示完成！');
  console.log('='.repeat(60));
  
  console.log('\n📝 使用总结:');
  console.log('1. Token管理工具提供完整的增删改查功能');
  console.log('2. 支持时效性控制（默认永久）');
  console.log('3. 基于token的角色权限控制');
  console.log('4. 工具列表请求支持token参数');
  console.log('5. 系统自动根据角色过滤可见工具');
  
}, 3500);