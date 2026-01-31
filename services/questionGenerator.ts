import { Difficulty, Question, QuestionType, NoteDuration, RenderData } from '../types';
import { PITCH_NAMES, DURATION_NAMES, MUSICAL_SYMBOLS, shuffleArray } from '../constants';

const generatePitchQuestion = (difficulty: Difficulty, index: number): Question => {
  // Logic:
  // Beginner: Treble Clef C4 - C5 (No change)
  // Intermediate/Advanced: Wider range. 
  //   - If note is low (e.g. < C4), use Bass Clef roughly half the time or if it makes sense.
  //   - Let's define: High (C4-A5) -> Treble. Low (C2-B3) -> Bass.
  
  let clef: 'treble' | 'bass' = 'treble';
  let minOctave = 4, maxOctave = 5;

  if (difficulty === 'beginner') {
    clef = 'treble';
    minOctave = 4;
    maxOctave = 5;
  } else {
    // 50% chance of Bass Clef for wider range practice
    clef = Math.random() > 0.5 ? 'bass' : 'treble';
    
    if (clef === 'treble') {
       minOctave = 4; // C4 to A5
       maxOctave = 5;
    } else {
       minOctave = 2; // C2 to E4
       maxOctave = 3;
    }
  }

  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // Randomly select a note
  let octave = Math.floor(Math.random() * (maxOctave - minOctave + 1)) + minOctave;
  let noteName = notes[Math.floor(Math.random() * notes.length)];
  
  // Constrain limits
  if (difficulty === 'beginner') {
    // Force C4-C5 range strictly
    if (octave === 5 && noteName !== 'C') octave = 4;
    if (octave === 4 && noteName === 'C') octave = 4; // ok
  }

  // Pitch Label (Correct Answer)
  const pitchIndex = notes.indexOf(noteName);
  const correctAnswer = PITCH_NAMES[pitchIndex];

  // Distractors
  const distractors = PITCH_NAMES.filter(n => n !== correctAnswer);
  const selectedDistractors = shuffleArray(distractors).slice(0, 5); 
  const options = shuffleArray([correctAnswer, ...selectedDistractors]);

  // Note Duration
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

const generateDurationQuestion = (index: number): Question => {
  const durations: NoteDuration[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty-second'];
  const targetDuration = durations[Math.floor(Math.random() * durations.length)];
  
  const correctAnswer = DURATION_NAMES[targetDuration];
  
  // Distractors
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
      // Advanced: Mix
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