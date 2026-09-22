import React, { useEffect, useRef } from 'react';
import { Bot, User, Sparkles, HelpCircle, MessageSquareText, CheckCircle } from 'lucide-react';

export default function TranscriptView({
  turns,
  currentQuestion,
  isLoading,
  loadingAction
}) {
  const scrollEndRef = useRef(null);

  // Auto-scroll as new turns or messages are added
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, currentQuestion, isLoading]);

  return (
    <div className="space-y-6">
      {turns.map((turn, index) => (
        <div key={turn.id || index} className="space-y-4 animate-fade-in">
          {/* Interviewer Question */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-indigo-400">Interviewer</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Question #{index + 1}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm leading-relaxed shadow-sm">
                {turn.question}
              </div>
            </div>
          </div>

          {/* User's Answer */}
          {turn.answer && (
            <div className="flex items-start gap-3 pl-4 sm:pl-8">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">Your Answer</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {turn.answer}
                </div>
              </div>
            </div>
          )}

          {/* AI Feedback */}
          {turn.feedback && (
            <div className="flex items-start gap-3 pl-4 sm:pl-8">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-emerald-400">AI Feedback</span>
                  <span className="text-[10px] text-slate-400">(Clarity • Correctness • Completeness)</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-100 text-sm leading-relaxed whitespace-pre-wrap">
                  {turn.feedback}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Current Active Question (Awaiting User's Answer) */}
      {currentQuestion && (
        <div className="flex items-start gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1">
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-indigo-400">Interviewer</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {turns.length === 0 ? "Opening Question" : `Follow-up #${turns.length + 1}`}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 text-slate-100 text-sm leading-relaxed shadow-md shadow-indigo-500/5">
              {currentQuestion}
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-start gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1">
            <Bot className="w-4 h-4 text-indigo-400 animate-spin" />
          </div>
          <div className="flex-1 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin shrink-0" />
            <span>
              {loadingAction === 'generating'
                ? 'Formulating interview question...'
                : 'Analyzing your answer & formulating a natural follow-up question...'}
            </span>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={scrollEndRef} />
    </div>
  );
}
