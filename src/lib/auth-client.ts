import { createAuthClient } from 'better-auth/react';
import { adminClient, jwtClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL ?? 'http://localhost:5173',
  plugins: [adminClient(), jwtClient()]
});

export const { useSession, signIn, signOut, signUp } = authClient;
