import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Allow large payloads for base64 photo uploads from textbooks
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Safe JSON parsing helper to protect against optional markdown codeblocks
function safeParseJson<T = any>(text: string): T {
  let cleaned = (text || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned || '{}');
}

// Helper to determine grade description from age
function getGradeLevelDescription(age: number): string {
  if (age <= 9) return `${age} let (1. stupeň ZŠ, cca 1.–3. třída)`;
  if (age <= 12) return `${age} let (4.–6. třída ZŠ, mladší školní věk)`;
  if (age <= 15) return `${age} let (2. stupeň ZŠ, 7.–9. třída, starší školní věk)`;
  if (age <= 19) return `${age} let (Střední škola / gymnázium)`;
  return `${age} let (Student SŠ/VŠ / dospělý)`;
}

// 1. Generate Lesson Endpoint
app.post('/api/generate-lesson', async (req, res) => {
  try {
    const { profile, topic, photos, selfConfidence } = req.body;

    if (!topic && (!photos || photos.length === 0)) {
      return res.status(400).json({ error: 'Je nutné zadat téma nebo přiložit fotografie učebnice/sešitu.' });
    }

    const gradeDesc = getGradeLevelDescription(profile?.age || 13);
    const interestsStr = [
      ...(profile?.interests || []),
      profile?.customInterests || ''
    ].filter(Boolean).join(', ') || 'hry, technologie, sport';

    const formatDesc = {
      bullets: 'Stručné odrážky a hesla (TL;DR formát) s tučně zvýrazněnými klíčovými pojmy pro žáky s rychlejší pozorností.',
      story: 'Příběh a příklady z praxe s narativním vysvětlením širších souvislostí a reálného dopadu.',
      step_by_step: 'Postupné krokování od úplných základů (očíslované kroky 1, 2, 3... logická návaznost bez přeskakování).'
    }[profile?.formatPreference as 'bullets' | 'story' | 'step_by_step'] || 'Stručné odrážky s tučným zvýrazněním';

    const toneDesc = profile?.communicationTone === 'strict'
      ? 'Věcně, přísně a přímo k věci (akademický, přímý, efektivní, bez zbytečných zdrobnělin či zdlouhavého povzbuzování).'
      : 'Podpůrně, s humorem a trpělivě (laskavý, povzbuzující, kamarádský, používá vtipná přirovnání a trpělivě buduje sebedůvěru).';

    const confidenceDesc = {
      1: '1/5 (Vůbec nechápu): Začni od naprosté nuly! Eliminuj jakýkoliv zbytečný odborný slang, použij maximálně srozumitelná intuitivní přirovnání a buduj elementární jistotu.',
      2: '2/5 (Mám v tom zmatek): Základní povědomí, ale potřebuje ujasnit klíčové pojmy, rozplést zmatky a ukázat jasnou analogii.',
      3: '3/5 (Něco vím, ale nejsem si jistý): Střední úroveň, potřebuje propojit teorii s praxí a upevnit pravidla.',
      4: '4/5 (Docela mi to jde): Pokročilejší úroveň, rychle projdi základ a zaměř se na zajímavé souvislosti a praktické aplikace.',
      5: '5/5 (Zvládám s přehledem): Přeskoč banální základy! Jdi přímo k pokročilým nuancím, chytákům, mezioborovým vazbám a výzvám.'
    }[selfConfidence as 1 | 2 | 3 | 4 | 5] || '3/5 (Střední úroveň)';

    const promptText = `
Jsi špičkový didaktický AI Tutor pro české žáky a studenty.
Tvým úkolem je vytvořit personalizovanou učební lekci na míru tomuto žákovi.

PROFIL ŽÁKA:
- Věk a úroveň: ${gradeDesc}
- Zájmy a koníčky: ${interestsStr}
- Preferovaný formát: ${formatDesc}
- Požadovaný tón: ${toneDesc}
- Sebehodnocení znalostí tématu: ${confidenceDesc}

TÉMA / ZADÁNÍ:
"${topic || 'Téma z přiložených fotografií sešitu/učebnice'}"

POKYNY K PŘILOŽENÝM FOTOGRAFIÍM:
${photos && photos.length > 0
  ? `Žák přiložil ${photos.length} fotografii/í své učebnice nebo sešitu. PŘEDNOSTNĚ pracuj s textem, definicemi, vzorci a příklady zachycenými na těchto fotografiích! Zachovej terminologii a kontext jeho učebnice.`
  : `Žák zadal téma heslovitě bez fotografií. Vygeneruj obsah na základě svého didaktického uvážení a profilu žáka.`
}

ZÁSADNÍ DIDAKTICKÉ POŽADAVKY:
1. DIDAKTICKÁ TRANSFORMACE PŘES ZÁJMY: Zásadní prvek! Aplikuj látku a abstraktní teorii na osobní zájmy žáka (${interestsStr}). Vytvoř nosnou metaforu či analogii (např. Minecraft crafting, herní pravidla Zelda/Roblox, fotbalová taktika, chování zvířat, vesmírné mise apod.).
2. PŘIZPŮSOBENÍ FORMÁTU: Formátuj textový obsah přesně podle požadovaného stylu (${profile?.formatPreference}):
   - Pokud odrážky (bullets): Vytvoř moderní TL;DR strukturu s tučně zvýrazněnými klíčovými pojmy.
   - Pokud příběh (story): Vytvoř pohlcující vyprávění s příklady z reálného života.
   - Pokud krokování (step_by_step): Očísluj jednotlivé logické kroky od základů až po výsledek.
3. ANIMACE ČI GRAFIKA (svgMarkup):
   Vytvoř čisté, validní a responzivní SVG schéma/infografiku (viewBox="0 0 800 450") s moderní grafikou, barevnou paletou (např. indigo, emerald, amber, slate), popiskami v češtině a jemnými SVG animacemi (např. <animate> atributy pro toky, pulzy nebo šipky). Schéma musí vizuálně znázorňovat princip probíraného tématu v kontextu vytvořené metafory/analogie. ŽÁDNÉ externí skripty.
4. AUDIO SKRIPT (audioScript):
   Připrav přirozený text pro poslech (cca 1,5 až 2 minuty mluveného slova v češtině), který látku vysvětluje mluvenou formou v požadovaném tónu.
5. KLÍČOVÉ BODY (keyPoints):
   3 až 5 hlavních bodů ("Co si z toho odnést").
6. NÁVRHY DOTAZŮ (suggestedQuestions):
   3 návodné otázky, které by žáka mohly zajímat pro další prohloubení.

Vrať validní JSON odpovídající požadovanému schématu.
`;

    // Prepare contents with multimodal parts if photos are provided
    const contents: any[] = [];
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (const p of photos) {
        if (p.dataUrl) {
          const match = p.dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (match) {
            contents.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        }
      }
    }
    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents.length === 1 ? contents[0].text : { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Chytlavý název lekce' },
            topic: { type: Type.STRING, description: 'Probírané téma' },
            pedagogicalLevel: { type: Type.STRING, description: 'Cílová úroveň / ročník a didaktický přístup' },
            metaphorExplanation: { type: Type.STRING, description: 'Popis použité metafory a analogie k zájmům žáka' },
            visualConcept: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                analogyTitle: { type: Type.STRING },
                svgMarkup: { type: Type.STRING, description: 'Validní SVG kód s viewBox="0 0 800 450"' },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ['title', 'description'],
                  },
                },
              },
              required: ['title', 'subtitle', 'analogyTitle', 'svgMarkup', 'steps'],
            },
            formattedSummary: { type: Type.STRING, description: 'Textové shrnutí formátované v Markdownu dle preferencí' },
            audioScript: { type: Type.STRING, description: 'Plynulý skript pro mluvené slovo' },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 až 5 klíčových bodů'
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 tipy na doplňující otázky'
            },
          },
          required: [
            'title',
            'topic',
            'pedagogicalLevel',
            'metaphorExplanation',
            'visualConcept',
            'formattedSummary',
            'audioScript',
            'keyPoints',
            'suggestedQuestions',
          ],
        },
      },
    });

    const parsed = safeParseJson(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/generate-lesson:', error);
    return res.status(500).json({ error: error.message || 'Nepodařilo se vygenerovat lekci.' });
  }
});

