import React, { useState } from 'react';
import { 
  Sparkles, 
  Gamepad2, 
  Flame, 
  HelpCircle, 
  Check, 
  ArrowRight, 
  ListChecks, 
  BookOpen, 
  Footprints, 
  Target, 
  Smile, 
  Info,
  GraduationCap
} from 'lucide-react';
import { StudentProfile, PreferredFormat, CommunicationTone } from '../types';

interface QuestionnaireProps {
  initialProfile?: StudentProfile | null;
  onComplete: (profile: StudentProfile) => void;
}

const COMMON_INTERESTS = [
  { id: 'minecraft', label: 'Minecraft', icon: '⛏️' },
  { id: 'roblox', label: 'Roblox', icon: '🧱' },
  { id: 'zelda', label: 'Zelda / RPG hry', icon: '🗡️' },
  { id: 'fotbal', label: 'Fotbal a sport', icon: '⚽' },
  { id: 'hokej', label: 'Hokej / florbal', icon: '🏒' },
  { id: 'zvirata', label: 'Zvířata a příroda', icon: '🐾' },
  { id: 'vesmir', label: 'Vesmír a astronomie', icon: '🚀' },
  { id: 'lego', label: 'Lego a robotika', icon: '🤖' },
  { id: 'hudba', label: 'Hudba (rock, rap, pop)', icon: '🎵' },
  { id: 'kresleni', label: 'Kreslení a manga', icon: '🎨' },
  { id: 'parkour', label: 'Parkour a tanec', icon: '🤸' },
  { id: 'programovani', label: 'Počítače a kódování', icon: '💻' },
];

