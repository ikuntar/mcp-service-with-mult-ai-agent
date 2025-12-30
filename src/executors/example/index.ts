/**
 * 示例执行器集合导出
 * 
 * 这个目录包含了所有执行器的示例实现。
 * 你可以将这些示例复制到其他位置并根据需求修改。
 */

// 文件系统执行器示例
export { FileSystemExecutorFactory as ExampleFileSystemFactory } from './filesystem/factory';
export { FileSystemExecutorInstance as ExampleFileSystemInstance } from './filesystem/instance';

// 网络执行器示例
export { NetworkExecutorFactory as ExampleNetworkFactory } from './network/factory';
export { NetworkExecutorInstance as ExampleNetworkInstance } from './network/instance';

// 系统执行器示例
export { SystemExecutorFactory as ExampleSystemFactory } from './system/factory';
export { SystemExecutorInstance as ExampleSystemInstance } from './system/instance';

// 默认执行器示例
export { DefaultExecutorFactory as ExampleDefaultFactory } from './default/factory';
export { DefaultExecutorInstance as ExampleDefaultInstance } from './default/instance';

/**
 * 使用示例：
 * 
 * ```typescript
 * import { 
 *   ExampleFileSystemFactory,
 *   ExampleNetworkFactory 
 * } from './src/executors/example';
 * 
 * // 1. 复制示例到你的项目目录
 * // 2. 根据需求修改实现
 * // 3. 在你的工厂中使用
 * ```
 */
