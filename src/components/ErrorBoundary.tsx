/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { logClientError } from '../lib/errorMonitoring';
import { AlertOctagon, RotateCw, Home, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error using our monitoring library
    logClientError(error, errorInfo.componentStack || undefined);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = async () => {
    if (!this.state.error) return;
    const errorText = `
Error: ${this.state.error.message}
Stack: ${this.state.error.stack || 'N/A'}
Component Stack: ${this.state.errorInfo?.componentStack || 'N/A'}
User-Agent: ${navigator.userAgent}
URL: ${window.location.href}
`;
    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error to clipboard:', err);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans select-none">
          {/* Ambient Glowing Background Elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

          {/* Premium Fallback Card */}
          <div className="max-w-xl w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl relative z-10 text-center flex flex-col items-center">
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mb-6 text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight text-white mb-3">
              We encountered a glitch
            </h1>
            
            <p className="text-slate-400 text-sm md:text-base mb-8 max-w-sm">
              An unexpected system crash was intercepted. The crash details have been captured and reported to our systems.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full mb-8">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gradient-to-r from-sun-500 to-rose-500 hover:from-sun-600 hover:to-rose-600 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <RotateCw className="w-4 h-4" />
                Reload Application
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-none"
              >
                <Home className="w-4 h-4" />
                Go to Homepage
              </button>
            </div>

            {/* Collapsible Error Inspector */}
            <div className="w-full text-left border border-slate-800 bg-slate-950/50 rounded-2xl overflow-hidden">
              <button
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="w-full flex items-center justify-between px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-400 hover:bg-slate-900/30 transition-colors focus-visible:outline-none"
              >
                <span>Diagnostic Logs</span>
                {this.state.showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {this.state.showDetails && (
                <div className="px-5 pb-5 border-t border-slate-900 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-rose-400 font-semibold font-mono">
                      {this.state.error?.name || 'Error'}
                    </span>
                    <button
                      onClick={this.handleCopyError}
                      className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-medium focus-visible:outline-none"
                    >
                      {this.state.copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy details</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto text-xs font-mono text-slate-400 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-900 select-text">
                    <p className="font-bold text-slate-200 mb-1">{this.state.error?.message}</p>
                    <pre className="whitespace-pre-wrap mt-2 select-text">
                      {this.state.error?.stack || 'No stack trace available.'}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="whitespace-pre-wrap mt-3 text-slate-500 select-text">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
