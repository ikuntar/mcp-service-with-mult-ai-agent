/**
 * Token和角色管理器
 *
 * 用于维护token和对应角色的组件，支持增删改查和时效性管理
 */

import { randomUUID } from 'crypto';

/**
 * Token信息接口
 */
export interface TokenInfo {
  token: string;
  role: string;
  description?: string;
  createdAt: string;
  expiresAt: string | null; // null表示永不过期
  lastUsed?: string;
  isActive: boolean;
}

/**
 * Token验证结果接口
 */
export interface TokenValidationResult {
  isValid: boolean;
  role: string | null;
  tokenInfo: TokenInfo | null;
  error?: string;
}

/**
 * Token管理器类
 * 
 * @example
 * ```typescript
 * const tokenManager = new TokenManager();
 * 
 * // 创建token
 * const token = tokenManager.createToken('admin', '管理员token');
 * 
 * // 创建带时效性的token
 * const tempToken = tokenManager.createToken('analyst', '临时分析师token', '1h');
 * 
 * // 验证token
 * const role = tokenManager.validateToken(token);
 * 
 * // 详细验证token
 * const result = tokenManager.validateTokenDetailed(token);
 * 
 * // 获取token信息
 * const info = tokenManager.getTokenInfo(token);
 * 
 * // 列出所有token
 * const allTokens = tokenManager.listTokens();
 * 
 * // 更新token
 * tokenManager.updateToken(token, { description: '更新描述' });
 * 
 * // 删除token
 * tokenManager.deleteToken(token);
 * ```
 */
export class TokenManager {
  private tokens: Map<string, TokenInfo> = new Map();
  private storageKey = 'token_manager_data';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 创建新的token
   * @param role 角色名称
   * @param description token描述（可选）
   * @param expiresIn 有效期（可选），支持格式：
   *   - "1h" - 1小时
   *   - "30m" - 30分钟
   *   - "7d" - 7天
   *   - "1y" - 1年
   *   - 不传或null表示永不过期
   * @returns 生成的token字符串
   */
  createToken(role: string, description?: string, expiresIn?: string | null): string {
    const token = randomUUID();
    const now = new Date();
    
    let expiresAt: string | null = null;
    if (expiresIn) {
      expiresAt = this.calculateExpiryDate(now, expiresIn).toISOString();
    }

    const tokenInfo: TokenInfo = {
      token,
      role,
      description,
      createdAt: now.toISOString(),
      expiresAt,
      isActive: true
    };

    this.tokens.set(token, tokenInfo);
    this.saveToStorage();
    
    console.log(`[TokenManager] 创建token: ${token.substring(0, 8)}... (角色: ${role}, 有效期: ${expiresIn || '永久'})`);
    return token;
  }

  /**
   * 验证token并返回角色
   * @param token token字符串
   * @returns 角色名称，如果无效则返回null
   */
  validateToken(token: string): string | null {
    const tokenInfo = this.tokens.get(token);
    
    if (!tokenInfo || !tokenInfo.isActive) {
      return null;
    }

    // 检查是否过期
    if (tokenInfo.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(tokenInfo.expiresAt);
      if (now > expiresAt) {
        // 标记为过期
        tokenInfo.isActive = false;
        this.saveToStorage();
        return null;
      }
    }

    // 更新最后使用时间
    tokenInfo.lastUsed = new Date().toISOString();
    this.saveToStorage();

    return tokenInfo.role;
  }

