import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { 
  Sparkles, ArrowLeft, Play, Info, Calendar, User, 
  ShieldAlert, BookOpen, Clock, Heart, Award, ArrowRight, Gamepad2
} from 'lucide-react';

const DEFAULT_INTRO_DATA = {
  'reverse-prompting': {
    title: '프롬프트 스무고개',
    description: 'AI가 출력한 답변 결과를 분석하여, 사용자가 주입한 최상의 비밀 프롬프트를 역추적하는 고차원 심리 마법 게임!',
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    detailed_intro: `### 🧙‍♂️ 게임의 목적 및 가치\nAI가 생성한 텍스트 힌트만 보고 원래 작성되었던 마법의 프롬프트를 역추적하여 맞춰보는 게임입니다. 이를 통해 AI가 어떤 프롬프트 패턴에 어떻게 반응하고 사고하는지 깊이 있게 추론해낼 수 있는 **'프롬프트 분석력'**과 **'역설계(Reverse Engineering) 감각'**을 재미있게 터득하게 됩니다.\n\n### 📜 게임 규칙 및 방법\n1. **문제 확인**: 선생님(호스트) 또는 AI가 무작위의 답변 결과 텍스트를 출제합니다.\n2. **추론 및 힌트**: 출제된 문장에 숨은 '역할(Role)', '상황(Context)', '조건(Task)' 등의 마법 가닥을 정밀하게 분해해 봅니다.\n3. **정답 대조**: AI와 실시간으로 스무고개식 대화를 나누며 원본 프롬프트 핵심 키워드를 유추하여 최종 승리 마법을 맞춰내면 성공입니다!`
  },
  'few-shot-lab': {
    title: 'Few-Shot 퓨샷 트레이닝 센터',
    description: '작은 정서적 단서와 퓨샷(Few-shot) 예시 데이터 튜닝을 통해 무미건조한 AI에게 특별한 성격과 생명을 불어넣는 마법 랩!',
    thumbnail_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80',
    detailed_intro: `### 🧪 게임의 목적 및 가치\n단 하나의 명령만으로는 AI의 출력 태도와 억양, 성향을 완벽하게 길들이기 어렵습니다. 몇 가지 정교하게 작성된 입/출력 쌍(예시)을 학습시키는 **Few-shot Prompting 기술**을 훈련하여, AI에게 독특한 말투(예: 츤데레, 로봇, K-Pop 아이돌 등)를 장착해주는 감성 바이브 엔지니어링 능력을 기릅니다.\n\n### 📜 게임 규칙 및 방법\n1. **감성 미션 배정**: AI에게 주입해야 할 독특한 페르소나 및 정서 목표가 부여됩니다.\n2. **예시 데이터 튜닝**: 사용자는 AI가 이해할 수 있는 2~3가지의 대화 예시 쌍을 텍스트로 다듬어 주입합니다.\n3. **마법 테스트**: 최종 트레이닝된 AI와 대화를 시도하여, 주어진 감성 미션을 얼마나 완벽하게 충족하며 응답하는지 실시간 검증을 통과해야 합니다.`
  },
  'rctf-battle': {
    title: 'RCTF 카드 배틀',
    description: '선생님이 돌린 룰렛 릴에서 튀어나온 랜덤 카드 조합(R, C, T, F)을 활용해 최강의 마법 프롬프트 문장을 직조해 내는 실시간 멀티플레이어 배틀!',
    thumbnail_url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=800&q=80',
    detailed_intro: `### ⚔️ 게임의 목적 및 가치\n프롬프트를 이끌어가는 가장 강력한 4대 마법 속성인 **Role(역할), Context(상황), Task(수행), Format(형식)**을 무작위로 배정받았을 때, 이에 당황하지 않고 논리적이고 풍부하며 기발한 연결 문장을 직조해 내는 **'창의적 문장 설계력'**을 실시간 경쟁 속에서 함양하는 스릴 넘치는 교구형 게임입니다.\n\n### 📜 게임 규칙 및 방법\n1. **잭팟 스핀**: 선생님이 게임 세션을 열고 슬롯을 회전시키면, 각 팀 브라우저 화면에 실시간으로 고유한 [R, C, T, F] 퀘스트가 배정됩니다.\n2. **프롬프트 작문**: 배정받은 4대 조건을 모두 포함한 아름답고 완벽한 프롬프트 마법 주문을 한글로 직조해 냅니다.\n3. **AI 이미지 퀴즈 제출**: 조합한 프롬프트를 AI에 돌려 나온 환상적인 이미지를 캡처/주소 형태로 선생님 대시보드에 실시간 전송합니다.\n4. **정답 대결**: 선생님이 이미지를 띄우면 다른 팀원들이 원래 어떤 R/C/T/F 카드로 뽑힌 그림이었을지 토론해 맞추고 점수를 나누어 획득합니다.`
  },
  'prompt-evolution': {
    title: '단계별 업그레이드',
    description: '너무나도 막연하고 짧았던 초보자의 명령을 5단계 진화식을 거치며 현업 시니어 수준의 최강 프롬프트로 다듬어나가는 설계 마법!',
    thumbnail_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    detailed_intro: `### 📈 게임의 목적 및 가치\n처음 프롬프트를 배우면 "이거 알려줘" 처럼 너무 막연하게 명령을 적기 마련입니다. 구체적인 조건, 예외 제약 사항, 단계별 사고 방식(Chain of Thought) 등의 뼈대를 얹어가며 프롬프트가 어떻게 극적으로 우수하게 변해가는지 단계를 거쳐 체득하는 **'프롬프트 정밀 튜닝 능력'**을 길러줍니다.\n\n### 📜 게임 규칙 및 방법\n1. **기초 껍질(1단계)**: 가장 미숙하고 얕은 초기 형태의 질문 카드가 주어집니다.\n2. **마법 조각 결합(2~4단계)**: '답변 길이 제한', '특정 어조 지정', '출력 서식 추가' 등의 진화 파편을 주입하여 글을 점점 길고 단단하게 재설계합니다.\n3. **최강 진화(5단계)**: 5단계를 거쳐 변모된 프롬프트를 최종 AI에 입력하여, 초기 질문 대비 AI의 답변 품질이 얼마나 비약적으로 정교해졌는지 두 눈으로 대조하여 검증합니다.`
  }
};

