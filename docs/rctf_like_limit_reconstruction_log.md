# ✍️ 좋아요 중복 방지 및 취소 기능 고도화 작업 로그 (Scribe's Log)

*   **기록자**: 서기님 (Doc)
*   **작업 일자**: 2026년 6월 4일
*   **프로젝트**: 프롬프트 아케이드 (Prompt Arcade)
*   **협력 파트너**: 아크랩스 공식 파트너십 (https://litt.ly/aklabs)

---

## 🏆 1. 작업 개요 및 핵심 요구사항
기존 커뮤니티 게시글 및 게임 센터의 모든 좋아요 기능은 로그인 유저 식별 없이 숫자를 1씩 단순 증가시켰기 때문에 한 명의 유저가 횟수 제한 없이 무한대로 좋아요 버튼을 누를 수 있는 문제가 있었습니다.
이를 방지하고, **로그인한 유저는 한 게시글/게임당 단 한 번만 좋아요를 누를 수 있고 다시 클릭하면 취소되도록** 구조적인 개편을 수행하였습니다.

이를 위해 프론트엔드의 단순 카운트 증가 로직을 폐기하고, Supabase에 좋아요 이력을 추적할 관계형 테이블을 설계하고 실시간 데이터 상태를 클라이언트에 동기화하였습니다.

---

## 🛠 2. 데이터베이스 설계 및 DDL (Supabase SQL Editor 실행용)
유저의 세션 ID(`user_id`)와 게시글/게임 ID(`post_id`/`game_id`)를 고유 쌍(UNIQUE)으로 가지는 테이블을 설계하여 중복 좋아요를 데이터베이스 레벨에서 완벽 차단합니다. 또한, 카운트 계산 성능 향상 및 다중 접속 시 발생할 수 있는 레이스 컨디션을 방지하기 위해 **DB 트리거(Trigger)** 방식을 도입하였습니다.

다음 SQL을 Supabase의 **SQL Editor**에 붙여넣어 실행해야 작동합니다.

```sql
-- 1. 커뮤니티 게시글 좋아요 테이블 생성 (posts 테이블의 id가 bigint일 경우)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id bigint REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

/* 
💡 참고: 만약 posts 테이블의 id가 UUID 형태라면 아래 쿼리를 사용하세요.
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);
*/

-- RLS(Row Level Security) 활성화
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (비로그인 유저도 조회는 가능하나, 수정은 로그인한 본인 데이터만 가능)
CREATE POLICY "Allow public read access to post_likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to post_likes" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated delete to post_likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);


-- 2. 게임 센터 게임 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS public.game_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text REFERENCES public.games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(game_id, user_id)
);

-- RLS(Row Level Security) 활성화
ALTER TABLE public.game_likes ENABLE ROW LEVEL SECURITY;

-- 정책 생성
CREATE POLICY "Allow public read access to game_likes" ON public.game_likes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to game_likes" ON public.game_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated delete to game_likes" ON public.game_likes FOR DELETE USING (auth.uid() = user_id);


-- 3. posts.likes_count 자동 증감 트리거 함수 및 설정
CREATE OR REPLACE FUNCTION public.handle_post_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_post_like_added_or_removed
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_like();


-- 4. games.like_count 자동 증감 트리거 함수 및 설정
CREATE OR REPLACE FUNCTION public.handle_game_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.games
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.games
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_game_like_added_or_removed
  AFTER INSERT OR DELETE ON public.game_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_game_like();
```

---

## 🛠 3. 수정 및 구현 파일 목록

### 1) [Home.jsx](file:///Users/byunmose/Desktop/AI%20Playgrounds/prompt_game/src/pages/Home.jsx)
*   **좋아요 상태 트래킹 구현**: `likedPosts` 상태를 추가하여 현재 유저가 이미 좋아요한 목록들을 `{ [postId]: true }` 꼴로 기록합니다.
*   **유저별 좋아요 쿼리 연동**: `fetchMyLikes` 함수를 신설해 로그인 시 `post_likes` 테이블을 쿼리하여 유저의 기존 선택 값을 화면에 활성화합니다.
*   **토글식 `handleLike` 로직 개편**:
    *   비로그인 시에는 Toast 피드백을 주며 로그인 창으로 안내합니다.
    *   이미 좋아요한 글인 경우 `post_likes`에서 DELETE를 시도하고, 최초 클릭 시 INSERT를 진행합니다.
*   **UI 바인딩 고도화**: 하트 컴포넌트(`Heart`)가 단지 `likes_count > 0`인 경우가 아니라, 현재 로그인한 사용자가 실제로 좋아요를 눌렀는지 여부인 `likedPosts[post.id]` 상태를 기준으로 붉은색(`fill-red-500`)을 연출하도록 수정하였습니다.

### 2) [PromptDetail.jsx](file:///Users/byunmose/Desktop/AI%20Playgrounds/prompt_game/src/pages/PromptDetail.jsx)
*   **단일 글 상세 좋아요 방지**: `isLiked` 상태값을 추가하여 유저의 상세글 좋아요 중복을 제어합니다.
*   **`fetchLikeStatus` 연동**: 게시글 진입 시 `post_likes`에 현재 로그인 유저와 해당 게시물 아이디 쌍이 존재하는지 단일 검색(`maybeSingle`)하여 아이콘 색상에 반영합니다.
*   **`handleLikePost` 로직 고도화**: `post_likes`에 insert/delete 쿼리를 동기 처리하며, 에러 시 롤백하는 예외 안정 장치를 마련했습니다.

### 3) [PlayCenter.jsx](file:///Users/byunmose/Desktop/AI%20Playgrounds/prompt_game/src/pages/PlayCenter.jsx)
*   **게임 센터 중복 클릭 금지**: `likedGames` 상태를 개설하고 `game_likes` 테이블을 기반으로 유저가 눌렀던 게임들을 붉은색 하트로 로드합니다.
*   **`handleLike` 비동기 스키마 교체**: 기존 `games` 테이블 직접 update 쿼리를 대신하여, `game_likes`에 upsert/delete 연동 처리를 완수하였습니다.

### 4) [MyPage.jsx](file:///Users/byunmose/Desktop/AI%20Playgrounds/prompt_game/src/pages/MyPage.jsx)
*   **로컬 스토리지 좋아요 이주(Migration)**: 기존 마이페이지의 '좋아요한 게임' 목록이 로컬 스토리지에 정적으로 머물러 멀티 디바이스 연동이 깨지던 것을, `game_likes` 테이블을 SELECT하여 로그인한 유저의 실제 저장된 게임들만 DB에서 안전하게 로드하도록 구현 변경하였습니다.

---

## 📈 4. 향후 유지보수를 위한 조언
1.  **외래 키 무결성(Cascade)**: `post_likes` 및 `game_likes`는 상위 테이블(`posts`, `games`, `auth.users`)의 삭제가 발생할 때 자동으로 해당 좋아요 쌍도 영구 삭제(`ON DELETE CASCADE`)되도록 설계하여 고아 데이터의 누적을 원천 방지하였습니다.
2.  **임시 동기화 오작동 시 대책**: 만약 DB 테이블이나 트리거가 미적용된 상태에서 화면이 구동될 시 클라이언트에서 warn 로그를 띄우며 기본 fallback을 타기 때문에 안전하게 운영 및 배포가 가능합니다.
