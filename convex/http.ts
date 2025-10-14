import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { getAuthUser } from './context';
import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const http = httpRouter();

http.route({
  path: '/get_file',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const bearerToken = request.headers.get('Authorization')?.split(' ')[1];
    if (!bearerToken) {
      return new Response('Unauthorized', { status: 401 });
    }
    const auth_user = await getAuthUser(bearerToken);
    if (!auth_user || auth_user.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }
    const { video_job_id } = z
      .object({
        video_job_id: z.string()
      })
      .parse(await request.json());
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
});
export default http;
