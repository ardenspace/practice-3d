# Codemap

빌드 중 만들어진 공유 모듈의 실물 목록. 정책은 `.talpi/conventions.md` 에
있다. 아래 항목은 이전 런(비눗방울 오브제 포트폴리오 v1)이 남긴 것들이며,
이번 런의 산출물은 각 스텝에서 여기 덧붙인다.

## 토큰과 문구

- `src/theme.ts` — 토큰·문구 모듈. `SITE_TITLE`, `SITE_TAGLINE`,
  `SCENE_HINT`, `HOME_TESTID`, `BACKDROP_SRC`, 우주 무드 색상
  (`COLOR_SPACE_BG`, `COLOR_NEBULA_PURPLE`, `COLOR_ACCENT_PINK`,
  `COLOR_ACCENT_CYAN`, `COLOR_TEXT`), `LONG_PRESS_MS`(250 — 탭/길게
  누르기 임계값의 유일한 소스), `WORK_ERROR_MESSAGE`(사용자 노출 실패
  문구는 여기만), `WORKS_EMPTY_MESSAGE`(등록부가 비었을 때 목록이 보이는
  문구, phase 1 에서 추가), `WORKS_LIST_LABEL`, `WORKS_TESTID`(`'works'` —
  목록 화면의 자기 표식이자 라우팅 테스트가 `/` 와 `/works` 를 가르는 심),
  `workObjectAlt(title, blurb)`(오브제 이미지 설명을 등록부 값에서 파생.
  문자열만 받아 토큰 모듈이 등록부를 임포트하지 않는다), 슬라이드·카드 색상
  (`COLOR_SLIDE_SURFACE/EDGE/SHADOW`, `COLOR_CARD_SURFACE/EDGE`),
  `SLIDE_ENTER_ANIMATION`, `WORKS_OPEN_LABEL`('작품 목록 열기' — 아이콘의
  접근 가능한 이름), `WORKS_DISMISS_TESTID`, 층 순서 토큰 `Z_ABOVE_SCENE`·
  `Z_SLIDE` — 이상 phase 1 에서 추가.
  `BACK_TO_HOME_LABEL`, 전환 애니메이션 축약값
  `PAGE_ENTER_ANIMATION`/`HINT_ENTER_ANIMATION`(keyframes 와 CSS 변수
  정의는 `src/index.css`, 인라인 style 은 이 상수로만 참조).
- `src/scene/constants.ts` — 방울 씬 상수 모듈. 카메라 z/fov, 라이트 리그,
  방울 개수·크기·배치·모션 파라미터, 림 셰이더 강도, 레이아웃 시드와 시드
  스트라이드 소수, `TOUCH_CLICK_SUPPRESS_MS`, 모션 축소 상수
  (`REDUCED_MOTION_TIME_SCALE`, `REDUCED_MOTION_DAMP`),
  `BUBBLE_MODEL_SRC`. 씬 매직 넘버는 전부 여기. 색상과 `LONG_PRESS_MS` 는
  여기 두지 않는다(`src/theme.ts` 몫).

## 순수 판정 모듈 (화면 없음, 유닛 테스트 대상)

- `src/scene/touch.ts` — 터치 판정. `decideTouchAction(elapsedMs)` 는
  'tap' | 'longpress-release', `shouldSuppressClick(pointerType,
  msSinceTouchEnd)` 는 터치 유래 합성 click 억제 판정. 타이머와 이벤트는
  두지 않는다.
- `src/scene/bubbles.ts` — `deriveWorkBubbles(entries)`. 등록부 순서를
  유지하며 항목당 방울 하나를 만든다. 씬은 이 목록만 소비한다.
- `src/scene/reducedMotion.ts` — `prefersReducedMotion()`. matchMedia
  'change' 리스너로 값을 캐시해 프레임마다 불러도 공짜이고 라이브로
  갱신된다. matchMedia 가 없거나 던지면 항상 false 이며 절대 던지지 않는다.
  `createReducedMotionSource(host?)` 는 테스트용 주입 팩토리. JS 프레임 루프
  모션은 반드시 이 헬퍼로 분기한다.
- `src/works/listClose.ts` — `decideListClose(locationKey)`. 목록을 닫을 때
  히스토리를 어떻게 다룰지 정하는 순수 규칙으로, `'back'` 또는
  `'replace-home'` 을 돌려준다(phase 1 스텝 4). 현재 항목이 방문의 첫
  항목(`location.key === 'default'`)이면 되감을 것이 없으므로 `/` 로
  갈아치고, 아니면 아이콘이 밀어 넣은 항목 하나를 되감는다. DOM 도 라우터도
  모른다. 목록을 닫는 길이 하나 더 생기면(페이즈 3 의 Esc) 판정을 다시
  내리지 말고 이 모듈을 거친다.
