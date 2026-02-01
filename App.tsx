import React, { useState, useEffect } from 'react';
import { GameState, Difficulty, UserStorageData } from './types';
import { generateQuiz } from './services/questionGenerator';
import { loadData, updateStats, clearData, getItemStats } from './services/storage';
import { Staff } from './components/Staff';
import confetti from 'canvas-confetti';
import { Music, Award, RotateCcw, CheckCircle2, XCircle, AlertCircle, BookOpen, Volume2, VolumeX, BrainCircuit, BarChart3, Trash2, Settings, ChevronRight } from 'lucide-react';
import { MUSICAL_SYMBOLS, DURATION_NAMES, PITCH_NAMES } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    difficulty: 'beginner-1',
    currentQuestionIndex: 0,
    score: 0,
    questions: [],
    history: [],
    isSoundEnabled: true,
    selectedVoiceURI: null,
    isAdaptiveMode: false,
  });
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const jaVoices = voices.filter(v => v.lang.startsWith('ja'));
      setAvailableVoices(jaVoices.length > 0 ? jaVoices : voices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const getPitchLabel = (pitch: string) => {
      const noteLetter = pitch.charAt(0);
      const index = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(noteLetter);
      return PITCH_NAMES[index] || pitch;
  };

  const playVoice = (text: string) => {
    if (!gameState.isSoundEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\s*\(.*?\)/g, '');
    const uttr = new SpeechSynthesisUtterance(cleanText);
    uttr.lang = 'ja-JP';
    uttr.rate = 1.0;
    if (gameState.selectedVoiceURI) {
        const voice = availableVoices.find(v => v.voiceURI === gameState.selectedVoiceURI);
        if (voice) uttr.voice = voice;
    }
    window.speechSynthesis.speak(uttr);
  };

  const startGame = (difficulty: Difficulty) => {
    const itemStats = getItemStats();
    const questions = generateQuiz(difficulty, gameState.isAdaptiveMode, itemStats);
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      difficulty,
      currentQuestionIndex: 0,
      score: 0,
      questions,
      history: []
    }));
    setSelectedOption(null);
    setFeedback(null);
  };

  const handleAnswer = (option: string) => {
    if (selectedOption || feedback) return;

    const currentQ = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = option === currentQ.correctAnswer;
    
    updateStats(currentQ.correctAnswer, isCorrect);

    setSelectedOption(option);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    playVoice(currentQ.correctAnswer);

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
    if (lastCorrect) {
        confetti({ particleCount: 150, spread: 100 });
    }
  };

  const clearAllData = () => {
      if (confirm('本当にすべての成績データを消去しますか？\n（この操作は取り消せません）')) {
          clearData();
          alert('データを消去しました。');
          setGameState(prev => ({ ...prev })); 
      }
  };

  // Helper component for Menu Level Card
  const LevelCard = ({ 
      title, 
      color, 
      icon, 
      levels 
  }: { 
      title: string, 
      color: string, 
      icon: React.ReactNode, 
      levels: { id: Difficulty, label: string, desc: string }[] 
  }) => (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 ${color}`}>
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
             <div className="p-2 bg-white rounded-lg shadow-sm text-2xl">{icon}</div>
             <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        </div>
        <div className="p-2">
            {levels.map((lvl) => (
                <button
                    key={lvl.id}
                    onClick={() => startGame(lvl.id)}
                    className="w-full text-left p-4 hover:bg-slate-50 rounded-xl transition-all group flex items-center justify-between border-b border-slate-100 last:border-0"
                >
                    <div>
                        <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                             {lvl.label}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{lvl.desc}</div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </button>
            ))}
        </div>
    </div>
  );

  const renderMenu = () => (
    <div className="flex flex-col items-center min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mt-8 mb-8 text-center animate-fade-in-down">
        <div className="inline-flex p-4 bg-white rounded-full shadow-lg mb-4">
            <Music className="w-12 h-12 text-indigo-500" />
        </div>
        <h1 className="text-4xl font-extrabold mb-2 text-indigo-900 tracking-tight">Maestro Quiz</h1>
        <p className="text-slate-500">目指せマエストロ！音楽知識クイズ</p>
      </div>

      {/* Settings Row */}
      <div className="flex flex-wrap justify-center gap-4 mb-10 w-full max-w-4xl">
         <button 
             onClick={() => setGameState(prev => ({...prev, isSoundEnabled: !prev.isSoundEnabled}))}
             className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-sm transition-all border ${gameState.isSoundEnabled ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
         >
             {gameState.isSoundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
             音声 {gameState.isSoundEnabled ? 'ON' : 'OFF'}
         </button>
         
         <button 
             onClick={() => setGameState(prev => ({...prev, isAdaptiveMode: !prev.isAdaptiveMode}))}
             className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-sm transition-all border ${gameState.isAdaptiveMode ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-slate-500 border-slate-200'}`}
         >
             <BrainCircuit size={16}/>
             苦手克服 {gameState.isAdaptiveMode ? 'ON' : 'OFF'}
         </button>

         <button 
            onClick={() => setGameState(prev => ({...prev, status: 'reference'}))}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm bg-white text-indigo-600 border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-all"
        >
            <BookOpen size={16} /> 学習・暗記
        </button>

        <button 
            onClick={() => setGameState(prev => ({...prev, status: 'stats'}))}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm bg-white text-purple-600 border border-purple-100 shadow-sm hover:bg-purple-50 transition-all"
        >
            <BarChart3 size={16} /> 成績表
        </button>
      </div>

      {/* Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-12">
        <LevelCard 
            title="初級 (Beginner)" 
            color="border-green-500" 
            icon={<span className="text-green-500">🌱</span>}
            levels={[
                { id: 'beginner-1', label: 'Step 1: 基本のドレミ', desc: 'ト音記号・全音符・真ん中の音域' },
                { id: 'beginner-2', label: 'Step 2: 高音に挑戦', desc: 'ト音記号・全音符・高い音域' },
                { id: 'beginner-3', label: 'Step 3: 低音に挑戦', desc: 'ヘ音記号・全音符・低い音域' },
            ]}
        />
        <LevelCard 
            title="中級 (Intermediate)" 
            color="border-blue-500" 
            icon={<span className="text-blue-500">🎹</span>}
            levels={[
                { id: 'intermediate-1', label: 'Step 1: 音符の長さ', desc: '全・2分・4分音符のリズム' },
                { id: 'intermediate-2', label: 'Step 2: 8分音符', desc: '旗が1つある音符の登場' },
                { id: 'intermediate-3', label: 'Step 3: 細かいリズム', desc: '16分音符・32分音符の識別' },
            ]}
        />
        <LevelCard 
            title="上級 (Advanced)" 
            color="border-red-500" 
            icon={<span className="text-red-500">🔥</span>}
            levels={[
                { id: 'advanced-1', label: 'Step 1: 演奏記号', desc: '強弱記号 (f, p) や表現' },
                { id: 'advanced-2', label: 'Step 2: 楽典・記号', desc: 'シャープ・フラット・反復記号' },
                { id: 'advanced-3', label: 'Step 3: 休符マスター', desc: '全休符から8分休符まで' },
            ]}
        />
      </div>

      <div className="text-sm text-slate-400 opacity-80">
        © 2026 Maestro Quiz
      </div>
    </div>
  );

  const renderStats = () => {
      const data = loadData();
      const dailyKeys = Object.keys(data.daily).sort();
      const last7Days = dailyKeys.slice(-7);
      
      let totalCorrect = 0;
      let totalQuestions = 0;
      Object.values(data.daily).forEach(d => {
          totalCorrect += d.correct;
          totalQuestions += d.total;
      });
      const totalRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                <button 
                    onClick={() => setGameState(prev => ({...prev, status: 'menu'}))} 
                    className="mb-6 text-indigo-600 font-bold flex items-center gap-2 hover:underline"
                >
                    &larr; メニューに戻る
                </button>
                
                <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                    <BarChart3 className="text-purple-600" /> 成績・学習記録
                </h2>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                        <span className="text-slate-500 text-sm font-bold mb-2">総回答数</span>
                        <span className="text-4xl font-black text-slate-800">{totalQuestions} <span className="text-sm font-normal text-slate-400">問</span></span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                         <span className="text-slate-500 text-sm font-bold mb-2">通算正答率</span>
                         <div className="flex items-baseline gap-1">
                             <span className={`text-4xl font-black ${totalRate >= 80 ? 'text-green-500' : totalRate >= 50 ? 'text-indigo-500' : 'text-orange-500'}`}>
                                 {totalRate}
                             </span>
                             <span className="text-lg font-bold text-slate-400">%</span>
                         </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                        <span className="text-slate-500 text-sm font-bold mb-2">継続日数</span>
                        <span className="text-4xl font-black text-pink-500">{dailyKeys.length} <span className="text-sm font-normal text-slate-400">日</span></span>
                    </div>
                </div>

                <div className="text-center">
                    <button 
                        onClick={clearAllData} 
                        className="text-red-400 hover:text-red-600 text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                        <Trash2 size={16} /> 成績データをすべてリセット
                    </button>
                </div>
            </div>
        </div>
      );
  };

  const renderReference = () => (
    <div className="min-h-screen bg-slate-50 p-6">
       <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setGameState(prev => ({...prev, status: 'menu'}))} 
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
            
            <div className="flex flex-col gap-10">
               {/* Treble Clef */}
               <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h4 className="font-bold text-center mb-6 text-slate-600 text-lg">ト音記号 (高音・基本)</h4>
                  {/* Grid 1 col mobile, 3 cols PC */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                     {['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'].map((pitch, i) => (
                        <div key={i} className="flex flex-col items-center border border-slate-100 rounded-lg p-4 bg-slate-50 transition-all hover:shadow-md">
                            <div className="flex items-center justify-center">
                                {/* Use width 130 and whole notes */}
                                <Staff 
                                    width={130}
                                    data={{ clef: 'treble', note: { pitch, duration: 'whole' } }} 
                                />
                            </div>
                            <div className="text-center mt-2 pb-2">
                                <div className="font-black text-2xl text-slate-800">{pitch}</div>
                                <div className="text-base font-bold text-indigo-500">{getPitchLabel(pitch)}</div>
                            </div>
                        </div>
                     ))}
                  </div>
               </div>
               
               {/* Bass Clef */}
               <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h4 className="font-bold text-center mb-6 text-slate-600 text-lg">ヘ音記号 (低音)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                     {['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3'].map((pitch, i) => (
                        <div key={i} className="flex flex-col items-center border border-slate-100 rounded-lg p-4 bg-slate-50 transition-all hover:shadow-md">
                            <div className="flex items-center justify-center">
                                <Staff 
                                    width={130}
                                    data={{ clef: 'bass', note: { pitch, duration: 'whole' } }} 
                                />
                            </div>
                            <div className="text-center mt-2 pb-2">
                                <div className="font-black text-2xl text-slate-800">{pitch}</div>
                                <div className="text-base font-bold text-indigo-500">{getPitchLabel(pitch)}</div>
                            </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </section>

          {/* Section 2: Durations */}
          <section className="mb-12">
            <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">⏱️ 音符の種類・長さ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {Object.keys(DURATION_NAMES).map((key) => (
                    <div key={key} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-all hover:shadow-md">
                        <div className="flex items-center justify-center">
                            <Staff width={130} data={{ clef: 'treble', note: { pitch: 'B4', duration: key as any } }} />
                        </div>
                        <span className="font-bold text-lg text-slate-700 mt-4">{DURATION_NAMES[key as keyof typeof DURATION_NAMES]}</span>
                    </div>
                ))}
            </div>
          </section>

           {/* Section 3: Symbols */}
           <section className="mb-12">
            <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">🎼 記号・休符</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {MUSICAL_SYMBOLS.map((sym, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-all hover:shadow-md">
                         <div className="flex items-center justify-center">
                             <Staff width={130} data={{ symbol: { type: sym.type as any, value: sym.value } }} />
                        </div>
                        <span className="font-bold text-base text-slate-700 mt-4 leading-tight px-2">{sym.answer}</span>
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
          <button onClick={() => setGameState(prev => ({...prev, status: 'menu'}))} className="text-slate-500 hover:text-slate-700 font-medium">
            &larr; メニュー
          </button>
          <div className="flex flex-col items-center">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {gameState.difficulty.replace('-', ' ').toUpperCase()} 
                {gameState.isAdaptiveMode && <BrainCircuit size={14} className="text-pink-500"/>}
             </span>
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
                  onClick={() => setGameState(prev => ({...prev, status: 'menu'}))}
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
      {gameState.status === 'stats' && renderStats()}
    </div>
  );
};

export default App;