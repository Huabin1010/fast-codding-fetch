import Elysia from 'elysia';
import { encode as encodeToken, decode as decodeToken } from 'next-auth/jwt';
export type SessionUser = {
  /** 用户ID */
  id: string;
  /** 用户名 */
  name: string;
  /** 电子邮箱 */
  email: string;
};

/** 登录令牌 */
export type SigninToken = {
  /** 访问令牌 */
  access_token: string;
  /** 过期时间（秒） */
  expires_in: number;
  /** 令牌类型 */
  token_type: string;
};

/** 认证数据 */
export type AuthData = {
  Auth: {
    /** 会话用户 */
    user: SessionUser;
  };
};
const SALT = '__SALT__';
/**
 * 基于jwt的登录
 * @param user
 * @returns
 */
export async function signIn(user: SessionUser) {
  const token = {
    id: user.id,
    sub: user.id,
    name: user.name,
    email: user.email,
    iat: Date.now(),
    exp: Date.now() + 60 * 60 * 24 * 7,
  };
  const accessToken = await encodeToken({
    token,
    secret: process.env.AUTH_SECRET!,
  });
  return {
    access_token: accessToken,
    expires_in: 60 * 60 * 24 * 7,
    token_type: 'Bearer',
  } as SigninToken;
}
async function decode(request: Request) {
  // 从Authorization header中提取token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return;
  }
  
  const tokenString = authHeader.substring(7); // Remove 'Bearer ' prefix
  const token = await decodeToken({
    token: tokenString,
    secret: process.env.AUTH_SECRET!,
  });
  
  if (!token?.sub) {
    return;
  }
  return {
    id: token.sub,
    name: token.name as string,
    email: token.email as string,
  };
}

/**
 * 授权信息
 * @returns
 */
export function auth() {
  return new Elysia({ name: 'Service.Auth' })
    .derive({ as: 'scoped' }, async ({ request }) => {
      const user = await decode(request);

      if (!user) {
        throw new Error('未授权访问');
      }

      return {
        Auth: {
          user,
        },
      } as AuthData;
    });
}
