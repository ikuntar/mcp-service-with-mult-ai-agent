/**
 * Token冲突防护机制
 * 
 * 负责：
 * 1. 检测协作单元Token与用户Token的冲突
 * 2. 提供安全的Token注册机制
 * 3. 维护Token命名规范
 */

import { TokenManager, globalTokenManager } from '../token/token-manager';

export interface TokenConflictResult {
  hasConflict: boolean;
  conflictType: 'duplicate' | 'role_confusion' | 'none';
  details: string;
  suggestion: string;
}

export class TokenConflictGuard {
  private tokenManager: TokenManager;
  
  // 协作单元Token前缀
  private readonly COLLAB_PREFIX = 'collab_';
  
  // 禁止的用户Token（避免与协作单元冲突）
  private readonly RESERVED_PATTERNS = [
    /^collab_/,  // 以collab_开头
    /^org_/,     // 以org_开头
    /^unit_/,    // 以unit_开头
  ];

  constructor(tokenManager: TokenManager = globalTokenManager) {
    this.tokenManager = tokenManager;
  }

  /**
   * 检查协作单元Token是否安全
   */
  checkCollaborationToken(
    unitId: string,
    unitName: string,
    existingUserTokens: string[] = []
  ): TokenConflictResult {
    const unitToken = this.generateCollaborationToken(unitId);
    
    // 检查1：Token是否已存在
    const existingToken = this.tokenManager.getTokenInfo(unitToken);
    if (existingToken) {
      return {
        hasConflict: true,
        conflictType: 'duplicate',
        details: `Token ${unitToken.substring(0, 16)}... 已存在于Token生态中，角色: ${existingToken.role}`,
        suggestion: `请使用不同的协作单元ID，或清理已存在的Token`
      };
    }
    
    // 检查2：与用户Token冲突（检查所有用户Token）
    const allTokens = this.tokenManager.listTokens(true);
    const conflictUserToken = allTokens.find(t =>
      t.token === unitToken &&
      !t.role.startsWith('collaboration_unit_')
    );
    if (conflictUserToken) {
      return {
        hasConflict: true,
        conflictType: 'duplicate',
        details: `协作单元Token与用户Token冲突: ${unitToken.substring(0, 16)}... (用户: ${conflictUserToken.description || conflictUserToken.role})`,
        suggestion: `建议协作单元ID添加前缀或后缀，如: ${unitId}_unit`
      };
    }
    
    // 检查3：协作单元ID与用户Token的ID部分冲突
    const conflictUserId = allTokens.find(t =>
      t.token === unitId &&
      !t.role.startsWith('collaboration_unit_')
    );
    if (conflictUserId) {
      return {
        hasConflict: true,
        conflictType: 'duplicate',
        details: `协作单元ID "${unitId}" 与用户Token冲突: ${conflictUserId.token}`,
        suggestion: `建议协作单元ID添加前缀，如: team_${unitId}`
      };
    }
    
    // 检查4：角色混淆风险
    const roleConfusion = this.checkRoleConfusion(unitToken, unitName);
    if (roleConfusion.hasConflict) {
      return roleConfusion;
    }
    
    return {
      hasConflict: false,
      conflictType: 'none',
      details: 'Token注册安全，无冲突',
      suggestion: '可以安全注册'
    };
  }

  /**
   * 检查用户Token是否安全
   */
  checkUserToken(
    userToken: string,
    userName: string
  ): TokenConflictResult {
    // 检查1：是否使用了保留前缀
    for (const pattern of this.RESERVED_PATTERNS) {
      if (pattern.test(userToken)) {
        return {
          hasConflict: true,
          conflictType: 'role_confusion',
          details: `用户Token "${userToken}" 使用了保留前缀，可能与协作单元冲突`,
          suggestion: `建议使用其他命名，如: user_${userToken} 或 ${userToken}_user`
        };
      }
    }
    
    // 检查2：是否与现有协作单元冲突
    const existingToken = this.tokenManager.getTokenInfo(userToken);
    if (existingToken && existingToken.role.startsWith('collaboration_unit_')) {
      return {
        hasConflict: true,
        conflictType: 'role_confusion',
        details: `用户Token "${userToken}" 与协作单元Token冲突，角色: ${existingToken.role}`,
        suggestion: `请使用不同的用户Token`
      };
    }
    
    return {
      hasConflict: false,
      conflictType: 'none',
      details: '用户Token安全',
      suggestion: '可以安全使用'
    };
  }

