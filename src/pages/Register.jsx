import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader2, Sparkles, ArrowLeft } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (oAuthError) throw oAuthError;
    } catch (err) {
      setError(err.message || '구글 연동 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.displayName.trim()) return setError('표시할 이름을 입력해 주세요.');
    if (!formData.email.trim()) return setError('이메일을 입력해 주세요.');
    if (formData.password.length < 6) return setError('비밀번호는 최소 6자 이상이어야 합니다.');
    if (formData.password !== formData.confirmPassword) return setError('비밀번호가 일치하지 않습니다.');

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName.trim()
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
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
        {/* 모바일 화면 패딩 축소 및 둥글기 반응형 적용 */}
        <div className="glass-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-white/70 backdrop-blur-xl shadow-2xl border border-white/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-teal-400 to-brand-accent" />
          
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-brand-primary/10 rounded-3xl text-brand-primary mb-4">
              <Sparkles size={28} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-800">마법학교 등록</h2>
            <p className="text-gray-500 font-bold text-xs sm:text-sm mt-1">프롬프트 마법사가 되기 위한 첫걸음</p>
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
            
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl text-xs font-bold text-center"
              >
                🎉 회원가입 성공! 로그인 화면으로 이동합니다.
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="표시할 이름 (닉네임)"
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border-2 border-gray-100 focus:border-brand-primary rounded-xl sm:rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all placeholder:text-gray-300"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={loading || success}
              />
            </div>

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
                disabled={loading || success}
              />
            </div>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border-2 border-gray-100 focus:border-brand-primary rounded-xl sm:rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all placeholder:text-gray-300"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading || success}
              />
            </div>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="비밀번호 확인"
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border-2 border-gray-100 focus:border-brand-primary rounded-xl sm:rounded-2xl outline-none font-bold text-sm sm:text-base text-gray-700 transition-all placeholder:text-gray-300"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={loading || success}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 bg-gray-900 hover:bg-brand-primary text-white rounded-xl sm:rounded-2xl font-black text-base shadow-xl shadow-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                '계정 생성하기'
              )}
            </motion.button>
          </form>

          {/* 구분선 */}
          <div className="relative flex items-center justify-center mt-6 mb-4">
            <div className="absolute w-full h-[1px] bg-gray-100" />
            <span className="relative px-4 bg-white text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
              Or Connect With
            </span>
          </div>

          {/* 구글 가입 버튼 */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            disabled={loading || success}
            onClick={handleGoogleSignUp}
            className="w-full py-3.5 bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-gray-200 text-gray-700 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            구글 계정으로 가입
          </motion.button>

          <div className="mt-6 text-center border-t border-gray-100 pt-6">
            <span className="text-xs sm:text-sm text-gray-400 font-bold">이미 가입하셨나요? </span>
            <Link to="/login" className="text-xs sm:text-sm text-brand-primary font-black hover:underline">
              로그인하기
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
