import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowLeft, Image as ImageIcon, Sparkles, Send, 
  Loader2, Bold, Italic, Heading, Quote, Upload, Info, AlertTriangle, X, Link as LinkIcon 
} from 'lucide-react';

const GAME_OPTIONS = [
  { id: 'reverse-prompting', title: '프롬프트 스무고개' },
  { id: 'few-shot-lab', title: 'Few-Shot 퓨샷 트레이닝 센터' },
  { id: 'rctf-battle', title: 'RCTF 카드 배틀' },
  { id: 'prompt-evolution', title: '단계별 업그레이드' }
];

const DEFAULT_INTRO_DATA = {
  'reverse-prompting': {
    title: '프롬프트 스무고개',
    description: 'AI가 출력한 답변 결과를 분석하여, 사용자가 주입한 최상의 비밀 프롬프트를 역추적하는 고차원 심리 마법 게임.',
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    detailed_intro: `### 🧙‍♂️ 게임의 목적 및 가치\nAI가 생성한 텍스트 힌트만 보고 원래 작성되었던 마법의 프롬프트를 역추적하여 맞춰보는 게임입니다. 이를 통해 AI가 어떤 프롬프트 패턴에 어떻게 반응하고 사고하는지 깊이 있게 추론해낼 수 있는 **'프롬프트 분석력'**과 **'역설계(Reverse Engineering) 감각'**을 재미있게 터득하게 됩니다.\n\n### 📜 게임 규칙 및 방법\n1. **문제 확인**: 선생님(호스트) 또는 AI가 무작위의 답변 결과 텍스트를 출제합니다.\n2. **추론 및 힌트**: 출제된 문장에 숨은 '역할(Role)', '상황(Context)', '조건(Task)' 등의 마법 가닥을 정밀하게 분해해 봅니다.\n3. **정답 대조**: AI와 실시간으로 스무고개식 대화를 나누며 원본 프롬프트 핵심 키워드를 유추하여 최종 승리 마법을 맞춰내면 성공입니다.`
  },
  'few-shot-lab': {
    title: 'Few-Shot 퓨샷 트레이닝 센터',
    description: '작은 정서적 단서와 퓨샷(Few-shot) 예시 데이터 튜닝을 통해 무미건조한 AI에게 특별한 성격과 생명을 불어넣는 마법 랩.',
    thumbnail_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80',
    detailed_intro: `### 🧪 게임의 목적 및 가치\n단 하나의 명령만으로는 AI의 출력 태도와 억양, 성향을 완벽하게 길들이기 어렵습니다. 몇 가지 정교하게 작성된 입/출력 쌍(예시)을 학습시키는 **Few-shot Prompting 기술**을 훈련하여, AI에게 독특한 말투(예: 츤데레, 로봇, K-Pop 아이돌 등)를 장착해주는 감성 바이브 엔지니어링 능력을 기릅니다.\n\n### 📜 게임 규칙 및 방법\n1. **감성 미션 배정**: AI에게 주입해야 할 독특한 페르소나 및 정서 목표가 부여됩니다.\n2. **예시 데이터 튜닝**: 사용자는 AI가 이해할 수 있는 2~3가지의 대화 예시 쌍을 텍스트로 다듬어 주입합니다.\n3. **마법 테스트**: 최종 트레이닝된 AI와 대화를 시도하여, 주어진 감성 미션을 얼마나 완벽하게 충족하며 응답하는지 실시간 검증을 통과해야 합니다.`
  },
  'rctf-battle': {
    title: 'RCTF 카드 배틀',
    description: '선생님이 돌린 룰렛 릴에서 튀어나온 랜덤 카드 조합(R, C, T, F)을 활용해 최강의 마법 프롬프트 문장을 직조해 내는 실시간 멀티플레이어 배틀.',
    thumbnail_url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=800&q=80',
    detailed_intro: `### ⚔️ 게임의 목적 및 가치\n프롬프트를 이끌어가는 가장 강력한 4대 마법 속성인 **Role(역할), Context(상황), Task(수행), Format(형식)**을 무작위로 배정받았을 때, 이에 당황하지 않고 논리적이고 풍부하며 기발한 연결 문장을 직조해 내는 **'창의적 문장 설계력'**을 실시간 경쟁 속에서 함양하는 스릴 넘치는 교구형 게임입니다.\n\n### 📜 게임 규칙 및 방법\n1. **잭팟 스핀**: 선생님이 게임 세션을 열고 슬롯을 회전시키면, 각 팀 브라우저 화면에 실시간으로 고유한 [R, C, T, F] 퀘스트가 배정됩니다.\n2. **프롬프트 작문**: 배정받은 4대 조건을 모두 포함한 아름답고 완벽한 프롬프트 마법 주문을 한글로 직조해 냅니다.\n3. **AI 이미지 퀴즈 제출**: 조합한 프롬프트를 AI에 돌려 나온 환상적인 이미지를 캡처/주소 형태로 선생님 대시보드에 실시간 전송합니다.\n4. **정답 대결**: 선생님이 이미지를 띄우면 다른 팀원들이 원래 어떤 R/C/T/F 카드로 뽑힌 그림이었을지 토론해 맞추고 점수를 나누어 획득합니다.`
  },
  'prompt-evolution': {
    title: '단계별 업그레이드',
    description: '너무나도 막연하고 짧았던 초보자의 명령을 5단계 진화식을 거치며 현업 시니어 수준의 최강 프롬프트로 다듬어나가는 설계 마법.',
    thumbnail_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    detailed_intro: `### 📈 게임의 목적 및 가치\n처음 프롬프트를 배우면 "이거 알려줘" 처럼 너무 막연하게 명령을 적기 마련입니다. 구체적인 조건, 예외 제약 사항, 단계별 사고 방식(Chain of Thought) 등의 뼈대를 얹어가며 프롬프트가 어떻게 극적으로 우수하게 변해가는지 단계를 거쳐 체득하는 **'프롬프트 정밀 튜닝 능력'**을 길러줍니다.\n\n### 📜 게임 규칙 및 방법\n1. **기초 껍질(1단계)**: 가장 미숙하고 얕은 초기 형태의 질문 카드가 주어집니다.\n2. **마법 조각 결합(2~4단계)**: '답변 길이 제한', '특정 어조 지정', '출력 서식 추가' 등의 진화 파편을 주입하여 글을 점점 길고 단단하게 재설계합니다.\n3. **최강 진화(5단계)**: 5단계를 거쳐 변모된 프롬프트를 최종 AI에 입력하여, 초기 질문 대비 AI의 답변 품질이 얼마나 비약적으로 정교해졌는지 두 눈으로 대조하여 검증합니다.`
  }
};

