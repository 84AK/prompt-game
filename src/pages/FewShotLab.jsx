import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Zap, Sparkles, Send, CheckCircle2, AlertCircle, Copy, Rocket, Target, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Asset imports
import vibeHeroImg from '../assets/vibe_hero.png';

const labStages = [
  {
    id: 1,
    title: "Step 1: 감성 이모지 튜닝",
    description: "단어의 분위기를 파악해서 어울리는 이모지를 매칭하는 예시를 학습시키세요.",
    fewShots: [
      { input: "즐거운 생일", output: "🎂🎉" },
      { input: "졸린 오후", output: "🥱☕" },
      { input: "비 오는 날", output: "☔️💧" }
    ],
    testQuestion: "눈 내리는 겨울",
    correctAnswer: "❄️⛄️",
    hint: "겨울과 눈에 어울리는 차갑고 포근한 이모지를 생각해보세요!",
    keywords: ["눈", "겨울", "추워", "트리"],
    vibeColor: "from-blue-400 to-indigo-500"
  },
  {
    id: 2,
    title: "Step 2: 리뷰 마인드 리딩",
    description: "사용자의 짧은 리뷰를 보고 긍정(P)인지 부정(N)인지 분류하는 법을 가르쳐주세요.",
    fewShots: [
      { input: "진짜 역대급 맛집이에요!", output: "P" },
      { input: "다시는 안 올 것 같아요..", output: "N" },
      { input: "배송이 빨라서 좋네요.", output: "P" }
    ],
    testQuestion: "가격에 비해 양이 너무 적어요.",
    correctAnswer: "N",
    hint: "실망스러운 마음이 담긴 리뷰는 'P'일까요, 'N'일까요?",
    keywords: ["N", "부정", "negative"],
    vibeColor: "from-orange-400 to-red-500"
  },
  {
    id: 3,
    title: "Step 3: 신조어 연금술",
    description: "두 단어를 합쳐서 힙한 줄임말을 만드는 규칙을 AI에게 전수하세요.",
    fewShots: [
      { input: "치킨 + 맥주", output: "치맥" },
      { input: "얼어 죽어도 아이스 아메리카노", output: "얼죽아" },
      { input: "점심 메뉴 추천", output: "점메추" }
    ],
    testQuestion: "중요한 건 꺾이지 않는 마음",
    correctAnswer: "중꺾마",
    hint: "아주 유명한 5글자 줄임말이에요! 앞글자들을 따보세요.",
    keywords: ["중꺾마", "꺾이지"],
    vibeColor: "from-purple-400 to-pink-500"
  }
];

const Toast = ({ message, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -50, x: '-50%' }}
        animate={{ opacity: 1, y: 20, x: '-50%' }}
        exit={{ opacity: 0, y: -50, x: '-50%' }}
        className="fixed top-0 left-1/2 z-[100] px-6 py-3 bg-white/90 backdrop-blur-md border border-brand-secondary/20 shadow-2xl rounded-2xl flex items-center gap-3"
      >
        <div className="w-8 h-8 bg-brand-secondary/10 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-brand-secondary" />
        </div>
        <p className="text-sm font-bold text-gray-700">{message}</p>
      </motion.div>
    )}
  </AnimatePresence>
);

const CalibrationMeter = ({ progress }) => (
  <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-200 shadow-inner relative">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      className="h-full bg-gradient-to-r from-brand-secondary to-teal-400"
    />
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-[10px] font-black text-gray-400 tracking-tighter uppercase">AI Sync Rate: {progress}%</span>
    </div>
  </div>
);

