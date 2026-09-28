import React from 'react';
import {
  Trophy,
  AlertTriangle,
  BookOpen,
  RotateCcw,
  CheckCircle,
  Award,
  Briefcase,
  Headphones,
  Download,
  ListOrdered,
  VolumeX,
  Bot,
  User,
  Sparkles
} from 'lucide-react';

export default function SessionSummary({
  summary = null,
  role = 'Technical Role',
  difficulty = 'Junior',
  turns = [],
  turnsCount = 0,
  recordedAudioUrl = null,
  onRestart,
  onStartNewInterview,
  onViewPastSessions
}) {
  const handleRestart = onRestart || onStartNewInterview;
  const totalTurns = turnsCount || turns.length;
  const { overallStrengths = [], overallWeaknesses = [], studyPlan = [] } = summary || {};

  return (
    <div className="max-w-4xl w-full mx-auto py-6 animate-fade-in space-y-8">
      {/* Summary Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl shadow-indigo-950/20 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-md">
          <Trophy className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Session Performance Summary
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Here is your comprehensive evaluation for the {difficulty} {role} mock interview session across {totalTurns} answered {totalTurns === 1 ? 'question' : 'questions'}.
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
            <p className="text-xs sm:text-sm font-semibold text-slate-200">{totalTurns} Answered</p>
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

      {/* Phase 4 Session Audio Playback Player (Shown if a recording was captured) */}
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

      {/* Phase 5 AI Performance Evaluation Cards */}
      {summary && (
        <div className="space-y-6">
          {/* Strengths Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm pb-2 border-b border-slate-800">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Key Strengths Demonstrated</span>
            </div>
            <ul className="space-y-2.5">
              {overallStrengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm pb-2 border-b border-slate-800">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Areas Needing Improvement</span>
            </div>
            <ul className="space-y-2.5">
              {overallWeaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actionable Study Plan Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm pb-2 border-b border-slate-800">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Recommended Concrete Study Plan</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {studyPlan.map((topic, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3 text-xs sm:text-sm text-indigo-100"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Question & Answer Breakdown Review */}
      {turns && turns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Question & Answer Breakdown</span>
            <span className="text-xs text-slate-400 font-normal">({turns.length} turns)</span>
          </h3>

          <div className="space-y-4">
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-indigo-400">
                        Question #{index + 1}
                      </span>
                      {turn.questionType && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {turn.questionType}
                        </span>
                      )}
                    </div>
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Action Controls */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
        {onViewPastSessions && (
          <button
            type="button"
            onClick={onViewPastSessions}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-all shadow-sm"
          >
            View All Saved Sessions
          </button>
        )}

        <button
          type="button"
          onClick={handleRestart}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95 ml-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Start New Interview Practice</span>
        </button>
      </div>
    </div>
  );
}
