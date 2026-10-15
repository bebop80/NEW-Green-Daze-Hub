import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('gd_direct_calendar_app');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#121620] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={36} />
          </div>

          <h1 className="font-['Bebas_Neue'] text-3xl sm:text-4xl tracking-wider text-white mb-2 uppercase">
            Ops, qualcosa è andato storto!
          </h1>

          <p className="font-mono text-xs sm:text-sm text-zinc-400 max-w-sm mb-6">
            Si è verificato un errore imprevisto. Tocca il pulsante qui sotto per ricaricare l'app.
          </p>

          {this.state.error && (
            <div className="max-w-md w-full bg-black/40 border border-white/10 rounded-xl p-3 text-left font-mono text-[11px] text-zinc-400 overflow-x-auto mb-6">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-['Bebas_Neue'] text-base tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
          >
            <RefreshCw size={18} />
            <span>Ricarica App</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
