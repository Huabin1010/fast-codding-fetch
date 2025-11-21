import crypto from 'crypto';
import { prisma } from './prisma';

/**
 * 生成随机 API Token
 * @returns 原始 token 字符串（仅在创建时返回一次）
 */
export function generateToken(): string {
  // 生成 32 字节的随机 token，转换为 base64url 格式
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * 对 token 进行哈希处理
 * @param token - 原始 token
 * @returns 哈希后的 token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * 创建新的 API Token
 * @param userId - 用户 ID
 * @param name - Token 名称
 * @param expiresAt - 过期时间（可选）
 * @returns 包含原始 token 和数据库记录的对象
 */
export async function createApiToken(
  userId: string,
  name: string,
  expiresAt?: Date
) {
  // 生成原始 token
  const rawToken = generateToken();
  
  // 对 token 进行哈希
  const hashedToken = hashToken(rawToken);
  
  // 保存到数据库
  const apiToken = await prisma.apiToken.create({
    data: {
      name,
      token: hashedToken,
      userId,
      expiresAt,
    },
  });
  
  // 返回原始 token（仅此一次）和数据库记录
  return {
    rawToken, // 这是用户需要保存的 token
    apiToken: {
      id: apiToken.id,
      name: apiToken.name,
      userId: apiToken.userId,
      expiresAt: apiToken.expiresAt,
      createdAt: apiToken.createdAt,
    },
  };
}

/**
 * 列出用户的所有 API Tokens
 * @param userId - 用户 ID
 * @returns API Token 列表
 */
export async function listApiTokens(userId: string) {
  return prisma.apiToken.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      isActive: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 删除 API Token
 * @param tokenId - Token ID
 * @param userId - 用户 ID（用于权限验证）
 * @returns 是否删除成功
 */
export async function deleteApiToken(tokenId: string, userId: string) {
  const result = await prisma.apiToken.deleteMany({
    where: {
      id: tokenId,
      userId, // 确保只能删除自己的 token
    },
  });
  
  return result.count > 0;
}

/**
 * 启用/禁用 API Token
 * @param tokenId - Token ID
 * @param userId - 用户 ID（用于权限验证）
 * @param isActive - 是否启用
 * @returns 更新后的 token
 */
export async function toggleApiToken(
  tokenId: string,
  userId: string,
  isActive: boolean
) {
  return prisma.apiToken.updateMany({
    where: {
      id: tokenId,
      userId, // 确保只能修改自己的 token
    },
    data: { isActive },
  });
}
