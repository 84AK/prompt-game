import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Zap, Sparkles, Trophy, Users, CheckCircle2, RotateCw, 
  Image as ImageIcon, MessageSquare, Target, UserCheck, AlertCircle, 
  X, PlusCircle, Send, Loader2, Camera, Key, Trash2 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DEFAULT_SLOT_DATA = {
  R: ["츤데레 짝남/짝녀", "K-Pop 아이돌", "100만 유튜버", "억울한 'T'형 인간", "킹받는 신입사원", "메타버스 가이드", "전설의 요리사", "흑화한 탐정", "AI 반란군 리더"],
  C: ["편의점 신상 털기 중", "연애 리얼리티 출연 중", "0.1초 남은 수강신청", "층간소음 항의 중", "급식실 앞 줄 서기", "호그와트 입학식", "무인도에 조난됨", "화성 이주 단지", "팬싸인회 대기실"],
  T: ["고백하기", "메뉴 추천하기", "비밀 폭로하기", "춤 가르쳐주기", "반성문 쓰기", "물건 판매하기", "환불 요청하기", "인생 조언하기", "암호 전달하기"],
  F: ["5글자로만 말하기", "사투리로 말하기", "노래 부르며 말하기", "표정으로만 말하기", "쇼츠 대본 형식", "킹받는 카톡 말투", "시(Poem)로 표현", "랩(Rap)으로 하기", "이모지로만 표현"]
};

