import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { 
  Sparkles, Gamepad2, Search, Zap, Swords, ArrowLeft, 
  Shield, MessageSquare, User as UserIcon, LogOut, Heart, Share2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const PLAYABLE_GAMES = [
  {
    id: 'reverse-prompting',
    title: '프롬프트 스무고개',
    description: 'AI가 출력한 결과물만 보고 어떤 마법 주문(프롬프트)을 속삭였는지 역으로 탐색하고 맞춰보세요.',
    icon_name: 'Search',
    color: 'bg-red-50/40',
    border_color: 'border-red-100/50',
    icon_color: 'text-red-500',
    tag: '역추론',
    category: 'prompt',
    is_popular: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'few-shot-lab',
    title: 'Few-Shot 퓨샷 트레이닝 센터',
    description: '몇 가지 핵심 예시를 제공하여 AI의 답변 말투와 감성 톤을 극적으로 튜닝하는 퓨샷 기법을 훈련하세요.',
    icon_name: 'Zap',
    color: 'bg-teal-50/40',
    border_color: 'border-teal-100/50',
    icon_color: 'text-teal-500',
    tag: '패턴학습',
    category: 'prompt',
    is_popular: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'rctf-battle',
    title: 'RCTF 카드 배틀',
    description: '랜덤하게 뽑히는 마법 카드 조합 미션을 클리어하기 위해 최적의 프롬프트를 설계하고 카드 결투를 펼치세요.',
    icon_name: 'Swords',
    color: 'bg-yellow-50/40',
    border_color: 'border-yellow-100/50',
    icon_color: 'text-yellow-500',
    tag: '실전조합',
    category: 'prompt',
    is_popular: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80'
  }
];

const PlayCenter = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [likes, setLikes] = useState({});
  const [gamesList, setGamesList] = useState(PLAYABLE_GAMES);
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const navigate = useNavigate();
  const toastTimerRef = useRef(null);

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

    // DB 실시간 체험형 게임 정보 및 좋아요 갱신 연동
    fetchPlayableGames();

    return () => subscription.unsubscribe();
  }, []);

  const fetchPlayableGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*');
      
      if (!error && data && data.length > 0) {
        // 좋아요 수 동적 매핑
        const dbLikes = {};
        data.forEach(item => {
          dbLikes[item.id] = item.like_count || 0;
        });
        setLikes(dbLikes);

        const merged = PLAYABLE_GAMES.map(pg => {
          const dbItem = data.find(d => d.id === pg.id);
          if (dbItem) {
            return {
              ...pg,
              title: dbItem.title || pg.title,
              description: dbItem.description || pg.description,
              tag: dbItem.tag || pg.tag,
              thumbnail_url: dbItem.thumbnail_url || pg.thumbnail_url,
              color: dbItem.color || pg.color,
              border_color: dbItem.border_color || pg.border_color
            };
          }
          return pg;
        });
        setGamesList(merged);
      }
    } catch (err) {
      console.warn("DB 실시간 체험 게임 로드 지연으로 기본 사양을 노출합니다.", err.message);
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

  const renderIcon = (iconName, colorClass) => {
    const IconComponent = LucideIcons[iconName] || Gamepad2;
    return <IconComponent className={`w-8 h-8 ${colorClass}`} />;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col min-h-screen relative overflow-x-hidden">
      {/* Toast Notification */}
      {toast.isVisible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold shadow-2xl text-xs sm:text-sm text-center max-w-[90vw]">
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-4 z-50 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-8 py-4 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg mb-12">
        <Link to="/" className="flex items-center gap-2 group self-start sm:self-auto">
          <Sparkles className="w-6 h-6 text-brand-primary group-hover:rotate-12 transition-transform" />
          <span className="font-black text-xl tracking-tight text-gray-800">Playcraft</span>
        </Link>

        <nav className="flex items-center justify-between sm:justify-end gap-1 sm:gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          <Link
            to="/play"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition-all"
          >
            <Gamepad2 size={16} /> <span className="hidden sm:inline">게임 센터</span>
          </Link>

          <Link
            to="/feed"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 hover:bg-gray-100/50 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
          >
            <MessageSquare size={16} /> <span className="hidden sm:inline">커뮤니티</span>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Navigation Back */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-gray-500 hover:text-gray-800 transition-colors group cursor-pointer"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            홈으로 돌아가기
          </Link>
        </div>

        {/* Title Section */}
        <div className="text-center sm:text-left mb-12">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-accent/25 rounded-full text-xs font-black text-brand-primary mb-4">
            <Gamepad2 size={14} /> Interactive Playground
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 tracking-tight leading-tight mb-4">
            AI 아케이드 룸 & <span className="text-brand-primary">공식 템플릿 쇼케이스</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl leading-relaxed">
            나만의 AI 오프라인 게임을 창작하기 전에, 플랫폼이 공식 지원하는 핵심 게임 메커니즘 엔진을 직접 플레이해 보며 아이디어를 획득하는 실습 공간입니다.
          </p>
        </div>

        {/* Bento Grid layout for 3 games */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {gamesList.map((game, idx) => {
            const gameLikes = likes[game.id] || 0;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className={`glass-card p-6 sm:p-8 rounded-[2.5rem] bg-white/90 border border-gray-150 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 ${game.color} ${game.border_color}`}
              >
                <div>
                  {/* 프리미엄 썸네일 탑재 */}
                  <div className="w-full h-36 rounded-2xl overflow-hidden mb-6 relative group/img shadow-inner bg-gray-100">
                    <img 
                      src={game.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'} 
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                      {renderIcon(game.icon_name, game.icon_color)}
                    </div>
                    <span className="px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-[10px] font-black text-gray-500 border border-white/50 shadow-sm">
                      #{game.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-gray-800 mb-2 tracking-tight leading-tight">{game.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed min-h-[56px]">{game.description}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-150/50 flex flex-col gap-4">
                  {/* Action Buttons */}
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => navigate(`/game/${game.id}`)}
                      className="flex-1 py-3 bg-gray-900 hover:bg-brand-primary text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      🚀 바로 시작
                    </button>
                    <button
                      onClick={() => navigate(`/game/${game.id}/intro`)}
                      className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-2xl text-xs font-black shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      📖 소개서 보기
                    </button>
                  </div>

                  {/* Social actions */}
                  <div className="flex items-center justify-end gap-1 text-gray-400">
                    <button
                      onClick={() => handleLike(game.id)}
                      className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      title="좋아요"
                    >
                      <Heart size={16} className={gameLikes > 0 ? 'fill-red-500 text-red-500' : ''} />
                      <span className="text-xs font-black">{gameLikes}</span>
                    </button>

                    <button
                      onClick={() => handleShare(game.id)}
                      className="p-2 hover:bg-gray-100 hover:text-brand-secondary rounded-xl transition-all cursor-pointer"
                      title="링크 공유"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

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

export default PlayCenter;
