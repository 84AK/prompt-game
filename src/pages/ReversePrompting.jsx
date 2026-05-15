import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronLeft, Sparkles, MessageCircle, Info, HelpCircle, Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Asset imports
import promptHeroImg from '../assets/prompt_hero.png';
import guideStep1 from '../assets/guide_step1.png';
import guideStep2 from '../assets/guide_step2.png';
import guideStep3 from '../assets/guide_step3.png';
import guideStep4 from '../assets/guide_step4.png';

const stages = [
  {
    id: 1,
    target: "사과",
    rule: "반말로 아주 짧게 대답하기",
    keywords: ["반말", "짧게", "친구", "한 문장"],
    ruleDescription: "AI가 친구처럼 반말을 하며, 한 문장으로만 짧게 대답하는 프롬프트가 걸려 있습니다.",
    hint: "먹는 것인지, 색깔이 무엇인지 물어보세요!",
    responses: {
      "살아있": "아니, 안 살아있어.",
      "먹는": "응, 아주 맛있지.",
      "음식": "응, 아주 맛있는 과일이야.",
      "색깔": "보통 빨간색인데, 가끔 초록색일 때도 있어.",
      "빨간": "응! 빨간색 사과가 제일 유명해.",
      "초록": "초록색 아오리 사과도 있지!",
      "커": "아니, 한 손에 쏙 들어오는 크기야.",
      "작아": "응, 그렇게 크지 않아.",
      "어디": "나무에서 자라.",
      "맛": "달콤하고 아삭아삭해.",
      "기본": "비밀이야. 맞춰봐!"
    }
  },
  {
    id: 2,
    target: "코끼리",
    rule: "이모지로만 대답하기",
    keywords: ["이모지", "그림", "아이콘", "텍스트", "글자"],
    ruleDescription: "AI가 텍스트 없이 오직 이모지로만 모든 정보를 전달하는 프롬프트가 걸려 있습니다.",
    hint: "동물인지, 코가 긴지 물어보세요!",
    responses: {
      "살아있": "🐘✅",
      "동물": "🐘🦁🦒✅",
      "먹는": "🌿🍎✅",
      "색깔": "🩶🐘",
      "회색": "🩶✅",
      "커": "🐘⛰️⬆️",
      "거대": "🐘⛰️⬆️",
      "어디": "🌍🦒🦓",
      "아프리카": "🌍🦁✅",
      "코": "🐘👃📏✨",
      "귀": "🐘👂🦋✨",
      "상아": "🐘🦷✨",
      "기본": "❓🤐"
    }
  },
  {
    id: 3,
    target: "비행기",
    rule: "'아니오'라고 대답할 때마다 수수께끼 내기",
    keywords: ["수수께끼", "아니오", "퀴즈", "부정", "거절"],
    ruleDescription: "AI가 부정적인 대답을 해야 할 때, 정답 대신 쌩뚱맞은 수수께끼를 던지는 복잡한 프롬프트가 걸려 있습니다.",
    hint: "기계인지, 날 수 있는지, 바다에 사는지 물어보세요!",
    responses: {
      "살아있": "내가 살아있냐고? '눈은 있는데 보지는 못하고, 입은 있는데 말하지 못하는 것은?' (정답: 바늘)",
      "기계": "응, 아주 복잡하고 거대한 기계야.",
      "날 수": "그럼! 구름 위를 슝슝 날아다니지.",
      "하늘": "맞아! 내 놀이터는 바로 넓은 하늘이야.",
      "날개": "나한테는 아주 크고 튼튼한 날개가 두 개나 있어.",
      "바다": "바다에 사냐고? '가면 갈수록 짧아지는 것은?' (정답: 수명/길)",
      "어디": "공항에 가면 나를 만날 수 있어.",
      "공항": "응! 여행을 떠나려는 사람들이 공항에서 나를 기다려.",
      "사람": "맞아, 수백 명의 사람을 태우고 멀리멀리 갈 수 있어.",
      "커": "그럼! 집보다 훨씬 더 크단다.",
      "거대": "응, 아주 거대하고 무거운 몸집을 가졌지.",
      "탈 것": "빙고! 나는 아주 빠른 이동 수단이야.",
      "여행": "응! 사람들을 싣고 세계 여행을 시켜주지.",
      "땅": "땅에서 다니냐고? '다리가 네 개인데 걷지 못하는 것은?' (정답: 책상/의자)",
      "바닥": "바닥에 있냐고? '올라갈 때는 긴데 내려올 때는 짧은 것은?' (정답: 촛불/연필)",
      "걷다": "걷고 싶냐고? '발이 없는데 길을 가는 것은?' (정답: 강물/시간)",
      "기본": "흥미로운 질문이네! 혹시 비밀 규칙을 알아냈니? 그렇다면 하단의 [🏆 정답 외치기!] 버튼을 눌러서 정답을 맞춰봐!"
    }
  }
];

