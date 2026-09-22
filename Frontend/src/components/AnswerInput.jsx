import React, { useState, useEffect, useRef } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

export default function AnswerInput({ onSubmit, isLoading, disabled }) {
  const [answer, setAnswer] = useState('');
  const textareaRef = useRef(null);

  // Auto-focus textarea when current question appears or loading finishes
  useEffect(() => {
    if (!isLoading && !disabled) {
      textareaRef.current?.focus();
    }
  }, [isLoading, disabled]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!answer.trim() || isLoading || disabled) return;
    onSubmit(answer.trim());
    setAnswer('');
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 bg-slate-950/90 backdrop-blur-md pt-3 pb-6 border-t border-slate-800/80">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-lg shadow-black/20">
          <textarea
            ref={textareaRef}
            id="answer-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
            rows={4}
            placeholder="Type your answer here... (be as detailed and clear as in a real interview)"
            className="w-full bg-transparent p-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800/80 bg-slate-900/50 rounded-b-2xl">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="hidden sm:inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400">Ctrl</kbd>
                +
                <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400">Enter</kbd>
                to submit
              </span>
              <span>{answer.length} chars</span>
            </div>

            <button
              id="submit-answer-btn"
              type="submit"
              disabled={!answer.trim() || isLoading || disabled}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
