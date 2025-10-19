import { hc } from 'hono/client';
import type { Router } from './api_router';

export const client = hc<Router>(
  (typeof window !== 'undefined' ? window.location.origin : '') + '/api',
  {
    headers: () => ({})
  }
);

export const QUERY_KEYS = {
  video: {
    video_jobs_list: () => ['video', 'video_jobs_list'],
    video_job_info: (job_id: string) => ['video', 'video_job_info', job_id]
  }
} as const;
