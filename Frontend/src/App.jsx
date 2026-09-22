import React, { useState } from 'react';
import Header from './components/Header.jsx';
import InterviewSetup from './components/InterviewSetup.jsx';
import TranscriptView from './components/TranscriptView.jsx';
import AnswerInput from './components/AnswerInput.jsx';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Session Configuration
  const [role, setRole] = useState('Backend Developer');
  const [difficulty, setDifficulty] = useState('Junior');
  const [isStarted, setIsStarted] = useState(false);

  // Interview Loop State
  // conversationHistory tracks all { role: "assistant"|"user", content: string } turns
  const [conversationHistory, setConversationHistory] = useState([]);
  
  // turns tracks the display list: { id, question, answer, feedback }
  const [turns, setTurns] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  
  // UI & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('idle'); // 'generating' | 'evaluating' | 'idle'
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Starts a new interview session.
   * Calls POST /api/generate-question with { role, difficulty, conversationHistory: [] }
   */
  const handleStartInterview = async () => {
    if (!role.trim()) return;

    setIsLoading(true);
    setLoadingAction('generating');
    setErrorMessage(null);
    setTurns([]);
    setConversationHistory([]);
    setCurrentQuestion('');

    try {
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.trim(),
          difficulty,
          conversationHistory: []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate opening question.');
      }

      const initialQuestion = data.question;
      setCurrentQuestion(initialQuestion);
      setIsStarted(true);

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
   * Sends full conversationHistory to POST /api/evaluate-answer
   */
  const handleSubmitAnswer = async (answerText) => {
    if (!answerText.trim() || !currentQuestion) return;

    const questionAsked = currentQuestion;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionAsked,
          answer: answerText,
          conversationHistory: updatedHistory,
          role,
          difficulty
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate your answer.');
      }

      const { feedback, nextQuestion } = data;

      // Update turn with feedback
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, feedback } : t))
      );

      // Set the next follow-up question
      setCurrentQuestion(nextQuestion);

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
   * Resets the interview state back to setup mode.
   */
  const handleRestart = () => {
    setIsStarted(false);
    setTurns([]);
    setCurrentQuestion('');
    setConversationHistory([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        role={role}
        difficulty={difficulty}
        isStarted={isStarted}
        onRestart={handleRestart}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-sm flex items-start justify-between gap-3 shadow-lg shadow-rose-950/20 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Interview Session Notice</p>
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

        {!isStarted ? (
          <InterviewSetup
            role={role}
            setRole={setRole}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onStart={handleStartInterview}
            isLoading={isLoading}
          />
        ) : (
          <div className="flex-1 flex flex-col justify-between">
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
                isLoading={isLoading}
                disabled={Boolean(errorMessage && !currentQuestion)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
