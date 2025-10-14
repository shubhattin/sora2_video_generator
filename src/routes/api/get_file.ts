import { createFileRoute } from '@tanstack/react-router';
import { OpenAI } from 'openai';
import { z } from 'zod';
import { createContext } from '~/api/context';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY
});

export const Route = createFileRoute('/api/get_file')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const bearerToken = request.headers.get('Authorization')?.split(' ')[1];
        if (!bearerToken) {
          return new Response('Unauthorized', { status: 401 });
        }
        const { user } = await createContext({ req: request });
        if (!user || user.role !== 'admin') {
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
      }
    }
  }
});
