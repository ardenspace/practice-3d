# Conventions

## Prior work this phase (Phase 1)

- step 1: 프로젝트 스캐폴드 — Vite 7 + React 19 + TS strict + Vitest(jsdom,
  `src/**/*.test.{ts,tsx}`) + react-router 7(`react-router` 패키지) + R3F.
  `src/theme.ts`(SITE_TITLE), `src/App.tsx`, scripts: dev/build/preview/test.
- step 2: B1–B3 계약 테스트 핀 — `src/works/registry.test.tsx`(B1),
  `src/works/assets.test.ts`(B2, node env fs 검사),
  `src/routes.test.tsx`(B3), `src/scene/bubbles.test.ts`(파생 보장).
  스텁: `src/works/registry.ts`(스키마 타입 + 빈 `works`),
  `src/scene/bubbles.ts`(`deriveWorkBubbles` — 빈 배열 반환),
  `src/routes.tsx`(`routes: RouteObject[]` — catch-all null).
  이 12개 테스트는 구현 전까지 assertion에서 실패하는 것이 정상.
  구현 스텝은 스텁을 채워서(재생성 금지) 테스트를 green으로 만든다.
  devDependency 추가: `@types/node` (B2 node 환경 테스트용).

## Baseline (applies unless overridden)

- 반복 리터럴(색상, 간격, 경로, 매직 넘버)은 토큰/상수 모듈 한 곳에 둔다.
  두 곳 이상 인라인 중복 금지.
- 두 번 나오는 로직은 공유 레이어로 추출하고 아래 Shared Utilities에
  등록한다.
- 사용자 노출 실패 문구는 한 가지 톤으로, 한 곳에서 정의한다.
- 스펙의 Simplicity Zones가 명시한 하드코딩(방울 개수/배치 상수 등)은
  위반이 아니다.

## Design Tokens

- 홈(방울 씬)은 우주 무드: 어두운 배경 + 보라 성운 + 핑크/시안 광원.
  구체 색상 값은 빌드 중 `src/theme.ts`(토큰 모듈) 한 곳에 정의하고
  여기에 등록한다.
- 탭/길게 누르기 임계값: 상수 하나 `LONG_PRESS_MS = 250` (토큰 모듈).
- 작품 페이지는 페이지마다 스타일 자유 — 홈 토큰을 따를 의무 없음.
  단 페이지 안에서의 반복 리터럴은 baseline 규칙 적용.
- 폰트 포함 모든 정적 자원은 셀프호스트 (런타임 외부 요청 금지).

## Shared Utilities

<!-- 빌드 중 implementer가 새 유틸을 만들면 여기 등록한다. -->

- `src/theme.ts` — 토큰/상수 모듈. 현재 `SITE_TITLE`, `HOME_TESTID`.
  씬 색상과 `LONG_PRESS_MS`도 여기에 추가한다.
- `HOME_TESTID` (`src/theme.ts`) — 테스트 심(B3): 홈 화면 루트 요소는
  `data-testid={HOME_TESTID}`를 가져야 한다. 라우팅 테스트가 "홈 렌더/
  홈으로 리다이렉트"를 이 아이디로 판별한다.
- `src/works/registry.ts` — 등록부 모듈, 작품 등록의 단일 진실.
  타입 `WorkEntry`/`WorkObject`(판별 유니온, v1 `ImageObject`) +
  `works: readonly WorkEntry[]` (현재 빈 배열 스텁).
- `src/scene/bubbles.ts` — 방울 목록 파생 모듈.
  `deriveWorkBubbles(entries): WorkBubble[]` (`WorkBubble = { entry }`,
  등록부 순서 유지, 항목당 정확히 1개). 씬은 이 목록만 소비한다.
  현재 스텁(빈 배열 반환) — 씬 스텝에서 구현.
- `src/routes.tsx` — 라우팅 표면의 단일 진실 `routes: RouteObject[]`.
  App/main은 이 배열로 라우터를 만든다. 현재 catch-all null 스텁.

## Layout & Naming

- `src/works/<slug>/` — 작품 페이지 컴포넌트와 그 페이지 전용 코드.
  작품 추가 = 등록부 항목 하나 + 이 폴더 하나 + `public/works/<slug>/`
  에셋 폴더 하나. 그 밖의 코드는 손대지 않는다 (B1).
- `src/scene/` — 방울 씬 (R3F 캔버스, 방울, 파티클, 폴백 전환).
- `src/theme.ts` — 디자인 토큰·상수 모듈.
- slug 및 에셋 파일명은 kebab-case. 컴포넌트 파일은 PascalCase.
- 테스트는 대상 옆 `*.test.ts(x)`, 러너는 Vitest.
- dev 서버는 Vite 기본 5173 (이 머신의 8080/8000/8081/5000/7000 등
  점유 포트 회피).

## Failure Behavior

- 조용하고 우아하게. 백지 화면 금지.
- WebGL 컨텍스트 생성 실패/실행 중 상실 → 배경 이미지 + 사이트 제목 +
  전 작품 텍스트 링크 폴백 (B4).
- 작품 페이지 크래시 → 에러 바운더리가 홈 링크 있는 최소 화면 표시.
- 등록부 위반(slug 형식·중복, object.src 형식)은 테스트 실패로 잡는다 —
  런타임 예외로 새지 않는다.
- 콘솔 로그는 개발 중 디버깅 외 프로덕션 경로에 남기지 않는다.
