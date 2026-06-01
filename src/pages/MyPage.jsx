import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, MessageSquare, Heart, Shield, 
  ArrowLeft, Calendar, Trash2, ExternalLink, Sparkles, Info, Loader2,
  Edit3, Check, X, Gamepad2
} from 'lucide-react';

const gameDetailMap = {
  'reverse-prompting': { title: '프롬프트 스무고개', tag: '분석력', color: 'bg-red-50/50', border: 'border-red-100/50' },
  'few-shot-lab': { title: 'Few-Shot 퓨샷 트레이닝 센터', tag: '패턴인식', color: 'bg-teal-50/50', border: 'border-teal-100/50' },
  'rctf-battle': { title: 'RCTF 카드 배틀', tag: '창의력', color: 'bg-yellow-50/50', border: 'border-yellow-100/50' },
  'prompt-evolution': { title: '단계별 업그레이드', tag: '설계능력', color: 'bg-purple-50/50', border: 'border-purple-100/50' },
  'unplugged-quest': { title: '언플러그드 프롬프트 퀘스트', tag: '협동심', color: 'bg-orange-50/50', border: 'border-orange-100/50' },
  'unplugged-roleplay': { title: '휴먼 AI 롤플레잉 게임', tag: '컴퓨팅사고', color: 'bg-indigo-50/50', border: 'border-indigo-100/50' }
};

