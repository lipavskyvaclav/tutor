import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Send, 
  ArrowRight, 
  Bot, 
  User as UserIcon, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Lightbulb, 
  VolumeX,
  Volume1
} from 'lucide-react';
import { StudentProfile, LessonData, ChatMessage } from '../types';

interface LessonViewProps {
  profile: StudentProfile;
  lesson: LessonData;
  onStartTest: () => void;
  isGeneratingTest: boolean;
}

export const LessonView: React.FC<LessonViewProps> = ({
  profile,
  lesson,
  onStartTest,
  isGeneratingTest,
}) => {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioSourceType, setAudioSourceType] = useState<'gemini' | 'browser' | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Visual diagram active step
  const [activeVisualStep, setActiveVisualStep] = useState<number>(0);

  // Follow-up Q&A Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize audio when lesson changes
  useEffect(() => {
    // Stop any existing audio or speech synthesis
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioCurrentTime(0);

    // Fetch audio from backend TTS
    fetchAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [lesson]);

  const fetchAudio = async () => {
    setIsLoadingAudio(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lesson.audioScript || lesson.formattedSummary,
          tone: profile.communicationTone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          setAudioSourceType('gemini');

          audio.onloadedmetadata = () => {
            setAudioDuration(audio.duration || 60);
          };

          audio.ontimeupdate = () => {
            if (audio.duration) {
              setAudioCurrentTime(audio.currentTime);
              setAudioProgress((audio.currentTime / audio.duration) * 100);
            }
          };

          audio.onended = () => {
            setIsPlaying(false);
            setAudioProgress(100);
          };
          setIsLoadingAudio(false);
          return;
        }
      }
      // If server TTS fails or is unavailable, we use browser TTS
      setAudioSourceType('browser');
      setAudioDuration(45);
    } catch (e) {
      console.warn('Fallback to browser speech synthesis:', e);
      setAudioSourceType('browser');
      setAudioDuration(45);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const togglePlayAudio = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Playback error, using browser speech fallback', err);
          playWithBrowserSpeech();
        });
      } else {
        playWithBrowserSpeech();
      }
    }
  };

  const playWithBrowserSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Váš prohlížeč nepodporuje syntézu řeči.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lesson.audioScript || lesson.formattedSummary);
    utterance.lang = 'cs-CZ';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setAudioSourceType('browser');
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setAudioProgress(100);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      playWithBrowserSpeech();
    }
  };

  const handleSendQuestion = async (textToSend?: string) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q || isSendingQuestion) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: q,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsSendingQuestion(true);

    try {
      const res = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          topic: lesson.topic,
          lessonSummary: lesson.formattedSummary,
          chatHistory: [...chatMessages, userMsg],
          question: q,
        }),
      });

      const data = await res.json();
      const tutorMsg: ChatMessage = {
        id: `msg-${Date.now()}-t`,
        sender: 'tutor',
        text: data.reply || 'Zde je vysvětlení k tvé otázce...',
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, tutorMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'tutor',
        text: 'Omlouvám se, nepodařilo se mi spojit se serverem. Zkus otázku položit znovu.',
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSendingQuestion(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Banner: Pedagogical transformation summary */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-xs text-indigo-200 border border-white/10">
              {lesson.pedagogicalLevel || `${profile.age} let`}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Didaktická transformace
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            {lesson.title}
          </h1>

          {/* Metaphor pill */}
          <div className="mt-3 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              <strong className="text-amber-200">Analogie ze tvého světa: </strong>
              {lesson.metaphorExplanation}
            </div>
          </div>
        </div>
      </div>

      {/* 1. ANIMACE ČI GRAFIKA VYSVĚTLUJÍCÍ PRINCIPY */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Vizuální vysvětlení</span>
              <span className="text-[11px] font-medium text-slate-400">· Animovaný model</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {lesson.visualConcept?.title || 'Animované schéma principu'}
            </h2>
            <p className="text-xs text-slate-500">
              {lesson.visualConcept?.analogyTitle || 'Vizuální znázornění procesu'}
            </p>
          </div>

          {/* Step tabs if available */}
          {lesson.visualConcept?.steps && lesson.visualConcept.steps.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {lesson.visualConcept.steps.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveVisualStep(idx)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    activeVisualStep === idx
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fáze {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SVG Container */}
        <div className="rounded-xl border border-slate-200 bg-slate-950/95 overflow-hidden flex items-center justify-center p-2 min-h-[300px] max-h-[500px]">
          <div 
            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[460px] [&>svg]:rounded-lg"
            dangerouslySetInnerHTML={{ __html: lesson.visualConcept?.svgMarkup || '<div class="text-white text-xs p-8">Schéma se generuje...</div>' }}
          />
        </div>

        {/* Active step explanation note */}
        {lesson.visualConcept?.steps && lesson.visualConcept.steps[activeVisualStep] && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
              {activeVisualStep + 1}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {lesson.visualConcept.steps[activeVisualStep].title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {lesson.visualConcept.steps[activeVisualStep].description}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 2. AUDIO PŘEHRÁVAČ PRO POSLECH */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayAudio}
              disabled={isLoadingAudio}
              className="w-12 h-12 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer"
              title={isPlaying ? 'Pozastavit poslech' : 'Přehrát mluvené vysvětlení'}
            >
              {isLoadingAudio ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Audio formát pro poslech
                </span>
                {audioSourceType === 'gemini' && (
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-300/30">
                    Gemini TTS hlas
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-white">Poslechni si shrnutí látky</h3>
              <p className="text-xs text-indigo-100">
                Přirozené mluvené slovo přizpůsobené tvému věku a tónu asistenta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={restartAudio}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Přehrát od začátku"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-2 border-t border-white/15">
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-200"
              style={{ width: `${audioProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-indigo-200 mt-1 font-mono">
            <span>{formatTime(audioCurrentTime)}</span>
            <span>{formatTime(audioDuration || 60)}</span>
          </div>
        </div>
      </section>

      {/* 3. TEXTOVÉ SHRNUTÍ S KLÍČOVÝMI BODY (DLE PREFEROVANÉHO FORMÁTU) */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              {profile.formatPreference === 'bullets' && 'Struktura: Odrážky a klíčová slova (TL;DR)'}
              {profile.formatPreference === 'story' && 'Struktura: Příběh a příklady ze života'}
              {profile.formatPreference === 'step_by_step' && 'Struktura: Postupné krokování od základů'}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">Výklad a zápis do sešitu</h2>
          </div>
        </div>

        {/* Markdown-style Formatted Text */}
        <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal space-y-3">
          {lesson.formattedSummary}
        </div>

        {/* Key Takeaways Box (Klíčové body) */}
        {lesson.keyPoints && lesson.keyPoints.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                💡
              </div>
              <h3 className="font-bold text-sm text-amber-950 uppercase tracking-wider">
                To nejdůležitější v kostce (Klíčové body):
              </h3>
            </div>
            <ul className="space-y-2">
              {lesson.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 4. POLE PRO DALŠÍ DOTAZY NEBO DOVYSVĚTLENÍ (Q&A CHAT) */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Máš k tomu další otázku?</h3>
              <p className="text-xs text-slate-500">
                AI ti odpoví stručně a přesně na míru tvému dotazníku.
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Quick Questions */}
        {lesson.suggestedQuestions && lesson.suggestedQuestions.length > 0 && (
          <div className="mb-4">
            <span className="text-xs text-slate-400 block mb-2 font-medium">Tipy na otázky:</span>
            <div className="flex flex-wrap gap-2">
              {lesson.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuestion(q)}
                  disabled={isSendingQuestion}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 hover:border-indigo-200 transition-all text-left"
                >
                  💬 {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat History */}
        {chatMessages.length > 0 && (
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'tutor' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isSendingQuestion && (
              <div className="flex gap-2.5 items-center text-xs text-slate-500 italic">
                <Bot className="w-4 h-4 text-indigo-600 animate-bounce" />
                <span>AI Tutor formuluje stručnou odpověď...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuestion();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Napiš svou otázku k tématu, např. 'Proč je to důležité?'..."
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
            disabled={isSendingQuestion}
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isSendingQuestion}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              !inputQuestion.trim() || isSendingQuestion
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
            }`}
          >
            <span>Odeslat</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>

      {/* 5. PŘEJÍT K TESTU (12 OTÁZEK) */}
      <div className="pt-2 text-center">
        <button
          onClick={onStartTest}
          disabled={isGeneratingTest}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base sm:text-lg rounded-2xl shadow-md transition-all cursor-pointer ${
            isGeneratingTest ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isGeneratingTest ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sestavuji 12otázkový test na míru...</span>
            </>
          ) : (
            <>
              <span>Přejít k procvičovacímu testu (12 otázek)</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-xs text-slate-500 mt-2">
          Test kombinuje 4× ABCD, 4× přiřazování s chytákem a 4× simulované situace.
        </p>
      </div>
    </div>
  );
};