const VibeTuner = ({ onCopy }) => {
  const [examples, setExamples] = useState([{ in: '', out: '' }, { in: '', out: '' }, { in: '', out: '' }]);
  const [testIn, setTestIn] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const finalPrompt = `너는 지금부터 패턴 학습의 대가야. 아래의 예시들을 보고 규칙을 파악해서 마지막 질문에 대답해줘.\n\n${examples.map(ex => `입력: ${ex.in || '...'} -> 출력: ${ex.out || '...'}`).join('\n')}\n입력: ${testIn || '...'} -> 출력:`;

  const runSimulation = () => {
    setIsTesting(true);
    setTestResult(null);
    
    setTimeout(() => {
      let mockOut = "패턴을 파악하기 위해 더 많은 데이터가 필요해요! (예시: 'A->B' 패턴)";
      if (examples[0].out && testIn) {
        mockOut = `[알림] AI가 패턴을 분석했습니다. 예측 결과: "${testIn.includes('공') || examples[0].out.includes('공') ? testIn.split(' ')[0] + '공' : examples[0].out}" (Few-shot 기반 학습 완료)`;
      }
      setTestResult(mockOut);
      setIsTesting(false);
    }, 2000);
  };

  return (
    <div className="glass-card p-10 rounded-[2.5rem] border-brand-secondary/20 bg-gradient-to-br from-brand-secondary/5 to-transparent mb-16 text-left">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
        <Rocket className="w-8 h-8 text-brand-secondary" />
        마이 AI 튜닝 스튜디오
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4 overflow-hidden">
          <p className="text-sm font-bold text-gray-500 mb-4">1. AI에게 가르칠 예시 세트를 입력하세요</p>
          {examples.map((ex, i) => (
            <div key={i} className="flex gap-3 items-center w-full overflow-hidden">
              <input 
                type="text" 
                placeholder="입력" 
                value={ex.in} 
                onChange={(e) => {
                  const newEx = [...examples];
                  newEx[i].in = e.target.value;
                  setExamples(newEx);
                }}
                className="flex-1 min-w-0 p-3 bg-white rounded-xl border border-gray-100 focus:border-brand-secondary focus:outline-none transition-all text-sm"
              />
              <span className="text-gray-300 flex-shrink-0">→</span>
              <input 
                type="text" 
                placeholder="출력" 
                value={ex.out}
                onChange={(e) => {
                  const newEx = [...examples];
                  newEx[i].out = e.target.value;
                  setExamples(newEx);
                }}
                className="flex-1 min-w-0 p-3 bg-white rounded-xl border border-gray-100 focus:border-brand-secondary focus:outline-none transition-all text-sm"
              />
            </div>
          ))}
          <div className="pt-4">
            <p className="text-sm font-bold text-gray-500 mb-2">2. 마지막으로 테스트할 질문을 입력하세요</p>
            <input 
              type="text" 
              placeholder="예: 럭비에서 사용하는 공은?" 
              value={testIn}
              onChange={(e) => setTestIn(e.target.value)}
              className="w-full p-4 bg-white rounded-xl border border-gray-100 focus:border-brand-secondary focus:outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 border-2 border-dashed border-brand-secondary/30 flex flex-col justify-between relative overflow-hidden h-full">
            <AnimatePresence>
              {isTesting && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                    <Zap className="w-12 h-12 text-brand-secondary mb-4" />
                  </motion.div>
                  <p className="font-black text-brand-secondary animate-pulse text-lg">AI가 예시 패턴을 학습 중입니다...</p>
                  <p className="text-xs text-gray-400 mt-2">Few-shot 알고리즘 가동 중</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <p className="text-xs font-black text-brand-secondary mb-4 uppercase tracking-widest">Generated Few-shot Prompt</p>
              <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 font-mono mb-6 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {finalPrompt}
              </div>
              
              {testResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-brand-secondary/10 rounded-2xl border border-brand-secondary/20 mb-6">
                  <p className="text-xs font-bold text-brand-secondary mb-1">✨ 시뮬레이션 결과:</p>
                  <p className="text-sm text-gray-700 font-bold">{testResult}</p>
                </motion.div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                disabled={isTesting || !testIn || examples.some(e => !e.in || !e.out)}
                onClick={runSimulation}
                className="flex-1 py-4 bg-brand-secondary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-teal-500 transition-all shadow-lg active:scale-95 disabled:opacity-20"
              >
                <Zap className="w-5 h-5" /> 테스트 실행
              </button>
              <button 
                disabled={!testIn || examples.some(e => !e.in || !e.out)}
                onClick={() => {
                  navigator.clipboard.writeText(finalPrompt);
                  if (onCopy) onCopy('AI 튜닝 주문이 복사되었습니다! ✨');
                }}
                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-20"
              >
                <Copy className="w-5 h-5" /> 주문 복사
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FewShotLab = () => {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [syncRate, setSyncRate] = useState(0);
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  
  const navigate = useNavigate();
  const currentStage = labStages[step - 1] || labStages[0];

  const showToast = (message) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  const handleCheck = () => {
    if (answer.trim().toLowerCase() === currentStage.correctAnswer.toLowerCase()) {
      setStatus('success');
      setSyncRate(prev => Math.min(prev + 33.3, 100));
      setTimeout(() => {
        if (step < labStages.length) {
          setStep(prev => prev + 1);
          setAnswer('');
          setStatus('idle');
        } else {
          setStep(4); // Result screen
        }
      }, 1500);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col font-sans">
      <Toast isVisible={toast.isVisible} message={toast.message} />
      
      <header className="p-8 flex items-center justify-between max-w-7xl mx-auto w-full">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5" /> 랩 나가기
        </button>
        {step > 0 && step <= 3 && (
          <div className="w-full max-w-md px-10">
            <CalibrationMeter progress={Math.round(syncRate)} />
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 pb-12">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="intro" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-16 rounded-[3rem] text-center border-white shadow-2xl relative overflow-hidden bg-white">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-secondary to-teal-400" />
              <div className="w-full max-w-lg mx-auto mb-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white ring-1 ring-gray-100">
                <img src={vibeHeroImg} alt="Vibe Lab" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-brand-secondary to-teal-600 bg-clip-text text-transparent">감성 AI 트레이닝 센터</h1>
              <p className="text-gray-500 mb-10 text-xl leading-relaxed max-w-2xl mx-auto">
                데이터 예시(Few-shot)를 통해 AI의 감성을 튜닝해보세요. <br />
                몇 가지 힌트만으로도 AI는 당신의 마음을 읽기 시작합니다!
              </p>
              <button onClick={() => setStep(1)} className="px-16 py-6 bg-gray-900 text-white rounded-[2rem] font-bold text-2xl shadow-xl hover:bg-brand-secondary hover:scale-105 transition-all">스튜디오 입장하기 🧪</button>
            </motion.div>
          )}

          {step > 0 && step <= 3 && (
            <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-8">
              <div className="text-left">
                <h2 className="text-3xl font-black mb-2 text-gray-800">{currentStage.title}</h2>
                <p className="text-gray-500">{currentStage.description}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4" /> Training Data (Few-shots)
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    {currentStage.fewShots.map((shot, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-brand-secondary/30 transition-all"
                      >
                        <span className="text-gray-400 font-medium">"{shot.input}"</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-200">→</span>
                          <span className={`px-5 py-3 rounded-2xl font-black text-2xl text-white bg-gradient-to-r ${currentStage.vibeColor} shadow-lg`}>
                            {shot.output}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Calibration Test
                  </p>
                  <div className="glass-card flex-1 p-10 rounded-[2.5rem] bg-white border-white shadow-xl flex flex-col justify-center items-center text-center">
                    <div className="mb-8">
                      <p className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-widest">Question</p>
                      <h3 className="text-3xl font-black text-gray-800">"{currentStage.testQuestion}"</h3>
                    </div>
                    
                    <div className="w-full space-y-6">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          readOnly={step === 1}
                          placeholder={step === 1 ? "아래 이모지들을 선택해보세요!" : "출력될 값을 예측해보세요..."}
                          className={`w-full p-5 bg-gray-50 rounded-2xl border-2 outline-none transition-all text-center text-2xl font-bold ${status === 'success' ? 'border-green-400 bg-green-50' : status === 'error' ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-brand-secondary focus:bg-white'}`}
                        />
                        {status === 'success' && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-8 h-8" />}
                        {status === 'error' && <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 w-8 h-8" />}
                      </div>

                      {step === 1 && (
                        <div className="flex flex-wrap justify-center gap-3 p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                          {["❄️", "⛄️", "🎂", "🎉", "🥱", "☕", "☔️", "💧", "🎄", "🍦", "🔥"].map((emoji, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                if (answer.length < 4) setAnswer(prev => prev + emoji);
                                else setAnswer(emoji);
                              }}
                              className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 text-2xl flex items-center justify-center hover:scale-110 active:scale-95 hover:border-brand-secondary transition-all"
                            >
                              {emoji}
                            </button>
                          ))}
                          <button 
                            onClick={() => setAnswer('')}
                            className="px-4 h-12 bg-gray-200 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-300 transition-colors"
                          >
                            지우기
                          </button>
                        </div>
                      )}

                      <button 
                        onClick={handleCheck}
                        disabled={!answer || status !== 'idle'}
                        className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-brand-secondary transition-all disabled:opacity-30"
                      >
                        {status === 'success' ? '동기화 완료!' : '동기화 확인'}
                      </button>
                    </div>
                    <p className="mt-6 text-sm text-gray-400 flex items-center gap-2">
                      <Info className="w-4 h-4" /> 힌트: {currentStage.hint}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="victory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="glass-card p-12 lg:p-16 rounded-[3rem] mb-12 bg-white border-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-4xl font-black mb-4 text-gray-800 tracking-tight">AI 트레이닝 마스터 등극!</h2>
                <p className="text-gray-500 text-xl mb-12 leading-relaxed">
                  축하합니다! AI의 학습 원리를 완벽하게 이해하셨군요. <br />
                  이제 당신만의 독특한 데이터로 AI를 직접 튜닝해보세요!
                </p>
                
                <div className="max-w-4xl mx-auto space-y-16">
                   {/* AI 튜닝 스튜디오 */}
                   <VibeTuner onCopy={showToast} />

                   {/* 아이디어 뱅크 */}
                   <div className="text-left">
                     <h4 className="text-2xl font-black mb-8 flex items-center gap-3">
                       <Sparkles className="w-8 h-8 text-brand-secondary" />
                       ✨ 기발한 예시 아이디어 뱅크
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { 
                            title: "🦁 동물 특징 결합기", 
                            ex: "사자+날개->그리핀, 말+뿔->유니콘...", 
                            tip: "상상의 동물을 만드는 규칙을 만들어보세요!" 
                          },
                          { 
                            title: "🎭 말투 변환 마법", 
                            ex: "배고파->배가 고프옵니다, 안녕->반갑구만!", 
                            tip: "사극 말투나 옛날 말투로 변환하는 AI를 만들어보세요." 
                          },
                          { 
                            title: "💎 브랜드 네이밍", 
                            ex: "커피+도서관->북카페, 운동+재미->운잼...", 
                            tip: "두 단어를 합쳐서 멋진 브랜드 이름을 지어보세요." 
                          },
                          { 
                            title: "🌈 색깔 감성 매칭", 
                            ex: "열정->빨강, 평화->초록, 희망->노랑...", 
                            tip: "추상적인 단어를 색깔로 표현하는 감성 AI를 훈련시키세요." 
                          }
                        ].map((idea, i) => (
                          <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-brand-secondary/30 transition-all group">
                            <h5 className="font-bold text-gray-800 mb-2 group-hover:text-brand-secondary transition-colors">{idea.title}</h5>
                            <p className="text-xs font-mono text-brand-secondary mb-3">{idea.ex}</p>
                            <p className="text-xs text-gray-500">{idea.tip}</p>
                          </div>
                        ))}
                     </div>
                   </div>

                   {/* 실전 게임 가이드 */}
                   <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white text-left relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Zap className="w-32 h-32" />
                      </div>
                      <h4 className="text-2xl font-black mb-8 flex items-center gap-3">
                        <Target className="w-8 h-8 text-teal-400" />
                        🤝 친구들과 함께 즐기는 'Few-shot 레이스'
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                          <div className="w-10 h-10 bg-teal-400/20 rounded-full flex items-center justify-center text-teal-400 font-black">1</div>
                          <p className="font-bold">패턴 설계하기</p>
                          <p className="text-xs text-gray-400 leading-relaxed">자신만의 독특한 [입력→출력] 규칙을 3개 정해서 튜닝 주문을 완성하세요.</p>
                        </div>
                        <div className="space-y-3">
                          <div className="w-10 h-10 bg-teal-400/20 rounded-full flex items-center justify-center text-teal-400 font-black">2</div>
                          <p className="font-bold">예시 카드 공개</p>
                          <p className="text-xs text-gray-400 leading-relaxed">친구들에게 3개의 예시 데이터만 보여주고, 마지막 질문을 던지세요.</p>
                        </div>
                        <div className="space-y-3">
                          <div className="w-10 h-10 bg-teal-400/20 rounded-full flex items-center justify-center text-teal-400 font-black">3</div>
                          <p className="font-bold">먼저 맞히면 승리!</p>
                          <p className="text-xs text-gray-400 leading-relaxed">가장 먼저 AI처럼 규칙을 파악해서 정답을 외친 팀이 승리합니다!</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="mt-20">
                  <button 
                    onClick={() => navigate('/')}
                    className="px-16 py-6 bg-brand-secondary text-white rounded-[2rem] font-bold text-2xl shadow-2xl hover:bg-teal-500 hover:scale-105 transition-all"
                  >
                    메인 홈으로 돌아가기 🏠
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default FewShotLab;
