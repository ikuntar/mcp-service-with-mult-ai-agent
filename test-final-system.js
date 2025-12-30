#!/usr/bin/env node

/**
 * 最终系统测试 - 演示简化后的Token系统
 */

const { globalTokenManager } = require('./build/core/token-manager.js');

console.log('🔧 简化后的Token系统测试\n');
console.log('='.repeat(60));

// 1. 创建Token
console.log('\n1. 创建Token');
console.log('-'.repeat(60));

const userToken = globalTokenManager.createToken('user', '用户token');
const analystToken = globalTokenManager.createToken('analyst', '分析师token', '2h');
const adminToken = globalTokenManager.createToken('admin', '管理员token', '1h');

console.log(`✅ 用户token: ${userToken.substring(0, 16)}...`);
console.log(`✅ 分析师token: ${analystToken.substring(0, 16)}...`);
console.log(`✅ 管理员token: ${adminToken.substring(0, 16)}...`);

// 2. 验证Token
console.log('\n2. 验证Token');
console.log('-'.repeat(60));

const roles = [userToken, analystToken, adminToken].map(token => 
  globalTokenManager.validateToken(token)
);

console.log(`用户token -> 角色: ${roles[0]}`);
console.log(`分析师token -> 角色: ${roles[1]}`);
console.log(`管理员token -> 角色: ${roles[2]}`);

// 3. Token统计
console.log('\n3. Token统计');
console.log('-'.repeat(60));

const stats = globalTokenManager.getStats();
console.log(`总token数: ${stats.total}`);
console.log(`有效token: ${stats.active}`);
console.log(`角色分布: ${JSON.stringify(stats.byRole)}`);

// 4. 演示权限差异
console.log('\n4. 工具权限对比');
console.log('-'.repeat(60));

console.log('用户角色 (user):');
console.log('  • echo, add');
console.log('  • get_token_role_info, validate_token');
console.log('  • file_read, file_write, file_search');
console.log('  • switch_role');

console.log('\n分析师角色 (analyst):');
console.log('  • 用户角色的所有工具');
console.log('  • demo_tool (高级演示工具)');
console.log('  • data_filter, data_sort, data_transform, data_aggregate');

console.log('\n管理员角色 (admin):');
console.log('  • 分析师角色的所有工具');
console.log('  • token_create, token_validate, token_info');
console.log('  • token_delete, token_deactivate, token_activate');
console.log('  • token_renew, token_cleanup, token_stats');

// 5. 使用流程演示
console.log('\n5. 完整使用流程');
console.log('-'.repeat(60));

console.log('步骤1: 创建Token');
console.log('  echo \'{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"token_create","arguments":{"role":"analyst","description":"我的token"}}}\' | node build/index.js');

console.log('\n步骤2: 使用Token获取工具列表');
console.log('  echo \'{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{"_meta":{"token":"your-token"}}}\' | node build/index.js');

console.log('\n步骤3: 验证Token');
console.log('  echo \'{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"validate_token","arguments":{"token":"your-token"}}}\' | node build/index.js');

console.log('\n步骤4: 获取角色信息');
console.log('  echo \'{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_token_role_info","arguments":{"token":"your-token"}}}\' | node build/index.js');

// 6. 架构总结
console.log('\n6. 架构总结');
console.log('-'.repeat(60));

console.log('✅ 已删除的组件:');
console.log('  • src/advanced-tools/ 目录');
console.log('  • src/core/mcp-tool-fetcher.ts');
console.log('  • src/tools/advanced-tool-fetcher.ts');
console.log('  • fetchAdvancedToolsTool 工具');
console.log('  • advanced_test 工具');

console.log('\n✅ 保留的组件:');
console.log('  • src/core/token-manager.ts (Token管理器)');
console.log('  • src/tools/token-management.ts (9个Token管理工具)');
console.log('  • src/tools/token-based-tool-fetcher.ts (2个Token查询工具)');
console.log('  • src/tools/demo-tool.ts (演示工具，使用groups过滤)');
console.log('  • src/groups/data-group.ts (数据处理工具组)');
console.log('  • src/plugins/file-plugin.ts (文件插件)');

console.log('\n✅ 核心机制:');
console.log('  • 主服务器ListToolsRequestHandler支持token参数');
console.log('  • 工具通过groups标签进行权限控制');
console.log('  • Token绑定角色，角色映射到groups');
console.log('  • 系统自动根据角色过滤可见工具');

console.log('\n' + '='.repeat(60));
console.log('✅ 系统简化完成！');
console.log('='.repeat(60));