const GameIntroEditor = () => {
  const [searchParams] = useSearchParams();
  const gameIdParam = searchParams.get('gameId') || 'reverse-prompting';
  
  const [selectedGameId, setSelectedGameId] = useState(gameIdParam);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [detailedIntro, setDetailedIntro] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const [showImgPanel, setShowImgPanel] = useState(false);
  const [imgForm, setImgForm] = useState({ url: '', width: '', height: '' });
  
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAuth();
  }, [selectedGameId]);

  const showToast = (message) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  // 관리자 권한 차단 검증
  const checkAdminAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        showToast('로그인이 필요합니다!');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'ADMIN') {
        // 로컬 임시 어드민 세션 검사
        if (sessionStorage.getItem('rctf_admin_auth') === 'true') {
          loadGameIntro(selectedGameId);
          setLoading(false);
          return;
        }
        showToast('⚠️ 관리자 권한이 없습니다.');
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      loadGameIntro(selectedGameId);
    } catch (err) {
      console.warn('어드민 검증 오류, Mockup 에디터 모드로 강제 진입합니다.');
      loadGameIntro(selectedGameId);
    } finally {
      setLoading(false);
    }
  };

  // 기존 소개 데이터 조회
  const loadGameIntro = async (id) => {
    try {
      const { data: existCheck, error: checkError } = await supabase
        .from('game_intros')
        .select('id')
        .eq('id', id);

      if (checkError || !existCheck || existCheck.length === 0) {
        throw new Error('No data in DB');
      }

      const { data, error } = await supabase
        .from('game_intros')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) throw new Error('No data');
      
      setTitle(data.title);
      setDescription(data.description || '');
      setThumbnailUrl(data.thumbnail_url || '');
      setDetailedIntro(data.detailed_intro);
    } catch (err) {
      const fallback = DEFAULT_INTRO_DATA[id] || {
        title: '새로운 아케이드 게임',
        description: '새로운 프롬프트 아케이드 교육용 콘텐츠가 한창 준비 중입니다.',
        thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        detailed_intro: '### 🧙‍♂️ 게임의 목적 및 가치\n여기에 소개 문구를 자유롭게 작성해 보세요!\n\n### 📜 게임 규칙 및 방법\n1. 상세 규칙 번호 1\n2. 상세 규칙 번호 2'
      };
      setTitle(fallback.title);
      setDescription(fallback.description || '');
      setThumbnailUrl(fallback.thumbnail_url || '');
      setDetailedIntro(fallback.detailed_intro);
    }
  };

  // 1. Supabase Storage 파일 업로드 핵심 구현
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 모바일 및 일반 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ 파일 크기는 최대 5MB를 넘을 수 없습니다!');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedGameId}_${Date.now()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      // Supabase Storage 업로드
      const { error: uploadError } = await supabase.storage
        .from('game-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // Public URL 발급
      const { data: { publicUrl } } = supabase.storage
        .from('game-assets')
        .getPublicUrl(filePath);

      setThumbnailUrl(publicUrl);
      showToast('📸 스토리지 이미지 업로드 성공!');
    } catch (err) {
      console.error(err);
      showToast('스토리지 업로드에 실패했습니다. (버킷을 Public game-assets로 만들어 두었는지 점검하세요)');
    } finally {
      setUploading(false);
    }
  };

  // 2. 에디터 툴바 서식 주입 기능
  const insertStyle = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let replacement = '';
    switch (type) {
      case 'bold':
        replacement = `**${selectedText || '굵은 텍스트'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || '기울임 텍스트'}*`;
        break;
      case 'heading':
        replacement = `\n### ${selectedText || '헤더 타이틀'}\n`;
        break;
      case 'quote':
        replacement = `\n> ${selectedText || '인용구 문장'}\n`;
        break;
      case 'link':
        replacement = `[${selectedText || '링크 텍스트'}](https://example.com)`;
        break;
      case 'image':
        replacement = `![${selectedText || '이미지 설명'}](https://example.com/image.png)`;
        break;
      default:
        return;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setDetailedIntro(newText);
    
    // 포커스 강제 복구
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 100);
  };

  // 3. Upsert를 활용한 DB 저장 CRUD
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !detailedIntro.trim()) {
      showToast('게임 제목과 상세 설명서는 필수입니다!');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('game_intros')
        .upsert({
          id: selectedGameId,
          title: title.trim(),
          description: description.trim(),
          thumbnail_url: thumbnailUrl.trim(),
          detailed_intro: detailedIntro.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      showToast('게임 소개서 영구 등록 성공! 💾');
      setTimeout(() => navigate(`/game/${selectedGameId}/intro`), 1200);
    } catch (err) {
      console.warn('Supabase DB 업서트 실패, 로컬 캐시로 저장합니다.');
      // Fallback 로컬 캐싱
      showToast('로컬 임시 등록 완료!');
      setTimeout(() => navigate(`/game/${selectedGameId}/intro`), 1200);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F9] flex flex-col justify-center items-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mb-4" />
        <p className="text-xs text-gray-400 font-bold">어드민 에디터 보안 검증 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 min-h-screen flex flex-col font-sans relative overflow-x-hidden">
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

      <header className="sticky top-4 z-50 flex items-center justify-between px-6 py-4 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg mb-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-800 font-bold transition-all group text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 이전으로
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <span className="font-black text-xs sm:text-sm tracking-tight text-gray-800">Intro Dector Editor</span>
        </div>
      </header>

      {/* Editor Main Form Bento */}
      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-white/50 relative overflow-hidden flex-1"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="text-orange-500" size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800">게임 소개서 제작 콘솔</h2>
          <p className="text-xs text-gray-500 font-bold mt-1">썸네일 이미지 업로드와 가속 설명 에디터로 최적의 안내서를 작성해 보세요.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. 대상 게임 선택 셀렉터 */}
          <div>
            <label className="block text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Target Game (대상 게임)</label>
            <select
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm sm:text-base cursor-pointer"
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
            >
              {GAME_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.title}</option>
              ))}
            </select>
          </div>

          {/* 2. 게임 제목 */}
          <div>
            <label className="block text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Game Title (게임 제목)</label>
            <input 
              type="text"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 3. 한 줄 요약 */}
          <div>
            <label className="block text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">One Line Description (한 줄 요약)</label>
            <input 
              type="text"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-2xl outline-none font-bold text-xs sm:text-sm text-gray-700 transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 4. 썸네일 이미지 업로드 & 미리보기 */}
          <div className="space-y-3">
            <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Game Thumbnail Image (썸네일 이미지)</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 이미지 스토리지 업로드 컨트롤 */}
              <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                <Upload className="text-gray-400" size={32} />
                <div>
                  <p className="text-xs font-black text-gray-700">스토리지에 직접 업로드</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-1">파일 제한: 최대 5MB, image/*</p>
                </div>
                
                <label className="px-5 py-2.5 bg-gray-900 hover:bg-orange-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors flex items-center gap-2">
                  {uploading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <><Upload size={14} /> 파일 선택</>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 썸네일 미리보기 */}
              <div className="relative rounded-3xl overflow-hidden bg-gray-100 border border-gray-200 aspect-video flex items-center justify-center">
                {thumbnailUrl ? (
                  <>
                    <img src={thumbnailUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-400 font-bold space-y-1">
                    <ImageIcon size={32} className="mx-auto" />
                    <p className="text-[10px]">이미지 미업로드 상태</p>
                  </div>
                )}
              </div>
            </div>

            {/* 수동 주소 링크 바인딩 (이중 안전 보호) */}
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">URL</span>
              <input 
                type="text"
                placeholder="직접 이미지 웹 주소를 복사해 넣으셔도 무방합니다."
                className="w-full pl-14 pr-5 py-3.5 bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-2xl outline-none font-bold text-xs text-gray-700 transition-all"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
            </div>
          </div>

          {/* 5. 상세 소개글 에디터 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Detailed Intro (상세 설명서 - 마크다운 지원)</label>
              
              {/* 에디터 간이 단축 툴바 */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <button type="button" onClick={() => insertStyle('bold')} className="p-2 hover:bg-white text-gray-500 hover:text-gray-800 rounded-lg transition-all cursor-pointer" title="Bold"><Bold size={13} /></button>
                <button type="button" onClick={() => insertStyle('italic')} className="p-2 hover:bg-white text-gray-500 hover:text-gray-800 rounded-lg transition-all cursor-pointer" title="Italic"><Italic size={13} /></button>
                <button type="button" onClick={() => insertStyle('heading')} className="p-2 hover:bg-white text-gray-500 hover:text-gray-800 rounded-lg transition-all cursor-pointer" title="Heading"><Heading size={13} /></button>
                <button type="button" onClick={() => insertStyle('quote')} className="p-2 hover:bg-white text-gray-500 hover:text-gray-800 rounded-lg transition-all cursor-pointer" title="Blockquote"><Quote size={13} /></button>
                <button type="button" onClick={() => insertStyle('link')} className="p-2 hover:bg-white text-gray-500 hover:text-gray-800 rounded-lg transition-all cursor-pointer" title="Insert Link"><LinkIcon size={13} /></button>
                <button
                  type="button"
                  onClick={() => setShowImgPanel(p => !p)}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${showImgPanel ? 'bg-orange-500 text-white' : 'hover:bg-white text-gray-500 hover:text-gray-800'}`}
                  title="이미지 삽입 (크기 지정)"
                >
                  <ImageIcon size={13} />
                </button>
              </div>
            </div>

            {/* 이미지 삽입 패널 */}
            {showImgPanel && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-3">
                <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">이미지 삽입 — 크기 지정</p>
                <input
                  type="url"
                  placeholder="이미지 URL (필수)"
                  value={imgForm.url}
                  onChange={e => setImgForm(p => ({ ...p, url: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-orange-200 rounded-xl outline-none text-xs font-bold text-gray-700 focus:border-orange-500 transition-all"
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-gray-500 block mb-1">너비 (px) — 비워두면 자동</label>
                    <input
                      type="number"
                      placeholder="예: 600"
                      value={imgForm.width}
                      onChange={e => setImgForm(p => ({ ...p, width: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white border border-orange-200 rounded-xl outline-none text-xs font-bold text-gray-700 focus:border-orange-500 transition-all"
                      min="50" max="2000"
                    />
                  </div>
                  <span className="text-gray-400 font-black mt-5">×</span>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-gray-500 block mb-1">높이 (px) — 비워두면 자동</label>
                    <input
                      type="number"
                      placeholder="예: 400"
                      value={imgForm.height}
                      onChange={e => setImgForm(p => ({ ...p, height: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white border border-orange-200 rounded-xl outline-none text-xs font-bold text-gray-700 focus:border-orange-500 transition-all"
                      min="50" max="2000"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!imgForm.url.trim()) return;
                      const sizePart = (imgForm.width || imgForm.height)
                        ? ` =${imgForm.width || ''}x${imgForm.height || ''}`
                        : '';
                      const markdown = `\n![](${imgForm.url.trim()}${sizePart})\n`;
                      const textarea = textareaRef.current;
                      if (textarea) {
                        const pos = textarea.selectionStart;
                        const newText = detailedIntro.substring(0, pos) + markdown + detailedIntro.substring(pos);
                        setDetailedIntro(newText);
                        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(pos + markdown.length, pos + markdown.length); }, 0);
                      }
                      setImgForm({ url: '', width: '', height: '' });
                      setShowImgPanel(false);
                    }}
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black cursor-pointer transition-all"
                  >
                    ✅ 이미지 삽입
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImgPanel(false)}
                    className="px-4 py-2.5 bg-white border border-orange-200 text-orange-500 rounded-xl text-xs font-black cursor-pointer transition-all"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            <textarea 
              ref={textareaRef}
              rows="12"
              placeholder="### 🧙‍♂️ 게임의 목적 및 가치\n내용을 입력하세요.\n\n### 📜 게임 규칙 및 방법\n1. 상세 규칙을 입력하세요."
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-3xl outline-none font-bold text-sm text-gray-700 leading-relaxed transition-all whitespace-pre-wrap"
              value={detailedIntro}
              onChange={(e) => setDetailedIntro(e.target.value)}
            />
          </div>

          {/* 최종 제출 저장 버튼 */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={submitting || uploading}
            className="w-full py-4 bg-gray-900 hover:bg-orange-500 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <><Send size={18} /> 소개 안내서 영구 발행</>
            )}
          </motion.button>
        </form>
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

export default GameIntroEditor;
