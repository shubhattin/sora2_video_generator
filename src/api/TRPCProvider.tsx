import { httpBatchLink, createTRPCClient } from "@trpc/client";
import { useState } from "react";
import transformer from "./transformer";
import { TRPCProvider } from "./client";
import type { AppRouter } from "./trpc_router";
import { queryClient as queryClientGlobal } from "~/lib/queryClient";

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(queryClientGlobal);
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer,
        }),
      ],
    })
  );

  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  );
}
