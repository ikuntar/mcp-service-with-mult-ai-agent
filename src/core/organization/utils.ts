/**
 * 组织架构工具函数
 */

import { StructureManager } from './structure';
import { OrganizationMemberImpl } from './member';
import { 
  OrganizationRole, 
  OrganizationLevel,
  OrganizationStructure,
  OrganizationRelationship,
  RelationshipType
} from './types';

/**
 * 验证组织结构
 */
export function validateOrganizationStructure(structure: StructureManager): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
} {
  return structure.validate();
}

/**
 * 获取组织统计信息
 */
export function getOrganizationStats(structure: StructureManager) {
  return structure.getStats();
}

/**
 * 按角色查找成员
 */
export function findMemberByRole(
  structure: StructureManager,
  role: OrganizationRole
): OrganizationMemberImpl[] {
  return structure.queryMembers({ role });
}

/**
 * 按能力查找成员
 */
export function findMemberByCapability(
  structure: StructureManager,
  capability: string
): OrganizationMemberImpl[] {
  return structure.queryMembers({ capabilities: [capability] });
}

/**
 * 获取关系链（从成员到上级的完整路径）
 */
export function getRelationshipChain(
  structure: StructureManager,
  memberId: string,
  relationshipType: RelationshipType = RelationshipType.REPORTING
): OrganizationMemberImpl[] {
  const chain: OrganizationMemberImpl[] = [];
  let currentId = memberId;
  
  // 最多追踪10层
  for (let i = 0; i < 10; i++) {
    const relationships = structure.getRelationships(currentId, relationshipType);
    
    // 找到向上的关系（当前成员汇报给谁）
    const upwardRel = relationships.find(rel => rel.from === currentId);
    if (!upwardRel) break;
    
    const superior = structure.getMember(upwardRel.to);
    if (!superior) break;
    
    chain.push(superior);
    currentId = superior.id;
  }
  
  return chain;
}

/**
 * 获取下属树（从成员到所有下属的完整结构）
 */
export function getSubordinateTree(
  structure: StructureManager,
  memberId: string
): Map<string, OrganizationMemberImpl[]> {
  const tree = new Map<string, OrganizationMemberImpl[]>();
  
  function collectSubordinates(id: string, depth: number = 0) {
    if (depth > 10) return; // 防止无限递归
    
    const reports = structure.getDirectReports(id);
    if (reports.length === 0) return;
    
    tree.set(id, reports);
    
    reports.forEach(report => {
      collectSubordinates(report.id, depth + 1);
    });
  }
  
  collectSubordinates(memberId);
  return tree;
}

/**
 * 检查成员是否可以协作
 */
export function canCollaborate(
  structure: StructureManager,
  member1Id: string,
  member2Id: string
): boolean {
  const member1 = structure.getMember(member1Id);
  const member2 = structure.getMember(member2Id);
  
  if (!member1 || !member2) return false;
  
  // 同一团队
  if (member1.teamId && member1.teamId === member2.teamId) {
    return true;
  }
  
  // 同一部门
  if (member1.departmentId && member1.departmentId === member2.departmentId) {
    return structure.getConfig().enableCrossTeamCollaboration;
  }
  
  // 有直接关系
  const relationships = structure.getRelationships();
  const hasDirectRelationship = relationships.some(
    rel => 
      (rel.from === member1Id && rel.to === member2Id) ||
      (rel.from === member2Id && rel.to === member1Id)
  );
  
  return hasDirectRelationship;
}

/**
 * 获取协作网络（与指定成员可以协作的所有成员）
 */
export function getCollaborationNetwork(
  structure: StructureManager,
  memberId: string
): OrganizationMemberImpl[] {
  const allMembers = structure.getAllMembers();
  const network: OrganizationMemberImpl[] = [];
  
  for (const member of allMembers) {
    if (member.id === memberId) continue;
    if (canCollaborate(structure, memberId, member.id)) {
      network.push(member);
    }
  }
  
  return network;
}

/**
 * 计算成员相似度（基于能力和角色）
 */
export function calculateMemberSimilarity(
  member1: OrganizationMemberImpl,
  member2: OrganizationMemberImpl
): number {
  // 角色相似度
  const roleSimilarity = member1.role === member2.role ? 1 : 0.5;
  
  // 能力相似度
  const commonCapabilities = member1.capabilities.filter(cap => 
    member2.capabilities.includes(cap)
  );
  const capabilitySimilarity = 
    commonCapabilities.length / 
    Math.max(member1.capabilities.length, member2.capabilities.length);
  
  // 层级相似度
  const levelSimilarity = member1.level === member2.level ? 1 : 0.7;
  
  return (roleSimilarity + capabilitySimilarity + levelSimilarity) / 3;
}

