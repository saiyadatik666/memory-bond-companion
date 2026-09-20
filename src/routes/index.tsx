import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MemoryBondApp } from "@/components/memory-bond/MemoryBondApp";
import { AppLoadingScreen } from "@/components/memory-bond/AppLoadingScreen";
import { SafeRouteErrorBoundary } from "@/components/memory-bond/SafeRouteErrorBoundary";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  errorComponent: RouteErrorFallback,
});

function RouteErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-8 text-center shadow-lg space-y-4">
        <h2 className="text-xl font-bold text-foreground">Something went wrong while loading this page.</h2>
        <p className="text-sm text-muted-foreground font-medium">
          A temporary issue occurred while loading this view. Tap below to reload the companion.
        </p>
        {error && (
          <p className="p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-mono break-all text-left">
            {error.message}
          </p>
        )}
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            } else {
              reset();
            }
          }}
          className="w-full h-12 rounded-2xl font-black text-base shadow-sm bg-primary hover:bg-primary/90 text-white cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export function RouteComponent() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // 1.2-second subtle branded splash animation, then seamlessly open the welcome screen
      timer = setTimeout(() => {
        setIsClientReady(true);
      }, 1200);
    } catch (err: any) {
      setInitError(err?.message || "Failed to initialize companion view");
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!isClientReady) {
    return (
      <AppLoadingScreen
        error={initError}
        onRetry={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
        onSkip={() => setIsClientReady(true)}
      />
    );
  }

  return (
    <SafeRouteErrorBoundary>
      <MemoryBondApp />
    </SafeRouteErrorBoundary>
  );
}
