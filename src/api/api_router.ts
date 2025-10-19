import { Hono } from 'hono';
import { video_router } from './routes/video';
import { file_router } from './routes/file';

const router = new Hono().route('/video', video_router).route('/file', file_router);

export const api_handler = new Hono().route('/api', router);

export type Router = typeof router;
