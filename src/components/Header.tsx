import React from 'react';
import { BookOpen, User, RotateCcw, Sparkles } from 'lucide-react';
import { StudentProfile } from '../types';

interface HeaderProps {
  currentStep: 'questionnaire' | 'topic' | 'lesson' | 'test';
  profile: StudentProfile | null;
  onResetAll: () => void;
  onEditProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  profile,
  onResetAll,
  onEditProfile,
}) => {
  const steps = [
    { id: 'questionnaire', label: '1. Osobní profil' },
    { id: 'topic', label: '2. Téma a materiály' },
    { id: 'lesson', label: '3. Výuka a audio' },
    { id: 'test', label: '4. Test (12 otázek)' },
  ];

  const getStepStatus = (stepId: string) => {
    const order = ['questionnaire', 'topic', 'lesson', 'test'];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepId);
    if (stepIndex === currentIndex) return 'active';
    if (stepIndex < currentIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={onResetAll}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">EduMentor</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">AI Tutor</span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">Personalizovaná výuka na míru žákovi</p>
              </div>
            </div>

            {/* Mobile Profile Pill */}
            {profile && (
              <button
                onClick={onEditProfile}
                className="md:hidden flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>{profile.age} let</span>
              </button>
            )}
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto py-1 text-xs">
            {steps.map((s, idx) => {
              const status = getStepStatus(s.id);
              return (
                <div key={s.id} className="flex items-center">
                  <span
                    className={`px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap ${
                      status === 'active'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : status === 'completed'
                        ? 'text-indigo-900 bg-indigo-50 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < steps.length - 1 && (
                    <span className="text-slate-300 mx-1 text-xs select-none">›</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Profile Summary & Reset (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {profile ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onEditProfile}
                  className="flex items-center gap-2 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                  title="Upravit osobní profil žáka"
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-medium">{profile.age} let</span>
                  <span className="text-slate-400">·</span>
                  <span className="truncate max-w-[120px] text-slate-600">
                    {profile.interests.slice(0, 2).join(', ') || 'Zájmy'}
                  </span>
                </button>
                <button
                  onClick={onResetAll}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="Začít od začátku s novým tématem"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Adaptivní didaktická transformace</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
