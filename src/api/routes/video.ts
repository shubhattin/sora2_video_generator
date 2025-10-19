import { Hono } from 'hono';
import { getUserJWTMiddleware, protectedAdminRoute } from '../context';
import { zValidator } from '@hono/zod-validator';

import OpenAI from 'openai';
import z from 'zod';

const openai = new OpenAI();

const router = new Hono()
  .use(getUserJWTMiddleware)
  .use(protectedAdminRoute)
  // all routes are protected admin routes
  .post(
    '/create_video_job',
    zValidator(
      'json',
      z.object({
        prompt: z.string(),
        model: z.enum(['sora-2', 'sora-2-pro']),
        duration_s: z.enum(['4', '8', '12']),
        resolution: z.enum(['1280x720', '720x1280', '1024x1792', '1792x1024'])
      })
    ),
    async (c) => {
      const { prompt, model, duration_s, resolution } = c.req.valid('json');
      const video = await openai.videos.create({
        model: model,
        prompt: prompt,
        seconds: duration_s,
        size: resolution
      });

      return c.json(video);
    }
  )
  .get(
    '/get_video_job_info',
    zValidator(
      'query',
      z.object({
        job_id: z.string()
      })
    ),
    async (c) => {
      const { job_id } = c.req.valid('query');
      const video = await openai.videos.retrieve(job_id);
      return c.json(video);
    }
  )
  .get('/list_video_jobs', async (c) => {
    let videos_page = await openai.videos.list({
      limit: 100,
      order: 'desc'
    });
    const now_s = new Date().getTime() / 1000;
    const videos = videos_page.data.filter(
      (video) => video.status === 'completed' && video.expires_at && now_s <= video.expires_at
    );
    return c.json(videos);
  });

export const video_router = router;
