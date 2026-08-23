# InBody Food — 인바디 & 식단 관리

Next.js + Firebase + Vercel 기반의 개인 건강/식단 추적 앱. 인바디(체성분) 기록, 식사 사진
AI 분석, 체중/영양 대시보드, Notion 연동을 제공한다.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Hosting**: Vercel
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Image Storage**: Vercel Blob (meal / InBody photos — see [docs/image-storage-decision.md](docs/image-storage-decision.md))
- **AI**: Multimodal AI API (식사 사진 분석)
- **External**: Notion API (장기 기록 / 개인 대시보드)

아키텍처 전체 설명은 [docs/](docs/)를 참고.

## Getting Started

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인.

### 환경변수

`.env.local.example`을 `.env.local`로 복사하고 Firebase / AI / Notion 값을 채운다.
`NEXT_PUBLIC_` 접두사가 없는 값은 서버 전용이며 절대 클라이언트에 노출하지 않는다.

```bash
cp .env.local.example .env.local
```

### Firebase 로컬 에뮬레이터

```bash
firebase emulators:start
```

`.env.local`에서 `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`로 설정하면 로컬 앱이 에뮬레이터에 연결된다.

## 프로젝트 구조

```
app/            Next.js App Router 페이지 및 API routes
components/     UI 컴포넌트 (shadcn/ui 포함)
lib/            firebase / ai / notion / nutrition / health 클라이언트 및 유틸
services/       기능별 비즈니스 로직 (meal, body, nutrition, reports)
types/          Zod 스키마 + TypeScript 타입 (frontend/backend 공유)
functions/      Firebase Cloud Functions
docs/           아키텍처 결정 문서
```

## 배포

- `main` 브랜치 merge → Vercel Production Deployment
- Pull Request → Vercel Preview Deployment
