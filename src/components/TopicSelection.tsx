import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Sliders, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { StudentProfile, AttachedPhoto, TopicSessionInput } from '../types';

interface TopicSelectionProps {
  profile: StudentProfile;
  initialInput?: TopicSessionInput | null;
  onBack: () => void;
  onSubmit: (data: TopicSessionInput) => void;
  isLoading: boolean;
}

const SAMPLE_TOPICS = [
  { label: 'Fotosyntéza a dýchání rostlin', category: 'Přírodopis / Biologie' },
  { label: 'Pythagorova věta a pravoúhlý trojúhelník', category: 'Matematika' },
  { label: 'Minulý čas (Past Simple) v angličtině', category: 'Angličtina' },
  { label: 'Chemické vazby a periodická tabulka', category: 'Chemie' },
  { label: 'Cykly (for a while) a algoritmy', category: 'Informatika' },
  { label: 'Husitské války a Jan Hus', category: 'Dějepis' },
];

export const TopicSelection: React.FC<TopicSelectionProps> = ({
  profile,
  initialInput,
  onBack,
  onSubmit,
  isLoading,
}) => {
  const [topic, setTopic] = useState(initialInput?.topic || '');
  const [photos, setPhotos] = useState<AttachedPhoto[]>(initialInput?.photos || []);
  const [selfConfidence, setSelfConfidence] = useState<number>(initialInput?.selfConfidence ?? 2);
  const [isDragging, setIsDragging] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<AttachedPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const confidenceLevels = [
    {
      level: 1,
      title: 'Vůbec nechápu',
      tag: 'Začneme od nuly',
      color: 'border-rose-400 bg-rose-50/60 text-rose-900',
      activeColor: 'bg-rose-600 text-white',
      badge: '1 / 5',
      description: 'Žádný odborný slang ani složité vzorce. Začneme nejjednoduššími základy a intuitivním přirovnáním k budování jistoty.',
    },
    {
      level: 2,
      title: 'Mám v tom zmatek',
      tag: 'Potřebuji ujasnit pojmy',
      color: 'border-amber-400 bg-amber-50/60 text-amber-900',
      activeColor: 'bg-amber-600 text-white',
      badge: '2 / 5',
      description: 'Základní slova znám, ale pletou se mi. Potřebuji jasná přirovnání ze svého světa a rozmotat souvislosti.',
    },
    {
      level: 3,
      title: 'Něco vím, ale nejsem si jistý/á',
      tag: 'Střední úroveň',
      color: 'border-yellow-400 bg-yellow-50/60 text-yellow-900',
      activeColor: 'bg-yellow-600 text-white',
      badge: '3 / 5',
      description: 'Chápu princip, ale dělám občas chyby při praktickém řešení. Chci propojit teorii s praxí a upevnit pravidla.',
    },
    {
      level: 4,
      title: 'Docela mi to jde',
      tag: 'Pokročilé procvičení',
      color: 'border-emerald-400 bg-emerald-50/60 text-emerald-900',
      activeColor: 'bg-emerald-600 text-white',
      badge: '4 / 5',
      description: 'Základní látku zvládám. Chci se vyhnout chybám a soustředit se na praktické využití a zajímavé souvislosti.',
    },
    {
      level: 5,
      title: 'Zvládám s přehledem',
      tag: 'Mistrovská úroveň',
      color: 'border-indigo-400 bg-indigo-50/60 text-indigo-900',
      activeColor: 'bg-indigo-600 text-white',
      badge: '5 / 5',
      description: 'Přeskoč zjevné základy! Zaměř se rovnou na chytáky, mezioborové vztahy, zákeřné otázky a komplexní výzvy.',
    },
  ];

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const newPhoto: AttachedPhoto = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            dataUrl: result,
            mimeType: file.type,
            name: file.name,
          };
          setPhotos((prev) => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && photos.length === 0) {
      alert('Prosím zadej téma nebo vlož alespoň jednu fotografii učebnice či sešitu.');
      return;
    }
    onSubmit({
      topic: topic.trim(),
      photos,
      selfConfidence,
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Back button & Title */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět k profilu žáka</span>
        </button>
        <span className="text-xs text-indigo-700 bg-indigo-50 font-medium px-2.5 py-1 rounded-md border border-indigo-100">
          Žák: {profile.age} let · {profile.interests[0] || 'Zájmy'}
        </span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Co dnes potřebuješ pochopit a procvičit?
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
          Napiš téma, nebo vyfoť stránku z učebnice či sešitu. AI látku přizpůsobí přesně tvým podkladům.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Téma (Text Input) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <label htmlFor="topic-input" className="block text-sm font-bold text-slate-900 mb-1">
            Zadej téma nebo název kapitoly
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Např. Fotosyntéza, Pythagorova věta, Minulý čas v angličtině, Husité...
          </p>

          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Napiš, s čím potřebuješ pomoct..."
            className="w-full text-base px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-slate-900 placeholder:text-slate-400"
          />

          {/* Quick suggestions */}
          <div className="mt-3">
            <span className="text-xs text-slate-400 block mb-1.5 font-medium">Nebo vyzkoušej oblíbená témata:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TOPICS.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setTopic(item.label)}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fotografie z učebnice nebo sešitu */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Vlož fotografie z učebnice nebo sešitu</h2>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Volitelné, ale doporučené
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pokud nahraješ foto stránky, AI bude <strong>prioritně pracovat s textem a příklady</strong> přímo z tvé učebnice.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileChange(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  Klikni pro nahrání fotky nebo přetáhni soubor sem
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Podporuje JPG, PNG z mobilu, tabletu i počítače</p>
              </div>
            </div>
          </div>

          {/* Uploaded thumbnails */}
          {photos.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  Přiložené snímky ({photos.length}):
                </span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Prioritní režim aktivní
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`Snímek ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setPreviewPhoto(photo)}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(photo.id);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white transition-colors"
                      title="Odebrat snímek"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1.5 text-[10px] font-medium bg-slate-900/60 text-white px-1.5 py-0.5 rounded">
                      Strana {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode Indicator Callout */}
          <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5 text-xs text-slate-600">
            {photos.length > 0 ? (
              <>
                <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Prioritní zpracování učebnice:</strong> AI přečte text na fotografiích, použije vaše konkrétní definice a příklady a naváže na ně animaci i test.
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatická didaktická syntéza:</strong> Zvolil/a jsi heslovité téma. AI vygeneruje látku na základě svého didaktického uvážení a tvého osobního dotazníku.
                </span>
              </>
            )}
          </div>
        </div>

        {/* 5. Sebehodnocení aktuálních znalostí (Confidence 1 to 5) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Otázka 5 z 5</span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Jak si věříš v probíraném tématu?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Škála od 1 (vůbec nechápu) po 5 (zvládám s přehledem).
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
          </div>

          {/* 1 to 5 clickable blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 mb-4">
            {confidenceLevels.map((lvl) => {
              const isSelected = selfConfidence === lvl.level;
              return (
                <button
                  type="button"
                  key={lvl.level}
                  onClick={() => setSelfConfidence(lvl.level)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? `${lvl.color} ring-2 ring-indigo-500/30 font-medium shadow-xs`
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? lvl.activeColor : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lvl.badge}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{lvl.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{lvl.tag}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected level explanation */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-700 leading-relaxed">
            <div className="font-semibold text-indigo-900 mb-0.5">
              Vliv na AI (Startovní čára & náročnost):
            </div>
            <div>
              {confidenceLevels.find((c) => c.level === selfConfidence)?.description}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 text-center">
          <button
            type="submit"
            disabled={isLoading || (!topic.trim() && photos.length === 0)}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-white font-semibold text-sm sm:text-base rounded-xl shadow-sm transition-all cursor-pointer ${
              isLoading || (!topic.trim() && photos.length === 0)
                ? 'bg-slate-400 cursor-not-allowed opacity-70'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI Tutor připravuje lekci a grafiku...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Vytvořit personalizovanou lekci</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          {(!topic.trim() && photos.length === 0) && (
            <p className="text-xs text-slate-400 mt-2">Zadej alespoň téma nebo přilož fotku sešitu/učebnice.</p>
          )}
        </div>
      </form>

      {/* Image Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewPhoto.dataUrl}
              alt="Náhled učebnice"
              className="max-h-[80vh] w-auto object-contain mx-auto rounded"
            />
            <p className="text-center text-xs text-slate-600 mt-2 font-medium">{previewPhoto.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};
