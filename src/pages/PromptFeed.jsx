import React, { useState, useEffect, useRef } from 'react';
import RichEditor from '../components/RichEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Sparkles, ArrowLeft, MessageSquare, Plus, Trash2,
  User as UserIcon, Calendar, Heart, Share2, Info, Loader2, ArrowRight, Shield, Gamepad2,
  X, Send, Image as ImageIcon, Link as LinkIcon, PlayCircle, Upload
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
    r: '', c: '', t: '', f: '',
    image_url: '',
    link_url: '',
    youtube_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const navigate = useNavigate();
  const toastTimerRef = useRef(null);

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
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ isVisible: true, message });
    toastTimerRef.current = setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
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
        .eq('post_type', 'feed')
        .order('created_at', { ascending: false })
        .limit(50);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('이미지 파일은 최대 5MB까지 업로드 가능합니다.');
      return;
    }
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('game-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('game-assets').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      showToast('이미지 업로드 완료! ✅');
    } catch (err) {
      showToast('이미지 업로드 실패: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('제목과 내용을 모두 채워주세요!');
      return;
    }

    setSubmitting(true);
    const authorName = profile?.display_name || sessionStorage.getItem('user_display_name') || '익명의 마법사';
    const promptObj = {
      r: formData.r.trim(),
      c: formData.c.trim(),
      t: formData.t.trim(),
      f: formData.f.trim(),
      image_url: formData.image_url.trim(),
      link_url: formData.link_url.trim(),
      youtube_url: formData.youtube_url.trim()
    };
    const hasData = Object.values(promptObj).some(v => v);
    const finalPromptObj = hasData ? promptObj : null;

    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user?.id || 'anonymous_user',
          author_name: authorName,
          title: formData.title.trim(),
          content: formData.content.trim(),
          prompt_data: finalPromptObj,
          post_type: 'feed',
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
        prompt_data: finalPromptObj,
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
    setFormData({ title: '', content: '', r: '', c: '', t: '', f: '', image_url: '', link_url: '', youtube_url: '' });
    setIsWriteOpen(true);
  };

  const closeModal = () => {
    setIsWriteOpen(false);
    setFormData({ title: '', content: '', r: '', c: '', t: '', f: '', image_url: '', link_url: '', youtube_url: '' });
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
            <span className="font-black text-sm tracking-tight text-gray-800 hidden sm:inline">Playcraft</span>
          </Link>
        </div>
      </header>



      {/* Hero Title Section */}
      <section className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-gray-100 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full mb-3 text-[10px] sm:text-xs font-bold text-brand-primary border border-brand-primary/20">
            <MessageSquare size={14} /> COMMUNITY
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-none">커뮤니티</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-bold mt-2">게임 플레이 후기, 수업 사진, 소감을 자유롭게 나눠보세요.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openWriteModal}
          className="w-full sm:w-auto px-6 py-4 bg-brand-primary hover:brightness-110 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all text-xs sm:text-sm"
        >
          <Plus size={18} /> 글 올리기
        </motion.button>
      </section>

      {/* 카드 그리드 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full" />
          <p className="text-xs text-gray-400 font-bold">게시글 불러오는 중...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto p-10">
          <Info className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-gray-700">아직 올라온 글이 없습니다</h3>
          <p className="text-xs text-gray-400 font-bold mt-1">게임 후기나 소감을 첫 번째로 나눠보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {posts.map((post) => {
            const hasImage = post.prompt_data?.image_url;
            const hasPlayCircle = post.prompt_data?.youtube_url;
            const hasLink = post.prompt_data?.link_url;
            const hasRctf = post.prompt_data && (post.prompt_data.r || post.prompt_data.c || post.prompt_data.t || post.prompt_data.f);

            return (
              <motion.div
                key={post.id}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/feed/${post.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group"
              >
                {hasImage ? (
                  <div className="w-full h-44 overflow-hidden bg-gray-100">
                    <img src={post.prompt_data.image_url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                ) : hasPlayCircle ? (
                  <div className="w-full h-44 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-red-400 opacity-60" />
                  </div>
                ) : (
                  <div className="w-full h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary" />
                )}

                <div className="p-5">
                  {(hasImage || hasPlayCircle || hasLink || hasRctf) && (
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      {hasRctf && <span className="px-2 py-0.5 bg-violet-50 text-violet-500 rounded-full text-[9px] font-black">RCTF</span>}
                      {hasImage && <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full text-[9px] font-black flex items-center gap-0.5"><ImageIcon size={9}/> 이미지</span>}
                      {hasPlayCircle && <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[9px] font-black flex items-center gap-0.5"><PlayCircle size={9}/> 영상</span>}
                      {hasLink && <span className="px-2 py-0.5 bg-green-50 text-green-500 rounded-full text-[9px] font-black flex items-center gap-0.5"><LinkIcon size={9}/> 링크</span>}
                    </div>
                  )}

                  <h3 className="font-black text-sm text-gray-900 leading-tight mb-2 group-hover:text-brand-primary transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">{post.content}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserIcon size={10} className="text-gray-500" />
                      </div>
                      <span className="text-[10px] font-black text-gray-500 truncate max-w-[80px]">{post.author_name}</span>
                      <span className="text-[10px] text-gray-300">•</span>
                      <span className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={(e) => handleLikePost(e, post.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-all text-gray-400 flex items-center gap-1 cursor-pointer">
                        <Heart size={12} className={(post.likes_count || 0) > 0 ? 'fill-red-500 text-red-500' : ''} />
                        <span className="text-[10px] font-black">{post.likes_count || 0}</span>
                      </button>
                      <button onClick={(e) => handleShare(e, post.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 cursor-pointer">
                        <Share2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Write Modal */}
      <AnimatePresence>
        {isWriteOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg md:max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:h-[88vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-teal-500 w-5 h-5" />
                  <span className="font-black text-gray-900">커뮤니티에 글 올리기</span>
                  <span className="text-xs text-gray-400 font-bold hidden sm:inline">— 후기, 수업 사진, 소감을 나눠보세요</span>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer text-gray-400">
                  <X size={16} />
                </button>
              </div>

              {/* 폼 — 모바일: 1컬럼 / 데스크탑: 2컬럼 */}
              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row flex-1 min-h-0">

                {/* ── 왼쪽: 제목 / 이미지 / 링크 ── */}
                <div className="md:w-80 lg:w-96 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-gray-100">
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                    {/* 제목 */}
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-1.5">제목 <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        placeholder="예: 오늘 수업에서 RCTF 카드 배틀 해봤어요!"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    {/* 이미지 업로드 */}
                    <div>
                      <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <ImageIcon size={13} className="text-blue-400" /> 이미지 <span className="text-gray-400 font-normal">(선택)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all text-xs font-bold text-gray-500 hover:text-blue-500">
                          {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          {uploadingImage ? '업로드 중...' : '파일 선택'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                        {formData.image_url && (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img src={formData.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                            <span className="text-[10px] text-green-600 font-black truncate">완료 ✅</span>
                            <button type="button" onClick={() => setFormData(p => ({ ...p, image_url: '' }))} className="p-1 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 cursor-pointer shrink-0">
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 유튜브 URL */}
                    <div>
                      <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <PlayCircle size={13} className="text-red-500" /> 유튜브 URL <span className="text-gray-400 font-normal">(선택)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:bg-white transition-all"
                        value={formData.youtube_url}
                        onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      />
                    </div>

                    {/* 외부 링크 */}
                    <div>
                      <label className="text-xs font-black text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <LinkIcon size={13} className="text-green-500" /> 링크 URL <span className="text-gray-400 font-normal">(선택)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://... (관련 링크, 참고 자료 등)"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                        value={formData.link_url}
                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* 등록 버튼 */}
                  <div className="px-6 py-4 border-t border-gray-100 shrink-0">
                    <button
                      type="submit"
                      disabled={submitting || uploadingImage}
                      className="w-full py-3.5 bg-gray-900 hover:bg-teal-600 text-white rounded-xl font-black text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? <><Loader2 size={15} className="animate-spin" /> 등록 중...</> : <><Send size={15} /> 커뮤니티에 올리기</>}
                    </button>
                  </div>
                </div>

                {/* ── 오른쪽: 내용 에디터 ── */}
                <div className="flex-1 flex flex-col min-h-0 px-6 py-5">
                  <label className="block text-xs font-black text-gray-700 mb-2">내용 <span className="text-red-400">*</span></label>
                  <div className="flex-1 flex flex-col min-h-0">
                    <RichEditor
                      value={formData.content}
                      onChange={val => setFormData(prev => ({ ...prev, content: val }))}
                      placeholder="플레이 후기, 수업 소감, 재미있었던 순간 등을 자유롭게 적어보세요!"
                      minHeight="300px"
                    />
                  </div>
                </div>
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
