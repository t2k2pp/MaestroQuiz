export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export enum QuestionType {
  PITCH = 'PITCH',
  DURATION = 'DURATION',
  SYMBOL = 'SYMBOL'
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  renderData: RenderData;
  options: string[]; // 6 options
  correctAnswer: string;
}

// Data needed to render the staff or symbol
export interface RenderData {
  clef?: 'treble' | 'bass'; // Clef for the staff
  // For PITCH and DURATION
  note?: {
    pitch: string; // e.g., "C4", "A5"
    duration: NoteDuration;
    hasSharp?: boolean;
    hasFlat?: boolean;
    hasNatural?: boolean;
  };
  // For SYMBOL
  symbol?: {
    type: 'text' | 'shape';
    value: string; // "ff", "cresc.", or shape identifier
    label?: string; // Internal label for debugging
  };
}

export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirty-second';

export interface ItemStats {
  correct: number;
  wrong: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  correct: number;
  total: number;
}

export interface UserStorageData {
  items: Record<string, ItemStats>; // For adaptive learning
  daily: Record<string, DailyStats>; // Keyed by date string
}

// Legacy type alias if needed, or mapped
export type UserStats = Record<string, ItemStats>;

export interface GameState {
  status: 'menu' | 'playing' | 'result' | 'reference' | 'stats';
  difficulty: Difficulty;
  currentQuestionIndex: number;
  score: number;
  questions: Question[];
  history: {
    question: Question;
    userAnswer: string;
    isCorrect: boolean;
  }[];
  // Settings
  isSoundEnabled: boolean;
  selectedVoiceURI: string | null;
  isAdaptiveMode: boolean;
}