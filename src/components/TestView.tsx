import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ListChecks, 
  Shuffle, 
  FileQuestion,
  RotateCcw
} from 'lucide-react';
import { 
  StudentProfile, 
  TestQuestion, 
  ABCDQuestion, 
  MatchingQuestion, 
  CustomQuestion, 
  TestEvaluationResult 
} from '../types';

interface TestViewProps {
  profile: StudentProfile;
  topic: string;
  questions: TestQuestion[];
  onFinishTest: (evaluations: Record<string, TestEvaluationResult>, score: number) => void;
  onBackToLesson: () => void;
}

export const TestView: React.FC<TestViewProps> = ({
  profile,
  topic,
  questions,
  onFinishTest,
  onBackToLesson,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // Store user selections per question: questionId -> answer
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  // Matching active pairing state: definitionId -> termId
  const [matchingSlots, setMatchingSlots] = useState<Record<string, string>>({});
  // Selected term for matching click-to-pair
  const [selectedMatchingTermId, setSelectedMatchingTermId] = useState<string | null>(null);

  // Freeform text for short answers
  const [textInputAnswer, setTextInputAnswer] = useState<string>('');

  // Evaluated questions: questionId -> result
  const [evaluations, setEvaluations] = useState<Record<string, TestEvaluationResult>>({});

  const totalQuestions = questions?.length || 0;
  const currentQ = questions && questions[currentIndex] ? questions[currentIndex] : null;

  // Safe helper if questions ended early
  if (!currentQ || totalQuestions === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Všechny dostupné otázky byly dokončeny</h2>
        <p className="text-sm text-slate-600">
          Můžeš přejít na vyhodnocení svých odpovědí a zobrazení závěrečného shrnutí učiva.
        </p>
        <button
          type="button"
          onClick={() => {
            let totalScore = 0;
            Object.values(evaluations).forEach((r) => {
              totalScore += r.score || 0;
            });
            onFinishTest(evaluations, Math.round(totalScore));
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <span>Přejít k závěrečnému vyhodnocení</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const isCurrentEvaluated = Boolean(evaluations[currentQ.id]);
  const currentResult = evaluations[currentQ.id];

  // Helper for question phase label
  const getCategoryLabel = (index: number) => {
    if (index < 4) return { label: 'Část 1/3: Výběr z možností (ABCD)', badge: 'ABCD', icon: ListChecks };
    if (index < 8) return { label: 'Část 2/3: Přiřazovací otázky (5 termínů na 4 definice + 1 chyták)', badge: 'Přiřazování', icon: Shuffle };
    return { label: 'Část 3/3: Specializované didaktické úlohy', badge: 'AI Výzva', icon: FileQuestion };
  };

  // Evaluate ABCD
  const handleSelectABCD = (key: 'A' | 'B' | 'C' | 'D') => {
    if (isCurrentEvaluated) return;
    const q = currentQ as ABCDQuestion;
    const isCorrect = key === q.correctAnswer;
    const wrongExplanation = !isCorrect ? q.explanationsWrong?.[key] : undefined;

    const result: TestEvaluationResult = {
      isCorrect,
      score: isCorrect ? 1 : 0,
      studentAnswer: key,
      feedback: isCorrect ? q.explanationCorrect : (wrongExplanation || 'Tato možnost není správná.'),
      wrongTermExplanation: wrongExplanation,
    };

    setSelectedAnswers((prev) => ({ ...prev, [q.id]: key }));
    setEvaluations((prev) => ({ ...prev, [q.id]: result }));
  };

  // Matching handlers
  const handleTermClick = (termId: string) => {
    if (isCurrentEvaluated) return;
    // If already slotted somewhere, clicking removes it from slot
    const existingSlot = Object.keys(matchingSlots).find((k) => matchingSlots[k] === termId);
    if (existingSlot) {
      const nextSlots = { ...matchingSlots };
      delete nextSlots[existingSlot];
      setMatchingSlots(nextSlots);
      setSelectedMatchingTermId(null);
      return;
    }

    if (selectedMatchingTermId === termId) {
      setSelectedMatchingTermId(null);
    } else {
      setSelectedMatchingTermId(termId);
    }
  };

  const handleDefinitionClick = (defId: string) => {
    if (isCurrentEvaluated) return;
    if (selectedMatchingTermId) {
      // Slot this term
      setMatchingSlots((prev) => ({
        ...prev,
        [defId]: selectedMatchingTermId,
      }));
      setSelectedMatchingTermId(null);
    } else if (matchingSlots[defId]) {
      // Remove term from this slot
      const nextSlots = { ...matchingSlots };
      delete nextSlots[defId];
      setMatchingSlots(nextSlots);
    }
  };

  const submitMatchingAnswer = () => {
    const q = currentQ as MatchingQuestion;
    const definitions = q.definitions || [];
    const terms = q.terms || [];

    let correctCount = 0;
    definitions.forEach((def) => {
      if (matchingSlots[def.id] === def.correctTermId) {
        correctCount += 1;
      }
    });

    const isFullyCorrect = definitions.length > 0 && correctCount === definitions.length;
    const distractorId = q.distractorTermId || '';
    const isDistractorUsed = Boolean(distractorId && Object.values(matchingSlots).includes(distractorId));
    const distractorTerm = terms.find((t) => t.id === distractorId);

    let feedback = '';
    if (isFullyCorrect) {
      feedback = `Výborně! Všechna přiřazení máš správně. Chyták "${distractorTerm?.text || 'chyták'}" jsi správně vynechal/a.`;
      if (q.distractorExplanation) {
        feedback += ` (${q.distractorExplanation})`;
      }
    } else {
      feedback = `Správně jsi přiřadil/a ${correctCount} z ${definitions.length} definic. `;
      if (isDistractorUsed) {
        feedback += `Pozor: Použil/a jsi termín "${distractorTerm?.text || 'chyták'}", což byl chyták navíc! `;
        if (q.distractorExplanation) {
          feedback += q.distractorExplanation;
        }
      } else {
        feedback += `Prohlédni si správné dvojice níže.`;
      }
    }

    const result: TestEvaluationResult = {
      isCorrect: isFullyCorrect,
      score: definitions.length > 0 ? correctCount / definitions.length : 1,
      studentAnswer: matchingSlots,
      feedback,
      wrongTermExplanation: isDistractorUsed ? q.distractorExplanation : undefined,
    };

    setSelectedAnswers((prev) => ({ ...prev, [q.id]: matchingSlots }));
    setEvaluations((prev) => ({ ...prev, [q.id]: result }));
  };

  // Custom handler
  const handleCustomChoice = (answerKey: string) => {
    if (isCurrentEvaluated) return;
    const q = currentQ as CustomQuestion;
    const isCorrect = answerKey.toLowerCase().trim() === (q.correctAnswer || '').toLowerCase().trim();

    const result: TestEvaluationResult = {
      isCorrect,
      score: isCorrect ? 1 : 0,
      studentAnswer: answerKey,
      feedback: isCorrect ? q.explanationCorrect : q.explanationWrongCommon,
      wrongTermExplanation: !isCorrect ? q.explanationWrongCommon : undefined,
    };

    setSelectedAnswers((prev) => ({ ...prev, [q.id]: answerKey }));
    setEvaluations((prev) => ({ ...prev, [q.id]: result }));
  };

  const handleCustomTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInputAnswer.trim() || isCurrentEvaluated) return;
    const q = currentQ as CustomQuestion;

    const normalized = textInputAnswer.trim().toLowerCase();
    const isCorrect =
      normalized === (q.correctAnswer || '').toLowerCase().trim() ||
      Boolean(q.acceptableAnswers?.some((a) => a.toLowerCase().trim() === normalized));

    const result: TestEvaluationResult = {
      isCorrect,
      score: isCorrect ? 1 : 0,
      studentAnswer: textInputAnswer.trim(),
      feedback: isCorrect
        ? q.explanationCorrect
        : `Správná odpověď je: "${q.correctAnswer}". ${q.explanationWrongCommon || q.explanationCorrect}`,
      wrongTermExplanation: !isCorrect ? q.explanationWrongCommon : undefined,
    };

    setSelectedAnswers((prev) => ({ ...prev, [q.id]: textInputAnswer.trim() }));
    setEvaluations((prev) => ({ ...prev, [q.id]: result }));
  };

  // Next Question or Finish
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTextInputAnswer('');
      setSelectedMatchingTermId(null);
      setMatchingSlots({});
    } else {
      // Calculate total score
      let totalScore = 0;
      Object.values(evaluations).forEach((r) => {
        totalScore += r.score || 0;
      });
      onFinishTest(evaluations, Math.round(totalScore));
    }
  };

  const category = getCategoryLabel(currentIndex);
  const CategoryIcon = category.icon;

  // Safe definitions and terms for Matching Question
  const matchingDefs = (currentQ as MatchingQuestion).definitions || [];
  const matchingTerms = (currentQ as MatchingQuestion).terms || [];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Bar with Return button and Progress */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLesson}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na shrnutí lekce</span>
        </button>
        <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
          Téma: {topic}
        </span>
      </div>

      {/* Progress & Category Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CategoryIcon className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">{category.label}</span>
          </div>
          <span className="text-xs font-bold font-mono text-indigo-600">
            Otázka {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* 12-dot Progress Bar */}
        <div className="grid grid-cols-12 gap-1.5">
          {questions.map((q, idx) => {
            const isDone = Boolean(evaluations[q.id]);
            const isPassed = evaluations[q.id]?.isCorrect;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={q.id || idx}
                className={`h-2 rounded-full transition-all ${
                  isCurrent
                    ? 'ring-2 ring-indigo-500 ring-offset-1 bg-indigo-600'
                    : isDone
                    ? isPassed
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                    : 'bg-slate-200'
                }`}
                title={`Otázka ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        {/* Context Scenario if present */}
        {currentQ.contextScenario && (
          <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-100 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              <strong className="text-violet-950">Simulovaná situace: </strong>
              {currentQ.contextScenario}
            </div>
          </div>
        )}

        {/* Question Heading */}
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Otázka č. {currentIndex + 1} ({String(currentQ.type || 'abcd').toUpperCase()})
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {currentQ.question}
          </h2>
        </div>

        {/* ---------------- TYPE 1: ABCD ---------------- */}
        {currentQ.type === 'abcd' && (
          <div className="space-y-3">
            {((currentQ as ABCDQuestion).options || []).map((opt) => {
              const q = currentQ as ABCDQuestion;
              const isSelected = selectedAnswers[q.id] === opt.key;
              const isCorrectOpt = q.correctAnswer === opt.key;

              let btnStyle = 'bg-white border-slate-200 hover:border-slate-300 text-slate-800';
              if (isCurrentEvaluated) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400';
                } else if (isSelected && !isCorrectOpt) {
                  btnStyle = 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400';
                } else {
                  btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                }
              } else if (isSelected) {
                btnStyle = 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-950 font-medium';
              }

              return (
                <button
                  type="button"
                  key={opt.key}
                  disabled={isCurrentEvaluated}
                  onClick={() => handleSelectABCD(opt.key)}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${btnStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCurrentEvaluated && isCorrectOpt
                        ? 'bg-emerald-600 text-white'
                        : isCurrentEvaluated && isSelected && !isCorrectOpt
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <span className="text-xs sm:text-sm pt-0.5 leading-relaxed flex-1">
                    {opt.text}
                  </span>
                  {isCurrentEvaluated && isCorrectOpt && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {isCurrentEvaluated && isSelected && !isCorrectOpt && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ---------------- TYPE 2: MATCHING (5 TERMS TO 4 DEFINITIONS) ---------------- */}
        {currentQ.type === 'matching' && (
          <div className="space-y-6">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              <strong>Pravidla přiřazování:</strong> Klikni nejprve na termín dole a poté na definici, ke které patří.
              <span className="font-semibold text-amber-950 block mt-0.5">
                ⚠️ Pozor: Z nabízených termínů je 1 chyták navíc, který k žádné definici nepatří!
              </span>
            </div>

            {/* Target Definitions Slots */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Cílové definice ({matchingDefs.length} pozice):
              </span>
              {matchingDefs.map((def, idx) => {
                const assignedTermId = matchingSlots[def.id];
                const assignedTerm = matchingTerms.find((t) => t.id === assignedTermId);
                const isCorrectMatch = isCurrentEvaluated && assignedTermId === def.correctTermId;

                return (
                  <div
                    key={def.id || idx}
                    onClick={() => handleDefinitionClick(def.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isCurrentEvaluated
                        ? isCorrectMatch
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-rose-50 border-rose-300'
                        : selectedMatchingTermId
                        ? 'border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                          {def.definition}
                        </span>
                      </div>

                      {/* Slotted Term Display */}
                      <div className="sm:shrink-0 self-start sm:self-center">
                        {assignedTerm ? (
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              isCurrentEvaluated
                                ? isCorrectMatch
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'bg-indigo-600 text-white shadow-xs'
                            }`}
                          >
                            <span>{assignedTerm.text}</span>
                            {!isCurrentEvaluated && <span className="text-indigo-200 text-[10px]">✕</span>}
                          </div>
                        ) : (
                          <span
                            className={`text-xs px-2.5 py-1 rounded-md border border-dashed text-slate-400 font-medium ${
                              selectedMatchingTermId ? 'border-indigo-400 text-indigo-600 bg-white font-bold' : 'border-slate-300'
                            }`}
                          >
                            {selectedMatchingTermId ? 'Klikni pro vložení' : 'Prázdné místo'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Available Terms */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nabízené termíny (vyber a přiřaď):
                </span>
                <span className="text-[11px] text-slate-400">1 je chyták navíc</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {matchingTerms.map((term) => {
                  const isUsed = Object.values(matchingSlots).includes(term.id);
                  const isSelected = selectedMatchingTermId === term.id;
                  const q = currentQ as MatchingQuestion;
                  const isDistractor = term.id === q.distractorTermId;

                  let style = 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300';
                  if (isCurrentEvaluated) {
                    if (isDistractor) {
                      style = isUsed
                        ? 'bg-rose-100 border-rose-400 text-rose-950 font-bold'
                        : 'bg-amber-50 border-amber-300 text-amber-900 border-dashed';
                    } else {
                      style = 'bg-slate-100 border-slate-200 text-slate-600';
                    }
                  } else if (isSelected) {
                    style = 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300';
                  } else if (isUsed) {
                    style = 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-70';
                  }

                  return (
                    <button
                      type="button"
                      key={term.id}
                      disabled={isCurrentEvaluated}
                      onClick={() => handleTermClick(term.id)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${style}`}
                    >
                      <span>{term.text}</span>
                      {isCurrentEvaluated && isDistractor && (
                        <span className="ml-1.5 text-[10px] bg-amber-200 text-amber-900 px-1 py-0.5 rounded">
                          Chyták
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matching Submit Button */}
            {!isCurrentEvaluated && (
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={submitMatchingAnswer}
                  disabled={Object.keys(matchingSlots).length === 0}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all ${
                    Object.keys(matchingSlots).length === 0
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer'
                  }`}
                >
                  Ověřit přiřazení termínů
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TYPE 3: CUSTOM (AI-CHOSEN BEST FORMAT) ---------------- */}
        {currentQ.type === 'custom' && (
          <div className="space-y-4">
            {/* Sub-type True / False or Scenario Choice */}
            {((currentQ as CustomQuestion).subType === 'true_false' || (currentQ as CustomQuestion).options) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {((currentQ as CustomQuestion).options || [
                  { key: 'ano', text: 'Ano / Pravda' },
                  { key: 'ne', text: 'Ne / Nepravda' },
                ]).map((opt) => {
                  const q = currentQ as CustomQuestion;
                  const isSelected = selectedAnswers[q.id]?.toLowerCase() === opt.key.toLowerCase();
                  const isCorrectOpt = (q.correctAnswer || '').toLowerCase() === opt.key.toLowerCase();

                  let style = 'bg-white border-slate-200 hover:border-slate-300 text-slate-800';
                  if (isCurrentEvaluated) {
                    if (isCorrectOpt) {
                      style = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold';
                    } else if (isSelected && !isCorrectOpt) {
                      style = 'bg-rose-50 border-rose-400 text-rose-950 font-bold';
                    } else {
                      style = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    style = 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-950 font-semibold';
                  }

                  return (
                    <button
                      type="button"
                      key={opt.key}
                      disabled={isCurrentEvaluated}
                      onClick={() => handleCustomChoice(opt.key)}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${style}`}
                    >
                      <span className="font-bold text-sm sm:text-base">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sub-type Short Answer / Fill in Blank */}
            {(currentQ as CustomQuestion).subType === 'short_answer' ||
            (currentQ as CustomQuestion).subType === 'fill_in_blank' ? (
              <form onSubmit={handleCustomTextSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInputAnswer}
                    onChange={(e) => setTextInputAnswer(e.target.value)}
                    placeholder="Napiš svou odpověď nebo termín..."
                    disabled={isCurrentEvaluated}
                    className="flex-1 text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 font-medium"
                  />
                  {!isCurrentEvaluated && (
                    <button
                      type="submit"
                      disabled={!textInputAnswer.trim()}
                      className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white transition-all ${
                        !textInputAnswer.trim()
                          ? 'bg-slate-300 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer'
                      }`}
                    >
                      Ověřit
                    </button>
                  )}
                </div>
              </form>
            ) : null}
          </div>
        )}

        {/* ---------------- DIDACTIC FEEDBACK & ERROR EXPLANATION ---------------- */}
        {isCurrentEvaluated && currentResult && (
          <div
            className={`p-5 rounded-2xl border transition-all ${
              currentResult.isCorrect
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {currentResult.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2 text-xs sm:text-sm leading-relaxed flex-1">
                <div>
                  <strong className={currentResult.isCorrect ? 'text-emerald-800' : 'text-rose-800'}>
                    {currentResult.isCorrect ? 'Správně!' : 'Tady byla chyba:'}
                  </strong>{' '}
                  <span>{currentResult.feedback}</span>
                </div>

                {/* Specific explanation of the chosen wrong term */}
                {!currentResult.isCorrect && currentResult.wrongTermExplanation && (
                  <div className="p-3 rounded-xl bg-white/80 border border-rose-200/80 text-xs text-rose-900">
                    <span className="font-bold block mb-0.5">💡 Co tento pojem ve skutečnosti znamená:</span>
                    {currentResult.wrongTermExplanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NEXT QUESTION / FINISH TEST BUTTON */}
        {isCurrentEvaluated && (
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>{currentIndex === questions.length - 1 ? 'Dokončit test a zobrazit shrnutí' : 'Další otázka'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
