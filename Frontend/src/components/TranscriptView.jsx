import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Sparkles,
  Volume2,
  RotateCcw,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// Detect browser support for Web Speech API SpeechSynthesis
const isSpeechSynthesisSupported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;

/**
 * Safely parses turn feedback into a structured object or legacy string format.
 */
function parseTurnFeedback(rawFeedback) {
  if (!rawFeedback) return null;

  let data = rawFeedback;
  if (typeof rawFeedback === 'string') {
    try {
      data = JSON.parse(rawFeedback);
    } catch (e) {
      // Legacy unformatted feedback string
      return { isLegacy: true, text: rawFeedback };
    }
  }

  if (data && typeof data === 'object') {
    const scores = data.feedback || (data.clarity ? data : null);
    if (scores && (scores.clarity || scores.technicalAccuracy || scores.structure || scores.specificity)) {
      return {
        isLegacy: false,
        categories: {
          clarity: scores.clarity || { score: '-', comment: '' },
          technicalAccuracy: scores.technicalAccuracy || { score: '-', comment: '' },
          structure: scores.structure || { score: '-', comment: '' },
          specificity: scores.specificity || { score: '-', comment: '' }
        },
        weakestCategory: data.weakestCategory || null,
        starAnalysis: data.starAnalysis || null
      };
    }
  }

  return { isLegacy: true, text: typeof rawFeedback === 'string' ? rawFeedback : JSON.stringify(rawFeedback) };
}

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

  const categoryConfig = [
    { key: 'clarity', label: 'Clarity' },
    { key: 'technicalAccuracy', label: 'Technical Accuracy' },
    { key: 'structure', label: 'Structure' },
    { key: 'specificity', label: 'Specificity' }
  ];

  return (
    <div className="space-y-6">
      {turns.map((turn, index) => {
        const parsedFeedback = parseTurnFeedback(turn.feedback);

        return (
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
                  {turn.questionType && (
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      turn.questionType === 'behavioral'
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    }`}>
                      {turn.questionType}
                    </span>
                  )}
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
            {parsedFeedback && (
              <div className="flex items-start gap-3 pl-4 sm:pl-8">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-emerald-400">AI Evaluation Feedback</span>
                    {!parsedFeedback.isLegacy && (
                      <span className="text-[10px] text-slate-400">(Structured Category Assessment)</span>
                    )}
                  </div>

                  {parsedFeedback.isLegacy ? (
                    /* Legacy plain text feedback fallback */
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-100 text-sm leading-relaxed whitespace-pre-wrap">
                      {parsedFeedback.text}
                    </div>
                  ) : (
                    /* Phase 5 Structured Feedback Grid */
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 space-y-4">
                      {/* Four Category Score Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categoryConfig.map(({ key, label }) => {
                          const catData = parsedFeedback.categories[key] || {};
                          const score = catData.score;
                          const comment = catData.comment;
                          const isWeakest = parsedFeedback.weakestCategory === key;

                          const numScore = Number(score);
                          let scoreColor = 'bg-slate-800 text-slate-300 border-slate-700';
                          if (numScore >= 4) {
                            scoreColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                          } else if (numScore === 3) {
                            scoreColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                          } else if (numScore <= 2 && numScore > 0) {
                            scoreColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                          }

                          return (
                            <div
                              key={key}
                              className={`p-3 rounded-lg border transition-all ${
                                isWeakest
                                  ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/20'
                                  : 'bg-slate-950/60 border-slate-800/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-slate-200">{label}</span>
                                  {isWeakest && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      Targeted
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${scoreColor}`}>
                                  {score}/5
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-normal">
                                {comment || 'No comment provided.'}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* STAR Framework Analysis (If Behavioral) */}
                      {parsedFeedback.starAnalysis && (
                        <div className="mt-3 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                              <span>STAR Framework Detection</span>
                              <span className="text-[10px] text-slate-400 font-normal">(Behavioral Evaluation)</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            {[
                              { key: 'situation', label: 'Situation' },
                              { key: 'task', label: 'Task' },
                              { key: 'action', label: 'Action' },
                              { key: 'result', label: 'Result' }
                            ].map(({ key, label }) => {
                              const present = Boolean(parsedFeedback.starAnalysis[key]);
                              return (
                                <div
                                  key={key}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium ${
                                    present
                                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                  }`}
                                >
                                  {present ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  )}
                                  <span>{label}</span>
                                </div>
                              );
                            })}
                          </div>

                          {parsedFeedback.starAnalysis.missingParts &&
                            parsedFeedback.starAnalysis.missingParts.length > 0 && (
                              <p className="text-[11px] text-rose-400 pt-1">
                                <span className="font-semibold">Missing STAR Components: </span>
                                {parsedFeedback.starAnalysis.missingParts.join(', ')}
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

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
                : 'Analyzing your answer & formulating a targeted follow-up question...'}
            </span>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={scrollEndRef} />
    </div>
  );
}
