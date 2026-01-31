import React, { useState } from 'react';
import { GameState, Difficulty } from './types';
import { generateQuiz } from './services/questionGenerator';
import { Staff } from './components/Staff';
import confetti from 'canvas-confetti';
import { Music, Award, RotateCcw, CheckCircle2, XCircle, AlertCircle, BookOpen } from 'lucide-react';
import { MUSICAL_SYMBOLS, DURATION_NAMES } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    difficulty: 'beginner',
    currentQuestionIndex: 0,
    score: 0,
    questions: [],
    history: []
  });
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const startGame = (difficulty: Difficulty) => {
    const questions = generateQuiz(difficulty);
    setGameState({
      status: 'playing',
      difficulty,
      currentQuestionIndex: 0,
      score: 0,
      questions,
      history: []
    });
    setSelectedOption(null);
    setFeedback(null);
  };

  const handleAnswer = (option: string) => {
    if (selectedOption || feedback) return;

    const currentQ = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = option === currentQ.correctAnswer;
    
    setSelectedOption(option);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#22c55e', '#ffffff']
      });
    }

    setTimeout(() => {
      const newHistoryEntry = {
        question: currentQ,
        userAnswer: option,
        isCorrect
      };

      if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
        setGameState(prev => ({
          ...prev,
          score: isCorrect ? prev.score + 1 : prev.score,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          history: [...prev.history, newHistoryEntry]
        }));
        setSelectedOption(null);
        setFeedback(null);
      } else {
        finishGame(isCorrect, newHistoryEntry);
      }
    }, 1500);
  };

  const finishGame = (lastCorrect: boolean, lastHistoryEntry: GameState['history'][0]) => {
    setGameState(prev => ({
        ...prev,
        score: lastCorrect ? prev.score + 1 : prev.score,
        status: 'result',
        history: [...prev.history, lastHistoryEntry]
    }));
    if (lastCorrect) confetti({ particleCount: 150, spread: 100 });
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-6 text-white">
      <div className="mb-10 text-center animate-fade-in-down">
        <Music className="w-20 h-20 mx-auto mb-4 text-pink-400" />
        <h1 className="text-5xl font-extrabold mb-2 tracking-tight">Maestro Quiz</h1>
        <p className="text-indigo-200 text-lg">音楽の知識をテストしよう！</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
        {[
          { id: 'beginner', title: '初級', desc: '基本のドレミ (C4-C5)', color: 'bg-green-500 hover:bg-green-600', icon: '🎵' },
          { id: 'intermediate', title: '中級', desc: '広い音域・ヘ音記号', color: 'bg-blue-500 hover:bg-blue-600', icon: '🎹' },
          { id: 'advanced', title: '上級', desc: 'リズム・記号・広音域', color: 'bg-red-500 hover:bg-red-600', icon: '🔥' }
        ].map((level) => (
          <button
            key={level.id}
            onClick={() => startGame(level.id as Difficulty)}
            className={`${level.color} rounded-2xl p-8 transition-all transform hover:scale-105 shadow-xl flex flex-col items-center group`}
          >
            <span className="text-4xl mb-4 group-hover:animate-bounce">{level.icon}</span>
            <h2 className="text-2xl font-bold mb-2">{level.title}</h2>
            <p className="text-sm opacity-90">{level.desc}</p>
          </button>
        ))}
      </div>
      
      <button 
        onClick={() => setGameState({...gameState, status: 'reference'})}
        className="bg-indigo-700 hover:bg-indigo-600 text-white py-3 px-8 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all"
      >
        <BookOpen size={20} /> 学習モード (暗記リスト)
      </button>

      <div className="mt-12 text-sm text-indigo-300 opacity-60">
        © 2026 Maestro Quiz
      </div>
    </div>
  );

  const renderReference = () => (
    <div className="min-h-screen bg-slate-50 p-6">
       <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setGameState({...gameState, status: 'menu'})} 
            className="mb-6 text-indigo-600 font-bold flex items-center gap-2 hover:underline"
          >
            &larr; メニューに戻る
          </button>
          
          <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
             <BookOpen className="text-indigo-600" /> 学習・暗記リスト
          </h2>

          {/* Section 1: Notes */}
          <section className="mb-12">
            <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">🎵 音階 (ドレミ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h4 className="font-bold text-center mb-4">ト音記号 (高音・基本)</h4>
                  <div className="flex flex-wrap justify-center gap-4">
                     {['C4', 'E4', 'G4', 'B4', 'D5', 'F5'].map((pitch, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="transform scale-75 origin-top">
                                <Staff data={{ clef: 'treble', note: { pitch, duration: 'quarter' } }} />
                            </div>
                            <span className="text-sm font-bold mt-[-20px]">{pitch}</span>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h4 className="font-bold text-center mb-4">ヘ音記号 (低音)</h4>
                  <div className="flex flex-wrap justify-center gap-4">
                     {['C2', 'E2', 'G2', 'B2', 'C3', 'E3'].map((pitch, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="transform scale-75 origin-top">
                                <Staff data={{ clef: 'bass', note: { pitch, duration: 'quarter' } }} />
                            </div>
                            <span className="text-sm font-bold mt-[-20px]">{pitch}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </section>

          {/* Section 2: Durations */}
          <section className="mb-12">
            <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">⏱️ 音符の種類・長さ</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.keys(DURATION_NAMES).map((key) => (
                    <div key={key} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center text-center">
                        <div className="transform scale-50 origin-top h-24 w-full flex justify-center overflow-hidden">
                             <Staff data={{ clef: 'treble', note: { pitch: 'B4', duration: key as any } }} />
                        </div>
                        <span className="font-bold text-sm mt-2">{DURATION_NAMES[key as keyof typeof DURATION_NAMES]}</span>
                    </div>
                ))}
            </div>
          </section>

           {/* Section 3: Symbols */}
           <section className="mb-12">
            <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">🎼 記号・休符</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {MUSICAL_SYMBOLS.map((sym, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center text-center">
                        <div className="transform scale-50 origin-top h-28 w-full flex justify-center overflow-hidden">
                             <Staff data={{ symbol: { type: sym.type as any, value: sym.value } }} />
                        </div>
                        <span className="font-bold text-xs mt-[-10px]">{sym.answer}</span>
                    </div>
                ))}
            </div>
          </section>
       </div>
    </div>
  );

  const renderGame = () => {
    const question = gameState.questions[gameState.currentQuestionIndex];
    if (!question) return null;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
        {/* Header */}
        <div className="w-full max-w-3xl flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
          <button onClick={() => setGameState({...gameState, status: 'menu'})} className="text-slate-500 hover:text-slate-700 font-medium">
            &larr; メニュー
          </button>
          <div className="flex flex-col items-center">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{gameState.difficulty.toUpperCase()}</span>
             <div className="flex gap-1 mt-1">
                {gameState.questions.map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i === gameState.currentQuestionIndex ? 'bg-indigo-600' : i < gameState.currentQuestionIndex ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                ))}
             </div>
          </div>
          <div className="text-xl font-bold text-indigo-900">
            Q {gameState.currentQuestionIndex + 1} <span className="text-slate-400 text-sm">/ 10</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="w-full max-w-3xl animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">{question.questionText}</h2>
            
            <Staff data={question.renderData} className="mb-10 mx-auto" />

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option, idx) => {
                    let btnClass = "bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50";
                    if (selectedOption) {
                        if (option === question.correctAnswer) {
                            btnClass = "bg-green-100 border-2 border-green-500 text-green-800 font-bold";
                        } else if (option === selectedOption) {
                            btnClass = "bg-red-100 border-2 border-red-500 text-red-800";
                        } else {
                            btnClass = "opacity-50 bg-slate-100 border-slate-200";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(option)}
                            disabled={!!selectedOption}
                            className={`p-5 rounded-xl text-lg transition-all duration-200 relative overflow-hidden ${btnClass}`}
                        >
                            {option}
                            {selectedOption && option === question.correctAnswer && (
                                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600" />
                            )}
                             {selectedOption && option === selectedOption && option !== question.correctAnswer && (
                                <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-600" />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const wrongAnswers = gameState.history.filter(h => !h.isCorrect);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center animate-scale-up mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-6 text-yellow-500">
              <Award size={48} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">結果発表!</h2>
          <div className="text-6xl font-black text-indigo-600 mb-4">
              {gameState.score} <span className="text-2xl text-slate-400 font-normal">/ 10</span>
          </div>
          
          <p className="text-slate-600 mb-8">
              {gameState.score === 10 ? '完璧です！マエストロ！🏆' : 
              gameState.score >= 7 ? '素晴らしい成績です！✨' : 
              gameState.score >= 4 ? 'よく頑張りました！👍' : 'もう少し練習しましょう！🎵'}
          </p>

          <div className="flex flex-col gap-3">
              <button 
                  onClick={() => startGame(gameState.difficulty)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                  <RotateCcw size={20} /> もう一度挑戦する
              </button>
              <button 
                  onClick={() => setGameState({...gameState, status: 'menu'})}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                  メニューに戻る
              </button>
          </div>
        </div>

        {wrongAnswers.length > 0 && (
          <div className="w-full max-w-2xl animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
              <AlertCircle className="text-red-500" /> 間違えた問題の復習
            </h3>
            <div className="space-y-4">
              {wrongAnswers.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                   <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="transform scale-75 origin-left -my-6 -ml-4">
                         <Staff data={item.question.renderData} />
                      </div>
                      <div className="flex-1 w-full">
                         <h4 className="font-bold text-slate-800 mb-2">{item.question.questionText}</h4>
                         <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg text-red-800 border border-red-100">
                               <XCircle size={16} /> 
                               <span className="font-bold">あなたの回答:</span> {item.userAnswer}
                            </div>
                            <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg text-green-800 border border-green-100">
                               <CheckCircle2 size={16} /> 
                               <span className="font-bold">正解:</span> {item.question.correctAnswer}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="antialiased text-slate-900">
      {gameState.status === 'menu' && renderMenu()}
      {gameState.status === 'reference' && renderReference()}
      {gameState.status === 'playing' && renderGame()}
      {gameState.status === 'result' && renderResult()}
    </div>
  );
};

export default App;