export const Questionnaire: React.FC<QuestionnaireProps> = ({
  initialProfile,
  onComplete,
}) => {
  const [age, setAge] = useState<number>(initialProfile?.age || 13);
  const [interests, setInterests] = useState<string[]>(initialProfile?.interests || ['Minecraft', 'Fotbal']);
  const [customInterests, setCustomInterests] = useState<string>(initialProfile?.customInterests || '');
  const [formatPreference, setFormatPreference] = useState<PreferredFormat>(
    initialProfile?.formatPreference || 'bullets'
  );
  const [communicationTone, setCommunicationTone] = useState<CommunicationTone>(
    initialProfile?.communicationTone || 'supportive'
  );

  const getGradeEstimate = (currentAge: number) => {
    if (currentAge <= 7) return { grade: '1.–2. třída ZŠ', level: '1. stupeň (začínající čtenář)', note: 'Velmi jednoduchý jazyk, hravost, krátká vysvětlení.' };
    if (currentAge <= 9) return { grade: '3.–4. třída ZŠ', level: '1. stupeň ZŠ', note: 'Základní pojmy srozumitelně s vizuální oporou.' };
    if (currentAge <= 11) return { grade: '5.–6. třída ZŠ', level: 'Přechod na 2. stupeň', note: 'Budování logických vazeb a prvních abstraktnějších modelů.' };
    if (currentAge <= 13) return { grade: '7.–8. třída ZŠ', level: '2. stupeň ZŠ', note: 'Systematičtější terminologie, důraz na příčinu a následek.' };
    if (currentAge <= 15) return { grade: '9. třída ZŠ / 1. roč. SŠ', level: 'Příprava na přijímačky / SŠ', note: 'Respektující tón, zralé analogie bez infantilismu.' };
    if (currentAge <= 18) return { grade: 'Střední škola / Gymnázium', level: 'Středoškolské učivo', note: 'Příprava k maturitě, odbornější hloubka a kritické myšlení.' };
    return { grade: 'VŠ / Dospělý student', level: 'Pokročilé vzdělávání', note: 'Efektivní struktura, akademický kontext a hluboké porozumění.' };
  };

  const gradeInfo = getGradeEstimate(age);

  const toggleInterest = (label: string) => {
    if (interests.includes(label)) {
      setInterests(interests.filter((i) => i !== label));
    } else {
      setInterests([...interests, label]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalInterests = [...interests];
    if (customInterests.trim() && !finalInterests.includes(customInterests.trim())) {
      finalInterests.push(customInterests.trim());
    }
    onComplete({
      age,
      gradeLevel: `${gradeInfo.grade} (${gradeInfo.level})`,
      interests: finalInterests,
      customInterests,
      formatPreference,
      communicationTone,
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Intro Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vstupní didaktický dotazník</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Pojďme nastavit tvého AI tutora na míru
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          AI není generická učebnice. Odpověz na 4 otázky a tutor přizpůsobí obtížnost, příklady i tón přesně tvému světu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Věk (Age) */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs transition-all">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Otázka 1 ze 4</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Kolik ti je let?</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pomůže AI určit tvůj ročník a přizpůsobit míru i náročnost učiva.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4">
            {/* Age Slider + Big Number */}
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <input
                  type="range"
                  min={7}
                  max={20}
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>7 let (1. třída)</span>
                  <span>14 let (ZŠ)</span>
                  <span>18+ let (SŠ/VŠ)</span>
                </div>
              </div>
              <div className="w-20 text-center shrink-0">
                <div className="text-3xl font-extrabold text-indigo-600 font-mono tabular-nums">{age}</div>
                <div className="text-xs font-medium text-slate-500">let</div>
              </div>
            </div>

            {/* Quick age chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[8, 10, 12, 14, 16, 18].map((presetAge) => (
                <button
                  type="button"
                  key={presetAge}
                  onClick={() => setAge(presetAge)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    age === presetAge
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {presetAge} let
                </button>
              ))}
            </div>

            {/* Didactic consequence callout */}
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">Vliv na AI: </span>
                Zařazeno jako <strong className="text-indigo-700">{gradeInfo.grade}</strong> ({gradeInfo.level}). {gradeInfo.note}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Zájmy a koníčky (Interests & Metaphors) */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs transition-all">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Otázka 2 ze 4</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Co tě baví ve volném čase?</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konkrétní videohry, sporty, hudba, oblíbená zvířata či koníčky.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4">
            {/* Quick multi-select chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_INTERESTS.map((item) => {
                const isSelected = interests.includes(item.label);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleInterest(item.label)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      isSelected
                        ? 'bg-violet-50 border-violet-300 text-violet-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base select-none">{item.icon}</span>
                    <span className="truncate flex-1">{item.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom interest input */}
            <div>
              <label htmlFor="custom-interest" className="block text-xs font-medium text-slate-700 mb-1.5">
                Nebo doplň své vlastní koníčky:
              </label>
              <input
                id="custom-interest"
                type="text"
                value={customInterests}
                onChange={(e) => setCustomInterests(e.target.value)}
                placeholder="Např. stavění z Lega, Fortnite, jízda na koni, hra na kytaru..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Didactic explanation callout */}
            <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-100 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-violet-950">Vliv na AI (Didaktická transformace): </span>
                AI nevyloží látku abstraktně. Když se učíš anglické předložky, fyzikální síly nebo cykly v programování, tutor použije pravidla a mechaniky tvých oblíbených her a sportů jako přirozenou metaforu.
              </div>
            </div>
          </div>
        </section>

        {/* 3. Preferovaný formát příjmu informací (Format) */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs transition-all">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Otázka 3 ze 4</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Jaký styl poznámek se ti nejlépe čte?</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vyber formát, který nejlépe vyhovuje tvému soustředění a stylu učení.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ListChecks className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Format A: Bullets */}
            <button
              type="button"
              onClick={() => setFormatPreference('bullets')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                formatPreference === 'bullets'
                  ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center mb-3">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Možnost A</div>
                <h3 className="font-bold text-slate-900 text-sm">Stručné odrážky a hesla</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Stručný výtah „TL;DR“ s <strong>tučně zvýrazněnými</strong> klíčovými slovy pro rychlé čtení.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-amber-800/80 font-medium flex items-center gap-1">
                <span>⚡ Bleskový přehled</span>
              </div>
            </button>

            {/* Format B: Story */}
            <button
              type="button"
              onClick={() => setFormatPreference('story')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                formatPreference === 'story'
                  ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Možnost B</div>
                <h3 className="font-bold text-slate-900 text-sm">Příběhy a příklady z praxe</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Narativní vysvětlení a souvislosti, které ukážou, jak věci fungují v reálném světě.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-amber-800/80 font-medium flex items-center gap-1">
                <span>📖 Širší souvislosti</span>
              </div>
            </button>

            {/* Format C: Step-by-Step */}
            <button
              type="button"
              onClick={() => setFormatPreference('step_by_step')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                formatPreference === 'step_by_step'
                  ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center mb-3">
                  <Footprints className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Možnost C</div>
                <h3 className="font-bold text-slate-900 text-sm">Postupné krokování od základů</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Přehledně číslované kroky 1, 2, 3... bez přeskakování pro postupné budování jistoty.
                </p>
              </div>
              <div className="mt-3 text-[11px] text-amber-800/80 font-medium flex items-center gap-1">
                <span>🪜 Logická posloupnost</span>
              </div>
            </button>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Vliv na AI: </span>
              Změní strukturu i formátování generovaného textu tak, aby tě čtení neunavovalo a snadno jsi udržel/a pozornost.
            </div>
          </div>
        </section>

        {/* 4. Tón komunikace (Tone & Motivation) */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs transition-all">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Otázka 4 ze 4</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Jak chceš, aby se k tobě asistent choval?</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nastavení osobnosti a způsobu komunikace AI tutora.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tone A: Strict & Direct */}
            <button
              type="button"
              onClick={() => setCommunicationTone('strict')}
              className={`p-4 rounded-xl border text-left transition-all ${
                communicationTone === 'strict'
                  ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Volba A</div>
                  <h3 className="font-bold text-slate-900 text-sm">Věcně, přísně a přímo k věci</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Stručný a přímý přístup bez okolků a bez zdrobnělin. Okamžitá a nekompromisně přesná zpětná vazba.
              </p>
            </button>

            {/* Tone B: Supportive & Humorous */}
            <button
              type="button"
              onClick={() => setCommunicationTone('supportive')}
              className={`p-4 rounded-xl border text-left transition-all ${
                communicationTone === 'supportive'
                  ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Volba B</div>
                  <h3 className="font-bold text-slate-900 text-sm">Podpůrně, s humorem a trpělivě</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Povzbuzující, přátelský asistent s dávkou humoru. Trpělivě vysvětlí cokoliv znovu bez stresu z chyb.
              </p>
            </button>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Vliv na AI: </span>
              Zabrání tomu, aby asistent působil na starší žáky zbytečně dětinsky, nebo naopak na ty nejisté příliš chladně a akademicky.
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-2 text-center">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm sm:text-base rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
          >
            <span>Pokračovat k výběru tématu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
