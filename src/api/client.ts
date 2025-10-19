import { hc } from 'hono/client';
import type { Router } from './api_router';
import { authClient } from '@/lib/auth-client';
import z from 'zod';

const token_ref: {
  jwt_token: string | null;
} = {
  jwt_token: null
};

const renewToken = async () => {
  if (typeof window === 'undefined') return;
  authClient.token().then((token) => {
    if (!token.error) {
      token_ref.jwt_token = token.data.token;
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
};

export const client = hc<Router>(
  (typeof window !== 'undefined' ? window.location.origin : '') + '/api',
  {
    headers: () => ({
      Authorization: `Bearer ${token_ref.jwt_token}`
    })
  }
);

if (typeof window !== 'undefined') {
  renewToken();
}

export const QUERY_KEYS = {
  video: {
    video_jobs_list: () => ['video', 'video_jobs_list'],
    video_job_info: (job_id: string) => ['video', 'video_job_info', job_id]
  }
} as const;