  /**
   * 检查角色混淆
   */
  private checkRoleConfusion(
    unitToken: string,
    unitName: string
  ): TokenConflictResult {
    // 检查是否过于通用
    const genericNames = ['admin', 'root', 'system', 'default', 'guest'];
    const unitId = unitToken.replace(this.COLLAB_PREFIX, '');
    
    if (genericNames.includes(unitId)) {
      return {
        hasConflict: true,
        conflictType: 'role_confusion',
        details: `协作单元ID "${unitId}" 过于通用，容易与系统角色混淆`,
        suggestion: `建议使用更具体的名称，如: ${unitId}_team 或 team_${unitId}`
      };
    }
    
    return {
      hasConflict: false,
      conflictType: 'none',
      details: '',
      suggestion: ''
    };
  }

  /**
   * 安全注册协作单元Token
   */
  async safeRegisterCollaborationToken(
    unitId: string,
    unitName: string,
    description?: string
  ): Promise<{
    success: boolean;
    token?: string;
    error?: string;
    conflict?: TokenConflictResult;
  }> {
    // 检查冲突
    const conflictCheck = this.checkCollaborationToken(unitId, unitName);
    
    if (conflictCheck.hasConflict) {
      return {
        success: false,
        error: 'Token冲突检测失败',
        conflict: conflictCheck
      };
    }
    
    // 生成并注册Token
    const unitToken = this.generateCollaborationToken(unitId);
    const unitRole = this.generateCollaborationRole(unitId);
    
    try {
      this.tokenManager.createToken(
        unitRole,
        description || `协作单元: ${unitName}`,
        null
      );
      
      console.log(`[TokenConflictGuard] 安全注册协作单元Token: ${unitToken}`);
      
      return {
        success: true,
        token: unitToken
      };
    } catch (error) {
      return {
        success: false,
        error: `注册失败: ${error}`
      };
    }
  }

  /**
   * 安全注册用户Token
   */
  safeRegisterUserToken(
    userToken: string,
    userName: string,
    description?: string,
    expiresIn?: string | null
  ): {
    success: boolean;
    token?: string;
    error?: string;
    conflict?: TokenConflictResult;
  } {
    // 检查冲突
    const conflictCheck = this.checkUserToken(userToken, userName);
    
    if (conflictCheck.hasConflict) {
      return {
        success: false,
        error: 'Token冲突检测失败',
        conflict: conflictCheck
      };
    }
    
    // 注册Token
    try {
      const role = `user_${userName}`;
      this.tokenManager.createToken(
        role,
        description || `用户: ${userName}`,
        expiresIn
      );
      
      console.log(`[TokenConflictGuard] 安全注册用户Token: ${userToken}`);
      
      return {
        success: true,
        token: userToken
      };
    } catch (error) {
      return {
        success: false,
        error: `注册失败: ${error}`
      };
    }
  }

  /**
   * 生成协作单元Token
   */
  generateCollaborationToken(unitId: string): string {
    return `${this.COLLAB_PREFIX}${unitId}`;
  }

  /**
   * 生成协作单元角色
   */
  generateCollaborationRole(unitId: string): string {
    return `collaboration_unit_${unitId}`;
  }

  /**
   * 获取所有冲突报告
   */
  getConflictReport(): {
    userTokens: TokenConflictResult[];
    collaborationTokens: TokenConflictResult[];
  } {
    const allTokens = this.tokenManager.listTokens(true);
    
    const userTokens: TokenConflictResult[] = [];
    const collaborationTokens: TokenConflictResult[] = [];
    
    for (const tokenInfo of allTokens) {
      if (tokenInfo.role.startsWith('collaboration_unit_')) {
        // 检查协作单元Token
        const unitId = tokenInfo.token.replace(this.COLLAB_PREFIX, '');
        const conflict = this.checkCollaborationToken(unitId, tokenInfo.description || '');
        collaborationTokens.push(conflict);
      } else if (tokenInfo.role.startsWith('user_')) {
        // 检查用户Token
        const conflict = this.checkUserToken(tokenInfo.token, tokenInfo.description || '');
        userTokens.push(conflict);
      }
    }
    
    return { userTokens, collaborationTokens };
  }

  /**
   * 自动修复冲突（简单场景）
   */
  autoFixConflict(
    unitId: string,
    conflict: TokenConflictResult
  ): string | null {
    if (conflict.conflictType === 'duplicate') {
      // 生成带后缀的新ID
      const newId = `${unitId}_${Date.now().toString(36).substr(-4)}`;
      return newId;
    }
    
    if (conflict.conflictType === 'role_confusion') {
      // 添加团队前缀
      const newId = `team_${unitId}`;
      return newId;
    }
    
    return null;
  }
}

/**
 * 全局Token冲突防护实例
 */
export const globalTokenConflictGuard = new TokenConflictGuard();