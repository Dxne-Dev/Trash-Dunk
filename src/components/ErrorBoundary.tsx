import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("TrashDunk uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[350px] w-full flex-col items-center justify-center p-6 text-center">
          <div className="rounded-xl border border-red-500/40 bg-arena-900/90 p-8 shadow-2xl backdrop-blur-md max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-chalk">Un incident est survenu</h3>
            <p className="mb-6 text-xs text-chalk-dim/80 leading-relaxed">
              La démo a rencontré une anomalie inattendue. Vous pouvez la réinitialiser sans quitter la page.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-dunk-500 px-5 py-2.5 text-xs font-bold text-black transition hover:bg-dunk-400 active:scale-95 shadow-lg shadow-dunk-500/25 cursor-pointer"
            >
              Réinitialiser la démo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
