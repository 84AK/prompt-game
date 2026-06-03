import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as LucideIcons from 'lucide-react';
import { 
  Shield, ArrowLeft, Users, MessageSquare, Gamepad2, Trash2, 
  RefreshCw, Check, AlertTriangle, Key, Loader2, Sparkles, Zap,
  Edit3, Plus, Image as ImageIcon, Bold, Italic, Heading, Quote, Upload, Info
} from 'lucide-react';


const DEFAULT_SEED_GAMES = [
  {
    id: 'reverse-prompting',
    title: '프롬프트 스무고개',
    description: 'AI가 출력한 결과물만 보고 어떤 프롬프트 명령을 입력했는지 역으로 탐색하고 맞춰보세요.',
    icon_name: 'Search',
    color: 'bg-red-50/40',
    border_color: 'border-red-100/50',
    tag: '역추론',
    category: 'prompt',
    is_new: true,
    is_popular: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'few-shot-lab',
    title: 'Few-Shot 퓨샷 트레이닝 센터',
    description: '몇 가지 핵심 예시를 제공하여 AI의 답변 말투와 감성 톤을 극적으로 튜닝하는 퓨샷 기법을 훈련하세요.',
    icon_name: 'Zap',
    color: 'bg-teal-50/40',
    border_color: 'border-teal-100/50',
    tag: '패턴학습',
    category: 'prompt',
    is_new: false,
    is_popular: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'rctf-battle',
    title: 'RCTF 카드 배틀',
    description: '랜덤하게 뽑히는 미션 카드 조합을 클리어하기 위해 최적의 프롬프트를 설계하고 카드 결투를 펼치세요.',
    icon_name: 'Swords',
    color: 'bg-yellow-50/40',
    border_color: 'border-yellow-100/50',
    tag: '실전조합',
    category: 'prompt',
    is_new: false,
    is_popular: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80'
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
    is_popular: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80'
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
    is_popular: false,
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
  }
];

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 관리자 데이터 상태
  const [usersList, setUsersList] = useState([]);
  const [postsList, setPostsList] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [magicGamesList, setMagicGamesList] = useState([]);
  
  const [activeTab, setActiveTab] = useState('users'); // users, posts, games, manage-games
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const navigate = useNavigate();

  // 마법 게임 동적 CRUD를 위한 상태
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [gameForm, setGameForm] = useState({
    id: '',
    title: '',
    description: '',
    icon_name: 'Gamepad2',
    color: 'bg-gray-50/40',
    border_color: 'border-gray-150/50',
    tag: '',
    category: 'prompt',
    is_new: true,
    is_popular: false,
    thumbnail_url: '',
    detailed_intro: ''
  });
  
  const textareaRef = useRef(null);
  const toastTimerRef = useRef(null);
  
  // RCTF 방 생성 상태 (AdminDashboard 에서 직접 생성)
  const [createRoomTeams, setCreateRoomTeams] = useState(4);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showAdminCreateRoom, setShowAdminCreateRoom] = useState(false);

  const handleAdminCreateRoom = async () => {
    setCreatingRoom(true);
    try {
      const { data: newSession, error } = await supabase
        .from('rctf_games')
        .insert([{ game_state: 'PLAYING', total_teams: createRoomTeams, current_turn: 1 }])
        .select()
        .single();
      
      if (error) throw error;
      showToast(`🎰 게임 방이 생성되었습니다! (${createRoomTeams}팀)`);
      setShowAdminCreateRoom(false);
      // 데이터 리로드
      loadRealData();
    } catch (err) {
      showToast('❌ 방 생성에 실패했습니다: ' + err.message);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleEndRoom = async (gameId) => {
    if (!window.confirm('정말로 이 게임방 세션을 종료하고 모든 데이터를 삭제하시겠습니까?')) return;
    try {
      await supabase.from('rctf_teams').delete().eq('game_id', gameId);
      const { error } = await supabase.from('rctf_games').delete().eq('id', gameId);

      if (error) throw error;
      showToast('🔴 게임방 세션이 정상적으로 종료 및 삭제되었습니다.');
      loadRealData();
    } catch (err) {
      showToast('❌ 게임방 종료 실패: ' + err.message);
    }
  };

  useEffect(() => {
    // 세션 및 역할 조회
    const checkAdminRole = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const hasAdminFlag = sessionStorage.getItem('rctf_admin_auth') === 'true';
        
        let targetUser = session?.user ?? null;
        let targetProfile = null;

        if (targetUser) {
          // 실제 구글 세션이 있을 경우 프로필 테이블 조회 시도
          const { data: prof, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUser.id)
            .single();
          
          if (!error && prof) {
            targetProfile = prof;
          }
        }

        // 지정된 이메일 계정이거나 우회 플래그가 있는 경우 또는 DB 프로필이 ADMIN인 경우 승격
        const isAdminEmail = targetUser && ['mosebb@gmail.com', 'codingclubak03@gmail.com'].includes(targetUser.email);
        const isAuthorized = isAdminEmail || hasAdminFlag || (targetProfile && targetProfile.role === 'ADMIN');

        if (!isAuthorized) {
          showToast('⚠️ 관리자 권한이 없습니다.');
          setTimeout(() => navigate('/'), 1500);
          return;
        }

        // 관리자로 검증되거나 강제 승격된 경우 사용자 설정
        setUser(targetUser || { id: 'local_admin', email: 'admin@rctf.local' });
        
        if (targetProfile) {
          setProfile(targetProfile);
        } else {
          setProfile({
            id: targetUser?.id || 'local_admin',
            display_name: sessionStorage.getItem('user_display_name') || (targetUser?.email ? targetUser.email.split('@')[0] : '로컬 관리자'),
            role: 'ADMIN'
          });
        }

        // 실존하는 실제 Supabase 데이터 로딩 시도
        await loadRealData();

      } catch (err) {
        console.warn('관리자 데이터 로드 중 오류가 발생하여 빈 상태로 진입합니다.', err.message);
        loadMockupData();
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [navigate]);

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ isVisible: true, message });
    toastTimerRef.current = setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  // 실시간으로 디비 데이터 로드 및 오토 시딩
  const loadRealData = async () => {
    try {
      // 1. 오토 시딩 (Auto-Seeding) 가동
      await seedDefaultGamesData();

      // 2. 사용자 목록 (최근 100명)
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
      setUsersList(profiles || []);

      // 3. 피드 목록 (최근 50개)
      const { data: posts } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
      setPostsList(posts || []);

      // 4. 게임 세션 목록
      const { data: games } = await supabase.from('rctf_games').select('*').order('updated_at', { ascending: false });
      setActiveGames(games || []);

      // 5. 마법 게임 목록 (동적 games 테이블)
      const { data: magicGames } = await supabase.from('games').select('*').order('created_at', { ascending: true });
      setMagicGamesList(magicGames || []);
    } catch (err) {
      console.error(err);
    }
  };

  const seedDefaultGamesData = async () => {
    try {
      // 1. games 테이블 시딩 확인
      const { data: existingGames, error: fetchErr } = await supabase.from('games').select('id');
      if (fetchErr) throw fetchErr;

      const existingIds = existingGames?.map(g => g.id) || [];
      const missingGames = DEFAULT_SEED_GAMES.filter(g => !existingIds.includes(g.id));

      if (missingGames.length > 0) {
        console.log("DB에 누락된 시드 마법 게임을 오토 시딩합니다.", missingGames.map(g => g.id));
        const gamesToInsert = missingGames.map(({ thumbnail_url, ...g }) => g);
        const { error: insertErr } = await supabase.from('games').insert(gamesToInsert);
        if (insertErr) throw insertErr;
      }

      // 2. game_intros 테이블 시딩 확인
      const { data: existingIntros, error: introErr } = await supabase.from('game_intros').select('id');
      if (introErr) throw introErr;

      const existingIntroIds = existingIntros?.map(i => i.id) || [];
      const missingIntroIds = Object.keys(DEFAULT_SEED_INTROS).filter(id => !existingIntroIds.includes(id));

      if (missingIntroIds.length > 0) {
        const introsToInsert = missingIntroIds.map(id => ({
          id,
          title: DEFAULT_SEED_INTROS[id].title,
          description: DEFAULT_SEED_INTROS[id].description,
          thumbnail_url: DEFAULT_SEED_INTROS[id].thumbnail_url,
          detailed_intro: DEFAULT_SEED_INTROS[id].detailed_intro
        }));

        console.log("DB에 누락된 시드 설명서(game_intros)를 오토 시딩합니다.", missingIntroIds);
        const { error: insertIntroErr } = await supabase.from('game_intros').insert(introsToInsert);
        if (insertIntroErr) throw insertIntroErr;
      }
    } catch (err) {
      console.warn("오토 시딩 진행 중 문제가 발생하였습니다(이슈 우회 가능):", err.message);
    }
  };

  // 오프라인 Mockup 데이터 로드
  const loadMockupData = () => {
    // 실존하고 있는 실제 데이터만 투명하게 보여주기 위해 더미 목업 데이터를 빈 배열로 초기화합니다.
    setUsersList([]);
    setPostsList([]);
    setActiveGames([]);
    setMagicGamesList([]);
  };


  // 유저 권한 승격/강등 기능
  const handleToggleRole = async (targetId, currentRole) => {
    setSubmitting(true);
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetId);

      if (error) throw error;
      showToast(`권한이 ${newRole}(으)로 성공적으로 변경되었습니다.`);
      loadRealData();
    } catch (err) {
      // Mockup 변경
      const updated = usersList.map(u => u.id === targetId ? { ...u, role: newRole } : u);
      setUsersList(updated);
      showToast(`로컬 임시 권한 변경: ${newRole}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 특정 역할로 직접 지정 (TEACHER, ADMIN, USER)
  const handleSetRole = async (targetId, currentRole, newRole) => {
    if (currentRole === newRole) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetId);

      if (error) throw error;
      showToast(`권한이 ${newRole}(으)로 변경되었습니다.`);
      loadRealData();
    } catch (err) {
      const updated = usersList.map(u => u.id === targetId ? { ...u, role: newRole } : u);
      setUsersList(updated);
      showToast(`로컬 임시 권한 변경: ${newRole}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Supabase Storage 썸네일 업로드
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!gameForm.id) {
      showToast('❌ 썸네일을 업로드하려면 먼저 게임 ID를 지정해 주세요!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ 파일 크기는 최대 5MB를 넘을 수 없습니다!');
      return;
    }

    setUploadingThumbnail(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${gameForm.id.trim()}_${Date.now()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('game-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('game-assets')
        .getPublicUrl(filePath);

      setGameForm(prev => ({ ...prev, thumbnail_url: publicUrl }));
      showToast('📸 스토리지 이미지 업로드 성공!');
    } catch (err) {
      console.error(err);
      showToast('스토리지 업로드에 실패했습니다. (Public game-assets 버킷 필요)');
    } finally {
      setUploadingThumbnail(false);
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
      default:
        return;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setGameForm(prev => ({ ...prev, detailed_intro: newText }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 100);
  };

  // 3. 마법 게임 Upsert 통합 저장 기능
  const handleSaveMagicGame = async (e) => {
    e.preventDefault();
    if (!gameForm.id.trim() || !gameForm.title.trim() || !gameForm.detailed_intro.trim()) {
      showToast('게임 ID, 제목 및 상세 소개서는 필수입니다!');
      return;
    }

    setSubmitting(true);
    try {
      // 1) games 테이블 upsert
      const { error: gameError } = await supabase
        .from('games')
        .upsert({
          id: gameForm.id.trim(),
          title: gameForm.title.trim(),
          description: gameForm.description.trim(),
          icon_name: gameForm.icon_name,
          color: gameForm.color,
          border_color: gameForm.border_color,
          tag: gameForm.tag.trim() || '아케이드',
          category: gameForm.category,
          is_new: gameForm.is_new,
          is_popular: gameForm.is_popular,
          thumbnail_url: gameForm.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          created_at: new Date().toISOString()
        });

      if (gameError) throw gameError;

      // 2) game_intros 테이블 upsert
      const { error: introError } = await supabase
        .from('game_intros')
        .upsert({
          id: gameForm.id.trim(),
          title: gameForm.title.trim(),
          description: gameForm.description.trim(),
          thumbnail_url: gameForm.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          detailed_intro: gameForm.detailed_intro,
          updated_at: new Date().toISOString()
        });

      if (introError) throw introError;

      showToast('🎮 AI 아케이드 게임과 상세 소개서가 동적으로 저장 완료되었습니다!');
      setShowGameForm(false);
      loadRealData();
    } catch (err) {
      console.warn("DB Upsert 실패, 임시 로컬 데이터를 갱신합니다:", err.message);
      // 로컬 Mockup 적용
      const exists = magicGamesList.some(g => g.id === gameForm.id);
      let updated;
      if (exists) {
        updated = magicGamesList.map(g => g.id === gameForm.id ? { ...g, ...gameForm } : g);
      } else {
        updated = [...magicGamesList, { ...gameForm }];
      }
      setMagicGamesList(updated);
      showToast('로컬 임시로 아케이드 게임을 Upsert 완료했습니다.');
      setShowGameForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. 마법 게임 영구 삭제 기능
  const handleDeleteMagicGame = async (gameId) => {
    if (!window.confirm('정말로 이 아케이드 게임과 관련된 모든 상세 소개서 데이터를 영구 삭제하시겠습니까?')) return;

    setSubmitting(true);
    try {
      // 1) game_intros 데이터 삭제
      await supabase.from('game_intros').delete().eq('id', gameId);
      // 2) games 데이터 삭제
      const { error } = await supabase.from('games').delete().eq('id', gameId);

      if (error) throw error;
      showToast('아케이드 게임이 완전히 삭제되었습니다.');
      loadRealData();
    } catch (err) {
      console.warn("DB 삭제 실패, 임시 로컬 데이터 삭제 처리:", err.message);
      const updated = magicGamesList.filter(g => g.id !== gameId);
      setMagicGamesList(updated);
      showToast('로컬 임시로 아케이드 게임 삭제 완료.');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. 게임 수정 모드 초기 로드 헬퍼
  const handleOpenEditMode = async (game) => {
    setEditingGame(game.id);
    let detailedIntro = '### 🧙‍♂️ 게임의 목적 및 가치\n여기에 소개 문구를 자유롭게 작성해 보세요!\n\n### 📜 게임 규칙 및 방법\n1. 상세 규칙 번호 1\n2. 상세 규칙 번호 2';
    let thumbnailUrl = '';

    try {
      const { data, error } = await supabase
        .from('game_intros')
        .select('*')
        .eq('id', game.id)
        .single();
      
      if (data) {
        detailedIntro = data.detailed_intro || detailedIntro;
        thumbnailUrl = data.thumbnail_url || thumbnailUrl;
      }
    } catch (err) {
      console.warn("소개서 획득 실패, 기본 뼈대를 사용합니다.");
    }

    setGameForm({
      id: game.id,
      title: game.title,
      description: game.description || '',
      icon_name: game.icon_name || 'Gamepad2',
      color: game.color || 'bg-gray-50/40',
      border_color: game.border_color || game.borderColor || 'border-gray-150/50',
      tag: game.tag || '',
      category: game.category || 'prompt',
      is_new: game.is_new !== undefined ? game.is_new : game.isNew,
      is_popular: game.is_popular !== undefined ? game.is_popular : game.isPopular,
      thumbnail_url: thumbnailUrl,
      detailed_intro: detailedIntro
    });
    setShowGameForm(true);
  };

  const handleOpenCreateMode = () => {
    setEditingGame(null);
    setGameForm({
      id: '',
      title: '',
      description: '',
      icon_name: 'Gamepad2',
      color: 'bg-gray-50/40',
      border_color: 'border-gray-150/50',
      tag: '',
      category: 'prompt',
      is_new: true,
      is_popular: false,
      thumbnail_url: '',
      detailed_intro: '### 🧙‍♂️ 게임의 목적 및 가치\n여기에 소개 문구를 자유롭게 작성해 보세요!\n\n### 📜 게임 규칙 및 방법\n1. 상세 규칙 번호 1\n2. 상세 규칙 번호 2'
    });
    setShowGameForm(true);
  };


  // 피드 강제 삭제 기능
  const handleForceDeletePost = async (postId) => {
    if (!window.confirm('관리자 권한으로 이 글을 완전히 강제 삭제하시겠습니까?')) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      showToast('성공적으로 강제 삭제 처리되었습니다.');
      loadRealData();
    } catch (err) {
      // Mockup 삭제
      const updated = postsList.filter(p => p.id !== postId);
      setPostsList(updated);
      localStorage.setItem('mockup_posts', JSON.stringify(updated));
      showToast('로컬 임시 강제 삭제 완료.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F9] flex flex-col justify-center items-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 font-bold">관리자 인증 권한 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 min-h-screen flex flex-col font-sans relative">
      <AnimatePresence>
        {toast.isVisible && (
          <motion.div 
            initial={{ y: -50, opacity: 0, x: '-50%' }} 
            animate={{ y: 20, opacity: 1, x: '-50%' }} 
            exit={{ y: -50, opacity: 0, x: '-50%' }} 
            className="fixed top-0 left-1/2 z-[200] px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold shadow-2xl"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-4 z-50 flex items-center justify-between px-8 py-4 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg mb-12">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-800 font-bold transition-all group">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 홈으로
          </Link>
          <Link 
            to="/play" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full border border-gray-100 hover:border-gray-250 shadow-sm hover:shadow text-[10px] sm:text-xs font-black text-gray-700 transition-all cursor-pointer"
            title="게임 센터로 이동"
          >
            <Gamepad2 size={12} className="text-brand-primary" /> 게임 센터
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <span className="font-black text-sm tracking-tight text-gray-800">Admin Dashboard</span>
        </div>
      </header>

      {/* Hero Header */}
      <section className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full mb-3 text-xs font-black text-orange-600 border border-orange-100">
          <Shield size={14} /> 통합 관리 콘솔
        </div>
        <h1 className="text-4xl font-black text-gray-800 tracking-tight">프롬프트 아케이드 관리자 대시보드</h1>
        <p className="text-gray-500 font-bold mt-1">회원 현황 감시, 유해 게시물 제재 및 실시간 RCTF 퀴즈 게임방 상태를 조율합니다.</p>
      </section>

      {/* Bento Grid Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { key: 'users', label: '사용자 관리', icon: <Users size={20} /> },
          { key: 'posts', label: '피드 게시글 관리', icon: <MessageSquare size={20} /> },
          { key: 'games', label: 'RCTF 게임 세션', icon: <Gamepad2 size={20} /> },
          { key: 'manage-games', label: 'AI 게임 관리', icon: <Sparkles size={20} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setShowGameForm(false);
            }}
            className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${activeTab === tab.key ? 'bg-orange-500 text-white border-orange-500 shadow-xl shadow-orange-100' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
          >
            {tab.icon}
            <span className="text-sm font-black">{tab.label}</span>
          </button>
        ))}
      </div>


      {/* Content Container (Bento style) */}
      <div className="glass-card bg-white rounded-[3rem] p-10 shadow-2xl border-white relative overflow-hidden flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Users className="text-orange-500" /> 회원 정보 목록</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Total: {usersList.length}명</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-6">ID (고유키)</th>
                      <th className="py-4 px-6">표시 이름</th>
                      <th className="py-4 px-6">권한 (Role)</th>
                      <th className="py-4 px-6 text-right">관리 작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((targetUser) => (
                      <tr key={targetUser.id} className="border-b border-gray-50 text-sm hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs text-gray-400">{targetUser.id.substring(0, 16)}...</td>
                        <td className="py-4 px-6 font-black text-gray-700">{targetUser.display_name}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                            targetUser.role === 'ADMIN' ? 'bg-orange-100 text-orange-600' :
                            targetUser.role === 'TEACHER' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {targetUser.role === 'TEACHER' ? '🧑‍🏫 선생님' : targetUser.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {targetUser.role !== 'TEACHER' && targetUser.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleSetRole(targetUser.id, targetUser.role, 'TEACHER')}
                                disabled={submitting}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-black transition-colors cursor-pointer"
                              >
                                🧑‍🏫 선생님 지정
                              </button>
                            )}
                            {targetUser.role === 'TEACHER' && (
                              <button
                                onClick={() => handleSetRole(targetUser.id, targetUser.role, 'USER')}
                                disabled={submitting}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black transition-colors cursor-pointer"
                              >
                                선생님 해제
                              </button>
                            )}
                            {targetUser.role !== 'ADMIN' ? (
                              <button
                                onClick={() => handleSetRole(targetUser.id, targetUser.role, 'ADMIN')}
                                disabled={submitting}
                                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-black transition-colors cursor-pointer"
                              >
                                관리자 임명
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSetRole(targetUser.id, targetUser.role, 'USER')}
                                disabled={submitting}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black transition-colors cursor-pointer"
                              >
                                권한 해제
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'posts' && (
            <motion.div
              key="posts-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2"><MessageSquare className="text-orange-500" /> 전체 피드 글 모니터링</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Total: {postsList.length}개</span>
              </div>

              {postsList.length === 0 ? (
                <p className="text-center py-20 text-gray-400 font-bold">등록된 글이 존재하지 않습니다.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {postsList.map((post) => (
                    <div key={post.id} className="p-6 rounded-[2rem] border border-gray-100 bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-bold text-gray-400">작성자: {post.author_name}</span>
                          <button
                            onClick={() => handleForceDeletePost(post.id)}
                            disabled={submitting}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            title="강제 삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h4 className="text-lg font-black text-gray-800 mb-2 leading-tight">{post.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400">
                        <span>ID: {post.id.substring(0, 8)}...</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'games' && (
            <motion.div
              key="games-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Gamepad2 className="text-orange-500" /> 활성 게임방 세션 감시</h3>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Total: {activeGames.length}개</span>
                  <button
                    onClick={() => setShowAdminCreateRoom(prev => !prev)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus size={14} /> 새 방 만들기
                  </button>
                </div>
              </div>

              {/* 방 생성 패널 */}
              <AnimatePresence>
                {showAdminCreateRoom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 bg-orange-50 border-2 border-orange-200 rounded-[2rem] mb-6 space-y-6">
                      <h4 className="text-lg font-black text-orange-800 flex items-center gap-2"><Zap size={18} /> 새 게임 방 설정</h4>
                      <div>
                        <label className="text-sm font-black text-gray-600 mb-3 block">팀 수 선택</label>
                        <div className="flex gap-3 flex-wrap">
                          {[2, 3, 4, 5, 6, 8].map(n => (
                            <button
                              key={n}
                              onClick={() => setCreateRoomTeams(n)}
                              className={`w-14 h-14 rounded-2xl font-black text-xl transition-all cursor-pointer ${
                                createRoomTeams === n
                                  ? 'bg-orange-500 text-white shadow-lg'
                                  : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-bold">{createRoomTeams}팀 기준으로 실시간 방이 생성됩니다</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleAdminCreateRoom}
                          disabled={creatingRoom}
                          className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                        >
                          {creatingRoom ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                          방 생성!
                        </button>
                        <button
                          onClick={() => setShowAdminCreateRoom(false)}
                          className="px-6 py-3 bg-white text-gray-500 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {activeGames.length === 0 ? (
                <p className="text-center py-20 text-gray-400 font-bold">생성된 게임방 정보가 없습니다.</p>
              ) : (
                <div className="space-y-6">
                  {activeGames.map((game) => (
                    <div key={game.id} className="p-8 rounded-[2.5rem] border border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full uppercase tracking-wider">{game.game_state}</span>
                          <span className="font-mono text-xs text-gray-400">UUID: {game.id}</span>
                        </div>
                        <h4 className="text-xl font-black text-gray-800">배틀 세션 (팀 규모: {game.total_teams}개 팀)</h4>
                        <p className="text-xs text-gray-400 font-bold">현재 공격 차례: TEAM {game.current_turn} 🚩</p>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to="/game/rctf-battle"
                          className="px-6 py-3 bg-gray-900 hover:bg-orange-500 text-white rounded-xl text-xs font-black shadow-md transition-colors"
                        >
                          실시간 게임방 열기
                        </Link>
                        <button
                          onClick={() => handleEndRoom(game.id)}
                          className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} /> 방 종료
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}


          {activeTab === 'manage-games' && (
            <motion.div
              key="manage-games-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {!showGameForm ? (
                // 1) 게임 목록 뷰어
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                      <Sparkles className="text-orange-500" /> AI 아케이드 게임 동적 관리
                    </h3>
                    <button
                      onClick={handleOpenCreateMode}
                      className="px-5 py-2.5 bg-gray-900 hover:bg-orange-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Plus size={14} /> 새 게임 등록
                    </button>
                  </div>

                  {magicGamesList.length === 0 ? (
                    <p className="text-center py-20 text-gray-400 font-bold">등록된 아케이드 게임 정보가 없습니다.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {magicGamesList.map((game) => (
                        <div 
                          key={game.id} 
                          className={`p-6 rounded-[2.5rem] border bg-white/85 border-gray-150/70 flex flex-col justify-between hover:shadow-lg transition-all duration-300 ${game.color || 'bg-gray-50/40'} ${game.border_color || game.borderColor || 'border-gray-100'}`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className="px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-[10px] font-black text-gray-500 border border-white/50">
                                #{game.tag}
                              </span>
                              <span className={`px-2 py-0.5 text-[8px] font-black rounded-full uppercase tracking-wider ${game.category === 'prompt' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'}`}>
                                {game.category === 'prompt' ? 'Prompt' : 'Unplugged'}
                              </span>
                            </div>
                            <h4 className="text-base font-black text-gray-800 mb-2 leading-tight">{game.title}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed min-h-[32px] line-clamp-2">{game.description}</p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-150/50 flex justify-between items-center">
                            <span className="font-mono text-[9px] text-gray-300">ID: {game.id}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEditMode(game)}
                                className="p-2 bg-gray-50 hover:bg-orange-50 hover:text-orange-500 rounded-xl text-gray-400 transition-colors cursor-pointer"
                                title="상세 수정"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteMagicGame(game.id)}
                                className="p-2 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-xl text-gray-400 transition-colors cursor-pointer"
                                title="영구 삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // 2) 게임 등록 및 수정 폼 (마크다운 에디터 & 썸네일 파일 업로드 일괄 포함)
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
                      <Sparkles className="text-orange-500" />
                      {editingGame ? `[수정] ${gameForm.title}` : '🎮 새 아케이드 게임 정보 등록'}
                    </h3>
                    <button
                      onClick={() => setShowGameForm(false)}
                      className="px-4 py-2 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 transition-colors cursor-pointer"
                    >
                      취소
                    </button>
                  </div>

                  <form onSubmit={handleSaveMagicGame} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column (Metadata) */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2">게임 ID (고유 키 - 영문/대시만 가능)</label>
                          <input
                            type="text"
                            placeholder="예: few-shot-lab"
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-colors"
                            value={gameForm.id}
                            onChange={(e) => setGameForm({ ...gameForm, id: e.target.value })}
                            disabled={editingGame !== null || submitting}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2">게임 타이틀 (제목)</label>
                          <input
                            type="text"
                            placeholder="예: 감성 AI 트레이닝 센터"
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-colors"
                            value={gameForm.title}
                            onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                            disabled={submitting}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2">카드 간단 요약 소개글</label>
                          <textarea
                            placeholder="게임 카드에 표시될 간단한 한 줄 요약을 적어주세요."
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:border-orange-500 transition-colors min-h-[80px]"
                            value={gameForm.description}
                            onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                            disabled={submitting}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-gray-500 mb-2">태그 (해시태그)</label>
                            <input
                              type="text"
                              placeholder="분석력 / 패턴인식"
                              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-colors"
                              value={gameForm.tag}
                              onChange={(e) => setGameForm({ ...gameForm, tag: e.target.value })}
                              disabled={submitting}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-gray-500 mb-2">카테고리</label>
                            <select
                              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-colors"
                              value={gameForm.category}
                              onChange={(e) => setGameForm({ ...gameForm, category: e.target.value })}
                              disabled={submitting}
                            >
                              <option value="prompt">프롬프트 게임</option>
                              <option value="unplugged">언플러그드 게임</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-gray-500 mb-2">아이콘 컴포넌트 명칭</label>
                            <select
                              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500 transition-colors"
                              value={gameForm.icon_name}
                              onChange={(e) => setGameForm({ ...gameForm, icon_name: e.target.value })}
                              disabled={submitting}
                            >
                              <option value="Gamepad2">Gamepad2 (게임패드)</option>
                              <option value="Search">Search (돋보기)</option>
                              <option value="Zap">Zap (번개)</option>
                              <option value="Swords">Swords (칼배틀)</option>
                              <option value="TrendingUp">TrendingUp (상승그래프)</option>
                              <option value="Sparkles">Sparkles (별빛)</option>
                              <option value="Users">Users (사람들)</option>
                              <option value="Layers">Layers (레이어)</option>
                            </select>
                          </div>

                          <div className="flex gap-4 items-center pt-6">
                            <label className="flex items-center gap-2 text-xs font-black text-gray-500 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                                checked={gameForm.is_new}
                                onChange={(e) => setGameForm({ ...gameForm, is_new: e.target.checked })}
                                disabled={submitting}
                              />
                              신규 출시 (New)
                            </label>

                            <label className="flex items-center gap-2 text-xs font-black text-gray-500 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                                checked={gameForm.is_popular}
                                onChange={(e) => setGameForm({ ...gameForm, is_popular: e.target.checked })}
                                disabled={submitting}
                              />
                              대세 인기 (Popular)
                            </label>
                          </div>
                        </div>

                        {/* 썸네일 이미지 업로드 영역 */}
                        <div className="p-5 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                          <label className="block text-xs font-black text-gray-500 mb-3">소개서 썸네일 이미지</label>
                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-24 h-16 bg-gray-100 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center text-gray-400 border border-gray-200">
                              {gameForm.thumbnail_url ? (
                                <img src={gameForm.thumbnail_url} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={24} />
                              )}
                            </div>

                            <div className="flex-1 w-full space-y-2">
                              <input
                                type="text"
                                placeholder="이미지 Direct URL 또는 직접 업로드"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-xs outline-none focus:border-orange-500 transition-colors"
                                value={gameForm.thumbnail_url}
                                onChange={(e) => setGameForm({ ...gameForm, thumbnail_url: e.target.value })}
                                disabled={submitting}
                              />
                              
                              <div className="relative">
                                <input
                                  type="file"
                                  id="dashboard-thumbnail-file"
                                  accept="image/*"
                                  onChange={handleThumbnailUpload}
                                  className="hidden"
                                  disabled={uploadingThumbnail || submitting}
                                />
                                <label
                                  htmlFor="dashboard-thumbnail-file"
                                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-black text-gray-600 transition-all cursor-pointer shadow-sm ${uploadingThumbnail ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                  {uploadingThumbnail ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin text-orange-500" />
                                      업로드 중...
                                    </>
                                  ) : (
                                    <>
                                      <Upload size={14} />
                                      썸네일 이미지 직접 파일 업로드 (Max 5MB)
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column (Markdown Editor) */}
                      <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-black text-gray-500">상세 소개서 마크다운 작성</label>
                          
                          {/* 에디터 주입 단축 서식 툴바 */}
                          <div className="flex gap-1.5 p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <button
                              type="button"
                              onClick={() => insertStyle('bold')}
                              className="p-2 hover:bg-orange-50 hover:text-orange-500 rounded-lg text-gray-400 transition-all cursor-pointer"
                              title="굵게 (Bold)"
                            >
                              <Bold size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertStyle('italic')}
                              className="p-2 hover:bg-orange-50 hover:text-orange-500 rounded-lg text-gray-400 transition-all cursor-pointer"
                              title="기울임 (Italic)"
                            >
                              <Italic size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertStyle('heading')}
                              className="p-2 hover:bg-orange-50 hover:text-orange-500 rounded-lg text-gray-400 transition-all cursor-pointer"
                              title="헤더 타이틀 (Heading)"
                            >
                              <Heading size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertStyle('quote')}
                              className="p-2 hover:bg-orange-50 hover:text-orange-500 rounded-lg text-gray-400 transition-all cursor-pointer"
                              title="인용구 (Quote)"
                            >
                              <Quote size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-[350px]">
                          <textarea
                            ref={textareaRef}
                            placeholder="여기에 소개서 마크다운을 멋지게 작성해 주세요. 굵은 글씨, 이미지, 리액트 요소를 활용해 자유롭게 작성할 수 있습니다."
                            className="w-full flex-1 p-5 bg-gray-50/50 border border-gray-200 focus:border-orange-500 rounded-3xl outline-none font-bold text-xs sm:text-sm leading-relaxed text-gray-700 transition-all min-h-[300px] resize-y"
                            value={gameForm.detailed_intro}
                            onChange={(e) => setGameForm({ ...gameForm, detailed_intro: e.target.value })}
                            disabled={submitting}
                            required
                          />
                        </div>

                        <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl text-[10px] font-bold text-orange-600 flex gap-2">
                          <Info size={14} className="flex-shrink-0 mt-0.5" />
                          <div>
                            <p>상세 소개서 마크다운 에디터는 `game_intros` 테이블과 일괄 upsert 매칭됩니다.</p>
                            <p className="mt-1">썸네일 이미지는 꼭 Direct URL 주소를 가지거나 위 스토리지 업로드를 통해 생성된 URL이어야 정상 엑박 없이 출력됩니다.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowGameForm(false)}
                        className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                        disabled={submitting}
                      >
                        취소
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 bg-gray-900 hover:bg-orange-500 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="animate-spin text-white" size={16} />
                            게임 저장 중...
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                             {editingGame ? '수정된 게임 저장하기' : '새로운 게임 등록하기'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

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

export default AdminDashboard;
