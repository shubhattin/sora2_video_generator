import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  video_jobs: defineTable({
    job_id: v.string(),
    prompt: v.string(),
    model: v.string(),
    duration_s: v.number(),
    resolution: v.string(),
    status: v.union(
      v.literal('queued'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('failed')
    ),
    progress: v.optional(v.number()),
    created_at: v.number(),
    expires_at: v.optional(v.number()),
    completed_at: v.optional(v.number()),
    error: v.optional(
      v.object({
        message: v.string(),
        code: v.optional(v.string())
      })
    )
  }).index('job_id', ['job_id'])
});
