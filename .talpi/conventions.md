# Conventions

## Prior work this phase (Phase 2)

<!-- phase 시작 시 리셋. Phase 1 산출물은 Shared Utilities 참조:
     registry, deriveWorkBubbles, routes, HomeFallback, theme 토큰,
     test-setup. 에셋 렌더 주의사항은 git log의 phase 1 step 3 참조. -->

- step 1 (B4 핀): `src/scene/Home.test.tsx` — WebGL 명시 차단 환경에서
  홈 라우트가 폴백(배경 + 제목 + 등록부 전 작품 링크, 항목당 정확히 1개)
  을 렌더해야 한다는 계약. 의도적 red. `/`의 element를 새 씬 호스트 stub
  `src/scene/Home.tsx`로 교체 — stub은 B3(HOME_TESTID)와 스캐폴드 테스트
  (SITE_TITLE h1)만 만족하고 B4 의무는 미이행. 다음 스텝이 Home에
  WebGL 감지 + 씬/HomeFallback 분기를 구현하면 green이 된다.

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

- `src/theme.ts` — 토큰/상수 모듈. 현재 `SITE_TITLE`, `HOME_TESTID`,
  `BACKDROP_SRC`, 우주 무드 색상(`COLOR_SPACE_BG` 어두운 배경,
  `COLOR_NEBULA_PURPLE`, `COLOR_ACCENT_PINK`, `COLOR_ACCENT_CYAN`,
  `COLOR_TEXT`). `LONG_PRESS_MS`는 이후 스텝에서 추가한다.
- `HOME_TESTID` (`src/theme.ts`) — 테스트 심(B3): 홈 화면 루트 요소는
  `data-testid={HOME_TESTID}`를 가져야 한다. 라우팅 테스트가 "홈 렌더/
  홈으로 리다이렉트"를 이 아이디로 판별한다.
- `src/works/registry.ts` — 등록부 모듈, 작품 등록의 단일 진실.
  타입 `WorkEntry`/`WorkObject`(판별 유니온, v1 `ImageObject`) +
  `works: readonly WorkEntry[]`. 현재 항목: `vending-machine`.
  패턴: 작품 메타 텍스트(title/blurb/object src)는 작품 폴더의 Page
  파일에서 상수로 정의하고 등록부가 임포트한다 (리터럴 중복 방지,
  임포트 방향은 registry → Page 단방향).
- `src/scene/bubbles.ts` — 방울 목록 파생 모듈 (구현 완료).
  `deriveWorkBubbles(entries): WorkBubble[]` (`WorkBubble = { entry }`,
  등록부 순서 유지, 항목당 정확히 1개). 씬은 이 목록만 소비한다.
- `src/routes.tsx` — 라우팅 표면의 단일 진실 `routes: RouteObject[]`.
  App은 이 배열로 `createBrowserRouter`를 만들고, 테스트는 같은 배열로
  `createMemoryRouter`를 만든다. 라우트는 등록부(`works`)에서 파생 —
  등록부 항목 추가만으로 라우트가 늘어난다 (B1). 알 수 없는 경로는
  catch-all `<Navigate to="/" replace>`.
- `src/scene/Home.tsx` — 홈 씬 호스트 (default export). `/` 라우트의
  element. WebGL 씬 vs HomeFallback 폴백(B4)을 결정하는 자리 — 현재는
  stub(HOME_TESTID 루트 + SITE_TITLE h1만). WebGL 감지/분기는 다음
  스텝에서 구현. 홈 루트 testid 의무(B3)는 이 컴포넌트가 진다.
- `src/scene/HomeFallback.tsx` — 홈/폴백 화면 컴포넌트 (default export).
  배경 이미지 + `SITE_TITLE` h1 + 등록부 전 작품 텍스트 링크, 루트에
  `data-testid={HOME_TESTID}`. Phase 1에서는 `/`의 홈 화면이며, Phase 2
  는 홈 중앙을 WebGL 씬으로 교체하고 이 컴포넌트를 B4 폴백으로 재사용.
- `src/test-setup.ts` — vitest setupFiles (앱 코드 아님). jsdom의
  AbortController/AbortSignal을 Node 네이티브로 교체 — react-router 7
  데이터 라우터의 내비게이션(`new Request(url, { signal })`)이 jsdom
  렐름 시그널을 거부하는 문제 보정. 지우면 리다이렉트 테스트가 깨진다.

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