const parseMarkdownInline = (text) => {
  const regex = /\*\*(.*?)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-extrabold text-brand-primary bg-brand-primary/5 px-1 py-0.5 rounded">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const parseMarkdownText = (markdownText) => {
  if (!markdownText) return null;
  
  const lines = markdownText.split('\n');
  const elements = [];
  let currentList = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-none pl-1 space-y-2.5 my-3">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      flushList();
      return;
    }

    if (trimmed.startsWith('###')) {
      flushList();
      elements.push(
        <h3 key={`h3-${index}`} className="text-lg sm:text-xl font-black text-gray-800 pt-6 border-b border-gray-100 pb-2 flex items-center gap-2 mt-6 mb-2">
          <Sparkles size={16} className="text-brand-primary" />
          {trimmed.replace('###', '').trim()}
        </h3>
      );
      return;
    }

    // 이미지: ![alt](url)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushList();
      elements.push(
        <img
          key={`img-${index}`}
          src={imgMatch[2]}
          alt={imgMatch[1] || ''}
          className="block mx-auto max-w-full max-h-96 rounded-2xl my-4 object-contain shadow-md"
        />
      );
      return;
    }

    const isBullet = trimmed.startsWith('*') || trimmed.startsWith('-');
    const isNumbered = /^\d+\./.test(trimmed);

    if (isBullet || isNumbered) {
      const cleanLine = trimmed.replace(/^[\*\-]\s*/, '').replace(/^\d+\.\s*/, '');
      const prefix = isBullet ? '⚡' : (trimmed.match(/^\d+/)?.[0] || '1') + '.';
      
      currentList.push(
        <li key={`li-${index}`} className="text-sm text-gray-600 leading-relaxed font-bold flex items-start gap-2.5">
          <span className="text-brand-primary font-black shrink-0 mt-0.5">{prefix}</span>
          <span className="flex-1">{parseMarkdownInline(cleanLine)}</span>
        </li>
      );
    } else {
      flushList();
      elements.push(
        <p key={`p-${index}`} className="whitespace-pre-line text-sm text-gray-600 leading-relaxed font-bold my-3">
          {parseMarkdownInline(line)}
        </p>
      );
    }
  });

  flushList();

  return elements;
};

