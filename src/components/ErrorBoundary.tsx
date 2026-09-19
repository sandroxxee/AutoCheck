import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-[#101F33] border border-red-500/30 rounded-3xl p-8 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Ops, algo inesperado ocorreu</h3>
            <p className="text-xs text-slate-300">
              {this.state.error?.message || 'Houve uma falha ao renderizar este componente.'}
            </p>
            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 mx-auto transition-all shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Tela</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
