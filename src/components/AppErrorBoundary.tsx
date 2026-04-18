import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
  info: ErrorInfo | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
    info: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, info);
    this.setState({ error, info });
  }

  render() {
    const { error, info } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="mx-auto max-w-4xl space-y-4 rounded-lg border border-destructive/50 bg-card p-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-destructive">Application Error</h1>
            <p className="text-sm text-muted-foreground">
              The page crashed during rendering. Safari should now show the error details here instead of a blank screen.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">Message</h2>
            <pre className="overflow-auto rounded-md bg-muted p-4 text-sm whitespace-pre-wrap break-words">
              {error.name}: {error.message}
            </pre>
          </div>

          {error.stack && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Stack</h2>
              <pre className="overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap break-words">
                {error.stack}
              </pre>
            </div>
          )}

          {info?.componentStack && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Component Stack</h2>
              <pre className="overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap break-words">
                {info.componentStack}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
}
