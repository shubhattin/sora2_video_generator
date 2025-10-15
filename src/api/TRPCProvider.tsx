import { httpBatchLink, createTRPCClient } from '@trpc/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import transformer from './transformer';
import { TRPCProvider } from './client';
import type { AppRouter } from './trpc_router';
import { queryClient as queryClientGlobal } from '~/lib/queryClient';
import { authClient } from '@/lib/auth-client';
import { z } from 'zod';

export default function Provider({ children }: { children: React.ReactNode }) {
  const token_ref = useRef<string | null>(null);

  const [queryClient] = useState(queryClientGlobal);
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer,
          headers: () => {
            return token_ref.current ? { Authorization: `Bearer ${token_ref.current}` } : {};
          }
        })
      ]
    })
  );

  const renewToken = useCallback(async () => {
    if (typeof window === 'undefined') return;
    authClient.token().then((token) => {
      if (!token.error) {
        token_ref.current = token.data.token;
        const payload = z
          .object({
            exp: z.number()
          })
          .parse(JSON.parse(atob(token.data.token.split('.')[1])));
        const exp = new Date(payload.exp * 1000);
        const now = new Date();
        const time_diff = exp.getTime() - now.getTime();
        setTimeout(renewToken, time_diff - 1000); // 1 second before expiration new renew token
      }
    });
  }, [token_ref]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    renewToken();
  }, [renewToken]);

  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  );
}
