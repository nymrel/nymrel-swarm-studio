import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    console.error('Swarm Studio fixture failed to render.', error);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <main className="error-boundary" role="alert">
          <p className="eyebrow">Reference interface</p>
          <h1>The fixture could not render.</h1>
          <p>No external system was affected. Reload the page to restore the in-memory example state.</p>
          <button className="btn btn-primary" onClick={() => globalThis.location.reload()}>
            Reload fixture
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