const GameIntro = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [introData, setIntroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchGameIntro();
    checkAdminAuth();
  }, [gameId]);

  const checkAdminAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) {
          setProfile(data);
          if (data.role === 'ADMIN') {
            sessionStorage.setItem('rctf_admin_auth', 'true');
          }
        } else {
          const isAdminEmail = ['mosebb@gmail.com', 'codingclubak03@gmail.com'].includes(session.user.email);
          const userRole = (isAdminEmail || sessionStorage.getItem('rctf_admin_auth') === 'true') ? 'ADMIN' : 'USER';

          
          if (userRole === 'ADMIN') {
            sessionStorage.setItem('rctf_admin_auth', 'true');
          }
          
          setProfile({
            display_name: sessionStorage.getItem('user_display_name') || session.user.email.split('@')[0],
            role: userRole
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGameIntro = async () => {
    setLoading(true);

    try {
      // 항상 DB 먼저 조회 (어드민 수정 반영)
      const { data, error } = await supabase
        .from('game_intros')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error || !data) throw new Error('Data not found');
      setIntroData(data);
    } catch (err) {
      console.warn('Supabase game_intros 데이터 조회 실패, 내장 기본 가이드라인으로 안전하게 구동합니다.');
      const fallback = DEFAULT_INTRO_DATA[gameId] || {
        title: '신규 아케이드 게임',
        description: '새로운 프롬프트 아케이드 교육용 콘텐츠가 한창 준비 중입니다!',
        thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        detailed_intro: '### 🧙‍♂️ 게임 준비 중\n상세한 게임 규칙과 설명서를 관리자가 에디터를 통해 등록하고 준비하고 있는 상태입니다. 조금만 기다려 주시거나, 관리자 계정으로 진입하여 소개 내용을 직접 개설해 주세요!'
      };
      setIntroData(fallback);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F9] flex flex-col justify-center items-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full mb-4" />
        <p className="text-xs text-gray-400 font-bold">마법 게임 설명서 전송 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 min-h-screen flex flex-col font-sans relative overflow-x-hidden">
      <header className="sticky top-4 z-50 flex items-center justify-between px-6 py-4 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg mb-12">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-800 font-bold transition-all group text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 마법학교 메인
        </button>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/play" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full border border-gray-100 hover:border-gray-250 shadow-sm hover:shadow text-[10px] sm:text-xs font-black text-gray-700 transition-all cursor-pointer"
            title="게임 센터로 이동"
          >
            <Gamepad2 size={12} className="text-brand-primary" /> 게임 센터
          </Link>

          {profile && (
            <Link 
              to="/mypage"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full border border-gray-100 hover:border-gray-250 shadow-sm hover:shadow text-[10px] sm:text-xs font-black text-gray-700 max-w-[120px] sm:max-w-none truncate transition-all cursor-pointer"
              title="마이 포탈로 이동"
            >
              <User size={12} className="text-brand-primary" />
              {profile.display_name || '크리에이터'}
            </Link>
          )}

          {(profile?.role === 'ADMIN' || sessionStorage.getItem('rctf_admin_auth') === 'true') && (
            <Link 
              to={`/admin/game-intro/edit?gameId=${gameId}`}
              className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 rounded-xl text-[10px] font-black text-orange-600 border border-orange-200 transition-colors"
            >
              어드민 편집
            </Link>
          )}
          <span className="font-black text-xs sm:text-sm tracking-tight text-gray-800 hidden sm:inline">Playcraft</span>
        </div>
      </header>


      {/* Hero Header Card Container */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card bg-white rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden flex-1 flex flex-col"
      >
        {/* 썸네일 이미지 히어로 영역 */}
        <div className="w-full h-48 sm:h-72 relative overflow-hidden bg-gray-900">
          <img 
            src={introData.thumbnail_url} 
            alt={introData.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 text-white space-y-2">
            <span className="px-3 py-1 bg-brand-primary text-white text-[10px] font-black uppercase rounded-full tracking-widest shadow-md">
              Playcraft
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none drop-shadow-md">
              {introData.title} 소개서
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-10 flex-1 flex flex-col justify-between">
          <div className="space-y-8">
            {/* 한줄 요약 아코디언/배너 */}
            <div className="p-5 bg-brand-primary/[0.03] border-l-4 border-brand-primary rounded-r-3xl leading-relaxed">
              <p className="text-sm font-black text-gray-700">{introData.description}</p>
            </div>

            {/* 핵심 스펙 벤토 덱 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                <BookOpen className="text-brand-primary shrink-0" size={20} />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase leading-none">학습 영역</p>
                  <p className="text-xs font-black text-gray-700 mt-1">프롬프트 엔지니어링</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                <Clock className="text-brand-secondary shrink-0" size={20} />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase leading-none">예상 소요 시간</p>
                  <p className="text-xs font-black text-gray-700 mt-1">10분 ~ 25분</p>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                <Award className="text-brand-accent shrink-0" size={20} />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase leading-none">크리에이터 난이도</p>
                  <p className="text-xs font-black text-gray-700 mt-1">초급 ➡️ 중급 크리에이터</p>
                </div>
              </div>
            </div>

            {/* 상세 설명 (Markdown Parser - 인라인 굵은글씨 및 리스트 동적 렌더링 지원) */}
            <div className="prose max-w-none text-gray-600 text-sm leading-relaxed space-y-2 pt-4 border-t border-gray-50">
              {parseMarkdownText(introData.detailed_intro)}
            </div>
          </div>

          {/* 최종 마법 게임 시작하기 버튼 */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/game/${gameId}`)}
              className="w-full sm:w-auto px-12 py-5 bg-gray-900 hover:bg-brand-primary text-white rounded-[2rem] font-black text-base sm:text-lg shadow-xl shadow-gray-200 transition-colors flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play size={20} fill="currentColor" /> AI 게임 아케이드 개시하기
            </motion.button>
            <p className="text-[10px] text-gray-400 font-bold mt-2">버튼을 클릭하면 즉시 대화형 실시간 게임 화면으로 진입합니다.</p>
          </div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="mt-24 text-center border-t border-gray-100 pt-12 pb-6">
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

export default GameIntro;
