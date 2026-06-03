import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PlayCenter from './pages/PlayCenter';
import ReversePrompting from './pages/ReversePrompting';
import FewShotLab from './pages/FewShotLab';
import RctfBattle from './pages/RctfBattle';
import Login from './pages/Login';
import Register from './pages/Register';
import PromptFeed from './pages/PromptFeed';
import PromptDetail from './pages/PromptDetail';
import GameIntro from './pages/GameIntro';
import GameIntroEditor from './pages/GameIntroEditor';
import AdminDashboard from './pages/AdminDashboard';
import MyPage from './pages/MyPage';
import GameCreatorGuide from './pages/GameCreatorGuide';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<PlayCenter />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/feed" element={<PromptFeed />} />
          <Route path="/feed/:postId" element={<PromptDetail />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/game-intro/edit" element={<GameIntroEditor />} />
          <Route path="/game/reverse-prompting" element={<ReversePrompting />} />
          <Route path="/game/few-shot-lab" element={<FewShotLab />} />
          <Route path="/game/rctf-battle" element={<RctfBattle />} />
          <Route path="/game/:gameId/intro" element={<GameIntro />} />
          {/* 향후 게임 페이지 라우팅 추가 예정 */}
          <Route path="/creator-guide" element={<GameCreatorGuide />} />
          <Route path="/game/:gameId" element={<div className="p-20 text-center">게임 페이지 준비 중입니다!</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
