import React from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, Swords, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImg from '../assets/hero.png';

const games = [
  {
    id: 'reverse-prompting',
    title: '프롬프트 스무고개',
    description: 'AI의 답변만 보고 어떤 프롬프트를 썼는지 맞춰보세요!',
    icon: <Search className="w-8 h-8 text-brand-primary" />,
    color: 'bg-red-50',
    borderColor: 'border-red-100',
    tag: '분석력',
    gridSpan: 'col-span-1 md:col-span-2'
  },
  {
    id: 'few-shot-lab',
    title: '감성 AI 트레이닝 센터',
    description: '몇 가지 예시로 AI의 감성을 튜닝하는 바이브 랩!',
    icon: <Zap className="w-8 h-8 text-brand-secondary" />,
    color: 'bg-teal-50',
    borderColor: 'border-teal-100',
    tag: '패턴인식',
    gridSpan: 'col-span-1'
  },
  {
    id: 'rctf-battle',
    title: 'RCTF 카드 배틀',
    description: '랜덤 카드 조합으로 최고의 프롬프트를 만들어보세요.',
    icon: <Swords className="w-8 h-8 text-brand-accent" />,
    color: 'bg-yellow-50',
    borderColor: 'border-yellow-100',
    tag: '창의력',
    gridSpan: 'col-span-1'
  },
  {
    id: 'prompt-evolution',
    title: '단계별 업그레이드',
    description: '약한 프롬프트를 최강의 프롬프트로 진화시키세요!',
    icon: <TrendingUp className="w-8 h-8 text-purple-500" />,
    color: 'bg-purple-50',
    borderColor: 'border-purple-100',
    tag: '설계능력',
    gridSpan: 'col-span-1 md:col-span-2'
  }
];

const GameCard = ({ game }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/game/${game.id}`)}
      className={`glass-card p-6 rounded-3xl cursor-pointer flex flex-col justify-between ${game.color} ${game.borderColor} ${game.gridSpan}`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            {game.icon}
          </div>
          <span className="px-3 py-1 bg-white/50 rounded-full text-xs font-semibold text-gray-600 border border-white/50">
            #{game.tag}
          </span>
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-800">{game.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{game.description}</p>
      </div>
      
      <div className="mt-6 flex items-center text-sm font-bold text-gray-700">
        시작하기 
        <motion.span
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="ml-2"
        >
          →
        </motion.span>
      </div>
    </motion.div>
  );
};

const Home = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center gap-12 mb-20">
        <div className="flex-1 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Prompt Magic School</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              프롬프트로 부리는 <br />
              <span className="text-brand-primary">놀라운 마법!</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
              게임을 통해 AI와 대화하는 법을 배워보세요. 
              초보자도 쉽고 재미있게 프롬프트 엔지니어가 될 수 있습니다.
            </p>
            <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-colors">
              모든 게임 보기
            </button>
          </motion.div>
        </div>
        
        <div className="flex-1 relative">
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative z-10"
          >
            <img 
              src={heroImg} 
              alt="AI Magician" 
              className="w-full max-w-md mx-auto drop-shadow-2xl rounded-3xl"
            />
          </motion.div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-primary/10 rounded-full blur-3xl -z-0"></div>
        </div>
      </section>

      {/* Game Grid */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-800">연습할 게임 선택</h2>
            <p className="text-gray-500">원하는 주제의 게임을 골라 실력을 키워보세요!</p>
          </div>
        </div>
        
        <div className="bento-grid">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
      
      {/* Footer-like Info */}
      <div className="mt-24 text-center border-t border-gray-100 pt-12">
        <p className="text-gray-400 text-sm mb-4">© 2026 AK Labs Prompt Game. All rights reserved.</p>
        <a 
          href="https://litt.ly/aklabs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-brand-secondary font-bold hover:underline"
        >
          아크랩스 더 알아보기
        </a>
      </div>
    </div>
  );
};

export default Home;
