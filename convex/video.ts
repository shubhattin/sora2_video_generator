import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import OpenAI from "openai";
import { verifyAuthAdminUser } from "./context";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const createVideoJob = mutation({
  args: {
    auth_token: v.string(),
    prompt: v.string(),
    model: v.union(v.literal("sora-2"), v.literal("sora-2-pro")),
    duration_s: v.union(v.literal(4), v.literal(8), v.literal(12)),
    resolution: v.union(
      v.literal("1280x720"),
      v.literal("720x1280"),
      v.literal("1024x1792"),
      v.literal("1792x1024")
    ),
  },
  handler: async (ctx, args) => {
    await verifyAuthAdminUser(args.auth_token);

    const video = await openai.videos.create({
      model: "sora-2",
      prompt:
        "A video of Indian Man in Traditional attire teaching how to pronounce the sanskrit shloka 'namo vIra bhadrAya'",
      seconds: "8",
      size: "1280x720",
    });

    const id = await ctx.db.insert("video_jobs", {
      job_id: video.id,
      prompt: args.prompt,
      model: video.model,
      created_at: video.created_at,
      duration_s: Number(video.seconds),
      resolution: video.size,
      status: video.status,
      expires_at: video.expires_at ?? undefined,
    });

    return {
      video_job_id: video.id,
      id: id,
    };
  },
});

export const getVideoJob = query({
  args: {
    job_id: v.id("video_jobs"),
    auth_token: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthAdminUser(args.auth_token);
    return await ctx.db.get(args.job_id);
  },
});

export const completeVideoJob = mutation({
  args: {
    job_id: v.id("video_jobs"),
    auth_token: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthAdminUser(args.auth_token);

    const video_job_record = await ctx.db.get(args.job_id);
    const video_job_id = video_job_record?.job_id;
    if (!video_job_id) {
      throw new Error("Video job not found");
    }
    let video = await openai.videos.retrieve(video_job_id);
    let progress = video.progress ?? 0;
    while (video.status === "in_progress" || video.status === "queued") {
      video = await openai.videos.retrieve(video_job_id);
      progress = video.progress ?? 0;

      await Promise.all([
        ctx.db.patch(args.job_id, {
          status: video.status,
          progress: progress,
        }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
    await ctx.db.patch(args.job_id, {
      status: video.status,
      progress: progress,
      completed_at: video.completed_at ?? undefined,
      error: video.error ?? undefined,
    });
    return video.error;
  },
});
