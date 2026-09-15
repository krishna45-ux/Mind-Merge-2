/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function ScreenLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans relative">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[30%] left-[20%] w-[35%] h-[35%] rounded-full bg-lagoon-500/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[30%] right-[20%] w-[35%] h-[35%] rounded-full bg-indigo-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Holographic glowing spinner */}
        <div className="relative w-20 h-20 mx-auto mb-8 flex items-center justify-center">
          {/* Outer glowing spinner ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-lagoon-500 animate-spin" />

          {/* Middle pulsing glow */}
          <div className="absolute w-12 h-12 rounded-full bg-indigo-500/10 blur-md animate-pulse" />

          {/* Center core */}
          <div className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-lagoon-400 to-indigo-500 shadow-md shadow-lagoon-500/50" />
        </div>

        {/* Loading text */}
        <h2 className="text-xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent tracking-wide mb-2">
          Syncing MindMerge Grid
        </h2>

        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest animate-pulse">
          Connecting synapses...
        </p>

        {/* Loader skeleton layout mimic */}
        <div className="mt-12 space-y-4 max-w-xs mx-auto opacity-30">
          <div className="h-4 bg-slate-900 rounded-md w-3/4 mx-auto animate-pulse" />
          <div className="h-3 bg-slate-900 rounded-md w-1/2 mx-auto animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="h-3 bg-slate-900 rounded-md w-5/6 mx-auto animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
