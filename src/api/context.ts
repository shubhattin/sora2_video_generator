import { authClient } from '@/lib/auth-client';
import type { Context, Next } from 'hono';
import { createRemoteJWKSet } from 'jose';
import { jwtVerify } from 'jose';
import get_seesion_from_cookie from '~/lib/get_auth_from_cookie';

type SessionType = typeof authClient.$Infer.Session;

declare module 'hono' {
  interface ContextVariableMap {
    user?: SessionType['user'] | null;
  }
}

/** This middle is to be used on route groups which cannot access the JWT Header */
export const getUserSessionMiddleware = async (c: Context, next: Next) => {
  const session = await get_seesion_from_cookie(c.req.raw.headers.get('cookie') || '');
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('user', session.user);

  await next();
};

const AUTH_URL = import.meta.env.VITE_BETTER_AUTH_URL;
export const getUserJWTMiddleware = async (c: Context, next: Next) => {
  const token = c.req.raw.headers.get('Authorization')?.split(' ')[1];
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  const JWKS = createRemoteJWKSet(new URL(`${AUTH_URL}/api/auth/jwks`));
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: AUTH_URL, // Should match your JWT issuer, which is the BASE_URL
    audience: AUTH_URL // Should match your JWT audience, which is the BASE_URL by default
  });
  c.set('user', payload as SessionType['user']);
  await next();
};

export const protectedRoute = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
};

export const protectedAdminRoute = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  if (user.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
};
