#!/usr/bin/env node

/**
 * 详细测试Token权限系统
 */

const { spawn } = require('child_process');
const { globalTokenManager } = require('./build/core/token-manager.js');

console.log('🔧 详细Token权限系统测试\n');

// 创建测试token
const analystToken = globalTokenManager.createToken('analyst', '测试analyst');
const adminToken = globalTokenManager.createToken('admin', '测试admin');

console.log('创建的Token:');
console.log(`  analyst: ${analystToken}`);
console.log(`  admin: ${adminToken}`);

// 测试函数
function testRequest(description, request) {
  return new Promise((resolve) => {
    console.log(`\n📋 ${description}`);
    console.log('请求:', JSON.stringify(request, null, 2));
    
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
      console.log('响应:', stdout.trim().split('\n').pop());
      resolve({ success: code === 0 });
    });
  });
}

async function main() {
  // 测试1: 默认user角色
  await testRequest('测试1: 默认user角色获取工具列表', {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  });
  
  // 测试2: 使用analyst token
  await testRequest('测试2: 使用analyst token获取工具列表', {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {
      _meta: {
        token: analystToken
      }
    }
  });
  
  // 测试3: 使用admin token
  await testRequest('测试3: 使用admin token获取工具列表', {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/list",
    params: {
      _meta: {
        token: adminToken
      }
    }
  });
  
  // 测试4: 验证token
  await testRequest('测试4: 验证analyst token', {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "validate_token",
      arguments: {
        token: analystToken
      }
    }
  });
  
  // 测试5: 获取token信息
  await testRequest('测试5: 获取analyst token信息', {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "get_token_role_info",
      arguments: {
        token: analystToken
      }
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 详细测试完成');
  console.log('='.repeat(60));
}

main().catch(console.error);