import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowLeft, Gamepad2, Users, Send, Loader2,
  BookOpen, Dice5, Swords, ShieldCheck, Heart, Share2, Clipboard, ChevronRight,
  Bot, Copy, X
} from 'lucide-react';

const GameCreatorGuide = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  
  // 기획 발전기 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    concept: 'card-battle',
    role: '',
    context: '',
    task: '',
    format: '말과 그림'
  });
  
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [submittingFeed, setSubmittingFeed] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) setProfile(data);
    } catch (err) {
      console.warn(err);
    }
  };

  const showToast = (message) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  // 실시간 AI 기획서 마법 발전기 엔진 (사용자 프롬프트 및 RCTF 조합 알고리즘)
  const handleGeneratePlan = (e) => {
    e.preventDefault();
    if (!formData.role.trim() || !formData.context.trim() || !formData.task.trim()) {
      showToast('⚠️ Role, Context, Task 조건은 필수 입력 사항입니다!');
      return;
    }

    setGenerating(true);
    setGeneratedPlan('');

    setTimeout(() => {
      const hostName = profile?.display_name || '마법 크리에이터';
      const gameTitle = formData.title.trim() || `⚡ RCTF: ${formData.role}의 ${formData.context.split(' ').pop() || '운명적'} 대결`;
      
      let prepItems = '🎲 다면체 주사위, 📝 양면 메모 패드, ✏️ 마법 펜슬';
      if (formData.concept === '땅따먹기') prepItems = '🗺️ 그리드 영토 양식지, 🎨 3색 마커 펜, 🪙 게임용 토큰';
      else if (formData.concept === '추리 게임') prepItems = '🕵️‍♂️ 비밀 단서 카드, 🔍 돋보기 안경 모형, ⏳ 60초 모래시계';
      else if (formData.concept === '신체 릴레이') prepItems = '⏱️ 디지털 스톱워치, 🚩 팀별 색깔 고깔, 👟 활동적 신발';

      const plannerReport = `# 🧙‍♂️ [AI Game Forge] 언플러그드 게임 기획서

> **"세계 최고의 창의적 게임 디자이너 AI"**가 조율하고 직조해 낸 독창적인 오프라인 RCTF 교구 게임 기획서입니다. 본 기획서의 지침을 따라 즉각 동료 마법사들과 실물 게임 제작에 착수할 수 있습니다.

---

### 1. 🏷️ 게임의 이름
* **"${gameTitle}"** (플레이어들의 호기심과 모험 본능을 극도로 자극하는 프리미엄 오락 기획 명칭)

### 2. 🔮 게임의 핵심 컨셉
* **"${formData.concept === 'card-battle' ? '카드 배틀 (Card Battle)' : formData.concept === '땅따먹기' ? '영토 확장 땅따먹기 (Territory Quest)' : formData.concept === '추리 게임' ? '비밀 해킹 추리 게임 (Mystery Hack)' : '신체 협동 릴레이 (Body Relay)'}"**
* AI가 출제한 조건 속에서 직관적인 규칙과 실물 도구(교구)를 활용하여 지적 능력과 협동심을 동시에 기르는 인터랙티브 오프라인 게임 장르입니다.

### 3. 🧬 RCTF 4대 속성 구성 요소
* **👤 Role (역할):** 플레이어는 **[ ${formData.role} ]**이(가) 되어 모험을 지휘합니다.
* **🌍 Context (상황):** 플레이어들은 현재 **[ ${formData.context} ]** 속에 갇힌 긴박한 운명적 위기에 놓이게 됩니다.
* **🎯 Task (수행):** 최종 승리를 쟁취하기 위해 **[ ${formData.task} ]** 미션을 완수해 내야 합니다.
* **🎨 Format (형식):** 모든 결과물과 마법 주문은 최종적으로 **[ ${formData.format} ]**의 정교한 아웃풋 형태로 상대방에게 입증 및 렌더링해야 합니다.

### 4. 🛠️ 게임의 준비물
* **${prepItems}** 및 팀별 명찰 덱

### 5. 📜 핵심 규칙 (Rule)
1. **역할 분담 및 세팅 (1단계):** 참가자들은 3~4인으로 팀을 조립하고 각자 **[ ${formData.role} ]** 캐릭터 카드를 수령하여 보드판 주변에 둘러앉습니다.
2. **시나리오 로드 (2단계):** 호스트(선생님)가 **[ ${formData.context} ]** 상황 카드를 오픈하여 전체 플레이어에게 공통 퀘스트 공간을 선포합니다.
3. **미션 브레인스톰 (3단계):** 각 팀은 제한 시간 5분 동안 머리를 맞대어 **[ ${formData.task} ]** 미션을 돌파하기 위해, 주변 준비물을 활용한 마법 프롬프트 문장을 직조합니다.
4. **결과물 시각화 및 입증 (4단계):** 완성된 마법 프롬프트 작문을 바탕으로, 플레이어들은 **[ ${formData.format} ]** 형태로 직접 제작하거나 연출하여 전체 학급에 발표합니다.
5. **퀴즈 판정 및 우승 (5단계):** 다른 팀원들과 호스트가 결과물의 기발함을 교차 검증하고, 가장 멋진 작문 및 연출을 선보인 팀이 최종 승리 점수(+50pt)를 쟁취합니다.

### 6. 🔥 이 게임의 '꿀잼' 포인트
* 플레이어들이 단순히 앉아서 이론만 배우는 것이 아니라, 실물 도구를 활용해 자신이 진짜 **[ ${formData.role} ]**이 된 것처럼 실감 나게 **[ ${formData.format} ]** 결과물을 빚어내고 대조하는 창의적인 대결 속에서 교육적 스릴이 폭발합니다.

---
*Created by AI Game Forge Planner Engine / Designer: ${hostName}*`;

      setGeneratedPlan(plannerReport);
      setGenerating(false);
      showToast('🔮 세계 최고의 AI 디자이너가 기획서를 완벽하게 조립해 냈습니다!');
    }, 2000);
  };

  // 기획서 자랑하기 (피드 자랑에 자동 기여)
  const handleContributeToFeed = async () => {
    if (!generatedPlan) return;
    setSubmittingFeed(true);
    try {
      const email = user?.email || 'anonymous@aklabs.creator';
      const displayName = profile?.display_name || email.split('@')[0];
      const gameTitle = formData.title.trim() || '내가 만든 신규 RCTF 마법 게임';

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user?.id || null,
          title: `🛠️ [게임 아케이드 창작소] ${gameTitle}`,
          content: generatedPlan,
          author_name: displayName,
          post_type: 'game',
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;
      showToast('📋 게임 공유 피드에 기획서가 자랑스럽게 등재되었습니다! 🎊');
    } catch (err) {
      console.error(err);
      showToast('❌ 게임 공유 피드 연동에 실패했습니다. (로컬 데이터 오버플로우)');
    } finally {
      setSubmittingFeed(false);
    }
  };

  // 클립보드 복사
  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(generatedPlan)
      .then(() => showToast('📋 기획서 전체가 클립보드에 무사히 복사되었습니다!'))
      .catch(() => showToast('복사에 실패했습니다.'));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col min-h-screen relative overflow-x-hidden font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.isVisible && (
          <motion.div 
            initial={{ y: -50, opacity: 0, x: '-50%' }} 
            animate={{ y: 20, opacity: 1, x: '-50%' }} 
            exit={{ y: -50, opacity: 0, x: '-50%' }} 
            className="fixed top-0 left-1/2 z-[200] px-6 py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold shadow-2xl text-xs sm:text-sm text-center max-w-[90vw]"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="sticky top-4 z-50 flex items-center justify-between px-6 py-4 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg mb-12">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-800 font-bold transition-all group text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 홈으로 가기
        </button>
        <div className="flex items-center gap-3">
          <Link 
            to="/play" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full border border-gray-100 shadow-sm text-xs font-black text-gray-700 transition-all cursor-pointer"
          >
            <Gamepad2 size={12} className="text-brand-primary" /> 게임 센터
          </Link>
          <span className="font-black text-xs sm:text-sm tracking-tight text-gray-800 hidden sm:inline">AI Game Forge</span>
        </div>
      </header>

      {/* Hero Intro */}
      <div className="text-center sm:text-left mb-12">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-100 rounded-full text-xs font-black text-purple-600 mb-4">
          <Sparkles size={14} /> AI Game Forge & Unplugged Creator
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 tracking-tight leading-tight mb-4">
          세상에 없던 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-brand-primary">AI 마법 게임 창작소</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-500 max-w-2xl leading-relaxed">
          AI와 프롬프트를 결합하여 나만의 인터랙티브 언플러그드 오프라인 게임을 설계해보세요. 빈칸을 채우면 세계 최고의 게임 디자이너 AI 엔진이 정교하고 상세한 정식 게임 기획서를 실시간으로 조립해 드립니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
        {/* Left Column: Bento Guide & Inputs */}
        <div className="lg:col-span-6 space-y-8">
          {/* Bento Grid Concept Explainer */}
          <div className="p-8 bg-purple-50/50 border border-purple-100 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-black text-purple-900 flex items-center gap-2">
              <BookOpen size={20} className="text-purple-600" /> RCTF 기반 게임 기획 설계서 가이드
            </h3>
            <p className="text-xs text-purple-700 leading-relaxed font-bold">
              컴퓨터나 스마트 기기 없이, 주변의 종이, 카드, 주사위만을 활용해 친구들과 즐거운 마법 훈련을 펼칠 수 있는 실물 교구형 시나리오 게임의 4대 뼈대입니다.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-purple-100/50 shadow-sm text-left">
                <span className="text-[10px] font-black text-purple-400 block mb-1">ROLE (역할)</span>
                <span className="text-xs font-black text-purple-800">플레이어들이 이입할 캐릭터나 마법 등급을 정의합니다.</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-purple-100/50 shadow-sm text-left">
                <span className="text-[10px] font-black text-purple-400 block mb-1">CONTEXT (상황)</span>
                <span className="text-xs font-black text-purple-800">게임이 시작되는 신비한 사건이나 제한 장소를 부여합니다.</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-purple-100/50 shadow-sm text-left">
                <span className="text-[10px] font-black text-purple-400 block mb-1">TASK (수행)</span>
                <span className="text-xs font-black text-purple-800">승리를 거두거나 방을 탈출하기 위한 팀별 행동 미션입니다.</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-purple-100/50 shadow-sm text-left">
                <span className="text-[10px] font-black text-purple-400 block mb-1">FORMAT (형식)</span>
                <span className="text-xs font-black text-purple-800">완성된 마법 주문을 말, 그림, 몸짓 등 어떤 형태로 상대에게 보여줄지 선언합니다.</span>
              </div>
            </div>
          </div>

          {/* Creation Form */}
          <form onSubmit={handleGeneratePlan} className="glass-card p-8 sm:p-10 rounded-[2.5rem] bg-white border border-gray-150 shadow-2xl space-y-6">
            <div className="flex items-center gap-2 mb-2 pb-4 border-b border-gray-100">
              <Swords className="text-purple-600" />
              <h3 className="text-xl font-black text-gray-800">AI 게임 대장간 가동하기</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-gray-600 mb-2 block">1. 게임 이름 (선택)</label>
                <input 
                  type="text" 
                  placeholder="미입력 시 마법 제목 자동 부여" 
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-purple-500 transition-all text-sm text-gray-800"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-600 mb-2 block">2. 핵심 컨셉 장르</label>
                <div className="relative">
                  <select 
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-purple-500 appearance-none text-sm text-gray-800"
                    value={formData.concept}
                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  >
                    <option value="card-battle">🃏 카드 배틀 결투</option>
                    <option value="땅따먹기">🗺️ 영토 확장 땅따먹기</option>
                    <option value="추리 게임">🕵️‍♂️ 비밀 코드 추리 해킹</option>
                    <option value="신체 릴레이">🏃‍♂️ 신체 협동 릴레이</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest border-l-4 border-purple-500 pl-2">RCTF 마법 파편 조립</h4>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAiHelper(p => !p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl text-[11px] font-black transition-all cursor-pointer"
                  >
                    <Bot size={12} /> AI 아이디어 도우미
                  </button>

                  {showAiHelper && (
                    <div className="absolute right-0 top-9 w-80 sm:w-[420px] bg-white border border-purple-100 rounded-2xl shadow-2xl z-10 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-purple-100">
                        <div className="flex items-center gap-2 text-purple-700 font-black text-xs">
                          <Bot size={14} /> RCTF 아이디어 도우미 프롬프트
                        </div>
                        <button type="button" onClick={() => setShowAiHelper(false)} className="text-purple-400 hover:text-purple-600 cursor-pointer">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                          아래 프롬프트를 복사해서 <strong>ChatGPT</strong>나 <strong>Gemini</strong>에 붙여넣고,
                          내 게임 아이디어를 설명해 보세요. AI가 Role·Context·Task·Format을 대신 채워줍니다!
                        </p>
                        <pre className="text-[10px] leading-relaxed bg-gray-50 border border-gray-200 rounded-xl p-3 whitespace-pre-wrap text-gray-600 max-h-64 overflow-y-auto font-sans">{`나는 오프라인 카드/보드 게임 아이디어가 있어.
아래 내 게임 아이디어를 기반으로 RCTF 게임 입력칸에 넣을 내용을 만들어줘.

💡 내 게임 아이디어:
(여기에 게임 아이디어를 자유롭게 설명해줘)

아래 4가지 항목을 구체적이고 창의적으로 작성해줘:

👤 Role (플레이어 역할):
→ 플레이어들이 이입할 캐릭터나 마법 직업
예) 2학년 3반 비밀 정보원, 침묵의 마법 헌터

🌍 Context (게임 상황):
→ 게임이 시작되는 위기 상황이나 무대
예) 와이파이가 차단된 비밀 방, 어두운 마법 도서관

🎯 Task (목표 미션):
→ 승리하기 위해 팀이 해야 할 행동
예) 숨겨진 마법 카드 5종 조합하기

🎨 Format (결과 형식):
→ 최종 결과물을 어떻게 표현할지
예) 말과 그림, 온몸 연출 동작, 즉흥 연기`}</pre>
                        <button
                          type="button"
                          onClick={() => {
                            const prompt = `나는 오프라인 카드/보드 게임 아이디어가 있어.\n아래 내 게임 아이디어를 기반으로 RCTF 게임 입력칸에 넣을 내용을 만들어줘.\n\n💡 내 게임 아이디어:\n(여기에 게임 아이디어를 자유롭게 설명해줘)\n\n아래 4가지 항목을 구체적이고 창의적으로 작성해줘:\n\n👤 Role (플레이어 역할):\n→ 플레이어들이 이입할 캐릭터나 마법 직업\n예) 2학년 3반 비밀 정보원, 침묵의 마법 헌터\n\n🌍 Context (게임 상황):\n→ 게임이 시작되는 위기 상황이나 무대\n예) 와이파이가 차단된 비밀 방, 어두운 마법 도서관\n\n🎯 Task (목표 미션):\n→ 승리하기 위해 팀이 해야 할 행동\n예) 숨겨진 마법 카드 5종 조합하기\n\n🎨 Format (결과 형식):\n→ 최종 결과물을 어떻게 표현할지\n예) 말과 그림, 온몸 연출 동작, 즉흥 연기`;
                            navigator.clipboard.writeText(prompt)
                              .then(() => { showToast('✅ 프롬프트 복사 완료! ChatGPT나 Gemini에 붙여넣어 보세요.'); setShowAiHelper(false); })
                              .catch(() => showToast('복사 실패. 직접 선택해서 복사해 주세요.'));
                          }}
                          className="mt-3 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <Copy size={12} /> 프롬프트 복사하기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block">👤 Role (플레이어의 고유 마법 직업이나 신분)</label>
                <input 
                  type="text" 
                  placeholder="예: 2학년 3반 비밀 정보원, 침묵의 마법 헌터" 
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-purple-500 transition-all text-sm text-gray-800"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block">🌍 Context (게임의 무대가 되는 위기 상황 및 제한적 환경)</label>
                <input 
                  type="text" 
                  placeholder="예: 와이파이가 차단된 비밀 방, 어두컴컴한 마법 도서관" 
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-purple-500 transition-all text-sm text-gray-800"
                  required
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 mb-1.5 block">🎯 Task (목표 미션 및 승리 행동)</label>
                  <input 
                    type="text" 
                    placeholder="예: 숨겨진 마법 카드 5종 조합하기" 
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-purple-500 transition-all text-sm text-gray-800"
                    required
                    value={formData.task}
                    onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-gray-500 mb-1.5 block">🎨 Format (최종 연출 형태)</label>
                  <input 
                    type="text" 
                    placeholder="예: 즉흥 말과 스케치 그림, 온몸 연출 동작" 
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-purple-500 transition-all text-sm text-gray-800"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-4.5 bg-gradient-to-r from-purple-600 to-brand-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-100 transition-all flex items-center justify-center gap-2 border-0 cursor-pointer active:scale-95 hover:brightness-105"
            >
              {generating ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} /> 🔮 AI 마법 게임 기획서 조립하기</>}
            </button>
          </form>
        </div>

        {/* Right Column: AI Output Viewer */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] bg-gray-900 border border-gray-800 flex-1 flex flex-col text-left shadow-2xl relative overflow-hidden min-h-[500px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-teal-400 to-brand-primary" />
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
              <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                <Dice5 size={14} /> AI Game Forge Output Viewer
              </span>
              
              {generatedPlan && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCopyClipboard}
                    className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer border-0"
                    title="기획서 복사"
                  >
                    <Clipboard size={16} />
                  </button>
                  <button 
                    onClick={handleContributeToFeed}
                    disabled={submittingFeed}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-md"
                    title="자랑 피드에 올리기"
                  >
                    {submittingFeed ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    자랑 피드 공유
                  </button>
                </div>
              )}
            </div>

            {generating ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-12 space-y-4">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1 }} 
                  className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" 
                />
                <p className="text-purple-400 font-bold text-lg">세계 최고의 게임 디자이너 AI 소환 중...</p>
                <p className="text-xs text-gray-500">RCTF 속성을 정밀 분해하여 극적으로 재미있는 게임 룰을 작문하는 중입니다</p>
              </div>
            ) : generatedPlan ? (
              <div className="flex-1 overflow-y-auto no-scrollbar max-h-[580px] text-gray-300 leading-relaxed space-y-6 text-sm">
                <div className="whitespace-pre-wrap select-all font-mono leading-relaxed bg-black/30 p-6 rounded-2xl border border-gray-800/80">
                  {generatedPlan}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-12 space-y-4 text-gray-500">
                <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center text-gray-600">
                  <Swords size={28} />
                </div>
                <h4 className="text-lg font-black text-gray-400">대기 중인 기획서가 없습니다</h4>
                <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
                  좌측의 RCTF 마법 슬롯에 키워드를 채워 넣고 생성 버튼을 누르면 기획 대장간이 이곳에 상세 레포트를 렌더링해 줍니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto text-center border-t border-gray-150/40 pt-12 pb-6">
        <p className="text-gray-400 text-sm mb-4">© 2026 AK Labs Prompt Game. All rights reserved.</p>
        <a 
          href="https://litt.ly/aklabs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-brand-secondary font-bold hover:underline"
        >
          아크랩스 더 알아보기
        </a>
      </footer>
    </div>
  );
};

export default GameCreatorGuide;
