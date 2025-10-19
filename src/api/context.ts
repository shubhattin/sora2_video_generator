import { authClient } from '@/lib/auth-client';
import type { Context, Next } from 'hono';
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
