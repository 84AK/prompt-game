# ✍️ 대댓글(답글) 계층형 시스템 구현 작업 로그 (Scribe's Log)

*   **기록자**: 서기님 (Doc)
*   **작업 일자**: 2026년 6월 4일
*   **프로젝트**: 프롬프트 아케이드 (Prompt Arcade)
*   **협력 파트너**: 아크랩스 공식 파트너십 (https://litt.ly/aklabs)

---

## 🏆 1. 작업 개요 및 핵심 요구사항
기존 커뮤니티 상세 보기 페이지([PromptDetail.jsx](file:///Users/byunmose/Desktop/AI%20Playgrounds/prompt_game/src/pages/PromptDetail.jsx))의 댓글 시스템은 깊이 구분이 없는 평평한(Flat) 리스트 형태였습니다. 사용자 간의 활발한 피드백 교류와 마법 토론을 지원하기 위해, **댓글 아래에 답글(대댓글)을 2 depth 계층형으로 달 수 있는 기능**을 새롭게 구현하였습니다.

데이터의 결합 무결성을 보장하기 위해 Supabase `comments` 테이블에 자기 참조 외래 키(`parent_id`)를 도입하고, 프론트엔드 단에서 트리 구조를 필터링하여 인라인 답글 입력 폼과 들여쓰기 연결 화살표를 연출하는 세련된 UI를 완수하였습니다.

---

## 🛠 2. 데이터베이스 설계 및 DDL (Supabase SQL Editor 실행용)
기존 `comments` 테이블의 `id` 컬럼 타입에 따라 `parent_id`를 추가합니다. 
`posts` 테이블이 `uuid`를 주 키로 사용하므로, `comments` 테이블 역시 `uuid`를 사용할 가능성이 매우 큽니다. 오류 발생 시 `bigint`로 대처할 수 있도록 두 버전 모두 준비하였습니다.

다음 SQL 중 **본인의 DB 스키마에 맞는 버전 하나만 선택**하여 Supabase의 **SQL Editor**에서 실행해 주세요.

### [Option A] comments.id가 UUID 형식인 경우 (권장 및 기본값)
```sql
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;
```

### [Option B] comments.id가 BIGINT 형식인 경우
```sql
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id bigint REFERENCES public.comments(id) ON DELETE CASCADE;
```

*   **참고**: `ON DELETE CASCADE` 제약 조건을 걸어두었기 때문에, 최상위 부모 댓글이 지워지면 데이터베이스 레벨에서 그 아래 매핑된 답글(대댓글)들도 지저분하게 남지 않고 자동으로 동반 영구 삭제됩니다.

---

## 🛠 3. 수정 및 구현 파일 목록

### 1) [PromptDetail.jsx](file:///Users/byunmose/Desktop/AI%20Playgrounds/prompt_game/src/pages/PromptDetail.jsx)
*   **대댓글 관련 상태 추가**:
    *   `replyingToId`: 현재 사용자가 어떤 부모 댓글에 답글을 입력하고 있는지 기록하는 토글 상태 (`comment.id` 저장).
    *   `replyText`: 인라인 답글 폼에 입력되는 텍스트 상태.
*   **아이콘 추가 임포트**: `CornerDownRight` 아이콘을 `lucide-react`에서 가져와서 답글을 가리키는 시각적 가이드로 활용합니다.
*   **`handleAddReply` 함수 신설**:
    *   부모 댓글의 `id`를 `parent_id` 컬럼에 실어 `comments` 테이블에 INSERT 쿼리를 실행합니다.
    *   성공 시 등록 안내 Toast를 띄우고, 입력값을 리셋하며, `fetchComments`를 통해 목록을 재조회합니다.
*   **계층형 렌더링 필터링 구현**:
    *   전체 댓글 리스트 중 `parent_id`가 없는(null) 최상위 댓글(`comments.filter(c => !c.parent_id)`)을 먼저 매핑해 출력합니다.
    *   루프 내에서 각 부모 댓글의 `id`와 자식 댓글의 `parent_id`가 일치하는 답글 배열(`comments.filter(r => r.parent_id === comment.id)`)을 필터링해 냅니다.
    *   부모 댓글 우측 하단에 `CornerDownRight` 아이콘과 함께 **"답글 달기"** 버튼을 노출하고, 클릭 시 자연스러운 높이 슬라이드(`height: 'auto'`) 애니메이션과 함께 인라인 textarea 입력 영역을 펼쳐 줍니다.
    *   자식 답글들은 `ml-10` 클래스를 적용해 오른쪽으로 40px 밀어두고, 절대 경로 배치를 통해 L자 연결 화살표를 표시하여 한눈에 답글 관계임을 식별하게 디자인 완성도를 극대화했습니다.
*   **댓글 삭제 호환성**:
    *   최상위 댓글 혹은 답글 개별 삭제 시, 기존의 `handleDeleteComment`를 재활용하여 본인 및 관리자 권한을 정밀 체크한 후 안전하게 단일 레코드 삭제가 작동하게 만들었습니다.