const Toast = ({ message, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -50, x: '-50%' }}
        animate={{ opacity: 1, y: 20, x: '-50%' }}
        exit={{ opacity: 0, y: -50, x: '-50%' }}
        className="fixed top-0 left-1/2 z-[100] px-6 py-3 bg-white/90 backdrop-blur-md border border-brand-primary/20 shadow-2xl rounded-2xl flex items-center gap-3"
      >
        <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-brand-primary" />
        </div>
        <p className="text-sm font-bold text-gray-700">{message}</p>
      </motion.div>
    )}
  </AnimatePresence>
);

const PromptBuilder = ({ onCopy }) => {
  const [ingredients, setIngredients] = useState({ target: '', rule: '', persona: '' });
  const finalPrompt = `너는 지금부터 "${ingredients.persona || '...'}"야. 너는 마음속에 "${ingredients.target || '...'}"라는 비밀 물건을 하나 품고 있어. 사용자가 이 물건이 무엇인지 맞히기 위해 질문을 던질 거야. 대답할 때 반드시 "${ingredients.rule || '...'}"라는 비밀 규칙을 지켜서 대답해줘. 절대로 정답을 직접 말해서는 안 돼!`;

  return (
    <div className="glass-card p-10 rounded-[2.5rem] border-brand-secondary/20 bg-gradient-to-br from-brand-secondary/5 to-transparent mb-16 mt-12 text-left">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Sparkles className="w-8 h-8 text-brand-secondary" />🧪 프롬프트 연금술 (나만의 스무고개 만들기)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {[{ id: 'persona', label: '1. AI의 역할(페르소나)', placeholder: '예: 무뚝뚝한 로봇', icon: '👤' }, { id: 'target', label: '2. 비밀 물건 (정답)', placeholder: '예: 스마트폰', icon: '🎁' }, { id: 'rule', label: '3. 비밀 규칙 (프롬프트 제약)', placeholder: '예: 이모지로만 말하기', icon: '🚫' }].map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-bold text-gray-500 mb-2 flex items-center gap-2"><span>{field.icon}</span> {field.label}</label>
              <input type="text" value={ingredients[field.id]} onChange={(e) => setIngredients({ ...ingredients, [field.id]: e.target.value })} placeholder={field.placeholder} className="w-full p-4 bg-white rounded-2xl border-2 border-gray-100 focus:border-brand-secondary focus:outline-none transition-all text-gray-700 shadow-sm" />
            </div>
          ))}
        </div>
        <div className="flex flex-col h-full">
          <div className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">✨ 완성된 마법 주문 미리보기</div>
          <div className="flex-1 p-8 bg-white/80 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-brand-secondary/30 relative flex flex-col justify-center items-center text-center overflow-hidden">
            <p className="text-sm text-gray-600 leading-relaxed italic mb-8 px-4">{ingredients.persona || ingredients.target || ingredients.rule ? `"${finalPrompt}"` : <span className="text-gray-300 italic">재료를 입력하면 <br /> 비밀 주문이 완성됩니다!</span>}</p>
            <button disabled={!ingredients.persona || !ingredients.target || !ingredients.rule} onClick={() => { navigator.clipboard.writeText(finalPrompt); if(onCopy) onCopy('마법 주문이 복사되었습니다! 🪄'); }} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">마법 주문 복사하기 🪄</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GroupGuide = ({ onFinish, onCopy }) => {
  const steps = [
    { title: "1. 비밀 주문 설계", desc: "팀별로 AI가 숨길 '물건'과 절대 어기면 안 되는 '비밀 규칙'을 정해요.", img: guideStep1 },
    { title: "2. 마법사 소환하기", desc: "작성한 프롬프트를 AI에게 입력해 '비밀을 간직한 마법사'를 소환합니다.", img: guideStep2 },
    { title: "3. 탐정 활동 시작!", desc: "다른 팀들이 마법사에게 질문을 던져 물건과 규칙을 모두 맞혀야 합니다.", img: guideStep3 },
    { title: "4. 최고의 탐정팀은?", desc: "가장 적은 질문으로 두 가지 비밀을 모두 알아낸 팀이 승리합니다!", img: guideStep4 }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto text-center">
      <div className="mb-16 pt-12"><h2 className="text-4xl font-black mb-4">🤝 우리 반 프롬프트 스무고개 가이드</h2><p className="text-gray-500 text-lg">이제 친구들과 함께 실전 게임을 시작해볼까요?</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {steps.map((step, idx) => (
          <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="glass-card p-4 rounded-3xl flex flex-col items-center text-center">
            <div className="w-full aspect-square mb-4 overflow-hidden rounded-2xl shadow-md"><img src={step.img} alt={step.title} className="w-full h-full object-cover" /></div>
            <h3 className="font-bold text-lg mb-2 text-brand-primary">{step.title}</h3><p className="text-sm text-gray-600 leading-tight">{step.desc}</p>
          </motion.div>
        ))}
      </div>
      <PromptBuilder onCopy={onCopy} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 text-left">
        <div className="bg-brand-accent/10 p-8 rounded-3xl border border-brand-accent/20">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-accent" />
            꿀팁: 더 재미있게 게임하는 방법!
          </h3>
          <ul className="space-y-4 text-gray-700">
            {[
              { label: "황당한 조합", content: "'비밀 물건: 사과' + '비밀 규칙: 모든 말을 랩으로 하기'" },
              { label: "조커 카드", content: "'질문자에게 역으로 퀴즈 내기' 같은 조건을 넣어보세요." },
              { label: "제한 시간", content: "10번의 질문 안에 물건과 규칙을 모두 맞혀야 승리!" }
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm md:text-base leading-relaxed">
                <span className="flex-shrink-0 mt-1 text-brand-accent">✅</span>
                <div className="flex flex-col md:flex-row md:items-center gap-x-3">
                  <strong className="whitespace-nowrap text-brand-primary min-w-[90px]">{item.label} :</strong>
                  <span className="text-gray-600">{item.content}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card p-8 rounded-3xl border-gray-100"><h3 className="text-xl font-black mb-6 flex items-center gap-2"><HelpCircle className="w-6 h-6 text-brand-primary" />제작 도우미 (AI 프롬프트)</h3><div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-4"><p className="text-xs text-gray-500 italic leading-relaxed">"너는 지금부터 학생들이 '프롬프트 스무고개' 게임의 문제를 만들 수 있게 돕는 멘토 마법사야. 학생들이 주제를 말해주면 3단계(페르소나, 비밀 물건, 규칙)로 나누어 질문하며 문제를 설계하게 도와줘!"</p></div><button onClick={() => { const metaPrompt = "너는 지금부터 학생들이 '프롬프트 스무고개' 게임의 문제를 만들 수 있게 돕는 멘토 마법사야. 학생들이 주제를 말해주면 3단계(페르소나, 비밀 물건, 규칙)로 나누어 질문하며 문제를 설계하게 도와줘!"; navigator.clipboard.writeText(metaPrompt); if(onCopy) onCopy('도우미 프롬프트가 복사되었습니다! ✨'); }} className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors">도우미 프롬프트 복사하기</button></div>
      </div>
      <button onClick={onFinish} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-gray-800 transition-all mb-12">가이드 완료 & 홈으로 돌아가기</button>
    </motion.div>
  );
};

const ReversePrompting = () => {
  const [step, setStep] = useState(0); 
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [guessObject, setGuessObject] = useState('');
  const [guessRule, setGuessRule] = useState('');
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const showToast = (message) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentStage = stages[step - 1] || stages[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const userMsg = { role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setTimeout(() => {
      let aiText = currentStage.responses["기본"];
      for (const key in currentStage.responses) { if (inputValue.includes(key)) { aiText = currentStage.responses[key]; break; } }
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    }, 600);
  };

  const handleGuess = () => {
    if (isSubmitting) return;
    const objectCorrect = guessObject.trim() === currentStage.target;
    const ruleCorrect = currentStage.keywords.some(keyword => guessRule.includes(keyword));
    if (objectCorrect && ruleCorrect) {
      setIsSubmitting(true); setIsSuccess(true);
      setTimeout(() => {
        if (step < stages.length) { setStep(prev => prev + 1); setMessages([]); setGuessObject(''); setGuessRule(''); setIsSuccess(null); setShowGuessModal(false); }
        else { setStep(4); setShowGuessModal(false); }
        setIsSubmitting(false);
      }, 2000);
    } else {
      setIsSuccess(false); setTimeout(() => setIsSuccess(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col">
      <Toast isVisible={toast.isVisible} message={toast.message} />
      <header className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-800 transition-colors"><ChevronLeft className="w-5 h-5" />마법 학교로 돌아가기</button>
        {step > 0 && step <= stages.length && (<div className="flex items-center gap-4"><div className="text-sm font-bold text-gray-400">STAGE {step} / {stages.length}</div><div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden"><motion.div className="h-full bg-brand-primary" initial={{ width: 0 }} animate={{ width: `${(step / stages.length) * 100}%` }} /></div></div>)}
      </header>
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 pb-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-12 rounded-[3rem] text-center max-w-4xl mx-auto border-white/50 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
              
              <div className="w-full max-w-[480px] mx-auto mb-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white ring-1 ring-gray-100">
                <img 
                  src={promptHeroImg} 
                  alt="Prompt Detective" 
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                />
              </div>
              
              <h2 className="text-5xl font-black mb-6 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent leading-tight tracking-tight">
                프롬프트 스무고개
              </h2>
              
              <p className="text-gray-500 mb-12 leading-relaxed text-xl max-w-2xl mx-auto">
                마법사 AI가 비밀 물건을 하나 숨기고 있어요! <br />
                질문을 통해 물건과 <span className="text-brand-primary font-bold">비밀 규칙(프롬프트)</span>을 <br />
                모두 찾아내야 진정한 마법사가 될 수 있어요!
              </p>
              
              <button 
                onClick={() => setStep(1)}
                className="px-16 py-6 bg-brand-primary text-white rounded-[2rem] font-bold text-2xl shadow-2xl hover:bg-red-500 hover:scale-105 active:scale-95 transition-all"
              >
                도전 시작하기! 🪄
              </button>
            </motion.div>
          )}
          {step > 0 && step <= stages.length && (
            <motion.div key={`game-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-4">
              <div className="flex-1 glass-card rounded-[2rem] p-6 flex flex-col overflow-hidden bg-white/40">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                  <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 max-w-[80%] border border-gray-100">안녕! 내가 지금 생각하고 있는 <strong>비밀 물건</strong>이 뭘까? 질문을 던져서 알아맞혀 봐! 내 대답 방식도 유심히 살펴보고!</div></div>
                  {messages.map((msg, i) => (<motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-4 rounded-2xl shadow-sm text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>{msg.text}</div></motion.div>))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="relative"><input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="마법사에게 질문해보세요..." className="w-full p-5 pr-16 bg-white rounded-2xl border-2 border-gray-100 focus:border-brand-primary focus:outline-none transition-all shadow-inner" /><button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-brand-primary text-white rounded-xl shadow-lg hover:bg-red-500 transition-all"><Send className="w-5 h-5" /></button></form>
              </div>
              <div className="flex gap-4"><button onClick={() => setShowGuessModal(true)} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-gray-800 transition-all"><Trophy className="w-5 h-5" /> 정답 외치기!</button><div className="p-4 bg-white/80 rounded-2xl flex items-center gap-2 text-sm text-gray-500 border border-white"><Info className="w-5 h-5 text-brand-secondary" />힌트: {currentStage.hint}</div></div>
            </motion.div>
          )}
          {step === 4 && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card p-12 rounded-[3rem] text-center bg-white">
              <div className="w-24 h-24 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-8"><Trophy className="w-12 h-12 text-brand-primary" /></div>
              <h2 className="text-4xl font-black mb-6">마법 탐정 마스터 등극!</h2>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">축하합니다! AI의 비밀 물건과 프롬프트 비밀 규칙까지 모두 파헤치셨군요!</p>
              <button onClick={() => setStep(5)} className="w-full py-5 bg-brand-primary text-white rounded-2xl font-bold text-xl shadow-2xl hover:bg-red-500 transition-all flex items-center justify-center gap-2">단체 게임 가이드 & 주문 만들기 <ChevronRight className="w-6 h-6" /></button>
            </motion.div>
          )}
          {step === 5 && <GroupGuide onFinish={() => navigate('/')} onCopy={showToast} />}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showGuessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGuessModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl text-left">
              <h3 className="text-2xl font-black mb-6 text-center">정답을 맞춰보세요!</h3>
              <div className="space-y-6 mb-8">
                <div><label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">비밀 물건이 무엇인가요?</label><input type="text" value={guessObject} onChange={(e) => setGuessObject(e.target.value)} placeholder="예: 사과, 자동차..." className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all" /></div>
                <div><label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">AI의 비밀 규칙은 무엇인가요?</label><textarea value={guessRule} onChange={(e) => setGuessRule(e.target.value)} placeholder="예: 이모지로만 대답하기..." className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all h-24 resize-none" /></div>
              </div>
              {isSuccess === true && <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-2xl text-center font-bold">🎉 정답입니다! 다음 스테이지로!</div>}
              {isSuccess === false && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-2xl text-center font-bold">❌ 아쉬워요! 다시 생각해보세요.</div>}
              <div className="flex gap-4"><button onClick={() => setShowGuessModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all">취소</button><button disabled={isSubmitting} onClick={handleGuess} className="flex-[2] py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg hover:bg-red-500 transition-all disabled:opacity-50">{isSubmitting ? '처리 중...' : '제출하기'}</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReversePrompting;
