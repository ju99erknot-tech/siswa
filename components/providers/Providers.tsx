"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// ── QueryClient singleton ─────────────────────────────────────
// Recommended pattern for Next.js App Router + Turbopack.
// Using a module-level singleton prevents context loss on HMR and
// ensures a single QueryClient instance across the entire browser session.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

// On the server we always make a fresh client (no module-level singleton).
// In the browser we keep the same instance across HMR reloads.
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new client to avoid state leaking between requests
    return makeQueryClient();
  }
  // Browser: reuse the same client so context is never lost
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Do NOT use useState here — we want the singleton from getQueryClient()
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-center"
        richColors
        closeButton
        gap={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0d1221',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '16px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
            padding: '14px 16px',
          },
          classNames: {
            success: '!border-emerald-500/20 !bg-emerald-500/[0.08]',
            error: '!border-rose-500/20 !bg-rose-500/[0.08]',
            warning: '!border-amber-500/20 !bg-amber-500/[0.08]',
            info: '!border-violet-500/20 !bg-violet-500/[0.08]',
            closeButton: '!bg-white/5 !border-white/10 !text-white/40 hover:!text-white/80 hover:!bg-white/10',
          },
        }}
      />
      {children}
    </QueryClientProvider>
  );
}
