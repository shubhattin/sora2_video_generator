import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "$convex/_generated/api";
import type { Id } from "$convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

const MODELS = ["sora-2", "sora-2-pro"] as const;
const DURATION_S = [4, 8, 12] as const;
type resolutions_type = "1280x720" | "720x1280" | "1024x1792" | "1792x1024";
const RESOLUTIONS: Record<(typeof MODELS)[number], resolutions_type[]> = {
  "sora-2": ["1280x720", "720x1280"],
  "sora-2-pro": ["720x1280", "1280x720", "1024x1792", "1792x1024"],
};

export default function MainPage() {
  const [jwtToken, setToken] = useState("");
  const createVideoJobMut = useMutation(api.video.createVideoJob);
  useEffect(() => {
    authClient.token().then((token) => {
      if (!token.error) {
        setToken(token.data.token);
      }
    });
  }, []);

  return <main className="container mx-auto px-4 py-8"></main>;
}

const VideoJobCreated = ({
  job_id,
  jwtToken,
}: {
  job_id: string;
  jwtToken: string;
}) => {
  const videoJobs = useQuery(api.video.getVideoJob, {
    job_id: job_id as Id<"video_jobs">,
    auth_token: jwtToken,
  });
  const completeVideoJobMut = useMutation(api.video.completeVideoJob);

  return <div>VideoJobCreated</div>;
};
