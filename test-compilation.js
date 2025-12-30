#!/usr/bin/env node

/**
 * 编译测试脚本
 * 验证MCP框架编译后的基本功能
 */

const { spawn } = require('child_process');
const path = require('path');

// 测试工具
function runTest(name, command, expectedSuccess = true) {
  return new Promise((resolve) => {
    console.log(`\n📋 测试: ${name}`);
    console.log('='.repeat(50));
    
    const proc = spawn('sh', ['-c', command], {
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
      const success = code === 0;
      const result = success && expectedSuccess ? '✅ 通过' : '❌ 失败';
      
      console.log(`结果: ${result}`);
      if (stdout) {
        // 提取关键信息
        const lines = stdout.split('\n');
        const relevantLines = lines.filter(line => 
          line.includes('Echo:') || 
          line.includes('=') || 
          line.includes('Token') ||
          line.includes('角色') ||
          line.includes('工具') ||
          line.includes('错误')
        ).slice(0, 5);
        
        if (relevantLines.length > 0) {
          console.log('输出:', relevantLines.join('\n'));
        }
      }
      
      if (stderr && !success) {
        console.log('错误:', stderr.substring(0, 100));
      }
      
      resolve(success);
    });
  });
}

async function main() {
  console.log('🔧 MCP框架编译测试');
  console.log('='.repeat(50));
  
  const results = [];
  
  // 测试1: 基础工具 - echo
  results.push(await runTest(
    '基础工具 - echo',
    `echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"echo","arguments":{"message":"Hello World"}}}' | node build/index.js`
  ));
  
  // 测试2: 基础工具 - add
  results.push(await runTest(
    '基础工具 - add',
    `echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"add","arguments":{"a":5,"b":3}}}' | node build/index.js`
  ));
  
  // 测试3: 工具列表
  results.push(await runTest(
    '工具列表获取',
    `echo '{"jsonrpc":"2.0","id":3,"method":"tools/list","params":{}}' | node build/index.js`
  ));
  
  // 测试4: Token创建
  results.push(await runTest(
    'Token创建',
    `echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"token_create","arguments":{"role":"admin","description":"测试token"}}}' | node build/index.js`
  ));
  
  // 测试5: 角色切换
  results.push(await runTest(
    '角色切换',
    `echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"switch_role","arguments":{"role":"admin"}}}' | node build/index.js`
  ));
  
  // 测试6: 文件插件
  results.push(await runTest(
    '文件插件 - 读取',
    `echo '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"file_read","arguments":{"path":"test.txt"}}}' | node build/index.js`
  ));
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试总结');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`通过: ${passed}/${total}`);
  console.log(`状态: ${passed === total ? '✅ 全部通过' : '❌ 部分失败'}`);
  
  if (passed === total) {
    console.log('\n🎉 编译成功！所有核心功能正常工作。');
    process.exit(0);
  } else {
    console.log('\n⚠️  编译测试发现问题。');
    process.exit(1);
  }
}

main().catch(console.error);