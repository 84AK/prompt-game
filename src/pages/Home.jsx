import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, LogOut, User as UserIcon, MessageSquare, Shield,
  Heart, Share2, Gamepad2, PenSquare
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import heroImg from '../assets/hero.png';

const POST_COLORS = [
  { from: '#f87171', to: '#ef4444' },
  { from: '#2dd4bf', to: '#06b6d4' },
  { from: '#fbbf24', to: '#f59e0b' },
  { from: '#a78bfa', to: '#7c3aed' },
  { from: '#fb923c', to: '#f97316' },
  { from: '#818cf8', to: '#6366f1' },
];

const PostCard = ({ post, likes, onLike, onShare, colorIdx }) => {
  const navigate = useNavigate();
  const grad = POST_COLORS[colorIdx % POST_COLORS.length];
  const postLikes = likes[post.id] ?? post.likes_count ?? 0;

  const cleanTitle = post.title?.replace(/^[\u{1F300}-\u{1FAFF}️\s]*\[.*?\]\s*/u, '').trim() || post.title || '제목 없음';
  const contentPreview = post.content ? post.content.slice(0, 90) + (post.content.length > 90 ? '...' : '') : '';
  const dateStr = post.created_at
    ? new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : '';

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative rounded-[1.75rem] p-[2px] transition-all duration-300 hover:shadow-xl cursor-pointer"
      onClick={() => navigate(`/feed/${post.id}`)}
    >
      <div
        className="absolute inset-0 rounded-[1.75rem]"
        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
      />
      <div className="relative bg-white rounded-[1.6rem] p-5 flex flex-col h-full">
        <div
          className="w-full h-36 rounded-xl overflow-hidden mb-4 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${grad.from}22, ${grad.to}22)` }}
        >
          {post.image_url ? (
            <img
              src={post.image_url}
              alt={cleanTitle}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Gamepad2 className="w-10 h-10 opacity-20" style={{ color: grad.from }} />
          )}
        </div>

        <h3 className="text-base font-black mb-1.5 text-gray-900 leading-tight line-clamp-2">{cleanTitle}</h3>
        <p className="text-xs text-gray-500 leading-relaxed flex-1 min-h-[40px] line-clamp-3">{contentPreview}</p>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black shrink-0"
              style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
            >
              {post.author_name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-[10px] font-bold text-gray-500 truncate max-w-[80px]">{post.author_name}</span>
            {dateStr && <span className="text-[9px] text-gray-300 shrink-0">· {dateStr}</span>}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
              className="p-1.5 hover:bg-red-50 rounded-xl transition-all text-gray-400 flex items-center gap-0.5 cursor-pointer"
            >
              <Heart size={12} className={postLikes > 0 ? 'fill-red-500 text-red-500' : ''} />
              <span className="text-[9px] font-black">{postLikes}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onShare(post.id); }}
              className="p-1.5 hover:bg-gray-100 rounded-xl transition-all text-gray-400 cursor-pointer"
            >
              <Share2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [likes, setLikes] = useState({});
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const [postsList, setPostsList] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
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

    fetchPosts();

    return () => subscription.unsubscribe();
  }, []);

  const fetchPosts = async () => {
    setLoadingGames(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPostsList(data || []);

      const dbLikes = {};
      data?.forEach(p => { dbLikes[p.id] = p.likes_count || 0; });
      setLikes(dbLikes);
    } catch (err) {
      console.warn("posts load failed:", err.message);
      setPostsList([]);
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

  const handleLike = async (postId) => {
    const nextCount = (likes[postId] || 0) + 1;
    setLikes(prev => ({ ...prev, [postId]: nextCount }));
    showToast('게임이 마음에 드셨군요! 💖');
    try {
      await supabase.from('posts').update({ likes_count: nextCount }).eq('id', postId);
    } catch (err) {
      console.warn("좋아요 업데이트 실패:", err.message);
    }
  };

  const handleShare = (postId) => {
    const shareUrl = `${window.location.origin}/feed/${postId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast('📋 게임 링크가 클립보드에 복사되었습니다!'))
      .catch(() => showToast('링크 복사에 실패했습니다.'));
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
            <p className="text-xs sm:text-sm text-gray-500 mt-1">크리에이터들이 직접 만들고 공유한 게임 모음</p>
          </div>
          <button
            onClick={() => navigate('/creator-guide')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-2xl text-xs font-black transition-all cursor-pointer"
          >
            <PenSquare size={13} /> 게임 등록하기
          </button>
        </div>

        {loadingGames ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : postsList.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm mb-1">아직 등록된 게임이 없습니다.</p>
            <p className="text-xs">창작소에서 세상에 없는 첫 번째 게임을 만들어보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {postsList.map((post, idx) => (
              <PostCard
                key={post.id}
                post={post}
                likes={likes}
                onLike={handleLike}
                onShare={handleShare}
                colorIdx={idx}
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
