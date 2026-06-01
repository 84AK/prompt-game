import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { 
  Search, Zap, Swords, TrendingUp, Sparkles, LogOut, 
  User as UserIcon, MessageSquare, Shield, Heart, Share2, 
  Gamepad2, Layers, Award, Users, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import heroImg from '../assets/hero.png';

const STATIC_GAMES = [
  {
    id: 'reverse-prompting',
    title: '프롬프트 스무고개',
    description: 'AI의 답변만 보고 어떤 프롬프트를 썼는지 맞춰보세요!',
    icon_name: 'Search',
    color: 'bg-red-50/40',
    border_color: 'border-red-100/50',
    tag: '분석력',
    category: 'prompt',
    is_new: true,
    is_popular: false
  },
  {
    id: 'few-shot-lab',
    title: 'Few-Shot 퓨샷 트레이닝 센터',
    description: '몇 가지 예시로 AI의 말투와 감성을 완벽하게 튜닝하는 바이브 랩!',
    icon_name: 'Zap',
    color: 'bg-teal-50/40',
    border_color: 'border-teal-100/50',
    tag: '패턴인식',
    category: 'prompt',
    is_new: false,
    is_popular: true
  },
  {
    id: 'rctf-battle',
    title: 'RCTF 카드 배틀',
    description: '랜덤 카드 조합으로 최고의 프롬프트를 만들어보세요.',
    icon_name: 'Swords',
    color: 'bg-yellow-50/40',
    border_color: 'border-yellow-100/50',
    tag: '창의력',
    category: 'prompt',
    is_new: false,
    is_popular: true
  },
  {
    id: 'prompt-evolution',
    title: '단계별 업그레이드',
    description: '약한 프롬프트를 최강의 프롬프트로 진화시키세요!',
    icon_name: 'TrendingUp',
    color: 'bg-purple-50/40',
    border_color: 'border-purple-100/50',
    tag: '설계능력',
    category: 'prompt',
    is_new: false,
    is_popular: true
  },
  {
    id: 'unplugged-quest',
    title: '언플러그드 프롬프트 퀘스트',
    description: '종이 카드 교구와 주사위로 즐기는 컴퓨터 없는 오프라인 프롬프트 협동 게임!',
    icon_name: 'Sparkles',
    color: 'bg-orange-50/40',
    border_color: 'border-orange-100/50',
    tag: '협동심',
    category: 'unplugged',
    is_new: true,
    is_popular: false
  },
  {
    id: 'unplugged-roleplay',
    title: '휴먼 AI 롤플레잉 게임',
    description: '내가 직접 AI 역할을 맡아 친구들의 명령에 맞게 응답하고 오류를 디버깅해보세요!',
    icon_name: 'Users',
    color: 'bg-indigo-50/40',
    border_color: 'border-indigo-100/50',
    tag: '컴퓨팅사고',
    category: 'unplugged',
    is_new: false,
    is_popular: true
  }
];


const GameCard = ({ game, likes, onLike, onShare }) => {
  const navigate = useNavigate();
  const gameLikes = likes[game.id] || 0;

  // DB 필드와 정적 필드의 변수명 불일치 방지 보정 (camelCase / snake_case 둘 다 대응)
  const cardColor = game.color || 'bg-gray-50/40';
  const cardBorder = game.border_color || game.borderColor || 'border-gray-150/50';

  const renderIcon = () => {
    // 만약 기존 리액트 엘리먼트 형태라면 그대로 반환
    if (game.icon && React.isValidElement(game.icon)) {
      return game.icon;
    }
    
    // LucideIcons 컴포넌트 동적 매핑
    const IconName = game.icon_name || 'Gamepad2';
    const IconComponent = LucideIcons[IconName] || LucideIcons.Gamepad2;

    let iconColorClass = 'text-brand-primary';
    if (game.id === 'reverse-prompting') iconColorClass = 'text-red-500';
    else if (game.id === 'few-shot-lab') iconColorClass = 'text-teal-500';
    else if (game.id === 'rctf-battle') iconColorClass = 'text-yellow-500';
    else if (game.id === 'prompt-evolution') iconColorClass = 'text-purple-500';
    else if (game.id === 'unplugged-quest') iconColorClass = 'text-orange-500';
    else if (game.id === 'unplugged-roleplay') iconColorClass = 'text-indigo-500';

    return <IconComponent className={`w-6 h-6 ${iconColorClass}`} />;
  };
  
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`snap-start min-w-[280px] sm:min-w-[320px] max-w-[320px] flex-shrink-0 glass-card p-6 rounded-[2.5rem] bg-white/85 border border-gray-150 flex flex-col justify-between hover:shadow-xl transition-all duration-300 ${cardColor} ${cardBorder}`}
    >
      <div>
        {/* 프리미엄 썸네일 탑재 */}
        <div className="w-full h-32 rounded-2xl overflow-hidden mb-5 relative group/img shadow-inner bg-gray-100">
          <img 
            src={game.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'} 
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>

        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            {renderIcon()}
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-[10px] font-black text-gray-500 border border-white/50">
              #{game.tag}
            </span>
          </div>
        </div>
        
        <h3 className="text-lg font-black mb-2 text-gray-800 tracking-tight leading-tight">{game.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed min-h-[48px]">{game.description}</p>
      </div>
      
      {['reverse-prompting', 'few-shot-lab', 'rctf-battle'].includes(game.id) ? (
        <div className="mt-6 pt-4 border-t border-gray-150/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button 
              onClick={() => navigate(`/game/${game.id}`)}
              className="flex-1 px-2.5 py-2 bg-gray-900 hover:bg-brand-primary text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 shadow-sm hover:shadow transition-all duration-200 cursor-pointer whitespace-nowrap truncate"
            >
              🚀 바로 체험
            </button>
            <button 
              onClick={() => navigate(`/game/${game.id}/intro`)}
              className="flex-1 px-2.5 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 hover:border-gray-300 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 shadow-sm transition-all duration-200 cursor-pointer whitespace-nowrap truncate"
            >
              📖 소개서
            </button>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLike(game.id);
              }}
              className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-400 flex items-center gap-0.5 cursor-pointer"
              title="좋아요"
            >
              <Heart size={12} className={gameLikes > 0 ? 'fill-red-500 text-red-500' : ''} />
              <span className="text-[9px] font-black">{gameLikes}</span>
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onShare(game.id);
              }}
              className="p-1.5 hover:bg-gray-100 hover:text-brand-secondary rounded-lg transition-all text-gray-400 cursor-pointer"
              title="링크 공유"
            >
              <Share2 size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 pt-4 border-t border-gray-150/50 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/game/${game.id}/intro`)}
            className="text-xs font-black text-gray-800 hover:text-brand-primary flex items-center gap-1 group/btn cursor-pointer"
          >
            시작하기
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </button>

          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLike(game.id);
              }}
              className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-gray-400 flex items-center gap-1 cursor-pointer"
              title="좋아요"
            >
              <Heart size={14} className={gameLikes > 0 ? 'fill-red-500 text-red-500' : ''} />
              <span className="text-[10px] font-black">{gameLikes}</span>
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onShare(game.id);
              }}
              className="p-2 hover:bg-gray-100 hover:text-brand-secondary rounded-xl transition-all text-gray-400 cursor-pointer"
              title="링크 공유"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Home = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, prompt, unplugged
  const [likes, setLikes] = useState({});
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const [gamesList, setGamesList] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const navigate = useNavigate();

  // 3가지 가로 캐러셀 섹션의 스크롤 제어를 위한 useRef
  const tabCarouselRef = useRef(null);
  const newCarouselRef = useRef(null);
  const popularCarouselRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // 1. 실시간 Supabase games 및 좋아요 로드
    fetchGames();

    return () => subscription.unsubscribe();
  }, []);

  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGamesList(data || []);

      // DB 좋아요 수 동적 매핑
      const dbLikes = {};
      data?.forEach(g => {
        dbLikes[g.id] = g.like_count || 0;
      });
      setLikes(dbLikes);
    } catch (err) {
      console.warn("DB games load failed, empty list initialized:", err.message);
      setGamesList([]);
    } finally {
      setLoadingGames(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) throw error || new Error('No profile');
      
      setProfile(data);
      if (data.role === 'ADMIN') {
        sessionStorage.setItem('rctf_admin_auth', 'true');
      } else {
        sessionStorage.removeItem('rctf_admin_auth');
      }
      sessionStorage.setItem('user_display_name', data.display_name);
    } catch (err) {
      // 프로필 조회 실패/지연 시 세션 이메일이 지정된 관리자 계정 목록에 있다면 즉각 관리자 등급으로 로컬 복제 매핑
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const isAdminEmail = ['mosebb@gmail.com', 'codingclubak03@gmail.com'].includes(session.user.email); 
        const userRole = (isAdminEmail || sessionStorage.getItem('rctf_admin_auth') === 'true') ? 'ADMIN' : 'USER';

        
        if (userRole === 'ADMIN') {
          sessionStorage.setItem('rctf_admin_auth', 'true');
        }
        
        setProfile({
          id: session.user.id,
          display_name: sessionStorage.getItem('user_display_name') || session.user.email.split('@')[0],
          role: userRole
        });
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('rctf_admin_auth');
    sessionStorage.removeItem('user_display_name');
    setUser(null);
    setProfile(null);
    navigate('/');
  };

  const handleLike = async (gameId) => {
    try {
      const currentCount = likes[gameId] || 0;
      const nextCount = currentCount + 1;
      
      const { error } = await supabase
        .from('games')
        .update({ like_count: nextCount })
        .eq('id', gameId);
      
      if (error) throw error;
      
      const updated = { ...likes, [gameId]: nextCount };
      setLikes(updated);
      showToast('게임이 마음에 드셨군요! 💖');
    } catch (err) {
      console.error("좋아요 업데이트 실패:", err.message);
      const updated = { ...likes, [gameId]: (likes[gameId] || 0) + 1 };
      setLikes(updated);
      showToast('임시로 좋아요를 반영했습니다! 💖');
    }
  };

  const handleShare = (gameId) => {
    const shareUrl = `${window.location.origin}/game/${gameId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showToast('📋 게임 공유 링크가 클립보드에 복사되었습니다!');
      })
      .catch(() => {
        showToast('링크 복사에 실패했습니다.');
      });
  };

  const showToast = (message) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  // 캐러셀 좌우 슬라이딩 헬퍼 함수
  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = clientWidth * 0.75;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const gamesSource = gamesList;
  const filteredGames = gamesSource.filter(g => activeTab === 'all' || g.category === activeTab);
  const newGamesList = gamesSource.filter(g => g.is_new || g.isNew);
  const popularGamesList = gamesSource.filter(g => g.is_popular || g.isPopular);


  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col min-h-screen relative overflow-x-hidden">
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

      {/* Header */}
      <header className="sticky top-4 z-50 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-8 py-4 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg mb-12">
        <Link to="/" className="flex items-center gap-2 group self-start sm:self-auto">
          <Sparkles className="w-6 h-6 text-brand-primary group-hover:rotate-12 transition-transform" />
          <span className="font-black text-xl tracking-tight text-gray-800">Prompt Arcade</span>
        </Link>

        <nav className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          <Link 
            to="/play" 
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100/50 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Gamepad2 size={16} /> 게임 센터
          </Link>

          <Link 
            to="/feed" 
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100/50 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
          >
            <MessageSquare size={16} /> 피드 자랑
          </Link>

          <Link 
            to="/creator-guide" 
            className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-xl text-xs sm:text-sm font-black text-purple-600 transition-colors"
          >
            <Sparkles size={14} className="text-purple-500" /> 게임 창작소
          </Link>

          {(profile?.role === 'ADMIN' || sessionStorage.getItem('rctf_admin_auth') === 'true') && (
            <Link 
              to="/admin" 
              className="flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-xl text-xs sm:text-sm font-black text-orange-600 transition-colors"
            >
              <Shield size={16} /> 관리자
            </Link>
          )}


          <div className="h-4 w-[1px] bg-gray-200" />

          {user ? (
            <div className="flex items-center gap-2">
              <Link 
                to="/mypage"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full border border-gray-100 hover:border-gray-250 shadow-sm hover:shadow text-[10px] sm:text-xs font-black text-gray-700 max-w-[120px] sm:max-w-none truncate transition-all cursor-pointer"
                title="마이 포탈로 이동"
              >
                <UserIcon size={12} className="text-brand-primary" />
                {profile?.display_name || sessionStorage.getItem('user_display_name') || user?.email?.split('@')[0] || '마법사'}
              </Link>

              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-gray-400 cursor-pointer"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>

          ) : (
            <div className="flex items-center gap-2">
              <Link 
                to="/login" 
                className="px-3 py-2 hover:bg-gray-100/50 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                로그인
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-black hover:bg-brand-primary shadow-md transition-all"
              >
                회원가입
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center gap-12 mb-20">
        <div className="flex-1 text-center md:text-left order-2 md:order-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Prompt Arcade Studio</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight text-gray-800">
              세상에 없던 AI 게임을 <br />
              <span className="text-brand-primary">창작하고 공유하자!</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
              나만의 독창적인 프롬프트로 기발한 AI 오프라인 게임을 직접 설계하고 투고해 보세요.
              동료 크리에이터들이 창조해 낸 멋진 아케이드를 즉석에서 플레이해 볼 수 있습니다.
            </p>
            <button 
              onClick={() => navigate('/play')}
              className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-gray-800 transition-colors text-sm sm:text-base cursor-pointer"
            >
              게임 하러 가기
            </button>
          </motion.div>
        </div>
        
        <div className="flex-1 relative order-1 md:order-2 w-full max-w-md mx-auto md:max-w-none">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative z-10"
          >
            <img 
              src={heroImg} 
              alt="AI Magician" 
              className="w-full h-auto drop-shadow-2xl rounded-[2.5rem]"
            />
          </motion.div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-brand-primary/10 rounded-full blur-3xl -z-0"></div>
        </div>
      </section>

      {/* 1. 카테고리별 캐러셀 */}
      <section id="game-section" className="mb-16 scroll-mt-6 relative group">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-800 flex items-center gap-2">
              <Gamepad2 className="text-brand-primary" /> 공유된 프롬프트 아케이드 탐색
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-bold mt-1">전국 마법사 크리에이터들이 창작하고 기여한 실시간 공유 게임들을 둘러보세요.</p>
          </div>

          <div className="flex bg-white/60 backdrop-blur-md p-1.5 border border-gray-100 rounded-2xl w-full sm:w-auto shadow-inner">
            {[
              { key: 'all', label: '전체', icon: <Layers size={14} /> },
              { key: 'unplugged', label: '언플러그드 게임', icon: <Users size={14} /> },
              { key: 'prompt', label: '프롬프트 게임', icon: <Gamepad2 size={14} /> }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === tab.key ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-700'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 캐러셀 영역 */}
        <div className="relative">
          {/* 좌우 화살표 버튼 (Glassmorphic) */}
          <button 
            onClick={() => scrollCarousel(tabCarouselRef, 'left')}
            className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white/60 backdrop-blur-md hover:bg-white text-gray-700 border border-white/50 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={() => scrollCarousel(tabCarouselRef, 'right')}
            className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white/60 backdrop-blur-md hover:bg-white text-gray-700 border border-white/50 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronRight size={20} />
          </button>

          {/* 가로 스크롤 스냅 슬라이더 */}
          <div 
            ref={tabCarouselRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-6 px-1"
          >
            {filteredGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                likes={likes}
                onLike={handleLike}
                onShare={handleShare}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. 신규 추가 게임 캐러셀 */}
      <section className="mb-16 relative group">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
              <Sparkles className="text-orange-500" /> 새롭게 추가된 마법 게임
            </h3>
            <p className="text-xs text-gray-500 font-bold mt-1">새로 기획되어 갓 출시된 재미있는 카드/프롬프트 교구입니다.</p>
          </div>
          
          {/* 모바일 화면에서는 스크롤 인디케이터 제공 */}
          <span className="text-[10px] font-black text-gray-400 sm:hidden uppercase tracking-wider">Swipe →</span>
        </div>

        <div className="relative">
          <button 
            onClick={() => scrollCarousel(newCarouselRef, 'left')}
            className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white/60 backdrop-blur-md hover:bg-white text-gray-700 border border-white/50 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={() => scrollCarousel(newCarouselRef, 'right')}
            className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white/60 backdrop-blur-md hover:bg-white text-gray-700 border border-white/50 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronRight size={20} />
          </button>

          <div 
            ref={newCarouselRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-6 px-1"
          >
            {newGamesList.map((game) => (
              <GameCard 
                key={`new-${game.id}`} 
                game={game} 
                likes={likes}
                onLike={handleLike}
                onShare={handleShare}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. 인기 게임 캐러셀 */}
      <section className="mb-20 relative group">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
              <Award className="text-yellow-500" /> 가장 인기 있는 마법 게임
            </h3>
            <p className="text-xs text-gray-500 font-bold mt-1">마법사들이 가장 즐겨 훈련하고 강력 추천한 대세 배틀입니다.</p>
          </div>
          <span className="text-[10px] font-black text-gray-400 sm:hidden uppercase tracking-wider">Swipe →</span>
        </div>

        <div className="relative">
          <button 
            onClick={() => scrollCarousel(popularCarouselRef, 'left')}
            className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white/60 backdrop-blur-md hover:bg-white text-gray-700 border border-white/50 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={() => scrollCarousel(popularCarouselRef, 'right')}
            className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 p-3 bg-white/60 backdrop-blur-md hover:bg-white text-gray-700 border border-white/50 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 hidden sm:block"
          >
            <ChevronRight size={20} />
          </button>

          <div 
            ref={popularCarouselRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-6 px-1"
          >
            {popularGamesList.map((game) => (
              <GameCard 
                key={`popular-${game.id}`} 
                game={game} 
                likes={likes}
                onLike={handleLike}
                onShare={handleShare}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="mt-auto text-center border-t border-gray-100 pt-12 pb-6">
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

export default Home;
