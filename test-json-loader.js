// 测试JSON加载器
const { createPromptManagerWithJSON, autoLoadPrompts } = require('./src/core/ai-agent/prompt-engine');

async function testJSONLoader() {
  console.log('=== JSON加载器测试 ===\n');

  // 测试1：自动扫描并加载
  console.log('测试1：自动扫描并加载默认配置');
  try {
    const result = await autoLoadPrompts();
    console.log('加载结果:', {
      success: result.loadResult.success,
      loaded: result.loadResult.loaded,
      files: result.loadResult.files.length,
      errors: result.loadResult.errors.length
    });

    if (result.loadResult.success) {
      // 测试渲染
      const render1 = result.manager.renderSystemPrompt('default-assistant');
      console.log('\n默认助手提示词:');
      console.log(render1.content);

      const render2 = result.manager.renderSystemPrompt('code-generator', {
        language: 'TypeScript',
        task: '实现快速排序'
      });
      console.log('\n代码生成器提示词:');
      console.log(render2.content);

      const render3 = result.manager.renderAppendPrompt('format-json');
      console.log('\n格式要求提示词:');
      console.log(render3.content);
    }
  } catch (error) {
    console.error('错误:', error.message);
  }

  // 测试2：自定义目录
  console.log('\n\n测试2：自定义目录加载');
  try {
    const result = await createPromptManagerWithJSON(
      { strictMode: false },
      { rootDir: './src/core/ai-agent/prompts' }
    );
    
    console.log('加载结果:', {
      success: result.loadResult.success,
      loaded: result.loadResult.loaded,
      files: result.loadResult.files
    });

    // 列出所有提示词
    const allPrompts = result.manager.export();
    console.log('\n所有提示词:');
    console.log('- 系统提示词:', allPrompts.systemPrompts.map(p => p.id));
    console.log('- 追加提示词:', allPrompts.appendPrompts.map(p => p.id));
    console.log('- 拼接提示词:', allPrompts.concatenatePrompts.map(p => p.id));
  } catch (error) {
    console.error('错误:', error.message);
  }

  // 测试3：导出配置
  console.log('\n\n测试3：导出配置到JSON');
  try {
    const result = await autoLoadPrompts();
    const loader = require('./src/core/ai-agent/prompt-engine').JSONLoader;
    const jsonLoader = new loader(result.manager);
    
    const exported = await jsonLoader.exportToJSON('./test-export');
    console.log('导出文件:', exported);
  } catch (error) {
    console.error('错误:', error.message);
  }

  console.log('\n=== 测试完成 ===');
}

testJSONLoader().catch(console.error);