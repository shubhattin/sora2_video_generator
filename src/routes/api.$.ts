import { createFileRoute } from '@tanstack/react-router';
import { api_handler } from '@/api/api_router';

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: ({ request }) => api_handler.fetch(request),
      POST: ({ request }) => api_handler.fetch(request)
    }
  }
});
