import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Users,
  User,
  MessageSquare,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function SessionsList({ token, isTeamView = false, onStartNewInterview }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const endpoint = isTeamView ? '/api/sessions/team' : '/api/sessions';

    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions.');
      }

      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setErrorMessage(err.message || 'Could not load sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSessions();
    }
  }, [token, isTeamView]);

  const toggleExpand = (sessionId) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto py-6 animate-fade-in space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-1.5">
            {isTeamView ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            {isTeamView ? 'Team Collaboration' : 'Personal Performance'}
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            {isTeamView ? 'Team Practice History' : 'My Interview History'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isTeamView
              ? "Review sessions across all 3 team members to share strategies and review feedback."
              : 'Review your past mock interviews, questions asked, and AI evaluation feedback.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchSessions}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all shadow-sm disabled:opacity-50"
            title="Refresh sessions list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {!isTeamView && onStartNewInterview && (
            <button
              onClick={onStartNewInterview}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              <span>+ New Interview</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
          <p>{errorMessage}</p>
          <button onClick={fetchSessions} className="underline font-semibold hover:text-white ml-3">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="glass-panel p-5 rounded-2xl border border-slate-800 animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-800/60 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sessions.length === 0 && (
        <div className="glass-panel p-10 rounded-2xl text-center border border-slate-800/80 shadow-inner">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No interview sessions found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isTeamView
              ? "No one on the team has completed a recorded session yet. Complete your first practice to see it here!"
              : "You haven't conducted any recorded sessions yet. Start a session to track your questions and feedback over time."}
          </p>
          {!isTeamView && onStartNewInterview && (
            <button
              onClick={onStartNewInterview}
              className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
            >
              Start Your First Interview
            </button>
          )}
        </div>
      )}

      {/* Sessions Cards */}
      {!isLoading && sessions.length > 0 && (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;
            const turnsCount = session.turns ? session.turns.length : 0;

            return (
              <div
                key={session.id}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition-all shadow-md shadow-black/20"
              >
                {/* Session Card Header / Bar */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 font-bold text-slate-100 text-base">
                        <Briefcase className="w-4 h-4 text-indigo-400" />
                        {session.role}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          session.difficulty === 'Junior'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : session.difficulty === 'Mid'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {session.difficulty}
                      </span>

                      {/* Display user name if Team view */}
                      {isTeamView && session.user_name && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                          <User className="w-3 h-3 text-indigo-400" />
                          {session.user_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(session.created_at)}
                      </span>
                      <span>•</span>
                      <span className="text-slate-300 font-medium">
                        {turnsCount} {turnsCount === 1 ? 'Turn' : 'Turns'} recorded
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                      {isExpanded ? 'Hide Details' : 'View Q&A'}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Expanded Session Turns Transcript */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-900/60 p-5 space-y-6 animate-fade-in">
                    {turnsCount === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No answered turns were recorded for this session.
                      </p>
                    ) : (
                      session.turns.map((turn, idx) => (
                        <div
                          key={turn.id || idx}
                          className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800"
                        >
                          {/* Turn Question */}
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-1">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Question {idx + 1}</span>
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed font-medium">
                              {turn.question}
                            </p>
                          </div>

                          {/* Candidate's Answer */}
                          <div className="pl-3 border-l-2 border-slate-700">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                              Candidate's Response:
                            </span>
                            <p className="text-xs sm:text-sm text-slate-300 mt-1 whitespace-pre-wrap">
                              {turn.answer}
                            </p>
                          </div>

                          {/* AI Feedback */}
                          {turn.feedback && (
                            <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs sm:text-sm text-slate-200">
                              <div className="flex items-center gap-1.5 font-semibold text-indigo-300 text-xs mb-1">
                                <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                                <span>AI Evaluation Feedback</span>
                              </div>
                              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {turn.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