- `src/scene/webgl.ts` — `isWebGLAvailable()`. 프로브 캔버스로 webgl2 →
  webgl 순서로 시도하고 null/예외면 false. R3F Canvas 마운트 **전** 게이트로
  쓴다. jsdom 에서 three.js 가 컨텍스트를 잡으려다 죽는 일을 막는다.

## 등록부와 라우팅

- `src/works/registry.ts` — 작품 등록의 단일 진실. `WorkEntry`,
  `WorkObject`(판별 유니온, v1 은 `ImageObject`), `works`, `workPath(slug)`,
  `WORKS_PATH`(`'/works'` — 경로 리터럴의 단일 소스, phase 1 스텝 3 에서 추가.
  `workPath()` 가 여기서 파생된다). 현재 항목은 `vending-machine` 하나. 작품 메타 텍스트는 작품 폴더의 Page
  파일에서 상수로 정의하고 등록부가 가져간다(임포트 방향 단방향).
- `src/routes.tsx` — 라우팅 표면의 단일 진실 `routes: RouteObject[]`. App 은
  이 배열로 `createBrowserRouter` 를, 테스트는 같은 배열로
  `createMemoryRouter` 를 만든다. 작품 라우트는 등록부에서 파생된다. 알 수
  없는 경로는 catch-all 로 `/` 에 보낸다. phase 1 스텝 3 에서 `/works` 가
  `/` 의 **자식 라우트**로 들어갔다. 형제로 두면 `/` ↔ `/works` 이동마다
  Canvas 가 언마운트·재마운트되므로 자식으로 두어 같은 `Home` 인스턴스를
  유지한다(Requirement 32). 라우트 요소는 `<WorksList variant="fullscreen" />`
  하나다.
- `src/works/WorkErrorBoundary.tsx` — 작품 페이지 전용 에러 바운더리 +
  도착 연출 프레임. `routes.tsx` 가 `/works/<slug>` 라우트만 감싼다. 홈 라우트는
  감싸지 않는다(씬 오류는 폴백 경로 몫이며 여기로 흡수하면 안 된다).

## 화면

- `src/scene/Home.tsx` — 홈 씬 호스트이자 `/` 와 `/works` 가 공유하는 셸
  (phase 1 스텝 3 에서 셸이 되었다). `isWebGLAvailable()` 프로브로 씬과
  폴백을 분기하고 `webglcontextlost` 에 반응한다. 목록이 열렸는지는 주소를
  다시 비교하지 않고 `useOutlet()` 의 자식 매치 여부로 안다. 씬이 뜨는
  경우 열렸으면 `<WorksList variant="slide" />`, 닫혔으면 힌트와 아이콘을
  그린다. 씬 불가인 경우 `/works` 면 자식 라우트의 전체 화면 목록, `/` 면
  기존 `HomeFallback`. **이번 라운드에서 그 `/` 폴백 분기가 `/works` 이동으로
  바뀐다(페이즈 2).** phase 1 스텝 4 에서 목록이 열려 있는 동안 캔버스 층에
  `inert` + `aria-hidden` + `pointerEvents: 'none'` 을 건다. `<Canvas>` 자체는
  언마운트하지 않으므로 방울은 뒤에서 계속 떠다니되 닿을 수 없다. 바깥
  클릭으로 닫을 때는 `decideListClose` 의 판정을 따르고, 자기가 닫은
  경우에만 초점을 아이콘으로 돌려보낸다(뒤로가기나 주소창으로 닫힌 경우에는
  초점을 건드리지 않는다).
- `src/scene/HomeFallback.tsx` — 현재의 씬 폴백 화면. 배경 + 제목 + 등록부
  전 작품 텍스트 링크. **이번 라운드에서 작품 링크 목록이 빠진다.**
- `src/scene/BubbleField.tsx` — 방울 필드(Canvas 자식 전용). 작품 방울과
  장식 방울, 공용 `Bubble`(모션 useFrame + 프레넬 림 ShaderMaterial),
  호버 상태, 팝 단계(idle→burst→gone), 터치 배선. 파일 안 공용으로
  `dampTo`, `useHoverCursor`, `useObjetTexture`, `useBubbleGeometry`,
  `PopBurst`. 판정 로직은 `touch.ts` 에 있고 여기엔 배선만 둔다.
- `src/siteStyles.ts` — 홈과 목록이 공유하는 스타일 조각. `backdropStyle`,
  `siteTitleStyle`, `siteTaglineStyle`, `siteHeaderStyle`. phase 1 스텝 2 에서
  `src/scene/homeStyles.ts` 를 대체하며 `src/` 바로 아래로 옮겼다. 씬이
  목록을 임포트하게 되므로 공유 조각이 `scene/` 에 남으면 `works/ → scene/`
  역임포트가 생긴다. 다시 인라인 복제하지 않는다.

## 작품 목록 표면 (이번 런)

