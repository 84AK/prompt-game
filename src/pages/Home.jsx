import React, { useState, useEffect, useRef, useMemo } from 'react';
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


const GAME_GRADIENTS = {
  'reverse-prompting': { from: '#f87171', to: '#ef4444', label: 'text-red-500', bg: 'bg-red-50' },
  'few-shot-lab':      { from: '#2dd4bf', to: '#06b6d4', label: 'text-teal-500', bg: 'bg-teal-50' },
  'rctf-battle':       { from: '#fbbf24', to: '#f59e0b', label: 'text-amber-500', bg: 'bg-amber-50' },
  'prompt-evolution':  { from: '#a78bfa', to: '#7c3aed', label: 'text-violet-500', bg: 'bg-violet-50' },
  'unplugged-quest':   { from: '#fb923c', to: '#f97316', label: 'text-orange-500', bg: 'bg-orange-50' },
  'unplugged-roleplay':{ from: '#818cf8', to: '#6366f1', label: 'text-indigo-500', bg: 'bg-indigo-50' },
};

const GameCard = ({ game, likes, onLike, onShare }) => {
  const navigate = useNavigate();
  const gameLikes = likes[game.id] || 0;
  const grad = GAME_GRADIENTS[game.id] || { from: '#e5e7eb', to: '#d1d5db', label: 'text-gray-500', bg: 'bg-gray-50' };

  const IconName = game.icon_name || 'Gamepad2';
  const IconComponent = LucideIcons[IconName] || LucideIcons.Gamepad2;
  const isPlayable = ['reverse-prompting', 'few-shot-lab', 'rctf-battle'].includes(game.id);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      style={{ '--grad-from': grad.from, '--grad-to': grad.to }}
      className="group relative rounded-[1.75rem] p-[2px] transition-all duration-300 hover:shadow-xl"
    >
      <div
        className="absolute inset-0 rounded-[1.75rem] opacity-100"
        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
      />
      <div className="relative bg-white rounded-[1.6rem] p-5 flex flex-col h-full">
        {/* 썸네일 */}
        <div className="w-full h-36 rounded-xl overflow-hidden mb-4 relative bg-gray-100">
          <img
            src={game.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=70'}
            alt={game.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {game.is_new && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-white text-[9px] font-black rounded-full shadow-sm" style={{ color: grad.from }}>NEW</span>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 ${grad.bg} rounded-xl`}>
            <IconComponent className={`w-5 h-5 ${grad.label}`} />
          </div>
          <span className={`px-2.5 py-1 ${grad.bg} rounded-full text-[10px] font-black ${grad.label}`}>#{game.tag}</span>
        </div>

        <h3 className="text-base font-black mb-1.5 text-gray-900 leading-tight">{game.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed flex-1 min-h-[40px]">{game.description}</p>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5">
          {isPlayable ? (
            <>
              <button
                onClick={() => navigate(`/game/${game.id}`)}
                className="flex-1 py-2 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
              >
                🚀 바로 체험
              </button>
              <button
                onClick={() => navigate(`/game/${game.id}/intro`)}
                className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100 rounded-xl text-[10px] font-black cursor-pointer transition-all"
              >
                📖 소개서
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(`/game/${game.id}/intro`)}
              className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100 rounded-xl text-xs font-black cursor-pointer transition-all"
            >
              소개서 보기 →
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onLike(game.id); }}
            className="p-2 hover:bg-red-50 rounded-xl transition-all text-gray-400 flex items-center gap-1 cursor-pointer"
          >
            <Heart size={13} className={gameLikes > 0 ? 'fill-red-500 text-red-500' : ''} />
            <span className="text-[9px] font-black">{gameLikes}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onShare(game.id); }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 cursor-pointer"
          >
            <Share2 size={13} />
          </button>
        </div>
      </div>
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

  const toastTimerRef = useRef(null);

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
      console.warn("DB games load failed, using static games:", err.message);
      setGamesList(STATIC_GAMES);
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
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ isVisible: true, message });
    toastTimerRef.current = setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
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

  const filteredGames = useMemo(
    () => gamesList.filter(g => activeTab === 'all' || g.category === activeTab),
    [gamesList, activeTab]
  );
  const newGamesList = useMemo(
    () => gamesList.filter(g => g.is_new || g.isNew),
    [gamesList]
  );
  const popularGamesList = useMemo(
    () => gamesList.filter(g => g.is_popular || g.isPopular),
    [gamesList]
  );


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
          <span className="font-black text-xl tracking-tight text-gray-800">Playcraft</span>
        </Link>

        <nav className="flex items-center justify-between sm:justify-end gap-1 sm:gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          <Link
            to="/play"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 hover:bg-gray-100/50 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Gamepad2 size={16} /> <span className="hidden sm:inline">게임 센터</span>
          </Link>

          <Link
            to="/feed"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 hover:bg-gray-100/50 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
          >
            <MessageSquare size={16} /> <span className="hidden sm:inline">피드 자랑</span>
          </Link>

          <Link
            to="/creator-guide"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-xl text-xs sm:text-sm font-black text-purple-600 transition-colors"
          >
            <Sparkles size={14} className="text-purple-500" /> <span className="hidden sm:inline">게임 창작소</span>
          </Link>

          {(profile?.role === 'ADMIN' || sessionStorage.getItem('rctf_admin_auth') === 'true') && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-xl text-xs sm:text-sm font-black text-orange-600 transition-colors"
            >
              <Shield size={16} /> <span className="hidden sm:inline">관리자</span>
            </Link>
          )}

          <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/mypage"
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-white/80 hover:bg-white rounded-full border border-gray-100 hover:border-gray-250 shadow-sm hover:shadow text-[10px] sm:text-xs font-black text-gray-700 transition-all cursor-pointer"
                title="마이 포탈로 이동"
              >
                <UserIcon size={12} className="text-brand-primary" />
                <span className="hidden sm:inline">{profile?.display_name || sessionStorage.getItem('user_display_name') || user?.email?.split('@')[0] || '마법사'}</span>
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
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/login"
                className="px-2 sm:px-3 py-2 hover:bg-gray-100/50 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-black hover:bg-brand-primary shadow-md transition-all"
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
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Playcraft</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight text-gray-800">
              상상해봐.<br />
              <span className="text-brand-primary">게임이 될 테니까.</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
              AI를 도구 삼아, 세상에 없는 게임을 직접 만들고 공유하세요.
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

      {/* 게임 갤러리 섹션 */}
      <section id="game-section" className="mb-20 scroll-mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
              <Gamepad2 className="text-brand-primary" /> 게임 갤러리
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">크리에이터들이 직접 만들고 공유한 AI 게임 모음</p>
          </div>

          {/* 카테고리 탭 */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl">
            {[
              { key: 'all', label: '전체', icon: <Layers size={13} /> },
              { key: 'unplugged', label: '언플러그드', icon: <Users size={13} /> },
              { key: 'prompt', label: '프롬프트', icon: <Gamepad2 size={13} /> }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>

        {loadingGames ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">해당 카테고리의 게임이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        )}
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
