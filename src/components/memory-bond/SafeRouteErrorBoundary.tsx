import { Component, type ReactNode, type ErrorInfo } from "react";
import { Heart, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SafeRouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
            <h2 className="text-2xl font-black text-foreground font-display">Welcome to Memory Bond</h2>
            <p className="text-sm text-muted-foreground font-medium">
              A temporary issue occurred while loading this view. Tap below to reload the companion.
            </p>
            {this.state.error && (
              <p className="p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-mono break-all text-left">
                {this.state.error.message}
              </p>
            )}
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              className="w-full h-12 rounded-2xl font-black gap-2 text-base shadow-sm bg-primary hover:bg-primary/90 text-white cursor-pointer"
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
