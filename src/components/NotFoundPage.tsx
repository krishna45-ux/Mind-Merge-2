/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Home, Compass, Sparkles, BookOpen, Search, RefreshCw } from 'lucide-react';

interface NotFoundPageProps {
  onBackToHome: () => void;
}

export default function NotFoundPage({ onBackToHome }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden select-none">
      {/* Background Animated Neon Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[20%] w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-[15%] right-[20%] w-96 h-96 rounded-full bg-indigo-500/15 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/60 rounded-full blur-[140px]" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} 
        />
      </div>

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 p-8 sm:p-12 rounded-3xl shadow-2xl shadow-cyan-950/40 text-center flex flex-col items-center">
        
        {/* Floating Holographic 404 Badge */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
          
          <div className="relative px-6 py-3 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono text-xs sm:text-sm font-bold tracking-widest uppercase text-cyan-400">
              SYNAPSE CODE: 404 // NODE DISCONNECTED
            </span>
          </div>
        </div>

        {/* Big Glitch 404 Heading */}
        <div className="relative mb-2">
          <span className="font-display text-7xl sm:text-8xl font-black tracking-tighter bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
            404
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Neural Pathway Lost
        </h1>

        {/* Readable Crisp Description */}
        <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed font-normal">
          The study material, synthesis node, or page you are trying to reach has moved or doesn't exist in the MindMerge neural index.
        </p>

        {/* Quick Suggestion Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-8 text-left">
          <button
            onClick={onBackToHome}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 group flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">Main Hub</div>
              <div className="text-[11px] text-slate-400">Return to landing</div>
            </div>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all duration-200 group flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Reconnect</div>
              <div className="text-[11px] text-slate-400">Retry connection</div>
            </div>
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onBackToHome}
          className="w-full inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to MindMerge Orbit</span>
        </button>

        {/* Footer telemetry */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 w-full flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            System Operational
          </span>
          <span>MINDMERGE v2.4 // AI HYPERGRAPH</span>
        </div>
      </div>
    </div>
  );
}
