/**
 * 文件规则存储实现
 * 将规则持久化到JSON文件
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { RuleStorage } from './rule-storage';

export class FileRuleStorage implements RuleStorage {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.mkdir) {
      // Node.js 14.x 兼容
      this.ensureDir(dir);
    }
  }

  private async ensureDir(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (e) {
      // 目录已存在则忽略
    }
  }

  async get(key: string): Promise<any> {
    try {
      const data = await this.readData();
      return data[key];
    } catch (error) {
      return undefined;
    }
  }

  async save(key: string, value: any): Promise<void> {
    const data = await this.readData();
    data[key] = value;
    await this.writeData(data);
  }

  async delete(key: string): Promise<void> {
    const data = await this.readData();
    delete data[key];
    await this.writeData(data);
  }

  private async readData(): Promise<Record<string, any>> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // 文件不存在或读取失败，返回空对象
      return {};
    }
  }

  private async writeData(data: any): Promise<void> {
    // 确保目录存在
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (e) {
      // 目录已存在则忽略
    }
    
    await fs.writeFile(
      this.filePath, 
      JSON.stringify(data, null, 2), 
      'utf-8'
    );
  }
}
