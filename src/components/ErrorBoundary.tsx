import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logClientError } from "@/lib/errorLogger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    void logClientError({
      error,
      action: "ErrorBoundary",
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground text-sm">
              The error has been logged and our team will look into it. You can
              try reloading the page to continue.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-muted-foreground font-mono bg-muted p-3 rounded text-left break-words">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={this.handleReset}>
                Try again
              </Button>
              <Button onClick={this.handleReload}>Reload page</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
