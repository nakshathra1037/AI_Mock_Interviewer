import React from 'react';
import { Bot, RotateCcw, Briefcase, Award, LogOut, User, Users, PlayCircle, FileText } from 'lucide-react';

export default function Header({
  role,
  difficulty,
  isStarted,
  onRestart,
  currentUser,
  activeTab = 'interview',
  setActiveTab,
  onLogout
}) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">AI Mock Interviewer</h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 3
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Conversational multi-turn technical practice</p>
          </div>
        </div>

        {/* Navigation Bar (Visible when user is authenticated) */}
        {currentUser && setActiveTab && (
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'interview'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Practice</span>
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'resume'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
            <button
              onClick={() => setActiveTab('my-sessions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'my-sessions'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Sessions</span>
            </button>
            <button
              onClick={() => setActiveTab('team-sessions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'team-sessions'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Sessions</span>
            </button>
          </nav>
        )}

        {/* Right Section: Session Badges, Active Reset & User Info / Logout */}
        <div className="flex items-center gap-3">
          {/* Active Interview Badges & Reset Button */}
          {isStarted && activeTab === 'interview' && (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
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
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
                title="Restart Interview"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          )}

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {currentUser.email}
                </span>
              </div>

              {onLogout && (
                <button
                  id="logout-btn"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 transition-colors shadow-sm"
                  title="Sign out of your session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation bar */}
      {currentUser && setActiveTab && (
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 bg-slate-950/95 px-4">
          <button
            onClick={() => setActiveTab('interview')}
            className={`flex items-center gap-1 text-xs py-1 px-2.5 rounded-lg ${
              activeTab === 'interview'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Practice</span>
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex items-center gap-1 text-xs py-1 px-2.5 rounded-lg ${
              activeTab === 'resume'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume</span>
          </button>
          <button
            onClick={() => setActiveTab('my-sessions')}
            className={`flex items-center gap-1 text-xs py-1 px-2.5 rounded-lg ${
              activeTab === 'my-sessions'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Sessions</span>
          </button>
          <button
            onClick={() => setActiveTab('team-sessions')}
            className={`flex items-center gap-1 text-xs py-1 px-2.5 rounded-lg ${
              activeTab === 'team-sessions'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team</span>
          </button>
        </div>
      )}
    </header>
  );
}
