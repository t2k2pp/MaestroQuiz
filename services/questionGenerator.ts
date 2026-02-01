import { Difficulty, Question, QuestionType, NoteDuration, RenderData, ItemStats } from '../types';
import { PITCH_NAMES, DURATION_NAMES, MUSICAL_SYMBOLS, shuffleArray } from '../constants';

// Helper to pick weighted items
const pickWeightedItem = <T>(
  items: T[], 
  getKey: (item: T) => string, 
  stats: Record<string, ItemStats>, 
  isAdaptive: boolean,
  lastAnswer?: string
): T => {
  let pool = items.filter(item => getKey(item) !== lastAnswer);
  if (pool.length === 0) pool = items;

  if (!isAdaptive) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const weightedPool: T[] = [];
  pool.forEach(item => {
    const key = getKey(item);
    const itemStats = stats[key] || { correct: 0, wrong: 0 };
    const weight = (itemStats.wrong * 2) + 1;
    for (let i = 0; i < weight; i++) {
      weightedPool.push(item);
    }
  });

  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
};

const createNoteQuestion = (
  index: number,
  clef: 'treble' | 'bass',
  notes: string[], // e.g. ['C', 'D'...]
  minOctave: number,
  maxOctave: number,
  allowedDurations: NoteDuration[],
  stats: Record<string, ItemStats>,
  isAdaptive: boolean,
  lastAnswer?: string,
  isDurationQuestion: boolean = false
): Question => {
  
  // 1. Select Duration
  const duration = allowedDurations[Math.floor(Math.random() * allowedDurations.length)];

  // 2. Select Pitch
  const noteName = notes[Math.floor(Math.random() * notes.length)];
  let octave = Math.floor(Math.random() * (maxOctave - minOctave + 1)) + minOctave;

  // Adjust for edges
  if (octave === maxOctave && noteName !== 'C' && Math.random() > 0.5) {
      octave = maxOctave - 1; // avoid going too high if list is partial
  }

  const pitch = `${noteName}${octave}`;
  
  // 3. Form Question
  if (isDurationQuestion) {
      const correctAnswer = DURATION_NAMES[duration];
      const distractors = Object.values(DURATION_NAMES).filter(d => d !== correctAnswer);
      const options = shuffleArray([correctAnswer, ...shuffleArray(distractors).slice(0, 5)]);

      return {
        id: `q-${index}`,
        type: QuestionType.DURATION,
        questionText: 'この音符の種類（長さ）は？',
        renderData: { clef, note: { pitch, duration } },
        options,
        correctAnswer
      };

  } else {
      // PITCH Question
      const pitchIndex = ['C','D','E','F','G','A','B'].indexOf(noteName);
      const correctAnswer = PITCH_NAMES[pitchIndex];
      const distractors = PITCH_NAMES.filter(n => n !== correctAnswer);
      const options = shuffleArray([correctAnswer, ...shuffleArray(distractors).slice(0, 5)]);

      return {
        id: `q-${index}`,
        type: QuestionType.PITCH,
        questionText: `この音符の音階は？ (${clef === 'treble' ? 'ト音記号' : 'ヘ音記号'})`,
        renderData: { clef, note: { pitch, duration } },
        options,
        correctAnswer
      };
  }
};

const createSymbolQuestion = (
    index: number,
    filterTypes: string[], // 'dynamics', 'accidentals', 'rests', 'structure'
    stats: Record<string, ItemStats>,
    isAdaptive: boolean,
    lastAnswer?: string
): Question => {
    
    // Filter symbols based on category
    let pool = MUSICAL_SYMBOLS;
    if (filterTypes.length > 0) {
        pool = MUSICAL_SYMBOLS.filter(s => {
            if (filterTypes.includes('dynamics') && ['ff','pp','mf','mp','f','p','cresc.','dim.'].includes(s.value)) return true;
            if (filterTypes.includes('accidentals') && ['sharp','flat','natural'].includes(s.value)) return true;
            if (filterTypes.includes('structure') && ['treble_clef','bass_clef','repeat_start','tie','fermata'].includes(s.value)) return true;
            if (filterTypes.includes('rests') && ['whole_rest','half_rest','quarter_rest','eighth_rest'].includes(s.value)) return true;
            return false;
        });
    }

    const target = pickWeightedItem(pool, s => s.answer, stats, isAdaptive, lastAnswer);
    const correctAnswer = target.answer;
    const distractors = MUSICAL_SYMBOLS.map(s => s.answer).filter(a => a !== correctAnswer);
    const options = shuffleArray([correctAnswer, ...shuffleArray(distractors).slice(0, 5)]);

    return {
        id: `q-${index}`,
        type: QuestionType.SYMBOL,
        questionText: 'この記号の意味は？',
        renderData: { symbol: { type: target.type as any, value: target.value } },
        options,
        correctAnswer
    }
}

