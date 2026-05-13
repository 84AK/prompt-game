import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReversePrompting from './pages/ReversePrompting';
import FewShotLab from './pages/FewShotLab';
import RctfBattle from './pages/RctfBattle';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/reverse-prompting" element={<ReversePrompting />} />
          <Route path="/game/few-shot-lab" element={<FewShotLab />} />
          <Route path="/game/rctf-battle" element={<RctfBattle />} />
          {/* 향후 게임 페이지 라우팅 추가 예정 */}
          <Route path="/game/:gameId" element={<div className="p-20 text-center">게임 페이지 준비 중입니다!</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
