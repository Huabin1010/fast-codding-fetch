import Elysia from 'elysia';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/** API Token 认证数据 */
export type ApiTokenAuthData = {
  ApiTokenAuth: {
    /** API Token 信息 */
    apiToken: {
      id: string;
      name: string;
      userId: string;
    };
  };
};

/**
 * 验证 API Token
 * @param token - 待验证的 token
 * @returns 验证结果
 */
async function validateApiToken(token: string) {
  try {
    // 对 token 进行哈希，因为数据库中存储的应该是哈希值
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // 查询数据库中的 API Token
    const apiToken = await prisma.apiToken.findUnique({
      where: { token: hashedToken },
      select: {
        id: true,
        name: true,
        userId: true,
        expiresAt: true,
        lastUsedAt: true,
        isActive: true,
      },
    });

    // Token 不存在
    if (!apiToken) {
      return { valid: false, reason: 'Token 不存在' };
    }

    // Token 已禁用
    if (!apiToken.isActive) {
      return { valid: false, reason: 'Token 已被禁用' };
    }

    // Token 已过期
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      return { valid: false, reason: 'Token 已过期' };
    }

    return { valid: true, apiToken };
  } catch (error) {
    console.error('验证 API Token 失败:', error);
    return { valid: false, reason: '验证失败' };
  }
}

/**
 * 更新 API Token 最后使用时间
 * @param tokenId - Token ID
 */
async function updateLastUsed(tokenId: string) {
  try {
    await prisma.apiToken.update({
      where: { id: tokenId },
      data: { lastUsedAt: new Date() },
    });
  } catch (error) {
    console.error('更新 API Token 使用时间失败:', error);
  }
}

/**
 * API Token 认证中间件
 * 用于验证 API 请求中的 Bearer Token
 */
export function apiTokenAuth() {
  return new Elysia({ name: 'Service.ApiTokenAuth' })
    .derive({ as: 'scoped' }, async ({ request }) => {
      const authHeader = request.headers.get('Authorization');

      // 检查 Authorization header
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('缺少认证 token，请在 Authorization header 中提供 Bearer token');
      }

      // 提取 token
      const token = authHeader.substring(7); // 移除 "Bearer " 前缀

      // 验证 token
      const validationResult = await validateApiToken(token);

      if (!validationResult.valid) {
        throw new Error(validationResult.reason || '认证失败');
      }

      // 异步更新最后使用时间（不阻塞请求）
      updateLastUsed(validationResult.apiToken!.id).catch(console.error);

      return {
        ApiTokenAuth: {
          apiToken: {
            id: validationResult.apiToken!.id,
            name: validationResult.apiToken!.name,
            userId: validationResult.apiToken!.userId,
          },
        },
      } as ApiTokenAuthData;
    });
}