const MyPage = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [likedGames, setLikedGames] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const navigate = useNavigate();

  // 표시 이름 편집 관련 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState('');

  useEffect(() => {
    const initMyPage = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          showToast('로그인이 필요합니다!');
          setTimeout(() => navigate('/login'), 1500);
          return;
        }

        setUser(session.user);
        
        // 1. 프로필
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (prof) {
          setProfile(prof);
          setTempDisplayName(prof.display_name || '');
        } else {
          const fallbackName = session.user.email.split('@')[0];
          setProfile({ display_name: fallbackName, role: 'USER' });
          setTempDisplayName(fallbackName);
        }

        // 2. 내가 올린 피드 수집
        const { data: posts } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', session.user.id)

          .order('created_at', { ascending: false });

        setMyPosts(posts || []);

        // 3. 좋아요한 게임 로드 (localStorage 기반)
        const savedLikes = localStorage.getItem('prompt_game_likes');
        if (savedLikes) {
          const parsed = JSON.parse(savedLikes);
          const likedList = [];
          Object.keys(parsed).forEach(gameId => {
            if (parsed[gameId] > 0) {
              const detail = gameDetailMap[gameId] || { title: gameId, tag: '마법훈련', color: 'bg-gray-50/50', border: 'border-gray-100/50' };
              likedList.push({
                id: gameId,
                ...detail,
                likeCount: parsed[gameId]
              });
            }
          });
          setLikedGames(likedList);
        }

      } catch (err) {
        console.warn('마이페이지 데이터 조회 중 오류, 임시 모드로 세팅합니다.');
        loadMockupMyPage();
      } finally {
        setLoading(false);
      }
    };

    initMyPage();
  }, [navigate]);

  const showToast = (message) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  const handleUpdateDisplayName = async () => {
    if (!tempDisplayName.trim()) {
      showToast('표시 이름은 공백일 수 없습니다!');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: tempDisplayName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, display_name: tempDisplayName.trim() }));
      sessionStorage.setItem('user_display_name', tempDisplayName.trim());
      showToast('🧙‍♂️ 표시 이름이 변경되었습니다!');
      setIsEditingName(false);
    } catch (err) {
      console.warn("DB 이름 변경 실패, 임시 로컬 데이터를 업데이트합니다:", err.message);
      setProfile(prev => ({ ...prev, display_name: tempDisplayName.trim() }));
      sessionStorage.setItem('user_display_name', tempDisplayName.trim());
      showToast('로컬 임시 이름 변경 완료.');
      setIsEditingName(false);
    } finally {
      setSubmitting(false);
    }
  };

  const loadMockupMyPage = () => {
    setUser({ id: 'dummy_user_me', email: 'wizard@hogwarts.edu' });
    setProfile({ display_name: '로컬 임시 마법사', role: 'USER' });
    setTempDisplayName('로컬 임시 마법사');
    
    const cachedPosts = localStorage.getItem('mockup_posts');
    if (cachedPosts) {
      const postsArray = JSON.parse(cachedPosts);
      const filtered = postsArray.filter(p => p.user_id === 'dummy_user_me' || p.user_id === 'anonymous_user');
      setMyPosts(filtered);
    }
  };


  // 피드 자랑글 즉각 삭제
  const handleDeletePost = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm('정말로 이 글을 완전히 삭제하시겠습니까?')) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      
      showToast('성공적으로 삭제되었습니다.');
      setMyPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      // Mockup 삭제
      const cachedPosts = localStorage.getItem('mockup_posts');
      if (cachedPosts) {
        const postsArray = JSON.parse(cachedPosts);
        const filtered = postsArray.filter(p => p.id !== postId);
        localStorage.setItem('mockup_posts', JSON.stringify(filtered));
        setMyPosts(prev => prev.filter(p => p.id !== postId));
      }
      showToast('로컬 임시 삭제 완료.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F9] flex flex-col justify-center items-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full mb-4" />
        <p className="text-xs text-gray-400 font-bold">마법사 프로필 수집 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 min-h-screen flex flex-col font-sans relative overflow-x-hidden">
      <AnimatePresence>
        {toast.isVisible && (
          <motion.div 
            initial={{ y: -50, opacity: 0, x: '-50%' }} 
            animate={{ y: 20, opacity: 1, x: '-50%' }} 
            exit={{ y: -50, opacity: 0, x: '-50%' }} 
            className="fixed top-0 left-1/2 z-[200] px-6 py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold shadow-2xl text-xs sm:text-sm text-center"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-4 z-50 flex items-center justify-between px-6 py-4 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg mb-12">
        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-800 font-bold transition-all group text-xs sm:text-sm cursor-pointer">
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 홈으로
        </Link>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/play" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full border border-gray-100 hover:border-gray-250 shadow-sm hover:shadow text-[10px] sm:text-xs font-black text-gray-700 transition-all cursor-pointer"
            title="게임 센터로 이동"
          >
            <Gamepad2 size={12} className="text-brand-primary" /> 게임 센터
          </Link>

          {(profile?.role === 'ADMIN' || sessionStorage.getItem('rctf_admin_auth') === 'true') && (
            <Link 
              to="/admin" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 rounded-xl text-[10px] sm:text-xs font-black text-orange-600 border border-orange-100 transition-colors flex items-center gap-1"
              title="관리자 콘솔로 이동"
            >
              <Shield size={12} className="text-orange-500" /> 관리자
            </Link>
          )}

          <div className="flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <span className="font-black text-xs sm:text-sm tracking-tight text-gray-800 hidden sm:inline">My Portal</span>
          </div>
        </div>
      </header>


      {/* Profile Header Bento Card */}
      <section className="mb-12">
        <div className="glass-card bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/50 relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary to-brand-secondary" />
          
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary shadow-inner">
            <UserIcon size={36} />
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {isEditingName ? (
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <input
                    type="text"
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 focus:border-brand-primary rounded-xl outline-none font-bold text-sm text-gray-700 transition-all"
                    value={tempDisplayName}
                    onChange={(e) => setTempDisplayName(e.target.value)}
                    disabled={submitting}
                    maxLength={15}
                  />
                  <button
                    onClick={handleUpdateDisplayName}
                    disabled={submitting}
                    className="p-2 bg-brand-primary/10 hover:bg-brand-primary hover:text-white text-brand-primary rounded-xl transition-all cursor-pointer"
                    title="저장"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setTempDisplayName(profile?.display_name || '');
                    }}
                    disabled={submitting}
                    className="p-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all cursor-pointer"
                    title="취소"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight leading-none">
                    {profile?.display_name || '마법사'}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 hover:bg-gray-100 hover:text-brand-primary rounded-lg text-gray-400 transition-colors cursor-pointer"
                    title="표시 이름 변경"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}

              <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${profile?.role === 'ADMIN' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                {profile?.role === 'ADMIN' ? '선생님 (Admin)' : '일반 마법사'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold">등록 이메일: {user?.email}</p>
          </div>

        </div>
      </section>

      {/* 2-Column Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        
        {/* Left Column: 내가 올린 피드 CRUD 관리 (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
                <MessageSquare className="text-brand-primary" /> 내가 올린 마법 자랑글
              </h2>
              <p className="text-xs text-gray-400 font-bold mt-1">내가 피드 게시판에 등록한 프롬프트 글들을 직접 통제합니다.</p>
            </div>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-black">Total: {myPosts.length}개</span>
          </div>

          {myPosts.length === 0 ? (
            <div className="glass-card bg-white rounded-3xl p-10 border border-white/50 text-center space-y-3">
              <Info className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-400 font-bold">피드에 작성하신 글이 존재하지 않습니다.</p>
              <Link to="/feed" className="inline-block px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black shadow-md cursor-pointer">첫 마법 자랑하러 가기</Link>
            </div>
          ) : (
            <div className="glass-card bg-white rounded-3xl border border-white/50 shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-150/60">
                {myPosts.map((post, idx) => (
                  <div 
                    key={post.id}
                    onClick={() => navigate(`/feed/${post.id}`)}
                    className="p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-brand-primary/[0.02] cursor-pointer transition-colors group select-none"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-sm sm:text-base font-black text-gray-700 leading-tight group-hover:text-brand-primary transition-colors truncate">
                        {post.title}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                        <Calendar size={10} />
                        {new Date(post.created_at).toLocaleDateString()}
                        <span>•</span>
                        <Heart size={10} className="fill-red-500 text-red-500" />
                        <span>추천 {(post.likes_count || 0)}개</span>
                      </p>
                    </div>

                    <div className="flex gap-2 items-center">
                      <button
                        onClick={(e) => handleDeletePost(e, post.id)}
                        disabled={submitting}
                        className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-gray-400 cursor-pointer"
                        title="글 영구 삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 내가 좋아하는 게임 덱 (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
              <Heart className="text-red-500 fill-red-500 animate-pulse" /> 선호 마법 게임 덱
            </h2>
            <p className="text-xs text-gray-400 font-bold mt-1">홈에서 핑크 하트를 눌러두었던 게임 목록입니다.</p>
          </div>

          {likedGames.length === 0 ? (
            <div className="glass-card bg-white rounded-3xl p-8 border border-white/50 text-center space-y-3">
              <Info className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-400 font-bold">좋아요를 누른 게임이 아직 없습니다.</p>
              <Link to="/" className="inline-block px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black shadow-md cursor-pointer">게임 둘러보기</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {likedGames.map((game) => (
                <div 
                  key={`liked-${game.id}`}
                  onClick={() => navigate(`/game/${game.id}/intro`)}
                  className={`p-5 rounded-[2rem] border border-gray-150/50 bg-white/90 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 ${game.color} ${game.border}`}
                >
                  <div className="min-w-0 space-y-1">
                    <span className="px-2 py-0.5 bg-white/70 rounded-full text-[9px] font-black text-gray-500 border">
                      #{game.tag}
                    </span>
                    <h4 className="text-sm font-black text-gray-800 leading-tight pt-1 truncate">{game.title}</h4>
                  </div>
                  
                  <div className="flex items-center gap-1 text-red-500 font-black text-xs shrink-0 bg-red-50/50 px-2.5 py-1.5 rounded-full border border-red-100">
                    <Heart size={12} className="fill-red-500" />
                    <span>Liked</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

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

export default MyPage;
