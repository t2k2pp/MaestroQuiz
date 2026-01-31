import { Difficulty, Question, QuestionType, NoteDuration } from '../types';
import { PITCH_NAMES, DURATION_NAMES, MUSICAL_SYMBOLS, shuffleArray, ALL_DURATION_LABELS } from '../constants';

const generatePitchQuestion = (difficulty: Difficulty, index: number): Question => {
  // 1. Determine Range
  // Beginner: C4 - C5
  // Intermediate/Advanced: G3 - A5 (Approx range of typical treble staff + ledger lines)
  let minOctave = 4, maxOctave = 5;
  if (difficulty !== 'beginner') {
    minOctave = 3;
    maxOctave = 6; // Expanded range
  }

  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // Randomly select a note
  const octave = Math.floor(Math.random() * (maxOctave - minOctave + 1)) + minOctave;
  const noteName = notes[Math.floor(Math.random() * notes.length)];
  
  // Constrain limits closer for playability if needed, but strict logic:
  // Beginner: C4 to C5.
  let validNote = noteName;
  let validOctave = octave;

  if (difficulty === 'beginner') {
    validOctave = Math.random() > 0.5 ? 4 : 5;
    if (validOctave === 5 && validNote !== 'C') validOctave = 4; // Only allow C5 max
    if (validOctave === 4 && validNote === 'C') validOctave = 4; // C4 min
  }

  // Pitch Label (Correct Answer)
  const pitchIndex = notes.indexOf(validNote);
  const correctAnswer = PITCH_NAMES[pitchIndex];

  // Distractors
  // Fix: Ensure correct answer is included by selecting distractors separately then combining
  const distractors = PITCH_NAMES.filter(n => n !== correctAnswer);
  const selectedDistractors = shuffleArray(distractors).slice(0, 5); // Pick 5 distractors
  const options = shuffleArray([correctAnswer, ...selectedDistractors]);

  // Note Duration (Only Advanced has varied rhythms here)
  let duration: NoteDuration = 'whole';
  if (difficulty === 'advanced') {
    const durations: NoteDuration[] = ['whole', 'half', 'quarter', 'eighth'];
    duration = durations[Math.floor(Math.random() * durations.length)];
  }

  return {
    id: `q-${index}`,
    type: QuestionType.PITCH,
    questionText: 'この音符の音階は？',
    renderData: {
      note: {
        pitch: `${validNote}${validOctave}`,
        duration: duration
      }
    },
    options,
    correctAnswer
  };
};

const generateDurationQuestion = (index: number): Question => {
  const durations: NoteDuration[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty-second'];
  const targetDuration = durations[Math.floor(Math.random() * durations.length)];
  
  const correctAnswer = DURATION_NAMES[targetDuration];
  
  // Distractors
  const allOptions = Object.values(DURATION_NAMES);
  const distractors = allOptions.filter(d => d !== correctAnswer);
  const selectedDistractors = shuffleArray(distractors).slice(0, 5);
  const options = shuffleArray([correctAnswer, ...selectedDistractors]);

  // Random pitch for display (usually middle of staff like B4)
  return {
    id: `q-${index}`,
    type: QuestionType.DURATION,
    questionText: 'この音符の種類は？',
    renderData: {
      note: {
        pitch: 'B4', 
        duration: targetDuration
      }
    },
    options,
    correctAnswer
  };
};

const generateSymbolQuestion = (index: number): Question => {
  const targetSymbol = MUSICAL_SYMBOLS[Math.floor(Math.random() * MUSICAL_SYMBOLS.length)];
  
  const correctAnswer = targetSymbol.answer;
  
  // Distractors
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

export const generateQuiz = (difficulty: Difficulty): Question[] => {
  const questions: Question[] = [];
  
  for (let i = 0; i < 10; i++) {
    if (difficulty === 'beginner' || difficulty === 'intermediate') {
      questions.push(generatePitchQuestion(difficulty, i));
    } else {
      // Advanced: Mix of Pitch, Duration, and Symbols
      const roll = Math.random();
      if (roll < 0.4) {
        questions.push(generatePitchQuestion('advanced', i));
      } else if (roll < 0.7) {
        questions.push(generateDurationQuestion(i));
      } else {
        questions.push(generateSymbolQuestion(i));
      }
    }
  }
  
  return questions;
};