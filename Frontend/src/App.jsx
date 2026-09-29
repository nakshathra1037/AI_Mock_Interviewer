import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import InterviewSetup from './components/InterviewSetup.jsx';
import TranscriptView from './components/TranscriptView.jsx';
import AnswerInput from './components/AnswerInput.jsx';
import AuthForm from './components/AuthForm.jsx';
import SessionsList from './components/SessionsList.jsx';
import ResumeManager from './components/ResumeManager.jsx';
import SessionSummary from './components/SessionSummary.jsx';
import { AlertCircle, Trophy, Loader2, CheckCircle2 } from 'lucide-react';

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

  // Phase 4: Voice & Audio Recording State
  const [isCompleted, setIsCompleted] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [recordSession, setRecordSession] = useState(false); // Default: unchecked opt-in

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingAttemptRef = useRef(0);

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
   * Starts continuous microphone audio recording for the entire session.
   * If mic access is denied or unavailable, skips recording gracefully without blocking.
   */
  const startSessionRecording = async () => {
    if (
      typeof window === 'undefined' ||
      !navigator?.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      return;
    }

    const recordingAttempt = ++recordingAttemptRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (recordingAttempt !== recordingAttemptRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      let options = {};
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const mime = recorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mime });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
        }
        // Stop all mic tracks
        try {
          stream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          // ignore
        }
      };

      recorder.start(1000); // 1-second timeslices
      setIsRecordingSession(true);
    } catch (err) {
      console.warn('getUserMedia mic recording not available or denied:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied for session recording. You can still practice the interview.');
      }
    }
  };

  /**
   * Stops continuous audio recording and releases mic tracks
   */
  const stopSessionRecording = () => {
    recordingAttemptRef.current++;

    // Stop any active speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
      }
    }

    // Release microphone tracks
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // ignore
      }
      audioStreamRef.current = null;
    }

    setIsRecordingSession(false);
  };

  /**
   * Clears the stored JWT, user info, and resets current interview state.
   */
  const handleLogout = () => {
    stopSessionRecording();
    if (recordedAudioUrl) {
      try {
        URL.revokeObjectURL(recordedAudioUrl);
      } catch (e) {
        // ignore
      }
    }
    setToken(null);
    setCurrentUser(null);
    setSessionId(null);
    setResumeInfo({ hasResume: false, fileName: null });
    setUseResume(false);
    setIsStarted(false);
    setIsCompleted(false);
    setRecordedAudioUrl(null);
    setTurns([]);
    setCurrentQuestion('');
    setCurrentQuestionType('technical');
    setSessionSummary(null);
    setConversationHistory([]);
    setActiveTab('interview');
    setErrorMessage(null);
  };

  /**
   * Starts a new interview session and session audio recording.
   * Triggered when candidate clicks the "Start Mock Interview" button.
   * Calls POST /api/generate-question with { role, difficulty, conversationHistory: [] }
   * and Authorization: Bearer <token>.
   * Receives { question, questionType, sessionId }.
   */
  const handleStartInterview = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!role || !role.trim()) return;

    // Reset recording and completion state
    stopSessionRecording();
    if (recordedAudioUrl) {
      try {
        URL.revokeObjectURL(recordedAudioUrl);
      } catch (err) {
        // ignore
      }
    }
    setRecordedAudioUrl(null);
    setIsCompleted(false);

    setIsLoading(true);
    setLoadingAction('generating');
    setErrorMessage(null);
    setTurns([]);
    setConversationHistory([]);
    setCurrentQuestion('');
    setCurrentQuestionType('technical');
    setSessionSummary(null);
    setSessionId(null);

    // Initiate continuous audio recording in background ONLY if candidate opted-in
    if (recordSession) {
      startSessionRecording();
    }

    try {
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
    if (!answerText.trim() || !currentQuestion) return;

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
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
      // Determine next question type
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
   * Concludes the interview session, stops recording, and generates the overall performance summary.
   * Calls POST /api/session-summary with { sessionId }.
   */
  const handleEndInterview = async () => {
    stopSessionRecording();

    if (!sessionId || !token || turns.length === 0) {
      setIsCompleted(true);
      setCurrentQuestion('');
      return;
    }

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
    } catch (err) {
      console.error('Error concluding session summary:', err);
      setErrorMessage(err.message || 'Could not generate session summary.');
    } finally {
      setIsEndingSession(false);
      setIsCompleted(true);
      setCurrentQuestion('');
    }
  };

  /**
   * Resets the interview state back to setup mode.
   */
  const handleRestart = () => {
    stopSessionRecording();
    if (recordedAudioUrl) {
      try {
        URL.revokeObjectURL(recordedAudioUrl);
      } catch (e) {
        // ignore
      }
    }
    setRecordedAudioUrl(null);
    setIsCompleted(false);
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
        isCompleted={isCompleted || Boolean(sessionSummary)}
        isRecordingSession={isRecordingSession}
        onRestart={handleRestart}
        onEndInterview={handleEndInterview}
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
                    onClick={handleStartInterview}
                    isLoading={isLoading}
                    hasResume={resumeInfo.hasResume}
                    useResume={useResume}
                    setUseResume={setUseResume}
                    recordSession={recordSession}
                    setRecordSession={setRecordSession}
                  />
                ) : isCompleted || sessionSummary ? (
                  /* Combined End-of-Session Summary & Audio Playback */
                  <SessionSummary
                    summary={sessionSummary}
                    role={role}
                    difficulty={difficulty}
                    turns={turns}
                    turnsCount={turns.length}
                    recordedAudioUrl={recordedAudioUrl}
                    onRestart={handleRestart}
                    onStartNewInterview={handleRestart}
                    onViewPastSessions={() => setActiveTab('my-sessions')}
                  />
                ) : (
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Header bar during active interview with End Interview button */}
                    {turns.length > 0 && (
                      <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="font-medium text-slate-300">
                            Completed Turns: <strong className="text-slate-200">{turns.length}</strong>
                          </span>
                          {isRecordingSession && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium ml-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Recording audio
                            </span>
                          )}
                        </div>
                        <button
                          id="finish-interview-btn"
                          onClick={handleEndInterview}
                          disabled={isLoading || isEndingSession}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 active:scale-95"
                          title="Finish interview session to review feedback & listen to audio recording"
                        >
                          {isEndingSession ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating Summary...</span>
                            </>
                          ) : (
                            <>
                              <Trophy className="w-3.5 h-3.5" />
                              <span>End Interview & Review</span>
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
