import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ChevronLeft, Zap, Sparkles, Play, Trophy, Users, CheckCircle2, RotateCw, Image as ImageIcon, MessageSquare, Target, UserCheck, AlertCircle, Lock, X, Eye, EyeOff, PlusCircle, Send, Loader2, Camera, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_GAS_API_URL || '';

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

const Reel = ({ category, result, isSpinning, pool }) => {
  const items = [...(pool[category.key] || []), ...DEFAULT_SLOT_DATA[category.key]];
  const displayItems = Array.from({ length: 40 }).map((_, i) => items[i % items.length]);

  return (
    <div className={`flex-1 h-32 sm:h-48 relative overflow-hidden rounded-3xl border-4 ${category.border} ${category.bg} shadow-inner`}>
      <AnimatePresence mode="wait">
        {isSpinning ? (
          <motion.div key="spinning" initial={{ y: 0 }} animate={{ y: -2500 }} transition={{ duration: 3, ease: [0.45, 0.05, 0.55, 0.95] }} style={{ filter: 'blur(2px)' }} className="flex flex-col items-center gap-8 py-10">
            {displayItems.map((item, i) => (
              <span key={i} className={`text-xl font-black opacity-30 ${category.color} italic tracking-tighter`}>{item}</span>
            ))}
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ y: 50, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center p-4 text-center bg-white/40 backdrop-blur-[2px]">
            <span className={`text-xl sm:text-2xl font-black ${category.color} leading-tight drop-shadow-md`}>{result || '?'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RctfBattle = () => {
  const [gameState, setGameState] = useState({ config: { gameState: 'WAITING', totalTeams: 0, currentTurn: 1 }, teams: [], pool: [] });
  const [customPool, setCustomPool] = useState({ R: [], C: [], T: [], F: [] });
  const [newContent, setNewContent] = useState({ category: 'R', text: '' });
  const [myTeamId, setMyTeamId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loginData, setLoginData] = useState({ id: '', pw: '' });
  const [results, setResults] = useState({ R: '', C: '', T: '', F: '' });
  const [isSpinning, setIsSpinning] = useState(false);
  const [isMissionLocked, setIsMissionLocked] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null); // 호스트용 이미지 크게 보기 & 정답 보기 팀 정보
  const [revealedTeams, setRevealedTeams] = useState(new Set()); // 정답이 공개된 팀 ID들

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!API_URL || !API_URL.startsWith('http')) { handleLocalFallback(); return; }
      try {
        const res = await fetch(`${API_URL}?action=getState`);
        const data = await res.json();
        if (data && data.config) {
          setGameState(data);
          const p = { R: [], C: [], T: [], F: [] };
          if (data.pool) data.pool.forEach(item => { if (p[item.category]) p[item.category].push(item.content); });
          setCustomPool(p);
          if (myTeamId) {
            const myTeam = data.teams.find(t => t.TeamID === myTeamId);
            if (myTeam && myTeam.Status === 'SUBMITTED') setIsMissionLocked(true);
          }
        } else { handleLocalFallback(); }
      } catch (err) { handleLocalFallback(); } finally { setIsLoading(false); }
    };
    const handleLocalFallback = () => {
      setGameState({ config: { totalTeams: 4, currentTurn: 1, gameState: 'PLAYING' }, teams: Array.from({ length: 4 }, (_, i) => ({ TeamID: i + 1, Status: 'WAITING', Score: 0 })), pool: [] });
      setIsLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [myTeamId]);

  const showToast = (message) => {
    setToast({ isVisible: true, message });
    setTimeout(() => setToast({ isVisible: false, message: '' }), 3000);
  };

  const callAPI = async (data, buttonId = 'global') => {
    if (!API_URL.startsWith('http')) { showToast('로컬 모드입니다.'); return; }
    setLoadingMap(prev => ({ ...prev, [buttonId]: true }));
    try {
      await fetch(API_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(data) });
      showToast('성공적으로 전송되었습니다! ✨');
      if (data.action === 'submitPrompt') setIsMissionLocked(true);
    } catch (err) { showToast('전송 실패!'); } finally { setTimeout(() => { setLoadingMap(prev => ({ ...prev, [buttonId]: false })); }, 500); }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      setIsAuthenticating(true);
      const res = await fetch(`${API_URL}?action=verifyAdmin&id=${encodeURIComponent(loginData.id.trim())}&pw=${encodeURIComponent(loginData.pw.trim())}&_t=${Date.now()}`);
      const result = await res.json();
      if (result.authorized) { setIsHost(true); setIsLoginOpen(false); showToast('인증 성공! 🔓'); } 
      else { showToast('인증 실패! ❌'); }
    } catch (err) { showToast('서버 연결 오류!'); } finally { setIsAuthenticating(false); }
  };

  const addCustomRCTF = async () => {
    if (!newContent.text.trim()) return;
    await callAPI({ action: 'addPool', category: newContent.category, content: newContent.text.trim() }, 'addPool');
    setNewContent(prev => ({ ...prev, text: '' }));
  };

  const spinSlots = () => {
    setIsSpinning(true);
    setIsMissionLocked(false);
    setImageUrl('');
    setTimeout(() => {
      const getRand = (cat) => {
        const pool = [...customPool[cat], ...DEFAULT_SLOT_DATA[cat]];
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

  return (
    <div className="min-h-screen bg-[#F0F2F9] flex flex-col font-sans pb-20 overflow-x-hidden">
      <AnimatePresence>{toast.isVisible && ( <motion.div initial={{ y: -50, opacity: 0, x: '-50%' }} animate={{ y: 20, opacity: 1, x: '-50%' }} exit={{ y: -50, opacity: 0, x: '-50%' }} className="fixed top-0 left-1/2 z-[200] px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold shadow-2xl"> {toast.message} </motion.div> )}</AnimatePresence>

      {/* Image & Quiz Reveal Modal (Host Only) */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6 sm:p-12" onClick={() => setSelectedTeam(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-5xl w-full flex flex-col gap-8" onClick={(e) => e.stopPropagation()}>
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/10 bg-gray-900 aspect-video flex items-center justify-center">
                {selectedTeam.MediaContent ? (
                    <img src={selectedTeam.MediaContent} className="w-full h-full object-contain" alt="Quiz" />
                ) : (
                    <div className="text-gray-500 font-black text-3xl italic">이미지 미제출</div>
                )}
                <div className="absolute top-8 left-8 bg-orange-500 text-white px-8 py-3 rounded-2xl font-black text-2xl shadow-xl">TEAM {selectedTeam.TeamID} 🏁</div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <AnimatePresence mode="wait">
                    {revealedTeams.has(selectedTeam.TeamID) ? (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-white/20 w-full text-center">
                            <p className="text-3xl sm:text-5xl font-black leading-tight">
                                <span className="text-red-400">{selectedTeam.R}</span> <span className="text-white/50 text-2xl">@</span> <span className="text-blue-400">{selectedTeam.C}</span> <br/>
                                <span className="text-yellow-400">{selectedTeam.T}</span> <span className="text-green-400 text-2xl">({selectedTeam.F})</span>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => toggleReveal(selectedTeam.TeamID)} className="px-12 py-6 bg-white text-gray-900 rounded-[2rem] font-black text-3xl shadow-2xl flex items-center gap-4">
                            <Key size={32} /> 정답 공개하기
                        </motion.button>
                    )}
                </AnimatePresence>
                <button onClick={() => setSelectedTeam(null)} className="text-white/40 font-bold hover:text-white transition-all text-lg underline underline-offset-8">닫기 [CLOSE]</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setIsLoginOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all"><X size={24} className="text-gray-400" /></button>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Lock className="text-orange-500" /></div>
                <h3 className="text-2xl font-black">관리자 인증</h3>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input type="text" placeholder="Admin ID" className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" value={loginData.id} onChange={(e) => setLoginData({...loginData, id: e.target.value})} />
                <div className="relative">
                  <input type={showPw ? "text" : "password"} placeholder="Password" className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" value={loginData.pw} onChange={(e) => setLoginData({...loginData, pw: e.target.value})} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">{showPw ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
                <button type="submit" disabled={isAuthenticating} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-3">{isAuthenticating ? <Loader2 className="animate-spin" /> : "LOGIN"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-800 transition-all"><ChevronLeft /> 홈으로</button>
        <button onClick={() => isHost ? setIsHost(false) : setIsLoginOpen(true)} className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${isHost ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-100' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}>{isHost ? 'EXIT HOST MODE' : 'HOST MODE'}</button>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6">
        {isLoading ? ( <div className="flex flex-col items-center justify-center p-20 space-y-4"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" /><p className="text-gray-400 font-bold">서버 연결 중...</p></div> ) : (
          <>
            {isHost ? (
              <div className="glass-card p-12 rounded-[3rem] bg-white shadow-2xl border-white relative overflow-hidden space-y-12">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-400" />
                <h1 className="text-4xl font-black mb-8 tracking-tight flex items-center gap-4"><Zap className="text-orange-500" /> 호스트 대시보드</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">Game Setup</p>
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                          {[2, 3, 4, 5, 6].map(num => (
                            <button key={num} onClick={() => callAPI({ action: 'initGame', totalTeams: num }, `init-${num}`)} className={`w-12 h-12 rounded-xl font-black text-sm transition-all flex items-center justify-center ${config.totalTeams === num ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-orange-500'}`}>{loadingMap[`init-${num}`] ? <Loader2 size={16} className="animate-spin" /> : num}</button>
                          ))}
                        </div>
                        <button onClick={() => callAPI({ action: 'nextTurn' }, 'nextTurn')} disabled={loadingMap['nextTurn']} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-orange-500 transition-all flex items-center justify-center gap-2">{loadingMap['nextTurn'] ? <Loader2 className="animate-spin" /> : <><RotateCw size={18} /> 다음 턴으로 넘기기</>}</button>
                    </div>
                  </div>
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">Current Team: {config.currentTurn}</p>
                    <button onClick={() => callAPI({ action: 'updateScore', teamId: config.currentTurn, points: 10 }, 'score')} disabled={loadingMap['score']} className="w-full py-8 bg-green-500 text-white rounded-3xl font-black text-3xl shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all mb-4 flex items-center justify-center gap-4">{loadingMap['score'] ? <Loader2 size={32} className="animate-spin" /> : "+10 POINT"}</button>
                  </div>
                </div>
                {teams.length > 0 && (
                  <div className="mt-12 pt-12 border-t border-gray-100">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-2"><Trophy className="text-yellow-500" /> 팀별 퀴즈 현황 (이미지를 클릭해 퀴즈를 시작하세요!)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {teams.map((team, idx) => (
                        <div key={`host-team-${team.TeamID}-${idx}`} className={`p-8 rounded-[3rem] border-2 flex flex-col group transition-all ${config.currentTurn === team.TeamID ? 'border-orange-500 bg-orange-50/30 shadow-xl scale-[1.02]' : 'border-gray-50 bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-6"><span className="font-black text-gray-400">TEAM {team.TeamID}</span><span className={`text-[10px] px-3 py-1 rounded-full font-black ${team.Status === 'SUBMITTED' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>{team.Status}</span></div>
                          {team.Status === 'SUBMITTED' ? (
                            <div className="space-y-6 flex-1 flex flex-col">
                              {/* [업그레이드] 정답 가리기 UI */}
                              <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6">
                                <div className={`transition-all duration-500 ${revealedTeams.has(team.TeamID) ? 'blur-0 opacity-100' : 'blur-xl opacity-20 pointer-events-none'}`}>
                                    <p className="text-sm font-black text-gray-800 leading-tight">{team.R} @ {team.C} <br/> {team.T} ({team.F})</p>
                                </div>
                                {!revealedTeams.has(team.TeamID) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button onClick={() => toggleReveal(team.TeamID)} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:bg-orange-500 transition-all"><Key size={14}/> ANSWER</button>
                                    </div>
                                )}
                              </div>
                              
                              <div className="relative cursor-pointer overflow-hidden rounded-3xl bg-gray-200 aspect-video flex items-center justify-center group/img" onClick={() => setSelectedTeam(team)}>
                                {team.MediaContent ? (
                                    <>
                                        <img src={team.MediaContent} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt="Submitted" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all flex flex-col items-center justify-center text-white">
                                            <Play size={40} fill="currentColor" />
                                            <span className="font-black mt-2">QUIZ START!</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center"><ImageIcon className="text-gray-300 mb-2" size={32} /><p className="text-xs font-bold text-gray-400 italic">이미지 대기 중</p></div>
                                )}
                              </div>
                              <div className="text-3xl font-black text-gray-800 self-end mt-auto">{team.Score} <span className="text-sm font-bold text-gray-400">pt</span></div>
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
                {config.gameState === 'WAITING' ? (
                  <div className="glass-card p-12 rounded-[3rem] text-center bg-white shadow-2xl border-white relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary to-teal-400" /><Users className="w-20 h-20 text-brand-primary mx-auto mb-6" /><h1 className="text-4xl font-black mb-4 tracking-tight">RCTF 멀티 퀘스트 🚀</h1><p className="text-gray-500 text-xl animate-pulse font-bold">호스트가 게임을 설정 중입니다...</p></div>
                ) : !myTeamId ? (
                  <div className="space-y-12 pb-20">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-10 rounded-[3rem] bg-white shadow-xl border-white">
                        <div className="flex items-center gap-3 mb-8"><div className="p-4 bg-brand-primary/10 rounded-2xl text-brand-primary"><Sparkles size={32} /></div><div><h3 className="text-3xl font-black text-gray-800">오늘의 주제 기여하기 💡</h3><p className="text-gray-500 font-bold text-lg">여러분의 아이디어가 슬롯머신에 포함됩니다!</p></div></div>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="relative group min-w-[220px]"><div className="absolute -top-3 left-4 px-2 bg-white text-[10px] font-black text-brand-primary z-10">CATEGORY</div><select className="w-full px-6 py-5 bg-gray-50 border-4 border-gray-100 rounded-[1.5rem] font-black text-xl outline-none focus:border-brand-primary appearance-none text-gray-700" value={newContent.category} onChange={(e) => setNewContent({...newContent, category: e.target.value})}><option value="R">Role (역할)</option><option value="C">Context (상황)</option><option value="T">Task (수행)</option><option value="F">Format (형식)</option></select><div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronLeft className="-rotate-90 text-gray-400" size={24} /></div></div>
                            <div className="flex-1 relative"><div className="absolute -top-3 left-4 px-2 bg-white text-[10px] font-black text-brand-primary z-10">YOUR IDEA</div><input type="text" placeholder="아이디어를 시원하게 입력하세요!" className="w-full px-8 py-5 bg-gray-50 border-4 border-gray-100 rounded-[1.5rem] font-black text-xl outline-none focus:border-brand-primary transition-all placeholder:text-gray-300" value={newContent.text} onChange={(e) => setNewContent({...newContent, text: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && addCustomRCTF()} /></div>
                            <button onClick={() => addCustomRCTF()} disabled={loadingMap['addPool']} className="px-12 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xl shadow-2xl hover:bg-brand-primary transition-all flex items-center justify-center gap-3 active:scale-95">{loadingMap['addPool'] ? <Loader2 className="animate-spin" size={24} /> : <><Send size={24} /> 전송</>}</button>
                        </div>
                    </motion.div>
                    <div className="glass-card p-12 rounded-[3rem] text-center bg-white shadow-2xl border-white"><h2 className="text-3xl font-black mb-10 flex items-center justify-center gap-3"><UserCheck className="text-brand-primary" /> 소속 팀을 선택하세요 🚩</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-6">{ teams.map((team, idx) => { const id = team.TeamID; return ( <button key={`select-team-${id}-${idx}`} onClick={() => setMyTeamId(id)} className="group p-10 rounded-[2.5rem] border-2 border-gray-100 hover:border-brand-primary hover:bg-brand-primary/5 transition-all active:scale-95"><div className="text-5xl font-black text-gray-800 group-hover:text-brand-primary">{id}</div></button> ); })}</div></div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="glass-card p-8 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-between border-white">
                        <div className="flex items-center gap-4"><div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary font-black text-xl">{myTeamId}</div><h3 className="text-2xl font-black text-gray-800">우리 팀 대시보드 🎰</h3></div>
                        {!isMissionLocked && <button onClick={spinSlots} disabled={isSpinning} className="px-10 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-brand-primary active:scale-95 transition-all">{isSpinning ? 'SPINNING...' : 'JACKPOT SPIN! 🎰'}</button>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> {CATEGORIES.map(cat => <Reel key={cat.key} category={cat} result={isMissionLocked ? (gameState.teams.find(t=>t.TeamID===myTeamId)?.[cat.key]) : results[cat.key]} isSpinning={isSpinning} pool={customPool} />)} </div>
                    {((results.R && !isSpinning) || isMissionLocked) && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                        <div className="p-12 bg-white rounded-[4rem] shadow-2xl text-center border-4 border-brand-primary/5 relative overflow-hidden">
                          <p className="text-3xl font-black text-gray-800 leading-tight">
                            {isMissionLocked ? (
                              <><span className="text-red-500">{gameState.teams.find(t=>t.TeamID===myTeamId)?.R}</span> @ <span className="text-blue-500">{gameState.teams.find(t=>t.TeamID===myTeamId)?.C}</span> <br/> <span className="text-yellow-500">{gameState.teams.find(t=>t.TeamID===myTeamId)?.T}</span> <span className="text-green-500">({gameState.teams.find(t=>t.TeamID===myTeamId)?.F})</span></>
                            ) : (
                              <><span className="text-red-500">{results.R}</span> @ <span className="text-blue-500">{results.C}</span> <br/> <span className="text-yellow-500">{results.T}</span> <span className="text-green-500">({results.F})</span></>
                            )}
                          </p>
                        </div>
                        {!isMissionLocked ? ( <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={loadingMap['submit']} onClick={() => callAPI({ action: 'submitPrompt', teamId: myTeamId, rctf: results, mediaType: 'IMAGE', mediaContent: '' }, 'submit')} className="w-full py-6 bg-brand-primary text-white rounded-[2.5rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-3">{loadingMap['submit'] ? <Loader2 className="animate-spin" /> : "이 미션으로 도전하기! 🚀"}</motion.button> ) : (
                          <div className="space-y-8">
                            {gameState.teams.find(t=>t.TeamID===myTeamId)?.MediaContent ? (
                              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-10 bg-white rounded-[3rem] border-4 border-green-500 shadow-2xl text-center space-y-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="text-green-500" size={40} /></div>
                                <h4 className="text-3xl font-black text-gray-800">미션 제출 성공! 🎊</h4>
                                <p className="text-gray-500 font-bold text-lg">우리 팀의 이미지가 선생님 화면에 전송되었습니다. <br/> 다른 팀의 퀴즈 차례를 기다리세요!</p>
                                <div className="relative rounded-2xl overflow-hidden border-4 border-gray-100 max-w-sm mx-auto shadow-lg"><img src={gameState.teams.find(t=>t.TeamID===myTeamId)?.MediaContent} className="w-full h-auto" alt="My Submission" /><div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 text-xs font-black">MY IMAGE</div></div>
                              </motion.div>
                            ) : (
                              <div className="p-10 bg-white rounded-[3rem] border-4 border-dashed border-brand-primary/20 space-y-8 shadow-inner text-center">
                                <div className="flex items-center gap-4 mb-4 justify-center"><div className="p-4 bg-orange-100 rounded-2xl text-orange-600"><Camera size={32} /></div><h4 className="text-2xl font-black text-gray-800 tracking-tight text-left">AI 이미지 퀴즈 제출하기 🎨</h4></div>
                                <div className="space-y-6">
                                  <div className="flex flex-col md:flex-row gap-4">
                                      <input type="text" placeholder="이미지 URL 주소를 붙여넣으세요" className="flex-1 px-8 py-5 bg-gray-50 border-4 border-gray-100 rounded-2xl font-bold outline-none" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                                      <button onClick={() => callAPI({ action: 'submitPrompt', teamId: myTeamId, rctf: gameState.teams.find(t=>t.TeamID===myTeamId), mediaType: 'IMAGE', mediaContent: imageUrl }, 'submitImage')} disabled={loadingMap['submitImage'] || !imageUrl} className="px-10 py-5 bg-orange-500 text-white rounded-2xl font-black text-xl shadow-lg">{loadingMap['submitImage'] ? <Loader2 className="animate-spin" /> : "제출"}</button>
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
    </div>
  );
};

export default RctfBattle;