- `src/works/WorksList.tsx` — 온 사이트에서 작품 목록을 그리는 유일한 모듈
  (phase 1). 표현 분기를 `variant: 'slide' | 'fullscreen'` prop 으로 바깥에서
  받고, 등록부를 `entries?: readonly WorkEntry[]` 로 주입받으며 기본값은
  `works` 다. 씬을 마운트하지 않고 두 모습을 각각 렌더할 수 있다. 항목
  하나는 카드이고 카드 전체를 `/works/<slug>` 로 가는 react-router `Link` 가
  감싼다. 이미지 로드가 실패하면 카드별 상태로 `<img>` 를 접고 오브제 자리
  틀은 남긴다. `fullscreen` 은 `<main>` 에 제목·태그라인을 이고, `slide` 는
  이름 붙은 `<section>` 으로 목록만 그린다(phase 1 스텝 2 에서 구현).
  phase 1 스텝 4 에서 `slide` 가 패널 아래에 투명한 전체 화면 dismiss 면을
  깔고 바깥 클릭을 `onDismiss` prop 으로 올려보낸다. `fullscreen` 은
  `onDismiss` 를 받아도 그 면을 그리지 않는다 — Requirement 22 를 조건문이
  아니라 구조로 지킨다. 슬라이드 스크롤에는 `overscrollBehavior: 'contain'`
  이 걸려 있어 뒤 페이지로 스크롤이 번지지 않는다.
- `src/works/WorksOpenIcon.tsx` — 씬 홈 오른쪽 위에서 목록을 여는 아이콘
  (phase 1 스텝 3). 진짜 `<a href="/works">` 라 활성화하면 히스토리가 하나
  늘고 뒤로가기로 닫힌다. 그림은 방울 세 개 SVG, 이름은 `WORKS_OPEN_LABEL`.
  R3F 에 닿지 않아 라우터 컨텍스트만 있으면 씬 없이 렌더하고 클릭할 수
  있다. phase 1 스텝 4 에서 `<a>` 로 전달되는 `ref` 를 받아, 목록을 닫은 뒤
  초점이 돌아올 자리가 되었다. 아이콘이 존재하는 상태를 jsdom 이 만들 수 없으므로 여는 동작의
  확인은 이 모듈을 단독으로 렌더하는 seam 을 쓴다.
- `src/index.css` — 전역 CSS. 기존 `page-enter`/`hint-enter` 에 더해 phase 1
  스텝 2 가 `slide-enter` keyframes 와 `--slide-enter-ms`(320ms)를 넣었다.
  `prefers-reduced-motion` 에서 0ms 로 접힌다. CSS 모션은 여기 `@media` 가
  맡고 `src/scene/reducedMotion.ts` 는 R3F 프레임 루프 모션 몫이다.
- `src/works/WorksList.test.tsx` — B5 계약 테스트 10 개 (phase 1). 항목 수·
  순서, 등록부 파생(제목·소개·이미지 경로·링크 주소), 이미지 실패 시 텍스트
  유지, 빈 등록부 문구, 슬라이드·전체 화면의 제목·태그라인 유무를 핀한다.
  항목 하나는 `role="listitem"` 으로 센다. phase 1 검증자 지적으로 항목
  수·순서 핀이 세 항목짜리 `entries` 주입 위에서 돌도록 강화되었다(등록부에
  작품이 하나뿐이라 기존 핀이 공회전했다).
- `src/works/listClose.test.ts` — `decideListClose` 회귀 테스트(phase 1
  검증자 지적). 바깥 클릭으로 닫을 때의 판정 두 갈래와, 그 판정이 기대는
  react-router 내부 사실(첫 항목의 `location.key` 가 `'default'` 라는 것)을
  함께 핀한다. 그 사실이 드리프트하면 `navigate(-1)` 이 방문자를 사이트 밖으로
  밀어내므로 조용히 깨지면 안 된다.
- `src/routes.test.tsx` — 라우팅 회귀 테스트. phase 1 검증자 지적으로
  `/works` 가 목록 표면에 닿는다는 것과 `/` 가 그렇지 않다는 것을
  `WORKS_TESTID` 로 핀했다. 자식 경로가 어긋나면 catch-all 로 조용히 새어
  홈이 뜨는 것을 잡는다.

## 테스트 기반

- `src/test-setup.ts` — vitest setupFiles. jsdom 의
  AbortController/AbortSignal 을 Node 네이티브로 교체한다. react-router 7
  데이터 라우터의 내비게이션이 jsdom 렐름 시그널을 거부하는 문제를 보정하며,
  지우면 리다이렉트 테스트가 깨진다.
- `HOME_TESTID` — 홈 화면 루트 요소의 테스트 심. **이번 라운드에서 목록
  화면이 자기 표식을 따로 갖게 되므로, 라우팅 테스트가 `/` 와 `/works` 를
  구별할 수 있어야 한다(스펙 B3).**
