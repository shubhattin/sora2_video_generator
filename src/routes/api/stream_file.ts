import { createFileRoute } from '@tanstack/react-router';
import { OpenAI } from 'openai';
import { z } from 'zod';
import get_seesion_from_cookie from '@/lib/get_auth_from_cookie';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY
});

export const Route = createFileRoute('/api/stream_file')({
  validateSearch: z.object({
    video_job_id: z.string()
  }),
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await get_seesion_from_cookie(request.headers.get('cookie') || '');
        if (!session || session.user.role !== 'admin') {
          return new Response('Unauthorized', { status: 401 });
        }

        const url = new URL(request.url);
        const searchParams = Object.fromEntries(url.searchParams.entries());
        const vidoe_job_id = searchParams.video_job_id;
        const content = await openai.videos.downloadContent(vidoe_job_id);

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
      }
    }
  }
});
