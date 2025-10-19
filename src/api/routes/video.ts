import { Hono } from 'hono';
import { getUserJWTMiddleware, protectedAdminRoute } from '../context';
import { zValidator } from '@hono/zod-validator';
import { resizeImageFileCoverExact } from '~/tools/resizeImage.server';

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
      'form',
      z.object({
        prompt: z.string(),
        model: z.enum(['sora-2', 'sora-2-pro']),
        duration_s: z.enum(['4', '8', '12']),
        resolution: z.enum(['1280x720', '720x1280', '1024x1792', '1792x1024']),
        input_reference: z.file().optional()
      })
    ),
    async (c) => {
      const { prompt, model, duration_s, resolution, input_reference } = c.req.valid('form');
      const video = await openai.videos.create({
        model: model,
        prompt: prompt,
        seconds: duration_s,
        size: resolution,
        input_reference: input_reference
          ? await resizeImageFileCoverExact(input_reference, resolution)
          : undefined
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
  })
  .post(
    '/remix_video',
    zValidator('json', z.object({ video_id: z.string(), prompt: z.string() })),
    async (c) => {
      const { video_id, prompt } = c.req.valid('json');
      const remix = await openai.videos.remix(video_id, {
        prompt: prompt
      });
      return c.json(remix);
    }
  );

export const video_router = router;
