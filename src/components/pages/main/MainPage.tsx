import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query';
import { atomWithStorage } from 'jotai/utils';
import { useAtom, useSetAtom } from 'jotai/react';
import { Plus, List, Clock, Download, RotateCw, ChevronsUpDown, Check } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { client, QUERY_KEYS } from '~/api/client';
import { InferRequestType, InferResponseType } from 'hono';
import { cn } from '@/lib/utils';
import { atom } from 'jotai';

const MODELS = ['sora-2', 'sora-2-pro'] as const;
const DURATION_S = ['4', '8', '12'] as const;
type resolutions_type = '1280x720' | '720x1280' | '1024x1792' | '1792x1024';
const RESOLUTIONS: Record<(typeof MODELS)[number], resolutions_type[]> = {
  'sora-2': ['1280x720', '720x1280'],
  'sora-2-pro': ['720x1280', '1280x720', '1024x1792', '1792x1024']
};

const selected_tab_atom = atomWithStorage<'create' | 'remix' | 'list'>('selected_tab', 'create');
const remix_video_id_atom = atom<string | null>(null);

export default function MainPage() {
  const [tab, setTab] = useAtom(selected_tab_atom);

  return (
    <main className="container mx-auto px-4 py-8">
      <Tabs value={tab} onValueChange={(value) => setTab(value as 'create' | 'remix' | 'list')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger className="text-lg font-semibold" value="create">
            <Plus className="size-5" />
            Create
          </TabsTrigger>
          <TabsTrigger className="text-lg font-semibold" value="remix">
            <RotateCw className="size-4" />
            Remix
          </TabsTrigger>
          <TabsTrigger className="text-lg font-semibold" value="list">
            <List className="size-5" />
            List
          </TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <CreateVideo />
        </TabsContent>
        <TabsContent value="remix">
          <RemixVideo />
        </TabsContent>
        <TabsContent value="list">
          <VideoList />
        </TabsContent>
      </Tabs>
    </main>
  );
}

const videoListQueryOption = queryOptions({
  queryKey: QUERY_KEYS.video.video_jobs_list(),
  queryFn: () => client.video.list_video_jobs.$get().then((res) => res.json())
});

const INFO_REFRESH_INTERVAL_MS = 4000;
const CreateVideo = () => {
  const queryClient = useQueryClient();
  const [, setTab] = useAtom(selected_tab_atom);
  const [, setRemixVideoId] = useAtom(remix_video_id_atom);

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<(typeof MODELS)[number]>('sora-2');
  const [duration_s, setDuration_s] = useState<(typeof DURATION_S)[number]>('4');
  const [resolution, setResolution] = useState<resolutions_type>('1280x720');

  useEffect(() => {
    setResolution(RESOLUTIONS[model][0]);
  }, [model]);

  const inetervalRef = useRef<NodeJS.Timeout | null>(null);

  const $post = client.video.create_video_job.$post;
  const create_video_job_mut = useMutation<
    InferResponseType<typeof $post>,
    Error,
    InferRequestType<typeof $post>['json']
  >({
    mutationFn: (data) => {
      return client.video.create_video_job
        .$post({
          json: data
        })
        .then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries(videoListQueryOption);
    }
  });
  useEffect(() => {
    return () => {
      if (inetervalRef.current) clearInterval(inetervalRef.current);
    };
  }, []);
  const onClickCreate = () => {
    if (inetervalRef.current) clearInterval(inetervalRef.current);
    if (!prompt || prompt.trim() === '') return;
    create_video_job_mut.reset();
    create_video_job_mut.mutate({
      prompt: prompt,
      model: model,
      duration_s: duration_s,
      resolution: resolution
    });
  };

  const current_video_job_info_q = useQuery({
    queryKey: QUERY_KEYS.video.video_job_info(create_video_job_mut.data?.id!),
    queryFn: () =>
      client.video.get_video_job_info
        .$get({
          query: {
            job_id: create_video_job_mut.data?.id!
          }
        })
        .then((res) => res.json()),
    enabled: !!create_video_job_mut.data?.id
  });

  const status_video = current_video_job_info_q.data ?? create_video_job_mut.data;

  // Poll for job status updates based on current job id and status
  useEffect(() => {
    const jobId = create_video_job_mut.data?.id;
    if (!jobId) return;

    // Clear any existing interval first
    if (inetervalRef.current) {
      clearInterval(inetervalRef.current);
      inetervalRef.current = null;
    }

    const isTerminal =
      status_video?.status === 'completed' ||
      status_video?.status === 'failed' ||
      Boolean((status_video as any)?.error);

    if (isTerminal) {
      // ensure list is fresh once terminal
      queryClient.invalidateQueries(videoListQueryOption);
      return;
    }

    // Kick an immediate refresh once
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.video.video_job_info(jobId) });
    inetervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.video.video_job_info(jobId) });
    }, INFO_REFRESH_INTERVAL_MS);

    return () => {
      if (inetervalRef.current) {
        clearInterval(inetervalRef.current);
        inetervalRef.current = null;
      }
    };
  }, [create_video_job_mut.data?.id, status_video?.status]);

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
              <Button
                onClick={onClickCreate}
                disabled={
                  create_video_job_mut.isPending ||
                  !prompt ||
                  status_video?.status === 'in_progress' ||
                  status_video?.status === 'queued'
                }
              >
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
                    src={
                      client.file.stream_file.$url({
                        query: {
                          video_job_id: status_video.id
                        }
                      }).href
                    }
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
                    onClick={async () => {
                      await queryClient.invalidateQueries(videoListQueryOption);
                      setTab('remix');
                      setRemixVideoId(status_video.id);
                    }}
                  >
                    Remix this Video
                  </Button>
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

