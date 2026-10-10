import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("News Garden Uncaught Runtime Exception:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full rounded-2xl bg-slate-900/90 border border-rose-500/30 p-6 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />

            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="font-display text-lg font-bold text-white mb-2 tracking-wide">
              {this.props.fallbackTitle || "Dispatch Telemetry Interrupted"}
            </h2>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              An unexpected rendering exception was intercepted. Telemetry state has been safely isolated to preserve your session.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="text-xs h-9 border-white/20 hover:bg-white/[0.08] text-slate-200"
              >
                <Home className="w-3.5 h-3.5 mr-1.5" /> Return to Globe
              </Button>
              <Button
                size="sm"
                onClick={() => window.location.reload()}
                className="text-xs h-9 bg-primary text-slate-950 font-semibold hover:bg-primary/90"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reload View
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
