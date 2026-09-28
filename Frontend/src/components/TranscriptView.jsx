import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Sparkles, Volume2, RotateCcw, Eye, Headphones } from 'lucide-react';

// Detect browser support for Web Speech API SpeechSynthesis
const isSpeechSynthesisSupported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;

export default function TranscriptView({
  turns,
  currentQuestion,
  isLoading,
  loadingAction
}) {
  const scrollEndRef = useRef(null);
  const lastSpokenQuestionRef = useRef('');

  // Voice Question State:
  // If speech synthesis is supported, question text starts hidden until spoken or clicked "Show Text".
  // If unsupported, text displays immediately.
  const [isQuestionRevealed, setIsQuestionRevealed] = useState(!isSpeechSynthesisSupported);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto-scroll as new turns or messages are added
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, currentQuestion, isLoading, isQuestionRevealed, isSpeaking]);

  /**
   * Speaks the given question text using SpeechSynthesisUtterance
   */
  const speakQuestion = (text) => {
    if (!isSpeechSynthesisSupported || !text) return;

    try {
      window.speechSynthesis.cancel(); // Stop any overlapping utterance

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis failed:', err);
      setIsSpeaking(false);
      setIsQuestionRevealed(true);
    }
  };

  /**
   * When currentQuestion changes to a new non-empty string:
   * automatically speak it if speech synthesis is supported, and hide text initially.
   */
  useEffect(() => {
    if (!currentQuestion) {
      setIsSpeaking(false);
      lastSpokenQuestionRef.current = '';
      return;
    }

    if (currentQuestion !== lastSpokenQuestionRef.current) {
      lastSpokenQuestionRef.current = currentQuestion;

      if (isSpeechSynthesisSupported) {
        setIsQuestionRevealed(false);
        speakQuestion(currentQuestion);
      } else {
        // Fallback for unsupported browsers: reveal text immediately
        setIsQuestionRevealed(true);
        setIsSpeaking(false);
      }
    }
  }, [currentQuestion]);

  // Clean up any ongoing speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  const handleReplay = () => {
    if (!currentQuestion) return;
    speakQuestion(currentQuestion);
  };

  const handleShowText = () => {
    setIsQuestionRevealed(true);
  };

  return (
    <div className="space-y-6">
      {turns.map((turn, index) => (
        <div key={turn.id || index} className="space-y-4 animate-fade-in">
          {/* Interviewer Question (Past Turns - Always Visible) */}
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
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-400">Interviewer</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {turns.length === 0 ? "Opening Question" : `Follow-up #${turns.length + 1}`}
                </span>
              </div>

              {/* Voice speaking indicator */}
              {isSpeaking && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium animate-pulse">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                  <span>🔊 Speaking...</span>
                </div>
              )}
            </div>

            {/* Question Display: Voice question placeholder OR revealed text */}
            {!isQuestionRevealed ? (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-slate-200 text-sm leading-relaxed shadow-md shadow-indigo-500/5">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Volume2 className={`w-5 h-5 text-indigo-400 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {isSpeaking ? 'Interviewer is speaking the question...' : 'Voice question delivered.'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Listen carefully to the audio, or click "Show Text" to view the question on screen.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 text-slate-100 text-sm leading-relaxed shadow-md shadow-indigo-500/5 animate-fade-in">
                {currentQuestion}
              </div>
            )}

            {/* Voice Question Controls: Replay & Show Text */}
            {isSpeechSynthesisSupported && (
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  id="replay-question-btn"
                  type="button"
                  onClick={handleReplay}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all shadow-sm active:scale-95"
                  title="Speak the question aloud again"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>🔁 Replay</span>
                </button>

                {!isQuestionRevealed && (
                  <button
                    id="show-question-text-btn"
                    type="button"
                    onClick={handleShowText}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-all shadow-sm active:scale-95"
                    title="Reveal question text on screen"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Show Text</span>
                  </button>
                )}
              </div>
            )}
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