// 2. Audio TTS Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, tone } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text pro syntézu řeči je povinný.' });
    }

    // Limit text length to prevent timeouts
    const clipped = text.slice(0, 750);
    const voiceStyle = tone === 'strict' ? 'Direct, clear, pedagogical tutor voice' : 'Warm, friendly, encouraging tutor voice';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: clipped,
              speechMetadata: {
                style: voiceStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } else {
      return res.status(500).json({ error: 'Model nevrátil audio data.' });
    }
  } catch (error: any) {
    console.error('Error in /api/tts:', error);
    // Return gracefully so client can fallback to browser SpeechSynthesis
    return res.status(500).json({ error: error.message || 'Chyba při syntéze hlasu.' });
  }
});

// 3. Tutor Chat (Follow-up Q&A)
app.post('/api/tutor-chat', async (req, res) => {
  try {
    const { profile, topic, lessonSummary, chatHistory, question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Chybí dotaz žáka.' });
    }

    const gradeDesc = getGradeLevelDescription(profile?.age || 13);
    const interestsStr = [
      ...(profile?.interests || []),
      profile?.customInterests || ''
    ].filter(Boolean).join(', ') || 'hry a sport';

    const toneInstruction = profile?.communicationTone === 'strict'
      ? 'Odpovídej věcně, přísně, přesně a bez zbytečné omáčky. Jdi přímo k podstatě věci.'
      : 'Odpovídej podpůrně, s humorem, trpělivě a s povzbuzením. Klidně použij vtipnou analogii.';

    const systemPrompt = `
Jsi osobní AI Tutor pro žáka:
- Věk / úroveň: ${gradeDesc}
- Zájmy žáka: ${interestsStr}
- Styl odpovědí: ${toneInstruction}
- Aktuálně probírané téma: "${topic}"

Pravidla pro odpověď:
1. Odpověď musí být STRUČNÁ (cca 2–4 odstavce nebo krátké odrážky), jasná a přímo k položenému dotazu.
2. Pokud je to užitečné, propoj vysvětlení s jeho zájmy (${interestsStr}).
3. Piš přirozenou češtinou odpovídající věku žáka.
4. Na konci můžeš položit jednu rychlou otázku k ověření, zda žák odpověď pochopil.
`;

    const conversationContext = (chatHistory || [])
      .map((m: any) => `${m.sender === 'user' ? 'Žák' : 'Tutor'}: ${m.text}`)
      .join('\n');

    const prompt = `
Kontext probírané látky:
${lessonSummary ? lessonSummary.slice(0, 600) : topic}

Dosavadní konverzace:
${conversationContext}

Nový dotaz žáka:
"${question}"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return res.json({ reply: response.text || 'Omlouvám se, na tuto otázku se mi nepodařilo zformulovat odpověď.' });
  } catch (error: any) {
    console.error('Error in /api/tutor-chat:', error);
    return res.status(500).json({ error: error.message || 'Chyba při zpracování dotazu.' });
  }
});

// 4. Generate Comprehensive 12-Question Test
app.post('/api/generate-test', async (req, res) => {
  try {
    const { profile, topic, lessonSummary, selfConfidence } = req.body;

    const gradeDesc = getGradeLevelDescription(profile?.age || 13);
    const interestsStr = [
      ...(profile?.interests || []),
      profile?.customInterests || ''
    ].filter(Boolean).join(', ') || 'hry, sport';

    const testPrompt = `
Jsi didaktický expert a tvůrce testů pro české žáky a studenty.
Vytvoř komplexní test s PŘESNĚ 12 otázkami k tématu: "${topic}".

PROFIL ŽÁKA:
- Věk / úroveň: ${gradeDesc}
- Zájmy pro praktické situace v testu: ${interestsStr}
- Sebehodnocení žáka: ${selfConfidence}/5 (přizpůsob náročnost a vyvaruj se zbytečného matení, ale prozkoušej jak teorii, tak praktické situace).

PŘESNÉ POŽADAVKY NA STRUKTURU TESTU (PŘESNĚ 12 OTÁZEK):
1. OTÁZKY 1 AŽ 4 (přesně 4 otázky typu ABCD):
   - Klasický výběr ze 4 možností (A, B, C, D), právě jedna je správná.
   - Otázky kombinují teoretickou definici i aplikaci v simulované situaci (propojené se zájmy žáka).
   - KRITICKY DŮLEŽITÉ: Pro KAŽDOU možnost (A, B, C, D) musíš definovat podrobné vysvětlení!
     Pokud žák zvolí špatnou možnost, musíme mu vysvětlit, proč je špatně A CO TEN ŠPATNÝ TERMÍN VE SKUTEČNOSTI ZNAMENÁ!

2. OTÁZKY 5 AŽ 8 (přesně 4 otázky typu MATCHING - přiřazovací):
   - Každá otázka obsahuje 4 cílové definice / situace.
   - Nabízí se PŘESNĚ 5 termínů k přiřazení (1 termín je NAVÍC jako chyták/distractor pro vyšší obtížnost!).
   - Musíš uvést správné přiřazení pro 4 definice a navíc vysvětlit, proč distractor nikam nepatří a co ve skutečnosti znamená.
   - Uveď vysvětlení pro všechny termíny.

3. OTÁZKY 9 AŽ 12 (přesně 4 otázky zvolené AI na základě vhodnosti):
   - Vyber nejvhodnější formát pro dané téma:
     * true_false (Tvrzení Ano/Ne s odůvodněním)
     * short_answer (Doplnění klíčového pojmu nebo čísla)
     * scenario_choice (Řešení praktické simulované situace ze života nebo her žáka)
     * fill_in_blank (Doplnění chybějícího slova ve větě/vzorci)
   - Pro každou z těchto otázek uveď správnou odpověď, vysvětlení správnosti i podrobné vysvětlení nejčastější chyby a co znamenají chybné pojmy.

Vrať výsledek jako validní JSON s polem "questions" obsahujícím přesně 12 objektů očíslovaných 1 až 12.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: testPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              description: 'Seznam přesně 12 otázek',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  number: { type: Type.INTEGER, description: 'Číslo otázky 1 až 12' },
                  type: { type: Type.STRING, enum: ['abcd', 'matching', 'custom'] },
                  subType: { type: Type.STRING, description: 'Pro custom: true_false, short_answer, scenario_choice, fill_in_blank' },
                  question: { type: Type.STRING, description: 'Znění otázky nebo zadání' },
                  contextScenario: { type: Type.STRING, description: 'Volitelný kontext nebo simulovaná situace' },
                  // Pro ABCD
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                      required: ['key', 'text'],
                    },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanationCorrect: { type: Type.STRING, description: 'Vysvětlení, proč je správná odpověď správná' },
                  explanationsWrong: {
                    type: Type.OBJECT,
                    description: 'Vysvětlení a definice pro chybné možnosti A, B, C, D',
                    properties: {
                      A: { type: Type.STRING },
                      B: { type: Type.STRING },
                      C: { type: Type.STRING },
                      D: { type: Type.STRING },
                    },
                  },
                  // Pro MATCHING
                  instructions: { type: Type.STRING },
                  definitions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        definition: { type: Type.STRING },
                        correctTermId: { type: Type.STRING },
                      },
                      required: ['id', 'definition', 'correctTermId'],
                    },
                  },
                  terms: {
                    type: Type.ARRAY,
                    description: '5 termínů (4 správné + 1 distractor navíc)',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                      required: ['id', 'text'],
                    },
                  },
                  distractorTermId: { type: Type.STRING, description: 'ID termínu, který je navíc a k žádné definici nepatří' },
                  distractorExplanation: { type: Type.STRING, description: 'Vysvětlení, co je distractor zač a co znamená' },
                  // Pro CUSTOM
                  acceptableAnswers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  explanationWrongCommon: { type: Type.STRING },
                },
                required: ['id', 'number', 'type', 'question', 'correctAnswer', 'explanationCorrect'],
              },
            },
          },
          required: ['topic', 'questions'],
        },
      },
    });

    const parsed = safeParseJson(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/generate-test:', error);
    return res.status(500).json({ error: error.message || 'Chyba při generování testu.' });
  }
});

