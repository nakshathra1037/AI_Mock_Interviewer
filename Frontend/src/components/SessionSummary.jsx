import React from 'react';
import { Trophy, AlertTriangle, BookOpen, RotateCcw, CheckCircle } from 'lucide-react';

export default function SessionSummary({
  summary,
  role,
  difficulty,
  turnsCount,
  onRestart
}) {
  if (!summary) return null;

  const { overallStrengths = [], overallWeaknesses = [], studyPlan = [] } = summary;

  return (
    <div className="max-w-3xl w-full mx-auto py-6 animate-fade-in space-y-6">
      {/* Summary Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl shadow-indigo-950/20 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-md">
          <Trophy className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
          Session Performance Summary
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Here is your comprehensive evaluation for the {difficulty} {role} mock interview session across {turnsCount} answered {turnsCount === 1 ? 'question' : 'questions'}.
        </p>
      </div>

      {/* Summary Cards Grid */}
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

      {/* Action Footer */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Interview Practice</span>
        </button>
      </div>
    </div>
  );
}
