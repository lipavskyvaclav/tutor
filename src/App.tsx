/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Questionnaire } from './components/Questionnaire';
import { TopicSelection } from './components/TopicSelection';
import { LessonView } from './components/LessonView';
import { TestView } from './components/TestView';
import { FinalSummaryView } from './components/FinalSummaryView';
import { 
  StudentProfile, 
  TopicSessionInput, 
  LessonData, 
  TestQuestion, 
  TestEvaluationResult 
} from './types';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem('edumentor_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentStep, setCurrentStep] = useState<'questionnaire' | 'topic' | 'lesson' | 'test' | 'final_summary'>('questionnaire');
  const [sessionInput, setSessionInput] = useState<TopicSessionInput | null>(null);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [testEvaluations, setTestEvaluations] = useState<Record<string, TestEvaluationResult>>({});
  const [testScore, setTestScore] = useState<number>(0);
  const [finalSummary, setFinalSummary] = useState<{ coreTakeaway: string; feedbackMessage: string } | null>(null);

  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If a profile exists in storage on load, jump directly to topic selection
  useEffect(() => {
    if (profile && currentStep === 'questionnaire' && !sessionInput) {
      setCurrentStep('topic');
    }
  }, []);

  const handleProfileComplete = (newProfile: StudentProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('edumentor_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    setCurrentStep('topic');
  };

  const handleTopicSubmit = async (input: TopicSessionInput) => {
    if (!profile) return;
    setSessionInput(input);
    setIsLoadingLesson(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          topic: input.topic,
          photos: input.photos,
          selfConfidence: input.selfConfidence,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generování lekce selhalo.');
      }

      const lesson: LessonData = await res.json();
      setLessonData(lesson);
      setCurrentStep('lesson');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Nepodařilo se vygenerovat lekci. Zkontrolujte připojení a zkuste to znovu.');
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const handleStartTest = async () => {
    if (!profile || !lessonData) return;
    setIsGeneratingTest(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          topic: lessonData.topic,
          lessonSummary: lessonData.formattedSummary,
          selfConfidence: sessionInput?.selfConfidence || 3,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generování testu selhalo.');
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('Test neobsahuje žádné otázky.');
      }

      setTestQuestions(data.questions);
      setTestEvaluations({});
      setCurrentStep('test');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Nepodařilo se sestavit test. Zkuste to prosím znovu.');
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handleFinishTest = async (
    evals: Record<string, TestEvaluationResult>,
    score: number
  ) => {
    setTestEvaluations(evals);
    setTestScore(score);

    // Call final summary endpoint
    try {
      const wrongList = testQuestions
        .filter((q) => evals[q.id] && !evals[q.id].isCorrect)
        .map((q) => q.question);

      const res = await fetch('/api/final-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          topic: lessonData?.topic || sessionInput?.topic || 'Učivo',
          score,
          totalQuestions: testQuestions.length,
          wrongQuestions: wrongList,
        }),
      });

      if (res.ok) {
        const summaryData = await res.json();
        setFinalSummary(summaryData);
      } else {
        setFinalSummary({
          coreTakeaway: lessonData?.keyPoints?.join(' ') || 'Učivo úspěšně procvičeno.',
          feedbackMessage: `Dokončil/a jsi test se skóre ${score} z ${testQuestions.length}.`,
        });
      }
    } catch {
      setFinalSummary({
        coreTakeaway: lessonData?.keyPoints?.join(' ') || 'Učivo úspěšně procvičeno.',
        feedbackMessage: `Dokončil/a jsi test se skóre ${score} z ${testQuestions.length}.`,
      });
    }

    setCurrentStep('final_summary');
  };

  const handleResetAll = () => {
    setSessionInput(null);
    setLessonData(null);
    setTestQuestions([]);
    setTestEvaluations({});
    setFinalSummary(null);
    setCurrentStep('topic');
  };

  const handleEditProfile = () => {
    setCurrentStep('questionnaire');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        currentStep={
          currentStep === 'final_summary' ? 'test' : currentStep
        }
        profile={profile}
        onResetAll={handleResetAll}
        onEditProfile={handleEditProfile}
      />

      {/* Global Error Banner if any */}
      {errorMessage && (
        <div className="max-w-3xl mx-auto mt-4 px-4 w-full">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold">Chyba:</strong>
              {errorMessage}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentStep === 'questionnaire' && (
          <Questionnaire
            initialProfile={profile}
            onComplete={handleProfileComplete}
          />
        )}

        {currentStep === 'topic' && profile && (
          <TopicSelection
            profile={profile}
            onBack={() => setCurrentStep('questionnaire')}
            onSubmit={handleTopicSubmit}
            isLoading={isLoadingLesson}
          />
        )}

        {currentStep === 'lesson' && profile && lessonData && (
          <LessonView
            profile={profile}
            lesson={lessonData}
            onStartTest={handleStartTest}
            isGeneratingTest={isGeneratingTest}
          />
        )}

        {currentStep === 'test' && profile && testQuestions.length > 0 && (
          <TestView
            profile={profile}
            topic={lessonData?.topic || sessionInput?.topic || ''}
            questions={testQuestions}
            onFinishTest={handleFinishTest}
            onBackToLesson={() => setCurrentStep('lesson')}
          />
        )}

        {currentStep === 'final_summary' && profile && (
          <FinalSummaryView
            profile={profile}
            topic={lessonData?.topic || sessionInput?.topic || ''}
            score={testScore}
            totalQuestions={testQuestions.length || 12}
            evaluations={testEvaluations}
            questions={testQuestions}
            finalSummaryText={
              finalSummary?.coreTakeaway ||
              lessonData?.keyPoints?.join('. ') ||
              'Klíčové shrnutí tématu.'
            }
            tutorFeedback={
              finalSummary?.feedbackMessage ||
              'Gratuluji k dokončení procvičování!'
            }
            onRetakeTest={() => {
              setTestEvaluations({});
              setCurrentStep('test');
            }}
            onNewTopic={handleResetAll}
            onEditProfile={handleEditProfile}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EduMentor AI · Adaptivní didaktický tutor pro české školy</span>
          <span className="text-slate-400">Didaktická transformace · Personalizovaná výuka · Zvuk & Testy</span>
        </div>
      </footer>
    </div>
  );
}
