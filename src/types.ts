export type PreferredFormat = 'bullets' | 'story' | 'step_by_step';
export type CommunicationTone = 'strict' | 'supportive';

export interface StudentProfile {
  age: number;
  gradeLevel: string;
  interests: string[];
  customInterests: string;
  formatPreference: PreferredFormat;
  communicationTone: CommunicationTone;
}

export interface AttachedPhoto {
  id: string;
  dataUrl: string; // base64 data url
  mimeType: string;
  name: string;
}

export interface TopicSessionInput {
  topic: string;
  photos: AttachedPhoto[];
  selfConfidence: number; // 1 to 5
}

export interface VisualConceptStep {
  title: string;
  description: string;
  elementId?: string;
}

export interface VisualConcept {
  title: string;
  subtitle: string;
  analogyTitle: string;
  svgMarkup: string;
  steps: VisualConceptStep[];
}

export interface LessonData {
  title: string;
  topic: string;
  pedagogicalLevel: string;
  metaphorExplanation: string;
  visualConcept: VisualConcept;
  formattedSummary: string; // Markdown formatted summary
  audioScript: string;
  keyPoints: string[];
  suggestedQuestions: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

export type QuestionType = 'abcd' | 'matching' | 'custom';

export interface ABCDQuestion {
  id: string;
  number: number;
  type: 'abcd';
  question: string;
  contextScenario?: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanationCorrect: string;
  explanationsWrong: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

export interface MatchingPair {
  definitionId: string;
  definition: string;
  correctTermId: string;
}

export interface MatchingTerm {
  id: string;
  text: string;
}

export interface MatchingQuestion {
  id: string;
  number: number;
  type: 'matching';
  question: string;
  contextScenario?: string;
  instructions: string;
  definitions: {
    id: string;
    definition: string;
    correctTermId: string;
  }[];
  terms: MatchingTerm[]; // 5 terms: 4 match the definitions, 1 is a distractor
  distractorTermId: string;
  distractorExplanation: string;
  termExplanations: Record<string, string>; // Explanation for each term
}

export interface CustomQuestion {
  id: string;
  number: number;
  type: 'custom';
  subType: 'true_false' | 'short_answer' | 'fill_in_blank' | 'scenario_choice';
  question: string;
  contextScenario?: string;
  options?: { key: string; text: string }[]; // For true_false or scenario_choice
  correctAnswer: string;
  acceptableAnswers?: string[];
  explanationCorrect: string;
  explanationWrongCommon: string;
  keyTermDefinitions?: Record<string, string>;
}

export type TestQuestion = ABCDQuestion | MatchingQuestion | CustomQuestion;

export interface TestEvaluationResult {
  isCorrect: boolean;
  score: number; // 0 to 1
  studentAnswer: any;
  feedback: string;
  wrongTermExplanation?: string;
}

export interface TestSession {
  questions: TestQuestion[];
  answers: Record<string, any>;
  evaluations: Record<string, TestEvaluationResult>;
  completed: boolean;
  finalSummary?: string;
  score?: number;
  totalQuestions: number;
}
