import { useTRPC } from '@/api/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai/react';
import { Plus, List, Clock, Download, RotateCw } from 'lucide-react';
import type { Video } from 'openai/resources/videos';
import pretty_ms from 'pretty-ms';
import { Button } from '@/components/ui/button';
import { download_video_file_in_browser } from '@/tools/download_file_browser';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const MODELS = ['sora-2', 'sora-2-pro'] as const;
const DURATION_S = ['4', '8', '12'] as const;
type resolutions_type = '1280x720' | '720x1280' | '1024x1792' | '1792x1024';
const RESOLUTIONS: Record<(typeof MODELS)[number], resolutions_type[]> = {
  'sora-2': ['1280x720', '720x1280'],
  'sora-2-pro': ['720x1280', '1280x720', '1024x1792', '1792x1024']
};

const selected_tab_atom = atomWithStorage<'create' | 'list'>('selected_tab', 'create');

export default function MainPage() {
  const [tab, setTab] = useAtom(selected_tab_atom);

  return (
    <main className="container mx-auto px-4 py-8">
      <Tabs value={tab} onValueChange={(value) => setTab(value as 'create' | 'list')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger className="text-lg font-semibold" value="create">
            <Plus className="size-5" />
            Create
          </TabsTrigger>
          <TabsTrigger className="text-lg font-semibold" value="list">
            <List className="size-5" />
            List
          </TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <CreateVideoJob />
        </TabsContent>
        <TabsContent value="list">
          <VideoJobList />
        </TabsContent>
      </Tabs>
    </main>
  );
}

const CreateVideoJob = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<(typeof MODELS)[number]>('sora-2');
  const [duration_s, setDuration_s] = useState<(typeof DURATION_S)[number]>('4');
  const [resolution, setResolution] = useState<resolutions_type>('1280x720');

  useEffect(() => {
    setResolution(RESOLUTIONS[model][0]);
  }, [model]);

  const INFO_REFRESH_INTERVAL_MS = 3500;
  const inetervalRef = useRef<NodeJS.Timeout | null>(null);
  const create_video_job_mut = useMutation(
    trpc.video.create_video_job.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.video.list_video_jobs.queryFilter());

        if (inetervalRef.current) clearInterval(inetervalRef.current);
        inetervalRef.current = setInterval(() => {
          const current_data = create_video_job_mut.data;
          if (current_data?.status === 'completed' || current_data?.status === 'failed') {
            queryClient.invalidateQueries(trpc.video.list_video_jobs.queryFilter());
            if (inetervalRef.current) clearInterval(inetervalRef.current);
            return;
          }
          queryClient.invalidateQueries(
            trpc.video.get_video_job_info.queryFilter({
              job_id: data.id
            })
          );
        }, INFO_REFRESH_INTERVAL_MS);
      }
    })
  );
  useEffect(() => {
    return () => {
      if (inetervalRef.current) clearInterval(inetervalRef.current);
    };
  }, []);
  const onClickCreate = () => {
    if (inetervalRef.current) clearInterval(inetervalRef.current);
    create_video_job_mut.reset();
    create_video_job_mut.mutate({
      prompt: prompt,
      model: model,
      duration_s: duration_s,
      resolution: resolution
    });
  };

  const current_video_job_info_q = useQuery(
    trpc.video.get_video_job_info.queryOptions(
      {
        job_id: create_video_job_mut.data?.id!
      },
      {
        enabled: !!create_video_job_mut.data?.id
      }
    )
  );

  const status_video = current_video_job_info_q.data ?? create_video_job_mut.data;

  return (
    <div className="mx-auto mt-4 max-w-5xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate video</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the scene you want"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={(v) => setModel(v as (typeof MODELS)[number])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={duration_s}
                onValueChange={(v) => setDuration_s(v as (typeof DURATION_S)[number])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_S.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} sec
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
              <Select
                value={resolution}
                onValueChange={(v) => setResolution(v as resolutions_type)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS[model].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-2 md:col-span-2">
              <Button onClick={onClickCreate} disabled={create_video_job_mut.isPending || !prompt}>
                Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {status_video && (
        <Card>
          <CardContent>
            {status_video.status === 'completed' ? (
              <div className="space-y-4">
                <div className="aspect-video w-full overflow-hidden rounded-lg border shadow-sm">
                  <video
                    src={`/api/stream_file?video_job_id=${status_video.id}`}
                    className="h-full w-full"
                    controls
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="px-2 text-xs text-muted-foreground">
                    Expires in :{' '}
                    {pretty_ms(
                      status_video.expires_at
                        ? status_video.expires_at * 1000 - new Date().getTime()
                        : 0
                    )}
                  </span>
                  <Button
                    variant={'outline'}
                    onClick={() =>
                      download_video_file_in_browser(status_video.id, status_video.id + '.mp4')
                    }
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                </div>
              </div>
            ) : status_video.status === 'failed' ? (
              <div className="text-sm text-destructive">
                {status_video.error?.message || 'Video generation failed.'}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Progress
                    value={Math.max(0, Math.min(100, (status_video as any).progress ?? 0))}
                  />
                  <div className="text-xs text-muted-foreground">
                    {status_video.status === 'queued' ? 'Queued' : 'In progress'} ·{' '}
                    {status_video?.progress ?? 0}%
                  </div>
                </div>
                <Skeleton className="aspect-video w-full rounded-lg" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const VideoJobList = () => {
  const trpc = useTRPC();
  const video_job_q = useQuery(trpc.video.list_video_jobs.queryOptions());
  const queryClient = useQueryClient();

  return (
    <div className="mx-auto max-w-6xl space-y-4 lg:space-y-5">
      <div className="mt-4 flex items-center justify-center">
        <Button
          variant={'outline'}
          size={'sm'}
          onClick={() => {
            queryClient.invalidateQueries(trpc.video.list_video_jobs.queryFilter());
          }}
          disabled={video_job_q.isFetching}
        >
          <RotateCw className={`size-4 ${video_job_q.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {video_job_q.isLoading ? (
        <>
          <LoadingItemSkeleton />
          <LoadingItemSkeleton />
          <LoadingItemSkeleton />
        </>
      ) : video_job_q.data!.length > 0 ? (
        video_job_q.data?.map((video) => <CompletedVideoJobItem key={video.id} video={video} />)
      ) : (
        <div className="text-center text-sm text-muted-foreground">No videos found</div>
      )}
    </div>
  );
};

const CompletedVideoJobItem = ({ video }: { video: Video }) => {
  const onDownloadClick = async () => {
    download_video_file_in_browser(video.id, video.id + '.mp4');
  };
  const video_url = `/api/stream_file?video_job_id=${video.id}`;

  return (
    <div className="rounded-xl border bg-background/40 p-4 shadow-sm transition-colors hover:bg-background/60 sm:p-5 lg:p-6">
      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:col-span-5">
          <span className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm">
            <Clock className="size-4" />
            {new Date(video.created_at * 1000).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </span>

          <span className="text-xs text-muted-foreground sm:text-sm">
            Expires in:{' '}
            {pretty_ms(video.expires_at ? video.expires_at * 1000 - new Date().getTime() : 0)}
          </span>

          <Button className="h-9 px-4" variant={'outline'} onClick={onDownloadClick}>
            <Download className="size-4" />
            Download
          </Button>
          <span className="px-2 text-xs sm:text-sm">Size: {video.size}</span>
        </div>

        <div className="lg:col-span-7">
          <video
            src={video_url}
            className="max-h-[360px] w-full rounded-lg border shadow-sm"
            controls={true}
          />
        </div>
      </div>
    </div>
  );
};

const LoadingItemSkeleton = () => {
  return (
    <div className="rounded-xl border bg-background/40 p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:col-span-5">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="lg:col-span-7">
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};
