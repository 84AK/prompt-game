import React, { useState, useEffect, useRef } from 'react';
import RichEditor from '../components/RichEditor';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, User as UserIcon, Heart, Share2,
  Sparkles, Edit2, Trash2, Loader2, X, Send, ChevronLeft, Shield, Gamepad2,
  ExternalLink, PlayCircle, Image as ImageIcon, ImagePlus, MessageSquare,
  CornerDownRight
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
  const [formData, setFormData] = useState({ title: '', content: '', r: '', c: '', t: '', f: '', image_url: '', link_url: '', youtube_url: '' });
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const editFileInputRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchLikeStatus(session.user.id, postId);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchLikeStatus(session.user.id, postId);
      } else {
        setProfile(null);
        setIsLiked(false);
      }
    });

    fetchPostDetail();
    fetchComments();

    return () => subscription.unsubscribe();
  }, [postId]);

  const showToast = (message) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  const fetchLikeStatus = async (userId, targetPostId) => {
    if (!userId || !targetPostId) {
      setIsLiked(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', targetPostId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setIsLiked(!!data);
    } catch (err) {
      console.warn("좋아요 상태 조회 실패:", err.message);
    }
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

  // 상세 페이지 내 좋아요 증식 방지 처리
  const handleLikePost = async () => {
    if (!post) return;
    if (!user) {
      showToast('좋아요를 누르려면 먼저 로그인해 주세요! 💖');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const currentLikes = post.likes_count || 0;

    if (isLiked) {
      // 좋아요 취소
      const nextCount = Math.max(0, currentLikes - 1);
      setPost(prev => ({ ...prev, likes_count: nextCount }));
      setIsLiked(false);
      showToast('좋아요를 취소했습니다. 💔');

      try {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } catch (err) {
        console.warn("좋아요 취소 DB 반영 실패:", err.message);
        setPost(prev => ({ ...prev, likes_count: currentLikes }));
        setIsLiked(true);
      }
    } else {
      // 좋아요 추가
      const nextCount = currentLikes + 1;
      setPost(prev => ({ ...prev, likes_count: nextCount }));
      setIsLiked(true);
      showToast('이 프롬프트 마법을 응원합니다! 💖');

      try {
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: post.id, user_id: user.id }]);
        
        if (error) throw error;
      } catch (err) {
        console.warn("좋아요 DB 반영 실패:", err.message);
        setPost(prev => ({ ...prev, likes_count: currentLikes }));
        setIsLiked(false);
      }
    }
  };

  // 공유하기 액션
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('📋 이 글의 상세 링크가 클립보드에 복사되었습니다!'))
      .catch(() => showToast('링크 복사에 실패했습니다.'));
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.warn('댓글 로드 실패:', err.message);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    const authorName = profile?.display_name || user?.email?.split('@')[0] || '익명';
    try {
      const { error } = await supabase.from('comments').insert([{
        post_id: postId,
        user_id: user.id,
        author_name: authorName,
        content: commentText.trim(),
      }]);
      if (error) throw error;
      setCommentText('');
      fetchComments();
      showToast('댓글이 등록됐습니다! 💬');
    } catch (err) {
      showToast('댓글 등록 실패: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingComment(true);
    const authorName = profile?.display_name || user?.email?.split('@')[0] || '익명';
    try {
      const { error } = await supabase.from('comments').insert([{
        post_id: postId,
        user_id: user.id,
        author_name: authorName,
        content: replyText.trim(),
        parent_id: parentId
      }]);
      if (error) throw error;
      setReplyText('');
      setReplyingToId(null);
      fetchComments();
      showToast('답글이 등록됐습니다! 💬');
    } catch (err) {
      showToast('답글 등록 실패: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId, commentUserId) => {
    const isAdmin = profile?.role === 'ADMIN' || sessionStorage.getItem('rctf_admin_auth') === 'true';
    if (user?.id !== commentUserId && !isAdmin) {
      showToast('삭제 권한이 없습니다.');
      return;
    }
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      showToast('댓글 삭제 실패: ' + err.message);
    }
  };

  // 삭제 후 이동할 경로 (game → 홈, feed → 커뮤니티)
  const returnPath = post?.post_type === 'game' ? '/' : '/feed';

  // 상세 페이지 내 삭제
  const handleDelete = async () => {
    if (!post || !window.confirm('정말로 이 글을 완전히 삭제하시겠습니까?')) return;

    // 권한 재확인
    const isAdmin = profile?.role === 'ADMIN' || sessionStorage.getItem('rctf_admin_auth') === 'true';
    const isAuthor = user?.id === post.user_id;
    if (!isAuthor && !isAdmin) {
      showToast('삭제 권한이 없습니다.');
      return;
    }

    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      showToast('삭제 완료되었습니다.');
      setTimeout(() => navigate(returnPath), 800);
    } catch (err) {
      console.error('삭제 실패:', err.message);
      showToast('삭제 실패: ' + err.message);
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
      image_url: post.media_url || post.prompt_data?.image_url || '',
      link_url: post.prompt_data?.link_url || '',
      youtube_url: post.prompt_data?.youtube_url || ''
    });
    setIsWriteOpen(true);
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('이미지는 최대 5MB까지 가능합니다.'); return; }
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const fileName = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('game-assets')
        .upload(fileName, file, { cacheControl: '3600', contentType: file.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('game-assets').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      showToast('이미지 업로드 완료! ✅');
    } catch (err) {
      showToast('이미지 업로드 실패: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
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
          prompt_data: promptObj,
          media_url: formData.image_url?.trim() || null,
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
          onClick={() => navigate(returnPath)}
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
          <div
            className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* 5. Footer Social Interaction Bar */}
        <div className="pt-6 border-t border-gray-100/60 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={handleLikePost}
              className="px-4 py-2 bg-red-50 border border-red-100/50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Heart size={14} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
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
          
        </div>
      </motion.main>

      {/* 댓글 섹션 */}
      <section className="mt-8 mb-6">
        <h3 className="flex items-center gap-2 text-sm font-black text-gray-800 mb-5">
          <MessageSquare size={16} className="text-brand-primary" />
          댓글 <span className="text-brand-primary">{comments.length}</span>
        </h3>

        {/* 댓글 목록 */}
        {loadingComments ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-400 font-bold py-4 text-center">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {comments.filter(c => !c.parent_id).map((comment) => {
              const isOwn = user?.id === comment.user_id;
              const isAdmin = profile?.role === 'ADMIN' || sessionStorage.getItem('rctf_admin_auth') === 'true';
              const dateStr = new Date(comment.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              const replies = comments.filter(r => r.parent_id === comment.id);

              return (
                <div key={comment.id} className="flex flex-col gap-2">
                  {/* 최상위 댓글 */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-black shrink-0">
                      {comment.author_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-gray-800">{comment.author_name}</span>
                        <span className="text-[10px] text-gray-400">{dateStr}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                      {/* 답글 쓰기 토글 버튼 */}
                      {user && (
                        <div className="mt-2 flex gap-3">
                          <button
                            onClick={() => {
                              if (replyingToId === comment.id) {
                                setReplyingToId(null);
                                setReplyText('');
                              } else {
                                setReplyingToId(comment.id);
                                setReplyText('');
                              }
                            }}
                            className="text-[10px] font-black text-brand-primary hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <CornerDownRight size={10} /> 답글 달기
                          </button>
                        </div>
                      )}
                    </div>
                    {(isOwn || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                        className="p-1.5 hover:bg-red-50 rounded-xl text-gray-300 hover:text-red-400 transition-all cursor-pointer shrink-0 self-start"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </motion.div>

                  {/* 인라인 답글 입력 폼 */}
                  {replyingToId === comment.id && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={(e) => handleAddReply(e, comment.id)}
                      className="ml-10 flex gap-3 p-3 bg-gray-50/50 border border-gray-150 rounded-2xl"
                    >
                      <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-[10px] font-black shrink-0 mt-1">
                        {(profile?.display_name || user?.email)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="답글을 입력하세요..."
                          rows={1}
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-primary transition-all resize-none"
                          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddReply(e, comment.id); }}
                        />
                        <button
                          type="submit"
                          disabled={submittingComment || !replyText.trim()}
                          className="px-3 py-1 bg-brand-primary hover:brightness-110 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer disabled:opacity-40"
                        >
                          등록
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* 대댓글(답글) 목록 */}
                  {replies.map((reply) => {
                    const isReplyOwn = user?.id === reply.user_id;
                    const isReplyAdmin = profile?.role === 'ADMIN' || sessionStorage.getItem('rctf_admin_auth') === 'true';
                    const replyDateStr = new Date(reply.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    return (
                      <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="ml-10 flex gap-3 p-4 bg-gray-100/60 border border-gray-150/40 rounded-2xl relative"
                      >
                        <div className="absolute top-4 left-[-16px] text-gray-300">
                          <CornerDownRight size={14} />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center text-brand-secondary text-xs font-black shrink-0">
                          {reply.author_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-gray-800">{reply.author_name}</span>
                            <span className="text-[10px] text-gray-400">{replyDateStr}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                        </div>
                        {(isReplyOwn || isReplyAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(reply.id, reply.user_id)}
                            className="p-1.5 hover:bg-red-50 rounded-xl text-gray-300 hover:text-red-400 transition-all cursor-pointer shrink-0 self-start"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* 댓글 입력 */}
        {user ? (
          <form onSubmit={handleAddComment} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-black shrink-0 mt-1">
              {(profile?.display_name || user?.email)?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 flex gap-2">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows={2}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-all resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment(e); }}
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2 bg-brand-primary hover:brightness-110 text-white rounded-2xl text-xs font-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 self-end"
              >
                {submittingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                등록
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 text-xs text-gray-400 font-bold bg-gray-50 rounded-2xl">
            <button onClick={() => navigate('/login')} className="text-brand-primary underline cursor-pointer">로그인</button>하면 댓글을 남길 수 있습니다.
          </div>
        )}
      </section>

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
                  <RichEditor
                    value={formData.content}
                    onChange={val => setFormData(prev => ({ ...prev, content: val }))}
                    placeholder="게임 설명을 입력하세요."
                  />
                </div>

                <div className="space-y-3 p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">미디어 첨부 (선택)</p>

                  {/* 이미지 */}
                  <div>
                    <label className="text-xs font-black text-gray-500 mb-1.5 block flex items-center gap-1.5"><ImagePlus size={12} /> 이미지</label>
                    <input type="file" accept="image/*" ref={editFileInputRef} onChange={handleEditImageUpload} className="hidden" />
                    {formData.image_url ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                        <img src={formData.image_url} alt="preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setFormData(p => ({ ...p, image_url: '' }))}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full cursor-pointer">
                          <X size={12} />
                        </button>
                        <button type="button" onClick={() => editFileInputRef.current?.click()}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white rounded-lg text-[10px] font-black cursor-pointer">
                          변경
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button type="button" onClick={() => editFileInputRef.current?.click()} disabled={uploadingImage}
                          className="w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-brand-primary rounded-xl text-xs font-bold text-gray-400 hover:text-brand-primary transition-all cursor-pointer flex items-center justify-center gap-2">
                          {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                          {uploadingImage ? '업로드 중...' : '이미지 업로드'}
                        </button>
                        <input type="url" placeholder="또는 이미지 URL 직접 입력" value={formData.image_url}
                          onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-xs text-gray-700 transition-all" />
                      </div>
                    )}
                  </div>

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
