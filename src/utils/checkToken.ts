import { Request, Response, NextFunction } from 'express';
import * as jsonwebtoken from 'jsonwebtoken';
import { isTokenRevoked } from './tokenRevocation.js';

// ✅ normalization jwt import for ESM and CJS
const jwt: typeof jsonwebtoken = (jsonwebtoken as any).default ?? (jsonwebtoken as any);

const JWT_SECRET   = process.env.JWT_SECRET_KEY ?? 'change_me_secret';
const JWT_ISSUER   = process.env.JWT_ISSUER || undefined;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || undefined;

export interface AccessPayload extends jsonwebtoken.JwtPayload {
  id?: number;
  fullName?: string;
  roleId?: number;
  username?: string;
  org?: unknown | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AccessPayload;
    token?: string;
  }
}

const isTokenExpiredError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as any).name === 'TokenExpiredError';

const isJsonWebTokenError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as any).name === 'JsonWebTokenError';

export function checkToken(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS') return next();

  const h = req.get('authorization') || (req.headers as any)?.Authorization;
  if (!h || typeof h !== 'string' || !/^Bearer\s+/i.test(h)) {
    return res.status(401).json({ message: 'Token tapılmadı', code: 'NO_TOKEN' });
  }

  const token = h.split(' ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ message: 'Token düzgün deyil', code: 'BAD_FORMAT' });
  }

  if (isTokenRevoked(token)) {
    return res.status(401).json({ message: 'Token etibarsızdır', code: 'REVOKED' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    }) as AccessPayload;

    req.user = payload;
    req.token = token;
    return next();
  } catch (err) {
    const isProd = process.env.NODE_ENV === 'production';
    const meta = {
      tokenPreview: token ? `${token.slice(0, 8)}...${token.slice(-6)}` : undefined,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      method: req.method,
      path: req.originalUrl || req.url,
    };

    if (isTokenExpiredError(err)) {
      return res.status(401).json({ message: 'Tokenin vaxtı bitib', code: 'TOKEN_EXPIRED' });
    }
    if (isJsonWebTokenError(err)) {
      return res.status(401).json({ message: 'Token düzgün deyil', code: 'TOKEN_INVALID' });
    }

    console.error('[checkToken] JWT verify error:', { name: (err as any)?.name, message: (err as any)?.message, stack: (err as any)?.stack, ...meta });

    if (!isProd) {
      return res.status(500).json({
        message: 'Server error',
        code: 'SERVER_ERROR',
        errors: { name: (err as any)?.name, message: (err as any)?.message, stack: (err as any)?.stack, ...meta },
      });
    }
    return res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
  }
}

export default { checkToken };
