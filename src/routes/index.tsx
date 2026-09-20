import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MemoryBondApp } from "../components/memory-bond/MemoryBondApp";
import { AppLoadingScreen } from "../components/memory-bond/AppLoadingScreen";
import { SafeRouteErrorBoundary } from "../components/memory-bond/SafeRouteErrorBoundary";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
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

