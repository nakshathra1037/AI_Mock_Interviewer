import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import InterviewSetup from './components/InterviewSetup.jsx';
import TranscriptView from './components/TranscriptView.jsx';
import AnswerInput from './components/AnswerInput.jsx';
import AuthForm from './components/AuthForm.jsx';
import SessionsList from './components/SessionsList.jsx';
import ResumeManager from './components/ResumeManager.jsx';
import SessionSummary from './components/SessionSummary.jsx';
import { AlertCircle, Trophy, Loader2 } from 'lucide-react';

export default function App() {
  // Authentication State (Stored in React state, NOT localStorage)
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // { id, name, email }

  // App Navigation View: 'interview' | 'resume' | 'my-sessions' | 'team-sessions'
  const [activeTab, setActiveTab] = useState('interview');

  // Resume State (Phase 3)
  const [resumeInfo, setResumeInfo] = useState({ hasResume: false, fileName: null });
  const [useResume, setUseResume] = useState(false);

  // Session Configuration & Persistence
  const [role, setRole] = useState('Backend Developer');
  const [difficulty, setDifficulty] = useState('Junior');
  const [isStarted, setIsStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Interview Loop State
  // conversationHistory tracks all { role: "assistant"|"user", content: string } turns
  const [conversationHistory, setConversationHistory] = useState([]);
  
  // turns tracks the display list: { id, question, questionType, answer, feedback }
  const [turns, setTurns] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentQuestionType, setCurrentQuestionType] = useState('technical');

  // Session Summary State (Phase 5)
  const [sessionSummary, setSessionSummary] = useState(null);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // UI & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('idle'); // 'generating' | 'evaluating' | 'idle'
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Fetches stored resume information for current user
   */
  const fetchResumeInfo = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/resume', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResumeInfo({
          hasResume: Boolean(data.hasResume),
          fileName: data.fileName || null
        });
        if (data.hasResume) {
          setUseResume(true);
        }
      } else {
        setResumeInfo({ hasResume: false, fileName: null });
        setUseResume(false);
      }
    } catch (err) {
      console.warn('Could not retrieve resume status:', err.message);
    }
  };

  // Re-fetch resume status whenever authenticated
  useEffect(() => {
    if (token) {
      fetchResumeInfo();
    }
  }, [token]);

  /**
   * Called upon successful login or signup.
   * Stores the JWT and user in React state.
   */
  const handleAuthSuccess = (newToken, user) => {
    setToken(newToken);
    setCurrentUser(user);
    setErrorMessage(null);
    setActiveTab('interview');
  };

  /**
   * Clears the stored JWT, user info, and resets current interview state.
   */
  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setSessionId(null);
    setResumeInfo({ hasResume: false, fileName: null });
    setUseResume(false);
    setIsStarted(false);
    setTurns([]);
    setCurrentQuestion('');
    setCurrentQuestionType('technical');
    setSessionSummary(null);
    setConversationHistory([]);
    setActiveTab('interview');
    setErrorMessage(null);
  };

  /**
   * Starts a new interview session.
   * Calls POST /api/generate-question with { role, difficulty, conversationHistory: [] }
   * and Authorization: Bearer <token>.
   * Receives { question, questionType, sessionId }.
   */
  const handleStartInterview = async () => {
    if (!role.trim() || !token) return;

    setIsLoading(true);
    setLoadingAction('generating');
    setErrorMessage(null);
    setTurns([]);
    setConversationHistory([]);
    setCurrentQuestion('');
    setCurrentQuestionType('technical');
    setSessionSummary(null);
    setSessionId(null);

    try {
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: role.trim(),
          difficulty,
          conversationHistory: [],
          useResume: Boolean(useResume && resumeInfo.hasResume)
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        throw new Error('Your session has expired. Please sign in again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate opening question.');
      }

      const initialQuestion = data.question;
      const initialQuestionType = data.questionType || 'technical';
      setCurrentQuestion(initialQuestion);
      setCurrentQuestionType(initialQuestionType);
      setIsStarted(true);

      // Save persistent sessionId returned by backend
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      // Add to conversationHistory
      setConversationHistory([
        { role: 'assistant', content: initialQuestion }
      ]);
    } catch (err) {
      console.error('Error starting interview:', err);
      setErrorMessage(err.message || 'Network error connecting to backend.');
    } finally {
      setIsLoading(false);
      setLoadingAction('idle');
    }
  };

  /**
   * Submits candidate's answer.
   * Sends full conversationHistory, questionType, and sessionId to POST /api/evaluate-answer
   * with Authorization: Bearer <token>.
   */
  const handleSubmitAnswer = async (answerText) => {
    if (!answerText.trim() || !currentQuestion || !token) return;

    const questionAsked = currentQuestion;
    const qType = currentQuestionType;
    const turnId = Date.now();

    // Prepare updated history with user's answer included
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: answerText }
    ];
    setConversationHistory(updatedHistory);

    // Optimistically update turns view
    const newTurn = {
      id: turnId,
      question: questionAsked,
      questionType: qType,
      answer: answerText,
      feedback: null
    };
    setTurns((prev) => [...prev, newTurn]);
    setCurrentQuestion('');
    setIsLoading(true);
    setLoadingAction('evaluating');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: questionAsked,
          answer: answerText,
          conversationHistory: updatedHistory,
          role,
          difficulty,
          sessionId,
          questionType: qType
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        throw new Error('Your session has expired. Please sign in again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate your answer.');
      }

      const { feedback, nextQuestion } = data;

      // Update turn with structured feedback
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, feedback } : t))
      );

      // Set the next follow-up question
      setCurrentQuestion(nextQuestion);
      // Fall back or determine next question type
      setCurrentQuestionType(data.questionType || 'technical');

      // Update full history with assistant's next question
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: nextQuestion }
      ]);
    } catch (err) {
      console.error('Error evaluating answer:', err);
      setErrorMessage(err.message || 'Error communicating with backend.');
      // Restore the question so the user can re-try if desired
      setCurrentQuestion(questionAsked);
    } finally {
      setIsLoading(false);
      setLoadingAction('idle');
    }
  };

  /**
   * Concludes the interview session and generates the overall performance summary.
   * Calls POST /api/session-summary with { sessionId }.
   */
  const handleEndInterview = async () => {
    if (!sessionId || !token || turns.length === 0) return;

    setIsEndingSession(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/session-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        throw new Error('Your session has expired. Please sign in again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate session summary.');
      }

      setSessionSummary(data);
      setCurrentQuestion('');
    } catch (err) {
      console.error('Error concluding session summary:', err);
      setErrorMessage(err.message || 'Could not generate session summary.');
    } finally {
      setIsEndingSession(false);
    }
  };

  /**
   * Resets the interview state back to setup mode.
   */
  const handleRestart = () => {
    setIsStarted(false);
    setTurns([]);
    setCurrentQuestion('');
    setCurrentQuestionType('technical');
    setSessionSummary(null);
    setConversationHistory([]);
    setSessionId(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        role={role}
        difficulty={difficulty}
        isStarted={isStarted}
        onRestart={handleRestart}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-sm flex items-start justify-between gap-3 shadow-lg shadow-rose-950/20 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Notice</p>
                <p className="mt-0.5 text-xs text-rose-200/80">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-400 hover:text-rose-200 underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Unauthenticated View: Login / Signup Form */}
        {!token ? (
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        ) : (
          /* Authenticated Views */
          <>
            {/* View 1: Resume Intelligence (Phase 3) */}
            {activeTab === 'resume' && (
              <ResumeManager
                token={token}
                resumeInfo={resumeInfo}
                onRefreshResume={fetchResumeInfo}
                onSelectRoleForPractice={(suggestedRole) => {
                  setRole(suggestedRole);
                  setActiveTab('interview');
                }}
              />
            )}

            {/* View 2: My Sessions */}
            {activeTab === 'my-sessions' && (
              <SessionsList
                token={token}
                isTeamView={false}
                onStartNewInterview={() => {
                  handleRestart();
                  setActiveTab('interview');
                }}
              />
            )}

            {/* View 3: Team Sessions */}
            {activeTab === 'team-sessions' && (
              <SessionsList
                token={token}
                isTeamView={true}
                onStartNewInterview={() => {
                  handleRestart();
                  setActiveTab('interview');
                }}
              />
            )}

            {/* View 4: Interview Practice (Phase 1-5 core flow) */}
            {activeTab === 'interview' && (
              <>
                {!isStarted ? (
                  <InterviewSetup
                    role={role}
                    setRole={setRole}
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    onStart={handleStartInterview}
                    isLoading={isLoading}
                    hasResume={resumeInfo.hasResume}
                    useResume={useResume}
                    setUseResume={setUseResume}
                  />
                ) : sessionSummary ? (
                  /* Phase 5 End-of-Session Summary Screen */
                  <SessionSummary
                    summary={sessionSummary}
                    role={role}
                    difficulty={difficulty}
                    turnsCount={turns.length}
                    onRestart={handleRestart}
                  />
                ) : (
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Header bar during active interview with End Interview button */}
                    {turns.length > 0 && (
                      <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-xs text-slate-400 font-medium">
                          Completed Turns: <strong className="text-slate-200">{turns.length}</strong>
                        </span>
                        <button
                          onClick={handleEndInterview}
                          disabled={isLoading || isEndingSession}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                        >
                          {isEndingSession ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating Summary...</span>
                            </>
                          ) : (
                            <>
                              <Trophy className="w-3.5 h-3.5" />
                              <span>End Interview</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex-1 pb-4">
                      <TranscriptView
                        turns={turns}
                        currentQuestion={currentQuestion}
                        isLoading={isLoading}
                        loadingAction={loadingAction}
                      />
                    </div>

                    {/* Answer Input is pinned at the bottom when an active question exists */}
                    {currentQuestion && (
                      <AnswerInput
                        onSubmit={handleSubmitAnswer}
                        isLoading={isLoading || isEndingSession}
                        disabled={Boolean(errorMessage && !currentQuestion)}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}


