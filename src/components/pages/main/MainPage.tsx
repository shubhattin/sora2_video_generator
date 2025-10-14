import { Card, CardContent } from "@/components/ui/card";
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
  return <main className="container mx-auto px-4 py-8"></main>;
}

const VideoJobCreated = () => {
  return <div>VideoJobCreated</div>;
};
