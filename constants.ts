import { NoteDuration } from "./types";

// Pitch names in Japanese (Solfege)
export const PITCH_NAMES = [
  "ド (C)", "レ (D)", "ミ (E)", "ファ (F)", "ソ (G)", "ラ (A)", "シ (B)"
];

// Note Durations in Japanese
export const DURATION_NAMES: Record<NoteDuration, string> = {
  'whole': '全音符',
  'half': '2分音符',
  'quarter': '4分音符',
  'eighth': '8分音符',
  'sixteenth': '16分音符',
  'thirty-second': '32分音符'
};

// Symbols for Advanced Level
export const MUSICAL_SYMBOLS = [
  { value: 'ff', type: 'text', answer: 'フォルテッシモ (非常に強く)' },
  { value: 'pp', type: 'text', answer: 'ピアニッシモ (非常に弱く)' },
  { value: 'mf', type: 'text', answer: 'メゾフォルテ (少し強く)' },
  { value: 'mp', type: 'text', answer: 'メゾピアノ (少し弱く)' },
  { value: 'f', type: 'text', answer: 'フォルテ (強く)' },
  { value: 'p', type: 'text', answer: 'ピアノ (弱く)' },
  { value: 'cresc.', type: 'text', answer: 'クレッシェンド (だんだん強く)' },
  { value: 'dim.', type: 'text', answer: 'ディミヌエンド (だんだん弱く)' },
  { value: 'sharp', type: 'shape', answer: 'シャープ (半音上げる)' },
  { value: 'flat', type: 'shape', answer: 'フラット (半音下げる)' },
  { value: 'natural', type: 'shape', answer: 'ナチュラル (元の高さに戻す)' },
  { value: 'fermata', type: 'shape', answer: 'フェルマータ (程よく延ばす)' },
  { value: 'treble_clef', type: 'shape', answer: 'ト音記号 (高音部記号)' },
  { value: 'bass_clef', type: 'shape', answer: 'ヘ音記号 (低音部記号)' },
  { value: 'repeat_start', type: 'shape', answer: '反復記号 (最初に戻る/リピート)' },
  { value: 'tie', type: 'shape', answer: 'タイ (同じ高さの音をつなぐ)' },
  // Rests
  { value: 'whole_rest', type: 'shape', answer: '全休符 (1小節休む)' },
  { value: 'half_rest', type: 'shape', answer: '2分休符 (全音符の半分の長さ休む)' },
  { value: 'quarter_rest', type: 'shape', answer: '4分休符 (1拍休む)' },
  { value: 'eighth_rest', type: 'shape', answer: '8分休符 (半拍休む)' },
];

export const ALL_DURATION_LABELS = Object.values(DURATION_NAMES);

// Helper to shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Staff positioning logic
// Center C (C4) is reference. Treble clef lines are E4, G4, B4, D5, F5.
// We define "steps" relative to C4 = 0.
// D4 = 1, E4 = 2, F4 = 3, G4 = 4, A4 = 5, B4 = 6, C5 = 7.
export const getNoteStepsFromC4 = (pitchName: string, octave: number): number => {
  const noteMap: Record<string, number> = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
  const baseStep = noteMap[pitchName.toUpperCase()];
  const octaveDiff = octave - 4;
  return baseStep + (octaveDiff * 7);
};