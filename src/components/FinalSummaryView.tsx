import React, { useState } from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  BookOpen, 
  Sparkles, 
  FileText, 
  Copy, 
  Check, 
  ArrowRight,
  Filter,
  User
} from 'lucide-react';
import { StudentProfile, TestQuestion, TestEvaluationResult } from '../types';

interface FinalSummaryViewProps {
  profile: StudentProfile;
  topic: string;
  score: number;
  totalQuestions: number;
  evaluations: Record<string, TestEvaluationResult>;
  questions: TestQuestion[];
  finalSummaryText: string;
  tutorFeedback: string;
  onRetakeTest: () => void;
  onNewTopic: () => void;
  onEditProfile: () => void;
}

export const FinalSummaryView: React.FC<FinalSummaryViewProps> = ({
  profile,
  topic,
  score,
  totalQuestions,
  evaluations,
  questions,
  finalSummaryText,
  tutorFeedback,
  onRetakeTest,
  onNewTopic,
  onEditProfile,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mistakes'>('all');
  const [copiedMemo, setCopiedMemo] = useState(false);

  const percentage = Math.round((score / totalQuestions) * 100);

  const getScoreColor = () => {
    if (percentage >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 65) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (percentage >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const handleCopyMemo = () => {
    const textToCopy = `EduMentor AI – Shrnutí tématu: ${topic}\n\nTo nejdůležitější, co si pamatovat:\n${finalSummaryText}\n\nVýsledek testu: ${score}/${totalQuestions} (${percentage} %)`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const wrongQuestions = questions.filter((q) => evaluations[q.id] && !evaluations[q.id].isCorrect);
  const displayedQuestions = filterMode === 'mistakes' ? wrongQuestions : questions;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-7">
      {/* 1. SCORE & CELEBRATION HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3 border border-indigo-100">
          <Trophy className="w-3.5 h-3.5" />
          <span>Test úspěšně dokončen (12 otázek)</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Výsledky k tématu: {topic}
        </h1>

        <div className="flex items-center justify-center gap-6 my-6">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-indigo-600 tabular-nums">
              {score} <span className="text-slate-400 text-2xl font-normal">/ {totalQuestions}</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mt-1">
              Úspěšnost: {percentage} %
            </span>
          </div>
        </div>

        {/* Tutor's Feedback Message */}
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed text-left flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 block mb-0.5">Hodnocení tvého AI tutora:</strong>
            {tutorFeedback || 'Skvělá práce při procvičení tohoto tématu! Projdi si níže to nejdůležitější.'}
          </div>
        </div>
      </div>

      {/* 2. TO NEJDŮLEŽITĚJŠÍ, CO BY SI MĚL ŽÁK PAMATOVAT (ZÁVĚREČNÉ SHRNUTÍ V NĚKOLIKA VĚTÁCH) */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-sm">
              💡
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              To nejdůležitější, co si pamatovat:
            </h2>
          </div>

          <button
            onClick={handleCopyMemo}
            className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-indigo-200 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
            title="Zkopírovat shrnutí do schránky"
          >
            {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMemo ? 'Zkopírováno' : 'Zkopírovat zápis'}</span>
          </button>
        </div>

        <p className="text-indigo-100 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
          {finalSummaryText}
        </p>
      </section>

      {/* 3. REVIEW OF QUESTIONS (ROZBOR OTÁZEK A CHYB) */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Detailní rozbor všech 12 otázek</h3>
            <p className="text-xs text-slate-500">
              Podívej se, kde jsi bodoval/a a jaké chyby se vyskytly.
            </p>
          </div>

          {wrongQuestions.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-center">
              <button
                onClick={() => setFilterMode('all')}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                  filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Všechny (12)
              </button>
              <button
                onClick={() => setFilterMode('mistakes')}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                  filterMode === 'mistakes' ? 'bg-white text-rose-700 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Jen chyby ({wrongQuestions.length})
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {displayedQuestions.map((q) => {
            const ev = evaluations[q.id];
            const isCorrect = ev?.isCorrect;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed transition-all ${
                  isCorrect
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {q.number}. {q.question}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? 'Správně' : 'Chyba'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs">
                      {ev?.feedback}
                    </p>

                    {/* If error occurred, show specific distractor or term explanation */}
                    {!isCorrect && ev?.wrongTermExplanation && (
                      <div className="mt-1.5 p-2.5 rounded-lg bg-white border border-rose-200 text-xs text-rose-900">
                        <strong>Vysvětlení pojmu: </strong>
                        {ev.wrongTermExplanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onRetakeTest}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm transition-all shadow-2xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Zopakovat tento test</span>
        </button>

        <button
          onClick={onNewTopic}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-sm transition-all"
        >
          <span>Procvičit nové téma</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onEditProfile}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-800 text-xs sm:text-sm transition-all"
        >
          <User className="w-4 h-4" />
          <span>Změnit profil žáka</span>
        </button>
      </div>
    </div>
  );
};