// 5. Final Takeaway Summary
app.post('/api/final-summary', async (req, res) => {
  try {
    const { profile, topic, score, totalQuestions, wrongQuestions } = req.body;

    const tonePrompt = profile?.communicationTone === 'strict'
      ? 'Věcné, přesné, bez patosu a přehnaného chválení.'
      : 'Povzbuzující, přátelské, vřelé s humorem a motivací do dalšího učení.';

    const prompt = `
Žák právě dokončil 12otázkový test k tématu "${topic}".
Dosáhl skóre: ${score} z ${totalQuestions}.
Věk žáka: ${profile?.age || 13} let.
Tón komunikace: ${tonePrompt}

Úkoly:
1. Napiš shrnutí celého probíraného učiva v několika úderných větách (cca 3–5 vět) – to nejdůležitější, co by si měl žák navždy pamatovat ("Takeaway memo").
2. Napiš krátké osobní zhodnocení výkonu v požadovaném tónu. Pokud udělal chyby v některých oblastech (${JSON.stringify(wrongQuestions || [])}), stručně mu připomeň, na co si dát v praxi pozor.

Vrať JSON se dvěma položkami: "coreTakeaway" a "feedbackMessage".
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coreTakeaway: { type: Type.STRING, description: 'Klíčové shrnutí celého učiva v několika větách' },
            feedbackMessage: { type: Type.STRING, description: 'Osobní zpětná vazba a povzbuzení' },
          },
          required: ['coreTakeaway', 'feedbackMessage'],
        },
      },
    });

    const parsed = safeParseJson(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/final-summary:', error);
    return res.status(500).json({ error: error.message || 'Chyba při generování závěrečného shrnutí.' });
  }
});

// Vite Middleware or Production Static
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EduMentor AI server listening on http://0.0.0.0:${PORT}`);
});