  /**
   * 验证token并返回详细结果
   * @param token token字符串
   * @returns 验证结果对象
   */
  validateTokenDetailed(token: string): TokenValidationResult {
    try {
      if (!token) {
        return {
          isValid: false,
          role: null,
          tokenInfo: null,
          error: '必须提供token参数'
        };
      }

      const role = this.validateToken(token);
      
      if (!role) {
        const tokenInfo = this.getTokenInfo(token);
        if (!tokenInfo) {
          return {
            isValid: false,
            role: null,
            tokenInfo: null,
            error: 'token不存在'
          };
        }
        return {
          isValid: false,
          role: null,
          tokenInfo: tokenInfo,
          error: tokenInfo.isActive ? 'token已过期' : 'token已禁用'
        };
      }

      const tokenInfo = this.getTokenInfo(token);
      return {
        isValid: true,
        role,
        tokenInfo
      };

    } catch (error) {
      return {
        isValid: false,
        role: null,
        tokenInfo: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 获取token信息
   * @param token token字符串
   * @returns TokenInfo或null
   */
  getTokenInfo(token: string): TokenInfo | null {
    const tokenInfo = this.tokens.get(token);
    if (!tokenInfo) return null;

    // 检查是否过期
    if (tokenInfo.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(tokenInfo.expiresAt);
      if (now > expiresAt) {
        tokenInfo.isActive = false;
      }
    }

    return tokenInfo;
  }

  /**
   * 列出所有token
   * @param includeInactive 是否包含无效/过期的token（默认false）
   * @returns TokenInfo数组
   */
  listTokens(includeInactive: boolean = false): TokenInfo[] {
    const tokens = Array.from(this.tokens.values());
    
    if (includeInactive) {
      return tokens;
    }

    // 过滤掉无效和过期的token
    const now = new Date();
    return tokens.filter(info => {
      if (!info.isActive) return false;
      
      if (info.expiresAt) {
        const expiresAt = new Date(info.expiresAt);
        if (now > expiresAt) return false;
      }
      
      return true;
    });
  }

  /**
   * 更新token信息
   * @param token token字符串
   * @param updates 更新字段
   * @returns 是否更新成功
   */
  updateToken(token: string, updates: Partial<Omit<TokenInfo, 'token' | 'createdAt'>>): boolean {
    const tokenInfo = this.tokens.get(token);
    if (!tokenInfo) return false;

    Object.assign(tokenInfo, updates);
    this.saveToStorage();
    
    console.log(`[TokenManager] 更新token: ${token.substring(0, 8)}...`);
    return true;
  }

  /**
   * 删除token
   * @param token token字符串
   * @returns 是否删除成功
   */
  deleteToken(token: string): boolean {
    const deleted = this.tokens.delete(token);
    if (deleted) {
      this.saveToStorage();
      console.log(`[TokenManager] 删除token: ${token.substring(0, 8)}...`);
    }
    return deleted;
  }

  /**
   * 使token失效（软删除）
   * @param token token字符串
   * @returns 是否操作成功
   */
  deactivateToken(token: string): boolean {
    const tokenInfo = this.tokens.get(token);
    if (!tokenInfo) return false;

    tokenInfo.isActive = false;
    this.saveToStorage();
    
    console.log(`[TokenManager] 使token失效: ${token.substring(0, 8)}...`);
    return true;
  }

  /**
   * 激活token
   * @param token token字符串
   * @returns 是否操作成功
   */
  activateToken(token: string): boolean {
    const tokenInfo = this.tokens.get(token);
    if (!tokenInfo) return false;

    // 检查是否已过期
    if (tokenInfo.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(tokenInfo.expiresAt);
      if (now > expiresAt) {
        return false; // 已过期，无法激活
      }
    }

    tokenInfo.isActive = true;
    this.saveToStorage();
    
    console.log(`[TokenManager] 激活token: ${token.substring(0, 8)}...`);
    return true;
  }

  /**
   * 续期token
   * @param token token字符串
   * @param expiresIn 新的有效期
   * @returns 是否操作成功
   */
  renewToken(token: string, expiresIn: string): boolean {
    const tokenInfo = this.tokens.get(token);
    if (!tokenInfo) return false;

    const now = new Date();
    const newExpiry = this.calculateExpiryDate(now, expiresIn);
    
    tokenInfo.expiresAt = newExpiry.toISOString();
    tokenInfo.isActive = true;
    this.saveToStorage();
    
    console.log(`[TokenManager] 续期token: ${token.substring(0, 8)}... (新有效期: ${expiresIn})`);
    return true;
  }

  /**
   * 清理过期的token
   * @returns 删除的token数量
   */
  cleanupExpired(): number {
    const now = new Date();
    let deletedCount = 0;

    for (const [token, info] of this.tokens.entries()) {
      if (info.expiresAt && new Date(info.expiresAt) < now) {
        this.tokens.delete(token);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.saveToStorage();
      console.log(`[TokenManager] 清理了 ${deletedCount} 个过期token`);
    }

    return deletedCount;
  }

  /**
   * 获取token统计信息
   */
  getStats(): {
    total: number;
    active: number;
    expired: number;
    inactive: number;
    byRole: Record<string, number>;
  } {
    const now = new Date();
    let total = 0;
    let active = 0;
    let expired = 0;
    let inactive = 0;
    const byRole: Record<string, number> = {};

    for (const info of this.tokens.values()) {
      total++;
      
      // 统计角色分布
      byRole[info.role] = (byRole[info.role] || 0) + 1;

      if (!info.isActive) {
        inactive++;
        continue;
      }

      if (info.expiresAt) {
        const expiresAt = new Date(info.expiresAt);
        if (now > expiresAt) {
          expired++;
          continue;
        }
      }

      active++;
    }

    return { total, active, expired, inactive, byRole };
  }

  /**
   * 导出所有数据（用于备份）
   */
  exportData(): Record<string, TokenInfo> {
    return Object.fromEntries(this.tokens);
  }

  /**
   * 导入数据（用于恢复）
   */
  importData(data: Record<string, TokenInfo>): void {
    this.tokens = new Map(Object.entries(data));
    this.saveToStorage();
  }

  /**
   * 清空所有token
   */
  clear(): void {
    this.tokens.clear();
    this.saveToStorage();
    console.log('[TokenManager] 所有token已清空');
  }

  /**
   * 计算过期日期
   */
  private calculateExpiryDate(from: Date, expiresIn: string): Date {
    const result = new Date(from);
    const match = expiresIn.match(/^(\d+)([smhdwy])$/);
    
    if (!match) {
      throw new Error(`无效的过期时间格式: ${expiresIn}. 期望格式: 数字 + 单位 (s=秒, m=分钟, h=小时, d=天, w=周, y=年)`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        result.setSeconds(result.getSeconds() + value);
        break;
      case 'm':
        result.setMinutes(result.getMinutes() + value);
        break;
      case 'h':
        result.setHours(result.getHours() + value);
        break;
      case 'd':
        result.setDate(result.getDate() + value);
        break;
      case 'w':
        result.setDate(result.getDate() + value * 7);
        break;
      case 'y':
        result.setFullYear(result.getFullYear() + value);
        break;
    }

    return result;
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = Object.fromEntries(this.tokens);
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('[TokenManager] 无法保存到本地存储:', error);
      }
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          this.tokens = new Map(Object.entries(parsed));
          console.log(`[TokenManager] 从存储加载了 ${this.tokens.size} 个token`);
        }
      } catch (error) {
        console.warn('[TokenManager] 无法从本地存储加载:', error);
      }
    }
  }
}

/**
 * 全局token管理器实例
 */
export const globalTokenManager = new TokenManager();