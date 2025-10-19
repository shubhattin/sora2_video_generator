import { Hono } from 'hono';
import { getUserSessionMiddleware, protectedAdminRoute } from '../context';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI();

const router = new Hono()
  .use(getUserSessionMiddleware)
  .use(protectedAdminRoute)
  .get('/stream_file', zValidator('query', z.object({ video_job_id: z.string() })), async (c) => {
    const video_job_id = c.req.valid('query').video_job_id;

    const content = await openai.videos.downloadContent(video_job_id);

    const body = content.body;
    const contentType = 'video/mp4';

    let filename = 'file';

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': `public, max-age=${5 * 60 * 1000}`
    });

    // Stream the fetched file back to the client
    return new Response(body, {
      status: 200,
      headers
    });
  })
  .get(
    '/get_video_thumbnail',
    zValidator('query', z.object({ video_job_id: z.string() })),
    async (c) => {
      const video_job_id = c.req.valid('query').video_job_id;
      const thumbnail = await openai.videos.downloadContent(video_job_id, {
        variant: 'thumbnail'
      });
      const body = thumbnail.body;
      const contentType = 'image/png';
      const headers = new Headers({
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${5 * 60 * 1000}`
      });
      return new Response(body, {
        status: 200,
        headers
      });
    }
  );

export const file_router = router;
