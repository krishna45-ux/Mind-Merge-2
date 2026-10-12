/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Home, Compass, Sparkles, BookOpen, RefreshCw } from 'lucide-react';

interface NotFoundPageProps {
  onBackToHome: () => void;
}

export default function NotFoundPage({ onBackToHome }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 sm:p-6 text-[#2C1A12] font-sans relative overflow-hidden select-none">
      {/* Background Soft Warm Sunlit Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-96 h-96 rounded-full bg-[#F5EFE6] blur-3xl opacity-70" />
        <div className="absolute bottom-[15%] right-[15%] w-96 h-96 rounded-full bg-[#EAE0D3] blur-3xl opacity-50" />
      </div>

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-lg bg-white border border-[#EDE4D8] p-8 sm:p-12 rounded-3xl shadow-[0_12px_44px_rgba(44,26,18,0.06)] text-center flex flex-col items-center">
        
        {/* Warm 404 Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5EFE6] border border-[#E5DACB] text-xs font-semibold text-[#2C1A12] mb-6">
          <BookOpen className="w-3.5 h-3.5 text-[#C26D43]" />
          <span>Page Not Found</span>
        </div>

        {/* 404 Heading */}
        <div className="relative mb-3">
          <span className="font-serif text-7xl sm:text-8xl font-bold tracking-tight text-[#2C1A12]">
            404
          </span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C1A12] tracking-tight mb-3">
          Lost in the Library
        </h1>

        {/* Readable Description */}
        <p className="text-[#6D6056] text-sm sm:text-base max-w-sm mx-auto mb-8 leading-relaxed font-normal">
          The study material, notes, or lesson page you are looking for has moved or does not exist.
        </p>

        {/* Quick Suggestion Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-8 text-left">
          <button
            onClick={onBackToHome}
            className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F5EFE6] border border-[#EDE4D8] transition-all duration-200 group flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-white border border-[#EAE0D3] text-[#2C1A12] group-hover:text-[#C26D43] transition-colors">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#2C1A12]">Main Studio</div>
              <div className="text-[11px] text-[#7A6E65]">Return home</div>
            </div>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F5EFE6] border border-[#EDE4D8] transition-all duration-200 group flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-white border border-[#EAE0D3] text-[#2C1A12] group-hover:text-[#C26D43] transition-colors">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#2C1A12]">Refresh</div>
              <div className="text-[11px] text-[#7A6E65]">Reload page</div>
            </div>
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onBackToHome}
          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#2C1A12] hover:bg-[#3E261B] text-white font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to MindMerge Home</span>
        </button>
      </div>
    </div>
  );
}