const RemixVideo = () => {
  const queryClient = useQueryClient();
  const $post = client.video.remix_video.$post;
  const remix_video_mut = useMutation<
    InferResponseType<typeof $post>,
    Error,
    InferRequestType<typeof $post>['json']
  >({
    mutationFn: (data) => {
      return client.video.remix_video.$post({ json: data }).then((res) => res.json());
    }
  });

  const inetervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    return () => {
      if (inetervalRef.current) clearInterval(inetervalRef.current);
    };
  }, []);

  const [prompt, setPrompt] = useState('');
  const [video_id, setVideo_id] = useAtom(remix_video_id_atom);
  const [open, setOpen] = useState(false);
  const videos_list_q = useQuery(videoListQueryOption);

  const onClickRemix = () => {
    if (!video_id) return;
    if (!prompt || prompt.trim() === '') return;
    if (inetervalRef.current) clearInterval(inetervalRef.current);
    remix_video_mut.reset();
    remix_video_mut.mutate({ video_id: video_id, prompt: prompt });
  };

  const current_video_job_info_q = useQuery({
    queryKey: QUERY_KEYS.video.video_job_info(remix_video_mut.data?.id!),
    queryFn: () =>
      client.video.get_video_job_info
        .$get({
          query: {
            job_id: remix_video_mut.data?.id!
          }
        })
        .then((res) => res.json()),
    enabled: !!remix_video_mut.data?.id
  });

  const status_video = current_video_job_info_q.data ?? remix_video_mut.data;
  const selectedVideo = videos_list_q.data?.find((v) => v.id === video_id) ?? null;

  // Poll for remix job status updates
  useEffect(() => {
    const jobId = remix_video_mut.data?.id;
    if (!jobId) return;

    if (inetervalRef.current) {
      clearInterval(inetervalRef.current);
      inetervalRef.current = null;
    }

    const isTerminal =
      status_video?.status === 'completed' ||
      status_video?.status === 'failed' ||
      Boolean((status_video as any)?.error);

    if (isTerminal) {
      queryClient.invalidateQueries(videoListQueryOption);
      return;
    }

    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.video.video_job_info(jobId) });
    inetervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.video.video_job_info(jobId) });
    }, INFO_REFRESH_INTERVAL_MS);

    return () => {
      if (inetervalRef.current) {
        clearInterval(inetervalRef.current);
        inetervalRef.current = null;
      }
    };
  }, [remix_video_mut.data?.id, status_video?.status]);

  return (
    <div className="mx-auto mt-4 max-w-5xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Remix video</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Video</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={videos_list_q.isLoading || (videos_list_q.data?.length ?? 0) === 0}
                  >
                    {selectedVideo ? (
                      <span className="flex items-center gap-2 overflow-hidden">
                        {/* thumbnail */}
                        <img
                          src={
                            client.file.get_video_thumbnail.$url({
                              query: { video_job_id: selectedVideo.id }
                            }).href
                          }
                          alt="thumb"
                          className="h-6 w-10 rounded object-cover"
                          loading="lazy"
                        />
                        <span className="truncate text-left text-sm">{selectedVideo.id}</span>
                      </span>
                    ) : videos_list_q.isLoading ? (
                      'Loading videos...'
                    ) : (
                      'Select video...'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] p-0">
                  <Command>
                    <CommandInput placeholder="Search videos..." />
                    <CommandList>
                      <CommandEmpty>No videos found.</CommandEmpty>
                      <CommandGroup>
                        {videos_list_q.data?.map((video) => {
                          const thumbUrl = client.file.get_video_thumbnail.$url({
                            query: { video_job_id: video.id }
                          }).href;
                          return (
                            <CommandItem
                              key={video.id}
                              value={video.id}
                              onSelect={(currentValue) => {
                                setVideo_id(currentValue === video_id ? null : currentValue);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  video_id === video.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <img
                                src={thumbUrl}
                                alt="thumb"
                                className="h-10 w-16 rounded object-cover"
                                loading="lazy"
                              />
                              <div className="min-w-0">
                                <div className="truncate text-sm">{video.id}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(video.created_at * 1000).toLocaleString()}
                                </div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="remix_prompt">Prompt</Label>
              <Textarea
                id="remix_prompt"
                placeholder="Describe how you want to remix the selected video"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2 md:col-span-2">
              <Button
                onClick={onClickRemix}
                disabled={
                  remix_video_mut.isPending ||
                  !prompt ||
                  !video_id ||
                  status_video?.status === 'in_progress' ||
                  status_video?.status === 'queued'
                }
              >
                Remix
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
                    src={
                      client.file.stream_file.$url({
                        query: {
                          video_job_id: status_video.id
                        }
                      }).href
                    }
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
                    onClick={() => {
                      setPrompt('');
                      remix_video_mut.reset();
                      if (status_video?.id) {
                        setVideo_id(status_video.id);
                      }
                    }}
                  >
                    Remix this Video
                  </Button>
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
                {status_video.error?.message || 'Video remix failed.'}
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

const VideoList = () => {
  const video_jobs_q = useQuery(videoListQueryOption);
  const queryClient = useQueryClient();

  return (
    <div className="mx-auto max-w-6xl space-y-4 lg:space-y-5">
      <div className="mt-4 flex items-center justify-center">
        <Button
          variant={'outline'}
          size={'sm'}
          onClick={() => {
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.video.video_jobs_list()
            });
          }}
          disabled={video_jobs_q.isFetching}
        >
          <RotateCw className={`size-4 ${video_jobs_q.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {video_jobs_q.isLoading ? (
        <>
          <LoadingItemSkeleton />
          <LoadingItemSkeleton />
          <LoadingItemSkeleton />
        </>
      ) : video_jobs_q.data && video_jobs_q.data.length > 0 ? (
        video_jobs_q.data.map((video) => <CompletedVideoJobItem key={video.id} video={video} />)
      ) : (
        <div className="text-center text-sm text-muted-foreground">No videos found</div>
      )}
    </div>
  );
};

const CompletedVideoJobItem = ({ video }: { video: Video }) => {
  const setTab = useSetAtom(selected_tab_atom);
  const setRemixVideoId = useSetAtom(remix_video_id_atom);

  const onDownloadClick = async () => {
    download_video_file_in_browser(video.id, video.id + '.mp4');
  };
  const video_url = client.file.stream_file.$url({
    query: {
      video_job_id: video.id
    }
  }).href;

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
          <Button
            variant={'outline'}
            onClick={async () => {
              setTab('remix');
              setRemixVideoId(video.id);
            }}
          >
            Remix this Video
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
