import { createFileRoute } from "@tanstack/react-router";
import { Component, type ReactNode, type ErrorInfo } from "react";
import { MemoryBondApp } from "../components/memory-bond/MemoryBondApp";
import { Heart, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SafeRouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[MemoryBond Route Error]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-8 text-center shadow-lg space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mx-auto">
              <Heart className="h-8 w-8 fill-primary/20 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Welcome to Memory Bond</h2>
            <p className="text-sm text-muted-foreground">
              A temporary issue occurred while loading this view. Tap below to reload the companion.
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              className="w-full h-12 rounded-2xl font-bold gap-2 text-base shadow-sm"
            >
              <RotateCcw className="h-5 w-5" /> Reload Application
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Route = createFileRoute("/")({
  component: RouteComponent,
  pendingComponent: LoadingFallback,
  errorComponent: RouteErrorFallback,
});

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary animate-pulse shadow-sm">
          <Heart className="h-8 w-8 fill-primary/30 text-primary animate-bounce" />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground">Memory Bond</h3>
          <p className="text-xs text-muted-foreground">Loading your cognitive companion...</p>
        </div>
      </div>
    </div>
  );
}

function RouteErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-8 text-center shadow-lg space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/25 flex items-center justify-center text-destructive mx-auto">
          <Heart className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Memory Bond</h2>
        <p className="text-sm text-muted-foreground">
          {error?.message || "An unexpected error occurred while loading the view."}
        </p>
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => {
              reset();
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="flex-1 h-12 rounded-2xl font-bold gap-2 text-base"
          >
            <RotateCcw className="h-5 w-5" /> Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  return (
    <SafeRouteErrorBoundary>
      <MemoryBondApp />
    </SafeRouteErrorBoundary>
  );
}

