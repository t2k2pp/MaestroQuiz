import { Difficulty, Question, QuestionType, NoteDuration, RenderData, ItemStats } from '../types';
import { PITCH_NAMES, DURATION_NAMES, MUSICAL_SYMBOLS, shuffleArray } from '../constants';

// Helper to pick an item, prioritizing weaknesses if adaptive mode is on
const pickWeightedItem = <T>(
  items: T[], 
  getKey: (item: T) => string, 
  stats: Record<string, ItemStats>, 
  isAdaptive: boolean,
  lastAnswer?: string
): T => {
  // Filter out the last answer to prevent immediate repeats
  let pool = items.filter(item => getKey(item) !== lastAnswer);
  
  // Fallback if pool is empty (shouldn't happen with large sets, but safe guard)
  if (pool.length === 0) pool = items;

  if (!isAdaptive) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Create a weighted pool
  const weightedPool: T[] = [];
  
  pool.forEach(item => {
    const key = getKey(item);
    const itemStats = stats[key] || { correct: 0, wrong: 0 };
    // Weight algorithm: Base 1 + (Wrongs * 3). 
    // If you got it wrong 2 times, it appears 7 times in the pool.
    // If you got it correct a lot, we reduce chance slightly, but keep at least 1.
    
    // Simple approach: Add (Wrong^2 + 1) copies.
    const weight = (itemStats.wrong * 2) + 1;
    for (let i = 0; i < weight; i++) {
      weightedPool.push(item);
    }
  });

  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
};

const generatePitchQuestion = (difficulty: Difficulty, index: number, stats: Record<string, ItemStats>, isAdaptive: boolean, lastAnswer?: string): Question => {
  let clef: 'treble' | 'bass' = 'treble';
  let minOctave = 4, maxOctave = 5;

  if (difficulty === 'beginner') {
    clef = 'treble';
    minOctave = 4;
    maxOctave = 5;
  } else {
    clef = Math.random() > 0.5 ? 'bass' : 'treble';
    if (clef === 'treble') {
       minOctave = 4; maxOctave = 5;
    } else {
       minOctave = 2; maxOctave = 3;
    }
  }

  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // Create all possible note combinations for this setting to pick from
  const candidates: {note: string, octave: number}[] = [];
  for (let o = minOctave; o <= maxOctave; o++) {
    for (const n of notes) {
        if (difficulty === 'beginner') {
            if (o === 5 && n !== 'C') continue;
            if (o === 4 && n === 'C' && Math.random() > 0.1) continue; // Small bias to avoid too many Middle Cs if random
        }
        candidates.push({ note: n, octave: o });
    }
  }

  // Pick one using weighted logic
  const selection = pickWeightedItem(
    candidates, 
    (c) => PITCH_NAMES[notes.indexOf(c.note)], // Key is the Answer Text
    stats, 
    isAdaptive,
    lastAnswer
  );

  const noteName = selection.note;
  const octave = selection.octave;

  const pitchIndex = notes.indexOf(noteName);
  const correctAnswer = PITCH_NAMES[pitchIndex];

  // Distractors
  const distractors = PITCH_NAMES.filter(n => n !== correctAnswer);
  const selectedDistractors = shuffleArray(distractors).slice(0, 5); 
  const options = shuffleArray([correctAnswer, ...selectedDistractors]);

  let duration: NoteDuration = 'whole';
  if (difficulty === 'advanced') {
    const durations: NoteDuration[] = ['whole', 'half', 'quarter', 'eighth'];
    duration = durations[Math.floor(Math.random() * durations.length)];
  }

  return {
    id: `q-${index}`,
    type: QuestionType.PITCH,
    questionText: `この音符の音階は？ (${clef === 'treble' ? 'ト音記号' : 'ヘ音記号'})`,
    renderData: {
      clef: clef,
      note: {
        pitch: `${noteName}${octave}`,
        duration: duration
      }
    },
    options,
    correctAnswer
  };
};

const generateDurationQuestion = (index: number, stats: Record<string, ItemStats>, isAdaptive: boolean, lastAnswer?: string): Question => {
  const durations: NoteDuration[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty-second'];
  
  const targetDuration = pickWeightedItem(
    durations,
    (d) => DURATION_NAMES[d],
    stats,
    isAdaptive,
    lastAnswer
  );
  
  const correctAnswer = DURATION_NAMES[targetDuration];
  
  const allOptions = Object.values(DURATION_NAMES);
  const distractors = allOptions.filter(d => d !== correctAnswer);
  const selectedDistractors = shuffleArray(distractors).slice(0, 5);
  const options = shuffleArray([correctAnswer, ...selectedDistractors]);

  return {
    id: `q-${index}`,
    type: QuestionType.DURATION,
    questionText: 'この音符の種類は？',
    renderData: {
      clef: 'treble',
      note: {
        pitch: 'B4', 
        duration: targetDuration
      }
    },
    options,
    correctAnswer
  };
};

const generateSymbolQuestion = (index: number, stats: Record<string, ItemStats>, isAdaptive: boolean, lastAnswer?: string): Question => {
  const targetSymbol = pickWeightedItem(
    MUSICAL_SYMBOLS,
    (s) => s.answer,
    stats,
    isAdaptive,
    lastAnswer
  );
  
  const correctAnswer = targetSymbol.answer;
  
  const allAnswers = MUSICAL_SYMBOLS.map(s => s.answer);
  const distractors = allAnswers.filter(a => a !== correctAnswer);
  const selectedDistractors = shuffleArray(distractors).slice(0, 5);
  const options = shuffleArray([correctAnswer, ...selectedDistractors]);

  return {
    id: `q-${index}`,
    type: QuestionType.SYMBOL,
    questionText: 'この記号の意味は？',
    renderData: {
      symbol: {
        type: targetSymbol.type as 'text' | 'shape',
        value: targetSymbol.value
      }
    },
    options,
    correctAnswer
  };
};

export const generateQuiz = (difficulty: Difficulty, isAdaptive: boolean, stats: Record<string, ItemStats>): Question[] => {
  const questions: Question[] = [];
  let lastAnswer: string | undefined = undefined;
  
  for (let i = 0; i < 10; i++) {
    let q: Question;
    if (difficulty === 'beginner' || difficulty === 'intermediate') {
      q = generatePitchQuestion(difficulty, i, stats, isAdaptive, lastAnswer);
    } else {
      const roll = Math.random();
      if (roll < 0.4) {
        q = generatePitchQuestion('advanced', i, stats, isAdaptive, lastAnswer);
      } else if (roll < 0.7) {
        q = generateDurationQuestion(i, stats, isAdaptive, lastAnswer);
      } else {
        q = generateSymbolQuestion(i, stats, isAdaptive, lastAnswer);
      }
    }
    questions.push(q);
    lastAnswer = q.correctAnswer;
  }
  
  return questions;
};