#!/usr/bin/env node

/**
 * 测试使用token获取工具列表的功能
 */

const { spawn } = require('child_process');
const { globalTokenManager } = require('./build/core/token-manager.js');

console.log('🔧 测试Token工具列表获取功能\n');

// 创建不同角色的token
const tokens = {
  user: globalTokenManager.createToken('user', '用户token'),
  analyst: globalTokenManager.createToken('analyst', '分析师token'),
  admin: globalTokenManager.createToken('admin', '管理员token')
};

console.log('创建的Token:');
Object.entries(tokens).forEach(([role, token]) => {
  console.log(`  ${role}: ${token.substring(0, 16)}...`);
});

// 测试函数
function testToolsList(role, token) {
  return new Promise((resolve) => {
    console.log(`\n📋 测试 ${role} 角色的工具列表:`);
    console.log('-'.repeat(60));
    
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {
        _meta: {
          token: token
        }
      }
    };
    
    const proc = spawn('sh', ['-c', `echo '${JSON.stringify(request)}' | node build/index.js`], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0 && stdout) {
        try {
          const response = JSON.parse(stdout.trim().split('\n').pop());
          if (response.result && response.result.tools) {
            const tools = response.result.tools;
            console.log(`✅ 获取到 ${tools.length} 个工具`);
            console.log('工具列表:');
            tools.forEach(tool => {
              console.log(`  • ${tool.name}`);
            });
            resolve({ success: true, role, toolCount: tools.length, tools });
          } else {
            console.log('❌ 响应格式错误');
            resolve({ success: false, role });
          }
        } catch (e) {
          console.log('❌ 解析错误:', e.message);
          resolve({ success: false, role });
        }
      } else {
        console.log('❌ 执行失败');
        if (stderr) console.log('错误:', stderr.substring(0, 100));
        resolve({ success: false, role });
      }
    });
  });
}

async function main() {
  const results = [];
  
  // 测试每个角色
  for (const [role, token] of Object.entries(tokens)) {
    const result = await testToolsList(role, token);
    results.push(result);
  }
  
  // 总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.role}: ${result.success ? `${result.toolCount}个工具` : '失败'}`);
  });
  
  // 验证权限差异
  console.log('\n🔍 权限验证:');
  const userTools = results.find(r => r.role === 'user')?.tools.map(t => t.name) || [];
  const analystTools = results.find(r => r.role === 'analyst')?.tools.map(t => t.name) || [];
  const adminTools = results.find(r => r.role === 'admin')?.tools.map(t => t.name) || [];
  
  console.log(`用户角色: ${userTools.length}个工具`);
  console.log(`分析师角色: ${analystTools.length}个工具 (比用户多 ${analystTools.filter(t => !userTools.includes(t)).length}个)`);
  console.log(`管理员角色: ${adminTools.length}个工具 (比分析师多 ${adminTools.filter(t => !analystTools.includes(t)).length}个)`);
  
  const allSuccess = results.every(r => r.success);
  console.log(`\n${allSuccess ? '✅' : '❌'} 整体测试: ${allSuccess ? '全部通过' : '部分失败'}`);
  
  process.exit(allSuccess ? 0 : 1);
}

main().catch(console.error);