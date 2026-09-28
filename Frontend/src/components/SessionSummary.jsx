import React from 'react';
import {
  CheckCircle2,
  Award,
  Briefcase,
  Headphones,
  Download,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  ListOrdered,
  VolumeX
} from 'lucide-react';

export default function SessionSummary({
  role,
  difficulty,
  turns = [],
  recordedAudioUrl = null,
  onStartNewInterview,
  onViewPastSessions
}) {
  return (
    <div className="max-w-4xl w-full mx-auto py-6 animate-fade-in space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Interview Complete • Phase 4 Voice Practice</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Session Summary & Review
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Great job completing your practice interview! Review the questions, your answers, AI feedback, and listen back to your recorded voice responses.
        </p>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Target Role</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">{role}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Difficulty</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">{difficulty}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <ListOrdered className="w-5 h-5 text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Questions</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">{turns.length} Answered</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Audio Recording</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              {recordedAudioUrl ? 'Captured' : 'Unavailable'}
            </p>
          </div>
        </div>
      </div>

      {/* Phase 4 Session Audio Playback Player (Only shown if a recording was successfully captured) */}
      {recordedAudioUrl ? (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 shadow-xl space-y-4 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-900/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
                <Headphones className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                  <span>Session Audio Playback</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Recorded
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Listen back to your spoken answers captured continuously during this interview.
                </p>
              </div>
            </div>

            <a
              href={recordedAudioUrl}
              download={`interview_recording_${role.toLowerCase().replace(/\s+/g, '_')}.webm`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all shadow-sm shrink-0 self-start sm:self-auto"
              title="Download recording as audio file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download Audio</span>
            </a>
          </div>

          {/* HTML5 Native Audio Player */}
          <div className="pt-2">
            <audio
              controls
              src={recordedAudioUrl}
              className="w-full rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-3">
          <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            No session audio was captured (microphone permission was not granted or audio recording was unavailable).
          </span>
        </div>
      )}

      {/* Question & Feedback Transcript Review */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <span>Question & Answer Breakdown</span>
          <span className="text-xs text-slate-400 font-normal">({turns.length} turns)</span>
        </h3>

        {turns.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 rounded-2xl bg-slate-900/50 border border-slate-800">
            No questions were answered during this session.
          </div>
        ) : (
          <div className="space-y-6">
            {turns.map((turn, index) => (
              <div
                key={turn.id || index}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm"
              >
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-semibold text-indigo-400 block mb-1">
                      Question #{index + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {turn.question}
                    </p>
                  </div>
                </div>

                {/* Candidate's Answer */}
                {turn.answer && (
                  <div className="flex items-start gap-3 pl-3 sm:pl-6 border-l-2 border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Your Answer
                      </span>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {turn.answer}
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Feedback */}
                {turn.feedback && (
                  <div className="flex items-start gap-3 pl-3 sm:pl-6 border-l-2 border-emerald-500/30">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                        AI Feedback
                      </span>
                      <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed whitespace-pre-wrap">
                        {turn.feedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onViewPastSessions}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-all shadow-sm"
        >
          View All Saved Sessions
        </button>

        <button
          type="button"
          onClick={onStartNewInterview}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Start Another Practice Session</span>
        </button>
      </div>
    </div>
  );
}
