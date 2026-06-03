import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, User as UserIcon, Heart, Share2,
  Sparkles, Edit2, Trash2, Loader2, X, Send, ChevronLeft, Shield, Gamepad2,
  ExternalLink, PlayCircle, Image as ImageIcon
} from 'lucide-react';

const extractPlayCircleId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : null;
};

const CATEGORY_COLORS = {
  R: 'text-red-500 bg-red-50/50 border-red-100/50',
  C: 'text-blue-500 bg-blue-50/50 border-blue-100/50',
  T: 'text-yellow-500 bg-yellow-50/50 border-yellow-100/50',
  F: 'text-green-500 bg-green-50/50 border-green-100/50'
};

const PromptDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', r: '', c: '', t: '', f: '' });
  const [toast, setToast] = useState({ isVisible: false, message: '' });

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

    fetchPostDetail();

    return () => subscription.unsubscribe();
  }, [postId]);

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

  // 상세 글 로드 (Mockup 및 DB 하이브리드 지원)
  const fetchPostDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (err) {
      console.warn('Supabase DB 단일 조회 실패, 로컬 Mockup에서 포스트를 검색합니다.');
      const localData = localStorage.getItem('mockup_posts');
      if (localData) {
        const postsArray = JSON.parse(localData);
        const matched = postsArray.find(p => p.id === postId);
        if (matched) {
          setPost(matched);
        } else {
          showToast('해당 글을 찾을 수 없습니다.');
          setTimeout(() => navigate('/feed'), 1500);
        }
      } else {
        showToast('포스트 데이터를 로드할 수 없습니다.');
        setTimeout(() => navigate('/feed'), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  // 상세 페이지 내 좋아요 증식
  const handleLikePost = async () => {
    if (!post) return;
    try {
      const newLikes = (post.likes_count || 0) + 1;
      const { error } = await supabase
        .from('posts')
        .update({ likes_count: newLikes })
        .eq('id', post.id);

      if (error) throw error;
      setPost(prev => ({ ...prev, likes_count: newLikes }));
      showToast('이 프롬프트 마법을 응원합니다! 💖');
    } catch (err) {
      // 로컬 Mockup 좋아요
      const updatedPost = { ...post, likes_count: (post.likes_count || 0) + 1 };
      setPost(updatedPost);
      
      const localData = localStorage.getItem('mockup_posts');
      if (localData) {
        const postsArray = JSON.parse(localData);
        const mapped = postsArray.map(p => p.id === post.id ? updatedPost : p);
        localStorage.setItem('mockup_posts', JSON.stringify(mapped));
      }
      showToast('로컬 임시 좋아요! 💖');
    }
  };

  // 공유하기 액션
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('📋 이 글의 상세 링크가 클립보드에 복사되었습니다!'))
      .catch(() => showToast('링크 복사에 실패했습니다.'));
  };

  // 상세 페이지 내 삭제
  const handleDelete = async () => {
    if (!post || !window.confirm('정말로 이 글을 완전히 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      showToast('삭제 완료되었습니다.');
      setTimeout(() => navigate('/feed'), 1000);
    } catch (err) {
      // Mockup 삭제
      const localData = localStorage.getItem('mockup_posts');
      if (localData) {
        const postsArray = JSON.parse(localData);
        const filtered = postsArray.filter(p => p.id !== post.id);
        localStorage.setItem('mockup_posts', JSON.stringify(filtered));
      }
      showToast('로컬 임시 삭제 완료.');
      setTimeout(() => navigate('/feed'), 1000);
    }
  };

  // 수정 모달 열기
  const openEditModal = () => {
    if (!post) return;
    setFormData({
      title: post.title,
      content: post.content,
      r: post.prompt_data?.r || '',
      c: post.prompt_data?.c || '',
      t: post.prompt_data?.t || '',
      f: post.prompt_data?.f || '',
      image_url: post.prompt_data?.image_url || '',
      link_url: post.prompt_data?.link_url || '',
      youtube_url: post.prompt_data?.youtube_url || ''
    });
    setIsWriteOpen(true);
  };

  // 수정 완료 전송
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('제목과 내용을 모두 채워주세요!');
      return;
    }

    setSubmitting(true);
    const promptObj = {
      r: formData.r?.trim() || '',
      c: formData.c?.trim() || '',
      t: formData.t?.trim() || '',
      f: formData.f?.trim() || '',
      image_url: formData.image_url?.trim() || '',
      link_url: formData.link_url?.trim() || '',
      youtube_url: formData.youtube_url?.trim() || ''
    };

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: formData.title.trim(),
          content: formData.content.trim(),
          prompt_data: promptObj
        })
        .eq('id', post.id);

      if (error) throw error;
      showToast('성공적으로 수정되었습니다! ✏️');
      setIsWriteOpen(false);
      fetchPostDetail();
    } catch (err) {
      // Mockup 수정 반영
      const updatedPost = {
        ...post,
        title: formData.title.trim(),
        content: formData.content.trim(),
        prompt_data: promptObj
      };
      setPost(updatedPost);

      const localData = localStorage.getItem('mockup_posts');
      if (localData) {
        const postsArray = JSON.parse(localData);
        const mapped = postsArray.map(p => p.id === post.id ? updatedPost : p);
        localStorage.setItem('mockup_posts', JSON.stringify(mapped));
      }
      showToast('로컬 임시 수정 완료!');
      setIsWriteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F9] flex flex-col justify-center items-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full mb-4" />
        <p className="text-xs text-gray-400 font-bold">마법 정보 분석 중...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F0F2F9] flex flex-col justify-center items-center font-sans p-6 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 font-bold">글 정보를 로드하지 못했거나 존재하지 않습니다.</p>
        <Link to="/feed" className="mt-4 px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-black shadow-md">피드 목록으로 복귀</Link>
      </div>
    );
  }

  const hasPrompt = post.prompt_data && (post.prompt_data.r || post.prompt_data.c || post.prompt_data.t || post.prompt_data.f);
  const isOwner = user && (post.user_id === user.id || profile?.role === 'ADMIN');
  const imageUrl = post.prompt_data?.image_url;
  const linkUrl = post.prompt_data?.link_url;
  const youtubeId = extractPlayCircleId(post.prompt_data?.youtube_url);

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
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-800 font-bold transition-all group text-xs sm:text-sm cursor-pointer"
        >
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> 목록으로
        </button>
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

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <span className="font-black text-xs sm:text-sm tracking-tight text-gray-800">Playcraft</span>
          </div>
        </div>
      </header>

      {/* Main Detail Bento Container */}

      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-white/50 relative overflow-hidden flex-1"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-teal-400 to-brand-accent" />

        {/* 1. Header Metadata */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
              <UserIcon size={16} />
            </div>
            <div>
              <p className="text-sm sm:text-base font-black text-gray-700">{post.author_name}</p>
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 flex items-center gap-1">
                <Calendar size={12} />
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 소유주 액션 */}
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={openEditModal}
                className="p-2.5 text-gray-400 hover:text-brand-primary hover:bg-gray-50 border border-gray-100 rounded-xl transition-all cursor-pointer"
                title="수정하기"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-100 rounded-xl transition-all cursor-pointer"
                title="삭제하기"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* 2. Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-800 leading-snug tracking-tight mb-6">
          {post.title}
        </h1>

        {/* 3. R/C/T/F Card Combination UI */}
        {hasPrompt && (
          <div className="mb-8 p-5 bg-gray-50/70 border border-gray-100/60 rounded-3xl shadow-inner space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">RCTF Card Combination (조합된 마법 덱)</p>
            <div className="flex flex-wrap gap-2">
              {post.prompt_data.r && <span className={`px-3 py-2 rounded-xl text-xs font-black border ${CATEGORY_COLORS.R}`}>Role: {post.prompt_data.r}</span>}
              {post.prompt_data.c && <span className={`px-3 py-2 rounded-xl text-xs font-black border ${CATEGORY_COLORS.C}`}>Context: {post.prompt_data.c}</span>}
              {post.prompt_data.t && <span className={`px-3 py-2 rounded-xl text-xs font-black border ${CATEGORY_COLORS.T}`}>Task: {post.prompt_data.t}</span>}
              {post.prompt_data.f && <span className={`px-3 py-2 rounded-xl text-xs font-black border ${CATEGORY_COLORS.F}`}>Format: {post.prompt_data.f}</span>}
            </div>
          </div>
        )}

        {/* 4. 이미지 */}
        {imageUrl && (
          <div className="mb-8 rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <img src={imageUrl} alt="첨부 이미지" className="w-full max-h-[480px] object-cover" />
          </div>
        )}

        {/* 5. 유튜브 임베드 */}
        {youtubeId && (
          <div className="mb-8 rounded-3xl overflow-hidden border border-gray-100 shadow-sm aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="유튜브 영상"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* 6. 외부 링크 */}
        {linkUrl && (
          <div className="mb-8">
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-black text-xs rounded-2xl transition-all"
            >
              <ExternalLink size={14} /> 관련 링크 바로가기
            </a>
          </div>
        )}

        {/* 7. Main 설명 및 내용 */}
        <div className="prose max-w-none mb-12">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* 5. Footer Social Interaction Bar */}
        <div className="pt-6 border-t border-gray-100/60 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={handleLikePost}
              className="px-4 py-2 bg-red-50 border border-red-100/50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Heart size={14} className={(post.likes_count || 0) > 0 ? 'fill-red-500' : ''} />
              <span>추천 {(post.likes_count || 0)}</span>
            </button>
            <button 
              onClick={handleShare}
              className="px-4 py-2 bg-gray-50 border border-gray-150 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Share2 size={14} />
              <span>상세 공유</span>
            </button>
          </div>
          
          <span className="text-[10px] px-3 py-1 bg-gray-100 text-gray-400 rounded-full font-black uppercase">
            Prompt Card View
          </span>
        </div>
      </motion.main>

      {/* Edit Post Modal inside Details */}
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
                onClick={() => setIsWriteOpen(false)} 
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
              >
                <X size={24} className="text-gray-400" />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-brand-primary" size={28} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black">마법 수정하기</h3>
                <p className="text-gray-500 font-bold text-xs sm:text-sm mt-1">조합했던 카드 키워드를 넣으면 멋진 카드로 표시됩니다!</p>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Title (제목)</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 focus:border-brand-primary rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all" 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Content</label>
                  <textarea
                    rows="5"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 focus:border-brand-primary rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all leading-relaxed"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>

                <div className="space-y-3 p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">미디어 첨부 (선택)</p>
                  <div>
                    <label className="text-xs font-black text-gray-500 mb-1.5 block">유튜브 URL</label>
                    <input type="url" placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-red-400 rounded-xl outline-none font-bold text-xs text-gray-700 transition-all placeholder:text-gray-300" value={formData.youtube_url || ''} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 mb-1.5 block">관련 링크 URL</label>
                    <input type="url" placeholder="https://..." className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-green-400 rounded-xl outline-none font-bold text-xs text-gray-700 transition-all placeholder:text-gray-300" value={formData.link_url || ''} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-3 cursor-pointer"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> 수정 완료하기</>}
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

export default PromptDetail;