const CATEGORIES = [
  { key: 'R', label: 'Role', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  { key: 'C', label: 'Context', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'T', label: 'Task', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { key: 'F', label: 'Format', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' }
];

const Reel = memo(({ category, result, isSpinning, pool }) => {
  const displayItems = useMemo(() => {
    const items = [...(pool[category.key] || []), ...DEFAULT_SLOT_DATA[category.key]];
    return Array.from({ length: 40 }, (_, i) => items[i % items.length]);
  }, [pool, category.key]);
  return (
    <div className={`flex-1 h-32 sm:h-48 relative overflow-hidden rounded-3xl border-4 ${category.border} ${category.bg} shadow-inner`}>
      <AnimatePresence mode="wait">
        {isSpinning ? (
          <motion.div key="spinning" initial={{ y: 0 }} animate={{ y: -2500 }} transition={{ duration: 3, ease: [0.45, 0.05, 0.55, 0.95] }} className="flex flex-col items-center gap-8 py-10" style={{ willChange: 'transform' }}>
            {displayItems.map((item, i) => ( <span key={i} className={`text-xl font-black opacity-30 ${category.color} italic tracking-tighter`}>{item}</span> ))}
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ y: 50, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center p-4 text-center bg-white/40 backdrop-blur-[2px]">
            <span className={`text-xl sm:text-2xl font-black ${category.color} leading-tight drop-shadow-md`}>{result || '?'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const RctfBattle = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [gameState, setGameState] = useState({ config: { gameState: 'WAITING', totalTeams: 0, currentTurn: 1 }, teams: [], pool: [] });
  const [customPool, setCustomPool] = useState({ R: [], C: [], T: [], F: [] });
  const [newContent, setNewContent] = useState({ category: 'R', text: '' });
  const [myTeamId, setMyTeamId] = useState(null);
  
  // 권한 관리: Supabase 로그인 세션 기반
  const [userRole, setUserRole] = useState(null); // 'ADMIN' | 'TEACHER' | 'USER' | null
  const [isHost, setIsHost] = useState(false); // ADMIN 또는 TEACHER이면 true
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); // 권한 체크 완료 여부
  
  const [results, setResults] = useState({ R: '', C: '', T: '', F: '' });
  const [isSpinning, setIsSpinning] = useState(false);
  const [isMissionLocked, setIsMissionLocked] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState({});

  const displayRoomCode = gameState?.config?.room_code || activeSession?.room_code || '';
  const displayRoomName = gameState?.config?.room_name || activeSession?.room_name || '게임방';
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [revealedTeams, setRevealedTeams] = useState(new Set());
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  
  // 방 생성 UI 콘트롤
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [createRoomTeams, setCreateRoomTeams] = useState(4);
  const [roomNameInput, setRoomNameInput] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');

  // 학생용 방 입장 게이트웨이 관련 상태
  const [gateRoomCode, setGateRoomCode] = useState('');
  const [joinedRoomCode, setJoinedRoomCode] = useState(localStorage.getItem('rctf_joined_room_code') || '');
  const [gateError, setGateError] = useState('');

  const navigate = useNavigate();

  // refs — timer/subscription cleanup & stale-closure 방지
  const toastTimerRef = useRef(null);
  const spinTimerRef = useRef(null);
  const myTeamIdRef = useRef(myTeamId);
  useEffect(() => { myTeamIdRef.current = myTeamId; }, [myTeamId]);

  // 오디오 및 WebP 업로드 관련 상태
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Web Audio API 레트로 아케이드 효과음 재생
  const playSlotSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const startTime = ctx.currentTime;

      // 1. 슬롯 회전 아날로그 스핀음 연출 (3초간 띠디디디디디)
      for (let i = 0; i < 20; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(200 + i * 25, startTime + i * 0.13);
        
        gain.gain.setValueAtTime(0.08, startTime + i * 0.13);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.13 + 0.08);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime + i * 0.13);
        osc.stop(startTime + i * 0.13 + 0.09);
      }

      // 2. 스핀 종료 딩동댕 팡파레 (3초 부근)
      const tones = [523.25, 659.25, 783.99, 1046.50]; // C5(도), E5(미), G5(솔), C6(높은도)
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + 2.6 + idx * 0.1);
        
        gain.gain.setValueAtTime(0, startTime + 2.6 + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 2.6 + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.6 + idx * 0.1 + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime + 2.6 + idx * 0.1);
        osc.stop(startTime + 2.6 + idx * 0.1 + 0.45);
      });
    } catch (e) {
      console.warn('Web Audio play failed:', e);
    }
  };

  // 클라이언트 사이드에서 즉시 이미지를 WebP 및 최대 1280px로 다운스케일링 압축
  const compressToWebp = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 가로 해상도 최대 1280px로 가볍게 리사이징
          const MAX_WIDTH = 1280;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas WebP 변환에 실패했습니다.'));
            }
          }, 'image/webp', 0.8); // 80% 퀄리티 압축
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Supabase Storage 버킷 체크 및 압축 이미지 전송
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      // 1. WebP 초고속 브라우저 리사이징 압축
      const webpBlob = await compressToWebp(file);
      
      // 2. Supabase Storage 버킷 생성/확인
      const bucketName = 'rctf-images';
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets || !buckets.some(b => b.id === bucketName)) {
          await supabase.storage.createBucket(bucketName, { public: true });
        }
      } catch (bucketErr) {
        console.warn('Storage 버킷 확인/생성 우회:', bucketErr);
      }

      // 3. 파일 전송
      const fileName = `rctf_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 4. Public URL 획득 및 imageUrl 상태 갱신
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      showToast('이미지 업로드 및 WebP 초경량 변환 성공! 📸');

    } catch (err) {
      console.error('Image upload failed:', err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('Bucket not found') || errMsg.includes('does not exist')) {
        setUploadError('❌ Supabase Storage에 \'rctf-images\' 버킷이 존재하지 않습니다. Supabase SQL Editor에서 버킷 생성 및 RLS 정책(Select/Insert 개방)을 설정해 주셔야 파일 업로드가 가능합니다. (임시로 하단의 URL 입력 제출을 이용하실 수 있습니다.)');
      } else {
        setUploadError('이미지 업로드 및 WebP 변환에 실패했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ isVisible: true, message });
    toastTimerRef.current = setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  // 1. Supabase Auth 세션 + role 체크 → 방 로드
  useEffect(() => {
    const initSupabaseSession = async () => {
      setIsLoading(true);
      try {
        // (1) 현재 로그인 사용자 Supabase Auth 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        
        let role = 'USER';
        let display_name = '선생님';
        if (session?.user) {
          const isAdminEmail = ['mosebb@gmail.com', 'codingclubak03@gmail.com'].includes(session.user.email);
          const hasAdminFlag = sessionStorage.getItem('rctf_admin_auth') === 'true';
          
          let { data: profile } = await supabase
            .from('profiles')
            .select('role, display_name')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!profile) {
            profile = {
              id: session.user.id,
              display_name: session.user.email ? session.user.email.split('@')[0] : '마법사',
              role: isAdminEmail ? 'ADMIN' : 'USER'
            };
          }
          
          role = profile?.role || 'USER';
          if (isAdminEmail || hasAdminFlag) {
            role = 'ADMIN';
          }
          display_name = profile?.display_name || session.user.email.split('@')[0];
          
          setUserRole(role);
          const canHost = role === 'ADMIN' || role === 'TEACHER';
          setIsHost(canHost);         // ✅ 자동으로 HOST 모드 진입
          setIsAdminAuthenticated(canHost);
        } else {
          setUserRole('USER');
          setIsHost(false);
          setIsAdminAuthenticated(false);
        }
        
        setAuthChecked(true);

        // (2) 현재 활성화된 방 세션 가져오기 (권한별 분기)
        const savedCode = localStorage.getItem('rctf_joined_room_code') || '';
        const canHost = role === 'ADMIN' || role === 'TEACHER';

        if (canHost) {
          // 선생님/관리자는 가장 최근 방 세션을 기본 로드
          const { data: sessions, error: sessionErr } = await supabase
            .from('rctf_games')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1);

          if (!sessionErr && sessions && sessions.length > 0) {
            const latestSession = sessions[0];
            // [Self-Healing] 방 입장 코드가 없는 비정상/이전 세션 자동 복구 로직
            if (!latestSession.room_code) {
              const randomCode = String(Math.floor(1000 + Math.random() * 9000));
              const fallbackName = latestSession.room_name || `${display_name}의 마법 교실`;
              
              const { data: updatedSession, error: updateErr } = await supabase
                .from('rctf_games')
                .update({ 
                  room_code: randomCode, 
                  room_name: fallbackName,
                  updated_at: new Date().toISOString() 
                })
                .eq('id', latestSession.id)
                .select()
                .single();

              if (!updateErr && updatedSession) {
                setActiveSession(updatedSession);
                console.log(`[Self-Healing] 방 입장 코드가 없는 기존 세션에 난수 코드(${randomCode})를 부여하여 자동 복구했습니다.`);
              } else {
                setActiveSession(latestSession);
              }
            } else {
              setActiveSession(latestSession);
            }
          }
        } else if (savedCode) {
          // 학생이 방 코드를 이미 저장한 상태라면 해당 코드로 활성 방 조회
          const { data: sessions, error: sessionErr } = await supabase
            .from('rctf_games')
            .select('*')
            .eq('room_code', savedCode)
            .eq('game_state', 'PLAYING')
            .order('updated_at', { ascending: false })
            .limit(1);

          if (!sessionErr && sessions && sessions.length > 0) {
            setActiveSession(sessions[0]);
            setJoinedRoomCode(savedCode);
          } else {
            // 방이 만료되었거나 없을 경우 자동 퇴장 조치
            localStorage.removeItem('rctf_joined_room_code');
            setJoinedRoomCode('');
          }
        }

        // (3) 아이디어 풀 로드
        const { data: poolData } = await supabase.from('rctf_pool').select('*');
        updatePoolState(poolData || []);

      } catch (err) {
        console.warn('⚠️ Supabase 세션 연결 실패. 로컬 Mockup 모드로 개시합니다.', err);
        setIsLocalMode(true);
        handleLocalFallback();
        setAuthChecked(true);
      } finally {
        setIsLoading(false);
      }
    };

    initSupabaseSession();
  }, []);

  // activeSession이나 isLocalMode가 변경되었을 때 실시간 구독 및 데이터 갱신
  useEffect(() => {
    if (!activeSession || isLocalMode) return;

    // (1) 초기 데이터 동기화
    syncActiveGameData();

    // (2) Supabase Realtime 실시간 데이터베이스 테이블 구독 설정
    setIsSyncing(true);
    const gameChannel = supabase
      .channel('rctf-realtime')
      // rctf_games 변경 감지
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rctf_games', filter: `id=eq.${activeSession.id}` }, payload => {
        setIsSyncing(true);
        setGameState(prev => ({ ...prev, config: payload.new }));
        setTimeout(() => setIsSyncing(false), 500);
      })
      // rctf_teams 변경 감지
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rctf_teams', filter: `game_id=eq.${activeSession.id}` }, payload => {
        setIsSyncing(true);
        if (payload.eventType === 'INSERT') {
          setGameState(prev => {
            // 중복 방어막 장착: 이미 동일한 id의 팀이 들어있다면 추가하지 않음
            if (prev.teams.some(t => t.id === payload.new.id)) {
              return prev;
            }
            return { ...prev, teams: [...prev.teams, payload.new] };
          });
        } else if (payload.eventType === 'UPDATE') {
          setGameState(prev => {
            const index = prev.teams.findIndex(t => t.id === payload.new.id);
            if (index !== -1) {
              const updated = [...prev.teams];
              updated[index] = payload.new;
              return { ...prev, teams: updated };
            }
            return prev;
          });
          // 내 팀의 상태가 바뀐 경우 미션 락 해제 또는 활성화 (ref로 stale closure 방지)
          if (myTeamIdRef.current && payload.new.team_id === myTeamIdRef.current) {
            if (payload.new.status === 'SUBMITTED') setIsMissionLocked(true);
            else if (payload.new.status === 'WAITING') {
              setIsMissionLocked(false);
              setImageUrl('');
            }
          }
        } else if (payload.eventType === 'DELETE') {
          setGameState(prev => ({ ...prev, teams: prev.teams.filter(t => t.id !== payload.old.id) }));
        }
        setTimeout(() => setIsSyncing(false), 500);
      })
      // rctf_pool 변경 감지
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rctf_pool' }, payload => {
        setIsSyncing(true);
        supabase.from('rctf_pool').select('*').then(({ data }) => {
          updatePoolState(data || []);
          setTimeout(() => setIsSyncing(false), 500);
        });
      })
      .subscribe();

    setTimeout(() => setIsSyncing(false), 800);

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [activeSession, isLocalMode]);

  const updatePoolState = (poolArray) => {
    const p = { R: [], C: [], T: [], F: [] };
    poolArray.forEach(item => {
      if (p[item.category]) p[item.category].push(item.content);
    });
    setCustomPool(p);
  };

  const handleLocalFallback = () => {
    setGameState({
      config: { game_state: 'PLAYING', total_teams: 4, current_turn: 1 },
      teams: Array.from({ length: 4 }, (_, i) => ({
        id: `mock-${i + 1}`,
        team_id: i + 1,
        status: 'WAITING',
        r: '', c: '', t: '', f: '',
        media_content: '',
        score: 0
      })),
      pool: []
    });
  };

  // 현재 활성 세션의 팀 리스트 및 세션 동기화
  const syncActiveGameData = async () => {
    if (!activeSession) return;
    try {
      // 1. 방 세션 구성 가져오기
      const { data: game, error } = await supabase
        .from('rctf_games')
        .select('*')
        .eq('id', activeSession.id)
        .single();
      
      if (error) throw error;

      // 2. 팀 목록 가져오기
      let { data: teamsData } = await supabase
        .from('rctf_teams')
        .select('*')
        .eq('game_id', activeSession.id)
        .order('team_id', { ascending: true });

      // 만약 세션에 등록된 팀 개수가 total_teams보다 적다면 팀 생성 (오직 호스트 권한만 인서트 허용하여 동시성 삽입 오염 방지)
      if (isHost && (!teamsData || teamsData.length < game.total_teams)) {
        const teamInserts = [];
        for (let i = 1; i <= game.total_teams; i++) {
          if (!teamsData || !teamsData.some(t => t.team_id === i)) {
            teamInserts.push({
              game_id: activeSession.id,
              team_id: i,
              status: 'WAITING',
              score: 0
            });
          }
        }

        if (teamInserts.length > 0) {
          const { error: insertErr } = await supabase.from('rctf_teams').insert(teamInserts);
          if (insertErr) throw insertErr;
          
          // 새로 인서트 후 팀 데이터 재로드
          const { data: reloadedTeams } = await supabase
            .from('rctf_teams')
            .select('*')
            .eq('game_id', activeSession.id)
            .order('team_id', { ascending: true });
          teamsData = reloadedTeams;
        }
      }

      setGameState({
        config: game,
        teams: teamsData || [],
        pool: []
      });

      // 내 팀 정보 세팅
      if (myTeamId && teamsData) {
        const myTeam = teamsData.find(t => t.team_id === myTeamId);
        if (myTeam) {
          setIsMissionLocked(myTeam.status === 'SUBMITTED');
        }
      }

    } catch (err) {
      console.error('Error syncing game data:', err);
    }
  };

  // 2. Supabase 실시간 CRUD 액션 핸들러
  const handleAction = async (actionType, payload = {}, buttonId = 'global') => {
    setLoadingMap(prev => ({ ...prev, [buttonId]: true }));
    
    // 로컬 오프라인 모드인 경우
    if (isLocalMode) {
      handleLocalAction(actionType, payload);
      setLoadingMap(prev => ({ ...prev, [buttonId]: false }));
      return;
    }

    try {
      if (actionType === 'addPool') {
        const { error } = await supabase
          .from('rctf_pool')
          .insert([{ category: payload.category, content: payload.content }]);
        
        if (error) throw error;
        showToast('아이디어 풀에 기여 완료! ✨');

      } else if (actionType === 'initGame') {
        // (1) 세션 정보 갱신
        const { error } = await supabase
          .from('rctf_games')
          .update({ total_teams: payload.totalTeams, game_state: 'PLAYING', current_turn: 1, updated_at: new Date().toISOString() })
          .eq('id', activeSession.id);

        if (error) throw error;

        // (2) 기존 팀 제거 후 신규 생성 트리거를 위해 강제 리로드
        await supabase.from('rctf_teams').delete().eq('game_id', activeSession.id);
        await syncActiveGameData();
        showToast('게임이 활성화되었습니다! 🚩');

      } else if (actionType === 'submitPrompt') {
        const { error } = await supabase
          .from('rctf_teams')
          .update({
            status: 'SUBMITTED',
            r: payload.rctf.R,
            c: payload.rctf.C,
            t: payload.rctf.T,
            f: payload.rctf.F,
            media_content: payload.mediaContent,
            updated_at: new Date().toISOString()
          })
          .eq('game_id', activeSession.id)
          .eq('team_id', payload.teamId);

        if (error) throw error;
        setIsMissionLocked(true);
        setIsEditingImage(false);
        showToast('미션 제출 성공! 🚀');

      } else if (actionType === 'nextTurn') {
        const nextTurnId = gameState.config.current_turn >= gameState.config.total_teams ? 1 : gameState.config.current_turn + 1;
        const { error } = await supabase
          .from('rctf_games')
          .update({ current_turn: nextTurnId, updated_at: new Date().toISOString() })
          .eq('id', activeSession.id);

        if (error) throw error;
        showToast(`TEAM ${nextTurnId}의 차례입니다!`);

      } else if (actionType === 'updateScore') {
        const teamObj = gameState.teams.find(t => t.team_id === payload.teamId);
        const newScore = (teamObj?.score || 0) + payload.points;
        const { error } = await supabase
          .from('rctf_teams')
          .update({ score: newScore, updated_at: new Date().toISOString() })
          .eq('game_id', activeSession.id)
          .eq('team_id', payload.teamId);

        if (error) throw error;
        showToast(`TEAM ${payload.teamId} +${payload.points}pt 획득! 🏆`);

      } else if (actionType === 'resetAll') {
        // (1) 방 세션 세팅 리셋
        await supabase
          .from('rctf_games')
          .update({ current_turn: 1, updated_at: new Date().toISOString() })
          .eq('id', activeSession.id);

        // (2) 모든 팀의 상태 초기화
        const { error } = await supabase
          .from('rctf_teams')
          .update({
            status: 'WAITING',
            r: '', c: '', t: '', f: '',
            media_content: '',
            score: 0,
            updated_at: new Date().toISOString()
          })
          .eq('game_id', activeSession.id);

        if (error) throw error;
        setResults({ R: '', C: '', T: '', F: '' });
        setIsMissionLocked(false);
        setIsEditingImage(false);
        setRevealedTeams(new Set());
        showToast('모든 정보가 초기화되었습니다! ♻️');
      }

    } catch (err) {
      console.error(err);
      showToast('처리에 실패했습니다.');
    } finally {
      setTimeout(() => {
        setLoadingMap(prev => ({ ...prev, [buttonId]: false }));
      }, 500);
    }
  };

  // 로컬 목업 액션 핸들러
  const handleLocalAction = (actionType, payload) => {
    if (actionType === 'addPool') {
      setCustomPool(prev => {
        const next = { ...prev };
        next[payload.category] = [...next[payload.category], payload.content];
        return next;
      });
      showToast('로컬 임시 풀 등록 완료!');
    } else if (actionType === 'initGame') {
      setGameState(prev => ({
        config: { ...prev.config, total_teams: payload.totalTeams, current_turn: 1 },
        teams: Array.from({ length: payload.totalTeams }, (_, i) => ({
          id: `mock-${i + 1}`,
          team_id: i + 1,
          status: 'WAITING',
          score: 0
        }))
      }));
      showToast('로컬 모드 활성화!');
    } else if (actionType === 'submitPrompt') {
      setGameState(prev => {
        const updated = prev.teams.map(t => t.team_id === payload.teamId ? {
          ...t,
          status: 'SUBMITTED',
          r: payload.rctf.R,
          c: payload.rctf.C,
          t: payload.rctf.T,
          f: payload.rctf.F,
          media_content: payload.mediaContent
        } : t);
        return { ...prev, teams: updated };
      });
      setIsMissionLocked(true);
      setIsEditingImage(false);
      showToast('로컬 미션 임시 제출 완료!');
    } else if (actionType === 'nextTurn') {
      const nextId = gameState.config.current_turn >= gameState.config.total_teams ? 1 : gameState.config.current_turn + 1;
      setGameState(prev => ({ ...prev, config: { ...prev.config, current_turn: nextId } }));
    } else if (actionType === 'updateScore') {
      setGameState(prev => {
        const updated = prev.teams.map(t => t.team_id === payload.teamId ? { ...t, score: t.score + payload.points } : t);
        return { ...prev, teams: updated };
      });
      showToast(`로컬 점수 부여 완료!`);
    } else if (actionType === 'resetAll') {
      setGameState(prev => ({
        config: { ...prev.config, current_turn: 1 },
        teams: prev.teams.map(t => ({ ...t, status: 'WAITING', r: '', c: '', t: '', f: '', media_content: '', score: 0 }))
      }));
      setResults({ R: '', C: '', T: '', F: '' });
      setIsMissionLocked(false);
      setIsEditingImage(false);
      setRevealedTeams(new Set());
      showToast('로컬 리셋 완료!');
    }
  };


  // 학생용 수동 방 입장 기능
  const handleJoinRoom = async (e) => {
    if (e) e.preventDefault();
    if (!gateRoomCode.trim()) {
      setGateError('방 코드를 입력해 주세요.');
      return;
    }
    
    setIsLoading(true);
    setGateError('');
    try {
      const { data: sessions, error } = await supabase
        .from('rctf_games')
        .select('*')
        .eq('room_code', gateRoomCode.trim())
        .eq('game_state', 'PLAYING')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        setActiveSession(session);
        setJoinedRoomCode(session.room_code);
        localStorage.setItem('rctf_joined_room_code', session.room_code);
        showToast(`🏰 [${session.room_name || '마법 방'}]에 입장했습니다!`);
      } else {
        setGateError('❌ 현재 활성화된 방 코드가 아니거나 방이 존재하지 않습니다.');
      }
    } catch (err) {
      setGateError('방 입장 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 학생 방 퇴장(나가기) 기능
  const handleLeaveRoom = () => {
    setActiveSession(null);
    setJoinedRoomCode('');
    setGateRoomCode('');
    localStorage.removeItem('rctf_joined_room_code');
    showToast('🚪 방에서 정상적으로 퇴장했습니다.');
  };

  // 새 게임 방 생성 (ADMIN/TEACHER만 호출 가능)
  const handleCreateRoom = async () => {
    if (!isHost) {
      showToast('⛔ 방은 관리자 또는 선생님만 만들 수 있습니다.');
      return;
    }

    let hostName = '선생님';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .maybeSingle();

        hostName = prof?.display_name || (session.user.email ? session.user.email.split('@')[0] : '선생님');
      }
    } catch (err) {
      console.warn(err);
    }

    const finalName = roomNameInput.trim() || `${hostName}의 마법 교실`;
    const finalCode = roomCodeInput.trim() || String(Math.floor(1000 + Math.random() * 9000));

    try {
      const { data: newSession, error } = await supabase
        .from('rctf_games')
        .insert([{ 
          game_state: 'PLAYING', 
          total_teams: createRoomTeams, 
          current_turn: 1,
          room_name: finalName,
          room_code: finalCode
        }])
        .select()
        .single();
      if (error) throw error;
      setActiveSession(newSession);
      setShowCreateRoom(false);
      showToast(`🎰 게임 방 [${finalName}]이 생성되었습니다! (방 코드: ${finalCode})`);
    } catch (err) {
      showToast('방 생성에 실패했습니다.');
    }
  };

  const openCreateRoomModal = () => {
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    setRoomCodeInput(randomCode);
    const hostName = userRole === 'ADMIN' ? '관리자' : '선생님';
    setRoomNameInput(`${hostName}의 마법 교실`);
    setShowCreateRoom(true);
  };

  const addCustomRCTF = () => {
    if (!newContent.text.trim()) return;
    handleAction('addPool', { category: newContent.category, content: newContent.text.trim() }, 'addPool');
    setNewContent(prev => ({ ...prev, text: '' }));
  };

  const spinSlots = () => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    setIsSpinning(true);
    setIsMissionLocked(false);
    setImageUrl('');
    playSlotSound();
    spinTimerRef.current = setTimeout(() => {
      const getRand = (cat) => {
        const pool = [...(customPool[cat] || []), ...DEFAULT_SLOT_DATA[cat]];
        return pool[Math.floor(Math.random() * pool.length)];
      };
      setResults({ R: getRand('R'), C: getRand('C'), T: getRand('T'), F: getRand('F') });
      setIsSpinning(false);
    }, 3000);
  };

  const toggleReveal = (id) => {
    setRevealedTeams(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { config, teams } = gameState;

  const uniqueTeams = useMemo(() => {
    const seen = new Set();
    return (teams || []).filter(team => {
      if (seen.has(team.team_id)) return false;
      seen.add(team.team_id);
      return true;
    });
  }, [teams]);

  const myTeam = useMemo(
    () => (teams || []).find(t => t.team_id === myTeamId) || null,
    [teams, myTeamId]
  );

  return (
    <div className="min-h-screen bg-[#F0F2F9] flex flex-col font-sans pb-20 overflow-x-hidden">
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
      


      {/* 퀴즈 정답 확인 모달 */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6 sm:p-12" onClick={() => setSelectedTeam(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-5xl w-full flex flex-col gap-8" onClick={(e) => e.stopPropagation()}>
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/10 bg-gray-900 aspect-video flex items-center justify-center">
                {selectedTeam.media_content ? ( <img src={selectedTeam.media_content} className="w-full h-full object-contain" alt="Quiz" /> ) : ( <div className="text-gray-500 font-black text-3xl italic">이미지 미제출</div> )}
                <div className="absolute top-8 left-8 bg-orange-500 text-white px-8 py-3 rounded-2xl font-black text-2xl shadow-xl">TEAM {selectedTeam.team_id} 🏁</div>
              </div>
              <div className="flex flex-col items-center gap-6">
                <AnimatePresence mode="wait">
                  {revealedTeams.has(selectedTeam.team_id) ? (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-white/20 w-full text-center">
                      <p className="text-3xl sm:text-5xl font-black leading-tight text-white">
                        <span className="text-red-400">{selectedTeam.r}</span> <span className="text-white/50 text-2xl">@</span> <span className="text-blue-400">{selectedTeam.c}</span> <br/>
                        <span className="text-yellow-400">{selectedTeam.t}</span> <span className="text-green-400 text-2xl">({selectedTeam.f})</span>
                      </p>
                    </motion.div>
                  ) : ( <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => toggleReveal(selectedTeam.team_id)} className="px-12 py-6 bg-white text-gray-900 rounded-[2rem] font-black text-3xl shadow-2xl flex items-center gap-4"><Key size={32} /> 정답 공개하기</motion.button> )}
                </AnimatePresence>
                <button onClick={() => setSelectedTeam(null)} className="text-white/40 font-bold hover:text-white transition-all text-lg underline underline-offset-8">닫기 [CLOSE]</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 방 생성 모달 (ADMIN/TEACHER 전용) */}
      <AnimatePresence>
        {showCreateRoom && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative border">
              <button onClick={() => setShowCreateRoom(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24} className="text-gray-400" /></button>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><PlusCircle className="text-orange-500" /></div>
                <h3 className="text-2xl font-black">새 게임 방 열기</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">{userRole === 'ADMIN' ? '관리자' : '선생님'} 권한으로 방을 열수 있습니다.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-black text-gray-600 mb-2 block">방 이름 (선택)</label>
                  <input
                    type="text"
                    placeholder="예: 3학년 1반 마법 대결"
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all text-sm text-gray-700"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-black text-gray-600 mb-2 block">방 입장 코드 (선택)</label>
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="미입력 시 4자리 난수 자동 생성"
                      className="flex-1 px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all text-sm text-gray-700"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setRoomCodeInput(String(Math.floor(1000 + Math.random() * 9000)))}
                      className="px-5 bg-white hover:bg-gray-50 border-2 border-gray-150 text-gray-600 hover:text-orange-500 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0 shadow-sm"
                      title="랜덤 코드 생성"
                    >
                      🎲 랜덤
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-gray-600 mb-3 block">팀 수 선택</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[2,3,4,5,6,8].map(n => (
                      <button
                        key={n}
                        onClick={() => setCreateRoomTeams(n)}
                        className={`py-3 rounded-2xl font-black text-lg transition-all cursor-pointer ${
                          createRoomTeams === n
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-3 font-bold">{createRoomTeams}팀 기준으로 방이 열립니다</p>
                </div>
                <button
                  onClick={handleCreateRoom}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-3 cursor-pointer hover:bg-orange-600 transition-colors"
                >
                  <Zap size={20} /> 게임 방 시작!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <button 
          onClick={() => {
            if (isHost && activeSession) setIsHost(false);
            else if (myTeamId) setMyTeamId(null);
            else navigate(-1);
          }} 
          className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-800 transition-all group cursor-pointer"
        >
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> 이전으로
        </button>
        <div className="flex items-center gap-3">
          {/* 게임 창작소 링크 */}
          <Link 
            to="/creator-guide" 
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 rounded-xl text-[10px] font-black text-purple-600 transition-colors cursor-pointer flex-shrink-0"
          >
            <Sparkles size={12} className="text-purple-500" /> 창작소
          </Link>
          {/* Realtime Live 동기화 네온 구슬 */}
          {(isSyncing || !isLoading) && (
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-150 shadow-sm flex-shrink-0">
              <div className={`w-2 h-2 ${isLocalMode ? 'bg-orange-400' : 'bg-green-400'} rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]`} />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter hidden sm:inline">
                {isLocalMode ? 'Offline' : 'Realtime'}
              </span>
            </div>
          )}
          {/* role 배지 */}
          {authChecked && userRole && (
            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${
              userRole === 'ADMIN' ? 'bg-orange-100 text-orange-600' :
              userRole === 'TEACHER' ? 'bg-blue-100 text-blue-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {userRole === 'ADMIN' ? '관리자' : userRole === 'TEACHER' ? '🧑‍🏫 선생님' : '마법사'}
            </span>
          )}
          {/* HOST MODE 토글 (ADMIN/TEACHER만) */}
          {isHost && (
            <button 
              onClick={() => setIsHost(false)} 
              className="px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer bg-orange-500 text-white border-orange-500 shadow-lg"
            >
              EXIT HOST MODE
            </button>
          )}
          {!isHost && (userRole === 'ADMIN' || userRole === 'TEACHER') && (
            <button 
              onClick={() => setIsHost(true)} 
              className="px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer bg-white text-gray-400 border-gray-200 hover:border-orange-400 hover:text-orange-500"
            >
              HOST MODE
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6">
        {isLoading ? ( 
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
            <p className="text-gray-400 font-bold">실시간 세션 동기화 중...</p>
          </div> 
        ) : !activeSession ? (
          /* 방이 없을 때 분기 */
          isHost ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 text-center gap-8">
              <div className="w-28 h-28 bg-orange-50 rounded-[2rem] flex items-center justify-center">
                <Zap size={48} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-800">현재 열린 게임 방이 없습니다</h2>
                <p className="text-gray-400 font-bold mt-2">선생님이 새 방을 만들어 게임을 시작할 수 있습니다.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreateRoomModal}
                className="px-10 py-5 bg-orange-500 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-orange-200 flex items-center gap-3 cursor-pointer"
              >
                <PlusCircle size={24} /> 새 게임 방 열기
              </motion.button>
            </motion.div>
          ) : (
            /* 학생용 방 입장 게이트웨이 */
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="max-w-md mx-auto py-12 flex flex-col items-center justify-center gap-8"
            >
              <div className="w-24 h-24 bg-orange-50 rounded-[2rem] flex items-center justify-center shadow-inner">
                <Sparkles size={40} className="text-orange-500 animate-pulse" />
              </div>
              
              <div className="text-center">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">마법 교실 입장 게이트</h2>
                <p className="text-sm text-gray-400 font-bold mt-2 leading-relaxed">
                  선생님이 알려주신 방 입장 코드(4자리 등)를 입력하여 <br/> 실시간 프롬프트 카드 배틀에 동참해 보세요.
                </p>
              </div>

              <form onSubmit={handleJoinRoom} className="w-full bg-white p-8 rounded-[2.5rem] border border-gray-150 shadow-2xl space-y-6">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2.5 block text-left">Room Entry Code</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="입장 코드를 입력하세요"
                    className="w-full px-6 py-4.5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] font-mono text-2xl font-black text-center tracking-widest outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800 placeholder:text-gray-300"
                    value={gateRoomCode}
                    onChange={(e) => setGateRoomCode(e.target.value)}
                  />
                </div>

                {gateError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-black text-red-500 text-center bg-red-50 py-3 px-4 rounded-xl border border-red-100">
                    {gateError}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-[1.5rem] font-black text-lg shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border-0"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <><Zap size={18} /> 마법 학교 입장하기</>}
                </button>
              </form>
            </motion.div>
          )
        ) : (
          <>
            {isHost ? (
              <div className="glass-card p-12 rounded-[3rem] bg-white shadow-2xl border-white relative overflow-hidden space-y-12">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-400" />
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 border-b border-gray-150/40 pb-6">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-4">
                    <Zap className="text-orange-500 shrink-0" /> {displayRoomName || '선생님 대시보드'}
                  </h1>
                  <button
                    onClick={() => setShowCodeModal(true)}
                    className="px-5 py-2.5 bg-orange-100 hover:bg-orange-200 border border-orange-200 text-orange-600 rounded-2xl text-sm font-black shadow-inner flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0 cursor-pointer active:scale-95 transition-all outline-none"
                    title="입장코드 크게 보기"
                  >
                    🔑 방 입장 코드: <span className="font-mono text-base tracking-wider underline">{displayRoomCode}</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Game Setup</p>
                      <button 
                        onClick={() => handleAction('resetAll', {}, 'resetAll')}
                        disabled={loadingMap['resetAll']}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {loadingMap['resetAll'] ? <Loader2 size={12} className="animate-spin" /> : <><Trash2 size={12} /> RESET ALL</>}
                      </button>
                    </div>
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-2">
                        {[2, 3, 4, 5, 6].map(num => (
                          <button key={num} onClick={() => handleAction('initGame', { totalTeams: num }, `init-${num}`)} className={`w-12 h-12 rounded-xl font-black text-sm transition-all flex items-center justify-center cursor-pointer ${config.total_teams === num ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-orange-500'}`}>{loadingMap[`init-${num}`] ? <Loader2 size={16} className="animate-spin" /> : num}</button>
                        ))}
                      </div>
                      <button onClick={() => handleAction('nextTurn', {}, 'nextTurn')} disabled={loadingMap['nextTurn']} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-orange-500 transition-all flex items-center justify-center gap-2 cursor-pointer">{loadingMap['nextTurn'] ? <Loader2 className="animate-spin" /> : <><RotateCw size={18} /> 다음 턴으로 넘기기</>}</button>
                    </div>
                  </div>

                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">Current Team: {config.current_turn}</p>
                    <button onClick={() => handleAction('updateScore', { teamId: config.current_turn, points: 10 }, 'score')} disabled={loadingMap['score']} className="w-full py-8 bg-green-500 text-white rounded-3xl font-black text-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all mb-4 flex items-center justify-center gap-4 cursor-pointer">{loadingMap['score'] ? <Loader2 size={32} className="animate-spin" /> : "+10 POINT"}</button>
                  </div>
                </div>

                {uniqueTeams.length > 0 && (
                  <div className="mt-12 pt-12 border-t border-gray-100">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-2"><Trophy className="text-yellow-500" /> 팀별 퀴즈 현황 (이미지를 클릭해 퀴즈를 시작하세요!)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {uniqueTeams.map((team, idx) => (
                        <div key={`host-team-${team.team_id}-${idx}`} className={`p-8 rounded-[3rem] border-2 flex flex-col group transition-all ${config.current_turn === team.team_id ? 'border-orange-500 bg-orange-50/30 shadow-xl scale-[1.02]' : 'border-gray-50 bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-6"><span className="font-black text-gray-400">TEAM {team.team_id}</span><span className={`text-[10px] px-3 py-1 rounded-full font-black ${team.status === 'SUBMITTED' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>{team.status}</span></div>
                          {team.status === 'SUBMITTED' ? (
                            <div className="space-y-6 flex-1 flex flex-col">
                              <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6">
                                <div className={`transition-all duration-500 ${revealedTeams.has(team.team_id) ? 'blur-0 opacity-100' : 'blur-xl opacity-20 pointer-events-none'}`}>
                                  <p className="text-sm font-black text-gray-800 leading-tight">{team.r} @ {team.c} <br/> {team.t} ({team.f})</p>
                                </div>
                                {!revealedTeams.has(team.team_id) && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <button onClick={() => toggleReveal(team.team_id)} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:bg-orange-500 transition-all cursor-pointer"><Key size={14}/> ANSWER</button>
                                  </div>
                                )}
                              </div>
                              <div className="relative cursor-pointer overflow-hidden rounded-3xl bg-gray-200 aspect-video flex items-center justify-center group/img" onClick={() => setSelectedTeam(team)}>
                                {team.media_content ? (
                                  <>
                                    <img src={team.media_content} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt="Submitted" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all flex flex-col items-center justify-center text-white"><Target size={40} className="mb-2" /><span className="font-black">QUIZ START!</span></div>
                                  </>
                                ) : ( <div className="flex-1 flex flex-col items-center justify-center"><ImageIcon className="text-gray-300 mb-2" size={32} /><p className="text-xs font-bold text-gray-400 italic">이미지 대기 중</p></div> )}
                              </div>
                              <div className="text-3xl font-black text-gray-800 self-end mt-auto">{team.score} <span className="text-sm font-bold text-gray-400">pt</span></div>
                            </div>
                          ) : ( <div className="flex-1 flex items-center justify-center text-gray-300 font-black italic p-10 uppercase tracking-widest">Waiting for Mission...</div> )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 학생용 상단 방 정보 및 퇴장 버튼 공통 배너 */}
                <div className="glass-card px-8 py-5 rounded-[2rem] bg-white/80 border border-gray-150 shadow-md mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-black text-gray-800 text-lg leading-tight">{displayRoomName}</h4>
                      <p className="text-xs text-gray-400 font-bold mt-1">입장 코드: <span className="font-mono text-gray-600 underline font-black tracking-wider">{displayRoomCode}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={handleLeaveRoom}
                    className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
                  >
                    🚪 방 퇴장하기
                  </button>
                </div>
                {config.game_state === 'WAITING' ? (
                  <div className="glass-card p-12 rounded-[3rem] text-center bg-white shadow-2xl border-white relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary to-teal-400" /><Users className="w-20 h-20 text-brand-primary mx-auto mb-6" /><h1 className="text-4xl font-black mb-4 tracking-tight">RCTF 멀티 퀘스트 🚀</h1><p className="text-gray-500 text-xl animate-pulse font-bold">호스트가 게임을 설정 중입니다...</p></div>
                ) : !myTeamId ? (
                  <div className="space-y-12 pb-20">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-10 rounded-[3rem] bg-white shadow-xl border-white">
                      <div className="flex items-center gap-3 mb-8"><div className="p-4 bg-brand-primary/10 rounded-2xl text-brand-primary"><Sparkles size={32} /></div><div><h3 className="text-3xl font-black text-gray-800">오늘의 주제 기여하기 💡</h3><p className="text-gray-500 font-bold text-lg">여러분의 아이디어가 슬롯머신에 포함됩니다!</p></div></div>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative group min-w-[220px]"><div className="absolute -top-3 left-4 px-2 bg-white text-[10px] font-black text-brand-primary z-10">CATEGORY</div><select className="w-full px-6 py-5 bg-gray-50 border-4 border-gray-100 rounded-[1.5rem] font-black text-xl outline-none focus:border-brand-primary appearance-none text-gray-700" value={newContent.category} onChange={(e) => setNewContent({...newContent, category: e.target.value})}><option value="R">Role (역할)</option><option value="C">Context (상황)</option><option value="T">Task (수행)</option><option value="F">Format (형식)</option></select><div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronLeft className="-rotate-90 text-gray-400" size={24} /></div></div>
                        <div className="flex-1 relative"><div className="absolute -top-3 left-4 px-2 bg-white text-[10px] font-black text-brand-primary z-10">YOUR IDEA</div><input type="text" placeholder="아이디어를 시원하게 입력하세요!" className="w-full px-8 py-5 bg-gray-50 border-4 border-gray-100 rounded-[1.5rem] font-black text-xl outline-none focus:border-brand-primary transition-all placeholder:text-gray-300" value={newContent.text} onChange={(e) => setNewContent({...newContent, text: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && addCustomRCTF()} /></div>
                        <button onClick={() => addCustomRCTF()} disabled={loadingMap['addPool']} className="px-12 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xl shadow-2xl hover:bg-brand-primary transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer">{loadingMap['addPool'] ? <Loader2 className="animate-spin" size={24} /> : <><Send size={24} /> 전송</>}</button>
                      </div>
                    </motion.div>
                    
                    <div className="glass-card p-12 rounded-[3rem] text-center bg-white shadow-2xl border-white"><h2 className="text-3xl font-black mb-10 flex items-center justify-center gap-3"><UserCheck className="text-brand-primary" /> 소속 팀을 선택하세요 🚩</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-6">{ uniqueTeams.map((team, idx) => { const id = team.team_id; return ( <button key={`select-team-${id}-${idx}`} onClick={() => setMyTeamId(id)} className="group p-10 rounded-[2.5rem] border-2 border-gray-100 hover:border-brand-primary hover:bg-brand-primary/5 transition-all active:scale-95 cursor-pointer"><div className="text-5xl font-black text-gray-800 group-hover:text-brand-primary">{id}</div></button> ); })}</div></div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="glass-card p-8 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-between border-white">
                      <div className="flex items-center gap-4"><div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary font-black text-xl">{myTeamId}</div><h3 className="text-2xl font-black text-gray-800">우리 팀 대시보드 🎰</h3></div>
                      {!isMissionLocked && <button onClick={spinSlots} disabled={isSpinning} className="px-10 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-brand-primary active:scale-95 transition-all cursor-pointer">{isSpinning ? 'SPINNING...' : 'JACKPOT SPIN! 🎰'}</button>}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> 
                      {CATEGORIES.map(cat => (
                        <Reel 
                          key={cat.key} 
                          category={cat} 
                          result={isMissionLocked ? (myTeam?.[cat.key.toLowerCase()]) : results[cat.key]} 
                          isSpinning={isSpinning} 
                          pool={customPool} 
                        />
                      ))} 
                    </div>

                    {((results.R && !isSpinning) || isMissionLocked) && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                        <div className="p-12 bg-white rounded-[4rem] shadow-2xl text-center border-4 border-brand-primary/5 relative overflow-hidden">
                          <p className="text-3xl font-black text-gray-800 leading-tight">
                            {isMissionLocked ? (
                              <><span className="text-red-500">{myTeam?.r}</span> @ <span className="text-blue-500">{myTeam?.c}</span> <br/> <span className="text-yellow-500">{myTeam?.t}</span> <span className="text-green-500">({myTeam?.f})</span></>
                            ) : (
                              <><span className="text-red-500">{results.R}</span> @ <span className="text-blue-500">{results.C}</span> <br/> <span className="text-yellow-500">{results.T}</span> <span className="text-green-500">({results.F})</span></>
                            )}
                          </p>
                        </div>

                        {!isMissionLocked ? ( 
                          <motion.button 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }} 
                            disabled={loadingMap['submit']} 
                            onClick={() => handleAction('submitPrompt', { teamId: myTeamId, rctf: results, mediaContent: '' }, 'submit')} 
                            className="w-full py-6 bg-brand-primary text-white rounded-[2.5rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-3 cursor-pointer"
                          >
                            {loadingMap['submit'] ? <Loader2 className="animate-spin" /> : "이 미션으로 도전하기! 🚀"}
                          </motion.button> 
                        ) : (
                          <div className="space-y-8">
                            {myTeam?.media_content && !isEditingImage ? (
                              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-10 bg-white rounded-[3rem] border-4 border-green-500 shadow-2xl text-center space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                  <button 
                                    onClick={() => {
                                      setImageUrl(myTeam?.media_content || '');
                                      setIsEditingImage(true);
                                    }}
                                    className="px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-400 hover:text-orange-500 rounded-xl transition-all shadow-sm flex items-center gap-2 group cursor-pointer"
                                    title="이미지 수정하기"
                                  >
                                    <RotateCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                                    <span className="text-[10px] font-black uppercase">Edit</span>
                                  </button>
                                </div>
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="text-green-500" size={40} /></div>
                                <h4 className="text-3xl font-black text-gray-800">미션 제출 성공! 🎊</h4>
                                <p className="text-gray-500 font-bold text-lg">우리 팀의 이미지가 선생님 화면에 전송되었습니다. <br/> 다른 팀의 퀴즈 차례를 기다리세요!</p>
                                <div className="relative rounded-2xl overflow-hidden border-4 border-gray-100 max-w-sm mx-auto shadow-lg">
                                  <img src={myTeam?.media_content} loading="lazy" decoding="async" className="w-full h-auto" alt="My Submission" />
                                  <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 text-xs font-black">MY IMAGE</div>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="p-10 bg-white rounded-[3rem] border-4 border-dashed border-brand-primary/20 space-y-8 shadow-inner text-center relative">
                                {isEditingImage && (
                                  <button 
                                    onClick={() => setIsEditingImage(false)}
                                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                  >
                                    <X size={24} />
                                  </button>
                                )}
                                <div className="flex items-center gap-4 mb-4 justify-center"><div className="p-4 bg-orange-100 rounded-2xl text-orange-600"><Camera size={32} /></div><h4 className="text-2xl font-black text-gray-800 tracking-tight text-left">{isEditingImage ? "이미지 수정하기" : "AI 이미지 퀴즈 제출하기"} 🎨</h4></div>
                                
                                <div className="space-y-6">
                                  {/* 1. 이미지 파일 직접 선택 업로드 영역 */}
                                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl hover:bg-orange-50/20 transition-all relative group">
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      onChange={handleImageUpload} 
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                      disabled={isUploading}
                                    />
                                    {isUploading ? (
                                      <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="animate-spin text-orange-500" size={36} />
                                        <p className="text-sm font-bold text-gray-500">WebP 초경량 자동 압축 변환 중...</p>
                                      </div>
                                    ) : imageUrl && imageUrl.startsWith('https://') && !imageUrl.includes('placeholder') ? (
                                      <div className="flex flex-col items-center gap-2">
                                        <CheckCircle2 className="text-green-500" size={36} />
                                        <p className="text-sm font-black text-green-600">이미지 인코딩 및 준비 완료!</p>
                                        <p className="text-[10px] text-gray-400 font-mono truncate max-w-xs">{imageUrl}</p>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="text-gray-400 group-hover:scale-110 transition-transform duration-300" size={36} />
                                        <p className="text-sm font-black text-gray-600">📂 이미지 파일 직접 선택하기</p>
                                        <p className="text-xs text-gray-400 font-bold">WebP 자동 변환으로 초고속 전송 지원</p>
                                      </div>
                                    )}
                                  </div>

                                  {uploadError && (
                                    <p className="text-xs font-bold text-red-500 bg-red-50 py-2.5 px-4 rounded-xl border border-red-100">{uploadError}</p>
                                  )}

                                  {/* 구분선 */}
                                  <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-gray-150"></div>
                                    <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase">OR (URL 직접 입력)</span>
                                    <div className="flex-grow border-t border-gray-150"></div>
                                  </div>

                                  {/* 2. 이미지 URL 입력창 & 최종 제출 */}
                                  <div className="flex flex-col md:flex-row gap-4">
                                    <input 
                                      type="text" 
                                      placeholder="또는 이미지 URL 주소를 직접 입력해 주세요" 
                                      className="flex-1 px-8 py-5 bg-gray-50 border-4 border-gray-100 rounded-2xl font-bold outline-none focus:border-brand-primary transition-all text-gray-700 placeholder:text-gray-300" 
                                      value={imageUrl} 
                                      onChange={(e) => setImageUrl(e.target.value)} 
                                      disabled={isUploading}
                                    />
                                    <button 
                                      onClick={() => handleAction('submitPrompt', { teamId: myTeamId, rctf: { R: myTeam?.r, C: myTeam?.c, T: myTeam?.t, F: myTeam?.f }, mediaContent: imageUrl }, 'submitImage')} 
                                      disabled={loadingMap['submitImage'] || !imageUrl || isUploading} 
                                      className="px-10 py-5 bg-orange-500 text-white rounded-2xl font-black text-xl shadow-lg hover:bg-orange-600 active:scale-95 transition-all cursor-pointer flex-shrink-0 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                                    >
                                      {loadingMap['submitImage'] ? <Loader2 className="animate-spin" /> : (isEditingImage ? "수정 완료" : "제출")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* 빔프로젝터 친화형 대화면 입장코드 모달 */}
      <AnimatePresence>
        {showCodeModal && activeSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCodeModal(false)}
            className="fixed inset-0 bg-black/90 z-[9999] backdrop-blur-2xl flex flex-col justify-center items-center text-white cursor-zoom-out p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl w-full text-center space-y-12 bg-white/5 border border-white/10 p-12 sm:p-20 rounded-[4rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="space-y-4">
                <span className="px-5 py-2 bg-orange-500 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/20 animate-pulse">
                  실시간 게임방 입장코드
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-white/95 drop-shadow-md">
                  {displayRoomName}
                </h2>
              </div>

              <div className="py-8 bg-white/5 border border-white/10 rounded-[3rem] shadow-inner relative group select-all">
                <span className="font-mono text-8xl sm:text-[12rem] font-black text-orange-500 tracking-wider leading-none drop-shadow-[0_0_30px_rgba(249,115,22,0.3)] block">
                  {displayRoomCode}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm sm:text-base text-gray-400 font-bold">
                  선생님이 열어주신 주소에 접속하여 위 코드를 입력하세요.
                </p>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="px-8 py-3 bg-white/10 hover:bg-orange-500 text-white rounded-2xl text-xs font-black transition-all cursor-pointer border border-white/15 outline-none"
                >
                  대시보드로 돌아가기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RctfBattle;
