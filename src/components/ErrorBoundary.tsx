import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled UI error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 px-6 text-center">
          <h1 className="text-4xl font-semibold tracking-tighter mb-4">Something went wrong</h1>
          <p className="text-slate-500 dark:text-zinc-400 tracking-tight mb-8 max-w-md">
            An unexpected error occurred. Try refreshing the page — if it keeps happening, let us know.
          </p>
          <a
            href="/"
            className="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium tracking-tight hover:opacity-80 transition-opacity"
          >
            Go back home
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}
