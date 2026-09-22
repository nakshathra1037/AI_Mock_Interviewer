import React from 'react';
import { Bot, RotateCcw, Briefcase, Award } from 'lucide-react';

export default function Header({ role, difficulty, isStarted, onRestart }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">AI Mock Interviewer</h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 1
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Conversational multi-turn technical practice</p>
          </div>
        </div>

        {/* Current Session Badges & Actions */}
        {isStarted && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                {role}
              </span>
              <span className="text-slate-600">•</span>
              <span className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${
                difficulty === 'Junior' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : difficulty === 'Mid' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <Award className="w-3 h-3" />
                {difficulty}
              </span>
            </div>

            <button
              id="restart-interview-btn"
              onClick={onRestart}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="Restart Interview"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
