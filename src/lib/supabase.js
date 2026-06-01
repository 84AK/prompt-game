import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 안전장치: 정보가 누락되었을 때 경고 출력 및 Mockup 모드로 개발할 수 있게 함
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase URL 또는 Anon Key가 .env 파일에 설정되지 않았습니다. 실시간 및 DB 연동을 위해 설정을 진행해 주세요.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
