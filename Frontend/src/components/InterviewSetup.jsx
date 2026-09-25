import React from 'react';
import { Sparkles, Briefcase, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

const SUGGESTED_ROLES = [
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Engineer",
  "Data Analyst",
  "DevOps Engineer",
  "Machine Learning Engineer"
];

const DIFFICULTY_INFO = {
  Junior: {
    title: "Junior Level",
    desc: "Focus on fundamentals, core syntax, definitions, foundational concepts, and standard problem-solving.",
    color: "emerald"
  },
  Mid: {
    title: "Mid-Level",
    desc: "Focus on practical software architecture, component integration, trade-offs, edge cases, and optimization.",
    color: "amber"
  },
  Senior: {
    title: "Senior Level",
    desc: "Focus on distributed system design, high-level scalability, architectural trade-offs, failure resilience, and leadership.",
    color: "rose"
  }
};

export default function InterviewSetup({
  role,
  setRole,
  difficulty,
  setDifficulty,
  onStart,
  isLoading,
  hasResume = false,
  useResume = false,
  setUseResume
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (role.trim() && !isLoading) {
      onStart();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Interactive AI Interview Simulation
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight sm:text-4xl">
          Ace Your Next Interview
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
          Practice dynamic, conversational technical interviews. Answers are evaluated in real-time, followed by natural, context-aware follow-up questions.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-xl shadow-black/40">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label htmlFor="role-input" className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Target Job Role
            </label>
            <input
              id="role-input"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Backend Developer, Data Analyst, Cloud Architect..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />

            {/* Quick role suggestions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-slate-400 self-center mr-1">Popular:</span>
              {SUGGESTED_ROLES.map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => setRole(suggested)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    role === suggested
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {suggested}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label htmlFor="difficulty-select" className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Experience Level
            </label>
            <div className="relative">
              <select
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="Junior">Junior (Fundamentals & Core Concepts)</option>
                <option value="Mid">Mid (Practical Design & Edge Cases)</option>
                <option value="Senior">Senior (Architecture & Trade-offs)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Difficulty description helper */}
            <div className="mt-3 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  {DIFFICULTY_INFO[difficulty]?.title} Guidance
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {DIFFICULTY_INFO[difficulty]?.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Resume-Tailored Questions Toggle */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              hasResume
                ? 'bg-slate-900/60 border-slate-700/80 hover:border-indigo-500/50'
                : 'bg-slate-900/30 border-slate-800/80 opacity-70'
            }`}
          >
            <label className={`flex items-start gap-3 ${hasResume ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              <input
                type="checkbox"
                id="tailor-resume-checkbox"
                disabled={!hasResume}
                checked={hasResume && useResume}
                onChange={(e) => setUseResume && setUseResume(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    Tailor questions to my resume
                  </span>
                  {hasResume ? (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Resume Active
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
                      Upload Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {hasResume
                    ? 'The AI interviewer will ask questions that reference your actual projects, technologies, and achievements.'
                    : 'Upload your resume in the Resume tab to unlock questions tailored to your specific background.'}
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            id="start-interview-btn"
            type="submit"
            disabled={!role.trim() || isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating First Question...</span>
              </>
            ) : (
              <>
                <span>Start Mock Interview</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
