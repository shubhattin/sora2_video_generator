import z from 'zod';
import { t, protectedAdminProcedure } from '../trpc_init';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY
});

const create_video_job_route = protectedAdminProcedure
  .input(
    z.object({
      prompt: z.string(),
      model: z.enum(['sora-2', 'sora-2-pro']),
      duration_s: z.enum(['4', '8', '12']),
      resolution: z.enum(['1280x720', '720x1280', '1024x1792', '1792x1024'])
    })
  )
  .mutation(async ({ input: { model, duration_s, prompt, resolution } }) => {
    const video = await openai.videos.create({
      model: model,
      prompt: prompt,
      seconds: duration_s,
      size: resolution
    });

    return video;
  });

const get_video_job_info_route = protectedAdminProcedure
  .input(
    z.object({
      job_id: z.string()
    })
  )
  .query(async ({ input: { job_id } }) => {
    const video = await openai.videos.retrieve(job_id);
    return video;
  });

const list_video_jobs_route = protectedAdminProcedure.query(async () => {
  let videos_page = await openai.videos.list({
    limit: 100
  });
  const now_s = new Date().getTime() / 1000;
  const videos = videos_page.data.filter(
    (video) => video.status === 'completed' && video.expires_at && now_s <= video.expires_at
  );
  return videos;
});

export const videoRouter = t.router({
  create_video_job: create_video_job_route,
  get_video_job_info: get_video_job_info_route,
  list_video_jobs: list_video_jobs_route
});