export const generateQuiz = (difficulty: Difficulty, isAdaptive: boolean, stats: Record<string, ItemStats>): Question[] => {
  const questions: Question[] = [];
  let lastAnswer: string | undefined = undefined;
  
  const allNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  for (let i = 0; i < 10; i++) {
    let q: Question | null = null;

    switch (difficulty) {
        // --- BEGINNER ---
        case 'beginner-1': 
            // Basic Pitch: Treble, Whole notes, C4-C5 (Middle)
            q = createNoteQuestion(i, 'treble', allNotes, 4, 5, ['whole'], stats, isAdaptive, lastAnswer);
            break;
        case 'beginner-2':
            // High Pitch: Treble, Whole notes, C5-A5 (High)
            q = createNoteQuestion(i, 'treble', allNotes, 5, 5, ['whole'], stats, isAdaptive, lastAnswer);
            break;
        case 'beginner-3':
            // Low Pitch: Bass, Whole notes, C2-C3
            q = createNoteQuestion(i, 'bass', allNotes, 2, 3, ['whole'], stats, isAdaptive, lastAnswer);
            break;

        // --- INTERMEDIATE ---
        case 'intermediate-1':
            // Mixed Clefs, Basic Durations (Whole, Half, Quarter)
            // Randomly pick Pitch or Duration question
            {
                const isDuration = Math.random() > 0.5;
                const clef = Math.random() > 0.5 ? 'treble' : 'bass';
                const octMin = clef === 'treble' ? 4 : 2;
                const octMax = clef === 'treble' ? 5 : 3;
                q = createNoteQuestion(i, clef, allNotes, octMin, octMax, ['whole', 'half', 'quarter'], stats, isAdaptive, lastAnswer, isDuration);
            }
            break;
        case 'intermediate-2':
            // Add 8th Notes (Flagged)
            {
                const clef = 'treble';
                // Mostly Duration questions focusing on flags? Or mixed? Let's do mixed.
                // But prioritize showing the new note types.
                const isDuration = Math.random() > 0.3; 
                q = createNoteQuestion(i, clef, allNotes, 4, 5, ['quarter', 'eighth'], stats, isAdaptive, lastAnswer, isDuration);
            }
            break;
        case 'intermediate-3':
            // Add 16th, 32nd Notes
             {
                const clef = 'treble';
                const isDuration = true; // Hard to read pitch with many flags? Let's stick to duration focus for learning symbols.
                q = createNoteQuestion(i, clef, ['B'], 4, 4, ['eighth', 'sixteenth', 'thirty-second'], stats, isAdaptive, lastAnswer, true);
            }
            break;

        // --- ADVANCED ---
        case 'advanced-1':
            // Performance / Dynamics (Piano/Flute style)
            q = createSymbolQuestion(i, ['dynamics'], stats, isAdaptive, lastAnswer);
            break;
        case 'advanced-2':
            // Theory / Structure (Accidentals, Clefs, Ties)
            q = createSymbolQuestion(i, ['accidentals', 'structure'], stats, isAdaptive, lastAnswer);
            break;
        case 'advanced-3':
            // Rhythm / Rests
            q = createSymbolQuestion(i, ['rests'], stats, isAdaptive, lastAnswer);
            break;
    }

    if (q) {
        questions.push(q);
        lastAnswer = q.correctAnswer;
    }
  }
  
  return questions;
};