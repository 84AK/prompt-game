import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Sparkles, ArrowLeft, MessageSquare, Plus, Trash2, 
  User as UserIcon, Calendar, Heart, Share2, Info, Loader2, ArrowRight, Shield, Gamepad2
} from 'lucide-react';

const PromptFeed = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    r: '', c: '', t: '', f: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    fetchPosts();

    return () => subscription.unsubscribe();
  }, []);

  const showToast = (message) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) throw error || new Error('No profile data');
      setProfile(data);
      if (data.role === 'ADMIN') {
        sessionStorage.setItem('rctf_admin_auth', 'true');
      }
    } catch (err) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
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
  };

  // 피드 로드
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.warn('Supabase DB 연결 실패. 로컬 Mockup 피드를 연동합니다.');
      const localData = localStorage.getItem('mockup_posts');
      if (localData) {
        setPosts(JSON.parse(localData));
      } else {
        const dummy = [
          {
            id: '1',
            title: '✨ 츤데레 AI의 리액트 수강신청 격려 프롬프트!',
            content: '츤데레 짝남 컨셉으로 리액트 수강신청에 실패해서 속상해하는 나에게 인생 조언을 아기자기하게 건네주는 프롬프트입니다. 실제로 Gemini 3.5 Flash에 연동하면 아주 츤츤거리면서도 다정하게 응답해줘요! 추천 말투: "흥, 딱히 너가 걱정돼서 말해주는 건 아니니까!"',
            author_name: '루미_프롬프트마스터',
            user_id: 'dummy_user_1',
            prompt_data: { r: '츤데레 짝남/짝녀', c: '0.1초 남은 수강신청', t: '인생 조언하기', f: '킹받는 카톡 말투' },
            created_at: new Date(Date.now() - 3600000).toISOString(),
            likes_count: 14
          },
          {
            id: '2',
            title: '🔥 킹받는 카톡 말투로 고백하는 AI 조합법',
            content: 'Role과 Format을 꼬아놓았더니 세상에서 가장 얄미운 고백 프롬프트가 탄생했습니다. AI의 답변을 보고 진짜 친구들이랑 한참 웃었네요. 벤토 그리드 카드 슬롯에서 Jackpot을 터트려 우연히 만들어낸 걸작입니다! 친구들에게 장난칠 때 활용해 보세요.',
            author_name: '카이_엔지니어',
            user_id: 'dummy_user_2',
            prompt_data: { r: '억울한 \'T\'형 인간', c: '편의점 신상 털기 중', t: '고백하기', f: '이모지로만 표현' },
            created_at: new Date(Date.now() - 7200000).toISOString(),
            likes_count: 9
          }
        ];
        setPosts(dummy);
        localStorage.setItem('mockup_posts', JSON.stringify(dummy));
      }
    } finally {
      setLoading(false);
    }
  };

  // 피드 좋아요 증식
  const handleLikePost = async (e, postId) => {
    e.stopPropagation();
    try {
      const targetPost = posts.find(p => p.id === postId);
      const newLikes = (targetPost.likes_count || 0) + 1;
      
      const { error } = await supabase
        .from('posts')
        .update({ likes_count: newLikes })
        .eq('id', postId);

      if (error) throw error;
      
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: newLikes } : p));
      showToast('이 프롬프트 마법을 응원합니다! 💖');
    } catch (err) {
      const updated = posts.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p);
      setPosts(updated);
      localStorage.setItem('mockup_posts', JSON.stringify(updated));
      showToast('로컬 임시 좋아요! 💖');
    }
  };

  const handleShare = (e, postId) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/feed/${postId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast('📋 공유 링크가 클립보드에 복사되었습니다!'))
      .catch(() => showToast('링크 복사에 실패했습니다.'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('제목과 내용을 모두 채워주세요!');
      return;
    }

    setSubmitting(true);
    const authorName = profile?.display_name || sessionStorage.getItem('user_display_name') || '익명의 마법사';
    const promptObj = (formData.r || formData.c || formData.t || formData.f) ? {
      r: formData.r.trim(),
      c: formData.c.trim(),
      t: formData.t.trim(),
      f: formData.f.trim()
    } : null;

    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user?.id || 'anonymous_user',
          author_name: authorName,
          title: formData.title.trim(),
          content: formData.content.trim(),
          prompt_data: promptObj,
          likes_count: 0
        }]);

      if (error) throw error;
      showToast('새 글이 등록되었습니다! ✨');
      closeModal();
      fetchPosts();
    } catch (err) {
      const newPostObj = {
        id: String(Date.now()),
        title: formData.title.trim(),
        content: formData.content.trim(),
        author_name: authorName,
        user_id: user?.id || 'dummy_user_me',
        prompt_data: promptObj,
        likes_count: 0,
        created_at: new Date().toISOString()
      };
      const updatedPosts = [newPostObj, ...posts];
      localStorage.setItem('mockup_posts', JSON.stringify(updatedPosts));
      setPosts(updatedPosts);
      showToast('로컬 임시 등록 완료!');
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  const openWriteModal = () => {
    if (!user) {
      showToast('글을 쓰려면 먼저 로그인해 주세요!');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    setFormData({ title: '', content: '', r: '', c: '', t: '', f: '' });
    setIsWriteOpen(true);
  };

  const closeModal = () => {
    setIsWriteOpen(false);
    setFormData({ title: '', content: '', r: '', c: '', t: '', f: '' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 min-h-screen flex flex-col font-sans relative overflow-x-hidden">
      <AnimatePresence>
        {toast.isVisible && (
          <motion.div 
            initial={{ y: -50, opacity: 0, x: '-50%' }} 
            animate={{ y: 20, opacity: 1, x: '-50%' }} 
            exit={{ y: -50, opacity: 0, x: '-50%' }} 
            className="fixed top-0 left-1/2 z-[200] px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold shadow-2xl text-xs sm:text-sm text-center"
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

          {profile && (
            <Link 
              to="/mypage"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full border border-gray-100 hover:border-gray-250 shadow-sm hover:shadow text-[10px] sm:text-xs font-black text-gray-700 max-w-[120px] sm:max-w-none truncate transition-all cursor-pointer"
              title="마이 포탈로 이동"
            >
              <UserIcon size={12} className="text-brand-primary" />
              {profile.display_name || '크리에이터'}
            </Link>
          )}

          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <span className="font-black text-sm tracking-tight text-gray-800 hidden sm:inline">Prompt Arcade</span>
          </Link>
        </div>
      </header>



      {/* Hero Title Section */}
      <section className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-gray-100 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full mb-3 text-[10px] sm:text-xs font-bold text-brand-primary border border-brand-primary/20">
            <MessageSquare size={14} /> PROMPT COMMUNITY FEED
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight leading-none">크리에이터들의 프롬프트 및 게임 기획 공유 피드</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-bold mt-2">직접 설계한 RCTF 언플러그드 게임 기획서와 독창적인 AI 프롬프트 설계를 공유하고 탐험하세요.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openWriteModal}
          className="w-full sm:w-auto px-6 py-4 bg-gray-900 hover:bg-brand-primary text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs sm:text-sm"
        >
          <Plus size={18} /> 새 게임 기획 공유하기
        </motion.button>
      </section>

      {/* Main Board List View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full" />
          <p className="text-xs text-gray-400 font-bold">실시간 게시글 로드 중...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 glass-card bg-white rounded-[3rem] p-10 border-white/50 max-w-lg mx-auto">
          <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-gray-700">등록된 마법이 없습니다</h3>
          <p className="text-xs text-gray-400 font-bold mt-1">첫 번째 주인공이 되어 기발한 프롬프트를 자랑해 보세요!</p>
        </div>
      ) : (
        <div className="glass-card bg-white/70 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl overflow-hidden mb-12">
          {/* 테이블형 헤더 */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-8 py-5 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
            <div className="col-span-1 text-center">번호</div>
            <div className="col-span-6">마법 제목 (클릭 시 상세 이동)</div>
            <div className="col-span-2 text-center">작성자</div>
            <div className="col-span-2 text-center">날짜</div>
            <div className="col-span-1 text-center">피드백</div>
          </div>

          <div className="divide-y divide-gray-100">
            {posts.map((post, index) => {
              const hasPrompt = post.prompt_data && (post.prompt_data.r || post.prompt_data.c || post.prompt_data.t || post.prompt_data.f);
              
              return (
                <div 
                  key={post.id} 
                  onClick={() => navigate(`/feed/${post.id}`)}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-6 sm:px-8 py-5 items-center cursor-pointer select-none hover:bg-brand-primary/[0.03] transition-colors group"
                >
                  <div className="hidden sm:block col-span-1 text-center text-xs font-bold text-gray-400">
                    {posts.length - index}
                  </div>

                  <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5 sm:gap-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm sm:text-base text-gray-700 leading-tight group-hover:text-brand-primary transition-colors block truncate max-w-[75vw] sm:max-w-none">
                        {post.title}
                      </span>
                      <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                    
                    {/* 모바일 뷰 최적화 메타데이터 */}
                    <div className="flex sm:hidden items-center gap-2 text-[10px] text-gray-400 font-bold">
                      <span>{post.author_name}</span>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="hidden sm:block col-span-2 text-center text-xs font-black text-gray-600 truncate">
                    {post.author_name}
                  </div>

                  <div className="hidden sm:block col-span-2 text-center text-xs text-gray-400 font-bold">
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>

                  <div className="col-span-12 sm:col-span-1 flex items-center justify-between sm:justify-center text-xs font-bold text-gray-400 mt-2 sm:mt-0">
                    <span className="sm:hidden text-[10px] text-gray-400">이 프롬프트를 상세하게 확인하세요</span>
                    
                    <div className="flex items-center gap-1 sm:gap-0">
                      <button 
                        onClick={(e) => handleLikePost(e, post.id)}
                        className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-gray-400 flex items-center gap-1 cursor-pointer"
                        title="추천하기"
                      >
                        <Heart size={13} className={(post.likes_count || 0) > 0 ? 'fill-red-500 text-red-500' : ''} />
                        <span className="text-[10px] font-black text-gray-700">{(post.likes_count || 0)}</span>
                      </button>
                      <button 
                        onClick={(e) => handleShare(e, post.id)}
                        className="p-2 hover:bg-gray-100 hover:text-brand-secondary rounded-xl transition-all text-gray-400 cursor-pointer"
                        title="링크 공유"
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write Modal */}
      <AnimatePresence>
        {isWriteOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border border-white/50"
            >
              <button 
                onClick={closeModal} 
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
              >
                <X size={24} className="text-gray-400" />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-brand-primary" size={28} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black">나만의 프롬프트 마법 공유</h3>
                <p className="text-gray-500 font-bold text-xs sm:text-sm mt-1">조합했던 카드 키워드를 넣으면 멋진 카드로 표시됩니다!</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Title (제목)</label>
                  <input 
                    type="text" 
                    placeholder="글의 매력적인 제목을 정해보세요!" 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 focus:border-brand-primary rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all placeholder:text-gray-300" 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">RCTF Card Combination (선택 카드 조합)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input 
                      type="text" 
                      placeholder="Role" 
                      className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none font-bold text-xs text-red-500"
                      value={formData.r} 
                      onChange={(e) => setFormData({ ...formData, r: e.target.value })} 
                    />
                    <input 
                      type="text" 
                      placeholder="Context" 
                      className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none font-bold text-xs text-blue-500"
                      value={formData.c} 
                      onChange={(e) => setFormData({ ...formData, c: e.target.value })} 
                    />
                    <input 
                      type="text" 
                      placeholder="Task" 
                      className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none font-bold text-xs text-yellow-500"
                      value={formData.t} 
                      onChange={(e) => setFormData({ ...formData, t: e.target.value })} 
                    />
                    <input 
                      type="text" 
                      placeholder="Format" 
                      className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none font-bold text-xs text-green-500"
                      value={formData.f} 
                      onChange={(e) => setFormData({ ...formData, f: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Content (상세 설명 & 프롬프트 전문)</label>
                  <textarea 
                    rows="6" 
                    placeholder="조합한 프롬프트 전문이나, AI와 나눈 신기한 답변 내용, 꿀팁들을 마음껏 채워주세요!" 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 focus:border-brand-primary rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all placeholder:text-gray-300 whitespace-pre-wrap leading-relaxed" 
                    value={formData.content} 
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                  />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }} 
                  whileTap={{ scale: 0.99 }} 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-3 cursor-pointer"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> 마법 등록하기</>}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

export default PromptFeed;
