# 🎰 RCTF Multi-Quest: AI Image Quiz Master

AI 시대의 프롬프트 엔지니어링 실력을 겨루는 **교실 협업형 에듀테인먼트 플랫폼**입니다. 학생들이 직접 주제를 기여하고, AI로 생성한 이미지를 통해 서로의 추리력을 시험하는 역동적인 학습 경험을 제공합니다.

[![Aklabs Link](https://img.shields.io/badge/Aklabs-Link-orange?style=for-the-badge)](https://litt.ly/aklabs)

## 🚀 주요 기능 (Key Features)

### 1. 학생 참여형 '아이디어 보드' 💡
- 게임 시작 전, 모든 학생이 **Role(역할), Context(상황), Task(수행), Format(형식)** 아이디어를 제출합니다.
- 제출된 아이디어는 실시간으로 슬롯머신 풀(Pool)에 추가되어 우리 학급만의 유니크한 미션을 만듭니다.

### 2. 물리 엔진 기반 'RCTF 슬롯머신' 🎰
- 초고속 스핀과 감속 연출, 모션 블러 효과가 적용된 프리미엄 슬롯머신입니다.
- 버튼 하나로 창의적이고 킹받는(?) 미션 조합을 무작위로 생성합니다.

### 3. AI 이미지 퀴즈 모드 🎨🕵️‍♂️
- 확정된 미션을 바탕으로 AI(DALL-E, Bing 등) 이미지를 생성하여 제출합니다.
- 호스트 화면에서 이미지를 크게 띄우고 다른 팀의 미션을 맞추는 **블라인드 퀴즈 쇼**를 진행할 수 있습니다.

### 4. 강력한 호스트 대시보드  Zap
- **실시간 팀 관리**: 팀별 미션 상태(WAITING, SUBMITTED) 및 제출 이미지를 실시간 모니터링합니다.
- **블라인드 정답 공개**: 퀴즈의 긴장감을 위해 정답을 숨겼다가 선생님이 버튼을 누르면 공개하는 시스템입니다.
- **점수 및 턴 제어**: 버튼 클릭만으로 간편하게 점수를 부여하고 다음 턴으로 넘깁니다.

---

## 🛠 기술 스택 (Tech Stack)

- **Frontend**: React, Framer Motion (고급 애니메이션), Tailwind CSS (V4+), Lucide-React
- **Backend**: Google Apps Script (GAS) - Google Sheets 기반의 실시간 데이터베이스
- **Deployment**: Vercel
- **Security**: Server-side Admin Authentication (GAS-based)

---

## ⚙️ 설정 및 배포 가이드 (Setup & Deployment)

### 1. 환경 변수 설정
Vercel 배포 시 또는 로컬 `.env` 파일에 다음 항목을 반드시 추가해야 합니다.
```env
VITE_GAS_API_URL=여러분의_구글_앱스_스크립트_배포_URL
```

### 2. 구글 시트 구성
다음 이름의 시트들이 필요합니다:
- `Config`: 게임 상태 관리
- `Teams`: 팀별 데이터 (Score, R, C, T, F, MediaContent 등)
- `Admin`: 관리자 계정 (A열: ID, B열: PW)
- `RCTF_Pool`: 학생 기여 주제 저장

---

## 👨‍💻 제작 및 문의
이 프로젝트는 최신 AI 웹 트렌드와 교육 현장의 목소리를 반영하여 제작되었습니다.

- **아크랩스(Aklabs) 공식 홈페이지**: [https://litt.ly/aklabs](https://litt.ly/aklabs)

---
*Powered by Antigravity AI Assistant*