/**
 * 查找最相似的成员
 */
export function findMostSimilarMember(
  structure: StructureManager,
  targetMember: OrganizationMemberImpl,
  limit: number = 5
): Array<{ member: OrganizationMemberImpl; similarity: number }> {
  const allMembers = structure.getAllMembers();
  const similarities: Array<{ member: OrganizationMemberImpl; similarity: number }> = [];
  
  for (const member of allMembers) {
    if (member.id === targetMember.id) continue;
    
    const similarity = calculateMemberSimilarity(targetMember, member);
    similarities.push({ member, similarity });
  }
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * 获取组织健康度
 */
export function getOrganizationHealth(structure: StructureManager): {
  score: number;
  factors: Record<string, number>;
  issues: string[];
} {
  const stats = structure.getStats();
  const validation = structure.validate();
  
  let score = 100;
  const factors: Record<string, number> = {};
  const issues: string[] = [];
  
  // 团队大小检查
  if (stats.maxTeamSize > structure.getConfig().maxTeamSize) {
    score -= 20;
    factors.teamSize = 0;
    issues.push('团队规模过大');
  } else {
    factors.teamSize = 1;
  }
  
  // 孤立成员检查
  const allMembers = structure.getAllMembers();
  const connectedMembers = new Set();
  structure.getRelationships().forEach(rel => {
    connectedMembers.add(rel.from);
    connectedMembers.add(rel.to);
  });
  const isolatedCount = allMembers.length - connectedMembers.size;
  
  if (isolatedCount > 0) {
    score -= 10 * Math.min(isolatedCount, 5);
    factors.isolation = Math.max(0, 1 - isolatedCount / allMembers.length);
    issues.push(`存在 ${isolatedCount} 个孤立成员`);
  } else {
    factors.isolation = 1;
  }
  
  // 角色平衡检查
  const roleCounts = stats.memberCountByRole;
  const totalMembers = stats.totalMembers;
  const balanced = Object.values(roleCounts).every(count => 
    count <= totalMembers * 0.5
  );
  
  if (!balanced) {
    score -= 15;
    factors.roleBalance = 0.5;
    issues.push('角色分布不均');
  } else {
    factors.roleBalance = 1;
  }
  
  // 活跃度检查
  const activeRatio = totalMembers > 0 ? stats.activeMembers / totalMembers : 0;
  factors.activity = activeRatio;
  
  if (activeRatio < 0.8) {
    score -= 10;
    issues.push('活跃度较低');
  }
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    factors,
    issues
  };
}

/**
 * 生成组织报告
 */
export function generateOrganizationReport(structure: StructureManager): string {
  const stats = getOrganizationStats(structure);
  const health = getOrganizationHealth(structure);
  const validation = structure.validate();
  
  let report = `# 组织报告: ${structure.toJSON().name}\n\n`;
  
  report += `## 基本信息\n`;
  report += `- ID: ${structure.toJSON().id}\n`;
  report += `- 层级: ${structure.toJSON().level}\n`;
  report += `- 生成时间: ${new Date().toISOString()}\n\n`;
  
  report += `## 统计信息\n`;
  report += `- 总成员数: ${stats.totalMembers}\n`;
  report += `- 活跃成员: ${stats.activeMembers}\n`;
  report += `- 团队数量: ${stats.totalTeams}\n`;
  report += `- 部门数量: ${stats.totalDepartments}\n`;
  report += `- 关系数量: ${stats.totalRelationships}\n`;
  report += `- 平均团队大小: ${stats.avgTeamSize.toFixed(1)}\n\n`;
  
  report += `## 健康度\n`;
  report += `- 综合评分: ${health.score}/100\n`;
  report += `- 关键因素:\n`;
  Object.entries(health.factors).forEach(([factor, value]) => {
    report += `  - ${factor}: ${(value * 100).toFixed(0)}%\n`;
  });
  
  if (health.issues.length > 0) {
    report += `- 问题:\n`;
    health.issues.forEach(issue => {
      report += `  - ${issue}\n`;
    });
  }
  report += `\n`;
  
  report += `## 验证结果\n`;
  if (validation.isValid) {
    report += `✅ 结构验证通过\n`;
  } else {
    report += `❌ 结构验证失败\n`;
    validation.errors.forEach(err => {
      report += `  - ${err}\n`;
    });
  }
  
  if (validation.warnings.length > 0) {
    report += `⚠️ 警告:\n`;
    validation.warnings.forEach(warn => {
      report += `  - ${warn}\n`;
    });
  }
  
  if (validation.suggestions.length > 0) {
    report += `💡 建议:\n`;
    validation.suggestions.forEach(sug => {
      report += `  - ${sug}\n`;
    });
  }
  
  return report;
}