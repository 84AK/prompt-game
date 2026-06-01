import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, Sparkles, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) return setError('이메일을 입력해 주세요.');
    if (!formData.password) return setError('비밀번호를 입력해 주세요.');

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      });

      if (signInError) throw signInError;

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          if (profile.role === 'ADMIN') {
            sessionStorage.setItem('rctf_admin_auth', 'true');
          } else {
            sessionStorage.removeItem('rctf_admin_auth');
          }
          sessionStorage.setItem('user_display_name', profile.display_name);
        }

        navigate('/');
      }
    } catch (err) {
      setError(err.message || '로그인 실패. 이메일과 비밀번호를 다시 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 구글 소셜 로그인 연동 핸들러 (사용자 로컬 포트인 5175 리디렉션 반영)
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:5175'
        }
      });
      if (oAuthError) throw oAuthError;
    } catch (err) {
      setError(err.message || '구글 소셜 로그인 연동 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F9] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400/10 rounded-full blur-3xl -z-10" />

      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-gray-800 font-bold transition-colors group text-sm"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-white/70 backdrop-blur-xl shadow-2xl border border-white/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-teal-400 to-brand-accent" />
          
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-brand-primary/10 rounded-3xl text-brand-primary mb-4">
              <Sparkles size={28} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-800">마법학교 로그인</h2>
            <p className="text-gray-500 font-bold text-xs sm:text-sm mt-1">대시보드와 실시간 배틀을 시작하세요</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="이메일 주소"
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border-2 border-gray-100 focus:border-brand-primary rounded-xl sm:rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all placeholder:text-gray-300"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border-2 border-gray-100 focus:border-brand-primary rounded-xl sm:rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all placeholder:text-gray-300"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 hover:bg-brand-primary text-white rounded-xl sm:rounded-2xl font-black text-base shadow-xl shadow-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : '로그인'}
            </motion.button>
          </form>

          {/* 소셜 로그인 구분선 */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute w-full h-[1px] bg-gray-100" />
            <span className="relative px-4 bg-white text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
              Or Connect With
            </span>
          </div>

          {/* 구글 소셜 로그인 버튼 */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-3.5 bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-gray-250 text-gray-700 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {/* Google G Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            구글 계정으로 로그인
          </motion.button>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <span className="text-xs sm:text-sm text-gray-400 font-bold">아직 계정이 없으신가요? </span>
            <Link to="/register" className="text-xs sm:text-sm text-brand-primary font-black hover:underline">
              회원가입하기
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
