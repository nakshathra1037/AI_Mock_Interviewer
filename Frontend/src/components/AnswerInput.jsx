import React, { useState, useEffect, useRef } from 'react';
import { Send, CornerDownLeft, Mic, MicOff, Square, AlertCircle, X } from 'lucide-react';

// Detect browser support for Web Speech API SpeechRecognition
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function AnswerInput({ onSubmit, isLoading, disabled }) {
  const [answer, setAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micNotice, setMicNotice] = useState(null);

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');

  // Auto-focus textarea when current question appears or loading finishes
  useEffect(() => {
    if (!isLoading && !disabled) {
      textareaRef.current?.focus();
    }
  }, [isLoading, disabled]);

  // Clean up any active speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  /**
   * Starts or stops speech-to-text recognition
   */
  const toggleListening = () => {
    if (!SpeechRecognition) return;

    if (isListening) {
      // Stop listening early
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      setMicNotice(null);
      baseTextRef.current = answer;

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        const base = baseTextRef.current.trim();
        const combined = base
          ? `${base} ${currentTranscript.trim()}`
          : currentTranscript.trim();
        setAnswer(combined);
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicNotice('Microphone access was denied. You can continue typing your answer.');
        } else if (event.error !== 'no-speech') {
          setMicNotice(`Speech recognition notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Could not start SpeechRecognition:', err);
      setMicNotice('Unable to start speech recognition. Please type your answer.');
      setIsListening(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!answer.trim() || isLoading || disabled) return;

    // Stop listening before submitting
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore
      }
      setIsListening(false);
    }

    onSubmit(answer.trim());
    setAnswer('');
    baseTextRef.current = '';
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
      {/* Small dismissible microphone notice */}
      {micNotice && (
        <div className="mb-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{micNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setMicNotice(null)}
            className="p-1 hover:text-white rounded-lg transition-colors text-amber-400"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div
          className={`relative rounded-2xl bg-slate-900 border transition-all shadow-lg shadow-black/20 ${
            isListening
              ? 'border-rose-500/80 ring-1 ring-rose-500/40 shadow-rose-950/20'
              : 'border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500'
          }`}
        >
          <textarea
            ref={textareaRef}
            id="answer-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
            rows={4}
            placeholder={
              isListening
                ? 'Listening to your speech... Speak naturally or click the Stop button to finish.'
                : 'Type your answer here, or click the mic button to speak... (be as detailed and clear as in a real interview)'
            }
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

            <div className="flex items-center gap-2">
              {/* Mic Input Button (Speech-to-Text) - Hidden if browser doesn't support SpeechRecognition */}
              {SpeechRecognition && (
                <button
                  id="mic-input-btn"
                  type="button"
                  onClick={toggleListening}
                  disabled={isLoading || disabled}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
                  }`}
                  title={isListening ? 'Click to stop listening' : 'Speak your answer (Speech-to-Text)'}
                >
                  {isListening ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      <span>Listening... (Stop)</span>
                      <Square className="w-3 h-3 text-white fill-white shrink-0 ml-0.5" />
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="hidden sm:inline">Speak</span>
                    </>
                  )}
                </button>
              )}

              {/* Submit Answer Button */}
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
        </div>
      </form>
    </div>
  );
}
