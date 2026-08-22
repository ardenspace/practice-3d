# Code Map

이번 런이 만들거나 고친 파일만 담는다. 이전 런이 남긴 코드는 이 지도에 없으니
저장소에서 직접 읽는다. 정책은 `.talpi/conventions.md` 에 있다.

path: src/keys/keyNav.ts
is: 키 해석 계층. `keyIntent(key)`, `activeItemList(surface)`, `interceptsKey(surface, key)`, `moveCursor(current, count, direction)`. 방울·3D·씬을 모르고 항목 개수와 현재 위치만 안다(B2, Requirement 47). 씬 폴더 밖에 있는 것이 규약이다. 상태를 전혀 들지 않는다. 초점이 없을 때 방향키가 들어가는 자리는 인덱스 0 이고, 스페이스는 뜻이 없되(`keyIntent(' ')` 은 `null`) `interceptsKey` 는 참이라 홈과 목록에서 삼켜진다. Enter·Escape 는 가로채지 않는다 — 배선은 "가로챌지"를 `interceptsKey` 로, "무엇을 할지"를 `keyIntent` 로 따로 물어야 한다.
phase: 3

path: src/keys/keyNav.test.ts
is: B2 가운데 화면 없이 정해지는 전부를 핀한다 — 키의 뜻, 활성 항목 목록, 가로채기 술어, 순회 순서와 순환. 렌더 한 줄 없다.
phase: 3

path: src/keys/keyboardSurfaces.test.tsx
is: B2 를 실제 화면(전체 화면 목록·작품 페이지) 위에서 확인한다. 씬 없는 세계에서 잡을 수 있는 것만 든다.
phase: 3

path: src/routeHistory.test.tsx
is: B3 히스토리 표 다섯 행과 작품 페이지 Esc 의 두 목적지 규칙(Requirement 40·41)을 핀한다. "들어온 자리"가 세션 저장소에 남지 않는다는 것도 함께 본다.
phase: 3

path: src/works/registryDerivation.test.tsx
is: B1 의 "등록부에 항목을 하나 더 넣으면 (a) 순회 (b) 목록 (c) 라우트 (d) Esc 가 따라온다" 네 갈래를 핀한다.
phase: 3

path: src/works/WorksList.tsx
is: 온 사이트에서 작품 목록을 그리는 유일한 모듈. `variant: 'slide' | 'fullscreen'` 으로 표현을 받고 `entries` 로 등록부를 주입받아 씬 없이 렌더된다. 카드 링크에 `WORK_ITEM_ATTR`, 두 표면 루트에 `tabIndex={-1}`. slide 만 dismiss 면을 그린다.
phase: 1 (2 에서 초점 표식 추가)

path: src/works/WorksList.test.tsx
is: B5 계약 테스트. 항목 수·순서, 등록부 파생, 이미지 실패 시 텍스트 유지, 빈 등록부 문구, 두 표면의 제목·태그라인 유무를 핀한다. 세 항목짜리 `entries` 주입 위에서 돈다.
phase: 1

path: src/works/WorksOpenIcon.tsx
is: 씬 홈 오른쪽 위에서 목록을 여는 아이콘. 진짜 `<a href="/works">` 라 히스토리가 늘고 뒤로가기로 닫힌다. `ref` 를 받아 목록을 닫은 뒤 초점이 돌아올 자리가 된다.
phase: 1

path: src/works/listClose.ts
is: `decideListClose(locationKey)` — 목록을 닫을 때 히스토리를 되감을지 `/` 로 갈아칠지 정하는 순수 규칙. DOM 도 라우터도 모른다. 목록을 닫는 길이 더 생기면(페이즈 3 의 Esc) 판정을 새로 내리지 말고 이 모듈을 거친다.
phase: 1

path: src/works/listClose.test.ts
is: `decideListClose` 회귀 테스트. 두 갈래와, 그 판정이 기대는 react-router 사실(첫 항목의 `location.key` 가 `'default'`)을 함께 핀한다.
phase: 1

path: src/scene/sceneFallback.ts
is: `decideSceneFallback({ sceneAvailable, sceneLost, listOpen, locationKey, redirectedHere })` → `{ showScene, redirect, notice }`. 씬을 그릴지, `/works` 로 갈아칠지, 안내 문구를 붙일지 세 판정이 모인 곳. `sceneLost` 가 `sceneAvailable` 을 이긴다. 표식 `REDIRECTED_HERE_STATE` 와 판독기 `wasRedirectedHere` 도 여기 있다.
phase: 2

path: src/scene/sceneFallback.test.ts
is: `decideSceneFallback` 회귀 테스트 13 개. 모든 갈래와, 복구를 무시한다는 약속을 화면 없이 핀한다.
phase: 2

path: src/works/worksFocus.ts
is: `focusWorksList({ slug?, doc? })` — 사라진 요소가 들고 있던 초점이 갈 곳을 정하는 유일한 자리. 지목 항목 → 첫 항목 → 목록 표면 순으로 물러난다. `planWorksFocusHandoff(shell, active)` 가 그 옵션 객체를 만든다. `slug` 인자는 페이즈 3 이 방울→항목 매핑을 얹을 자리다.
phase: 2

path: src/works/worksFocus.test.tsx
is: `worksFocus` 회귀 테스트 11 개. 진짜 `WorksList` 를 렌더하므로 표식이나 `tabIndex` 가 드리프트하면 여기서 깨진다.
phase: 2

path: src/ErrorBoundary.tsx
is: 공용 에러 바운더리. 무엇을 그릴지(`fallback`)와 누구에게 알릴지(`onError`)를 바깥에서 받는다. `WorkErrorBoundary` 에서 추출했다.
phase: 2

path: src/theme.ts
is: 토큰·문구 모듈. 사용자 노출 문구와 색상, 테스트 표식, 층 순서 토큰이 여기에만 있다. 이번 런이 `WORKS_*`, `SCENE_FALLBACK_NOTICE`, `WORK_ITEM_ATTR`, 슬라이드·카드 색상, `workObjectAlt()` 를 더했다.
phase: prev-run (1·2 에서 추가)

path: src/scene/Home.tsx
is: 홈 씬 호스트이자 `/` 와 `/works` 가 공유하는 셸. 목록이 열렸는지는 `useOutlet()` 으로 안다. 열린 동안 캔버스 층에 `inert`+`aria-hidden`+`pointerEvents:none` 을 걸되 언마운트하지 않는다. 씬 불가·실행 중 상실은 `decideSceneFallback` 의 판정을 배선만 한다.
phase: prev-run (1·2 에서 개편)

path: src/scene/Home.test.tsx
is: B4 계약 테스트 10 개. 씬 불가 시 `/works` 갈아치기, 중간 화면 없음, `historyAction === REPLACE`, 안내 문구의 두 경우, 작품 링크가 목록 표면 안에만 있을 것을 핀한다. 실행 중 상실과 뒤늦은 복구는 jsdom 에서 핀하지 못했다.
phase: prev-run (2 에서 교체)

path: src/routes.tsx
is: 라우팅 표면의 단일 진실 `routes: RouteObject[]`. 작품 라우트는 등록부에서 파생된다. `/works` 는 `/` 의 자식이라 이동해도 Canvas 가 재마운트되지 않는다. catch-all 은 `REDIRECTED_HERE_STATE` 를 실어 `/` 로 보낸다.
phase: prev-run (1·2 에서 수정)

path: src/routes.test.tsx
is: 라우팅 회귀 테스트. 판별 수단이 `HOME_TESTID` 가 아니라 `topRoutePath` 라, `/works` 가 자식 라우트여도 catch-all 이 새지 않는다는 것이 참으로 남는다.
phase: prev-run (1·2 에서 수정)

path: src/works/registry.ts
is: 작품 등록의 단일 진실. `WorkEntry`, `WorkObject`, `works`, `workPath(slug)`, `WORKS_PATH`. 작품 메타 텍스트는 작품 폴더의 Page 파일에서 가져온다(임포트 방향 단방향).
phase: prev-run (1 에서 `WORKS_PATH` 추가)

path: src/works/WorkErrorBoundary.tsx
is: 작품 페이지가 크래시했을 때 무엇을 대신 보여줄지 정하는 함수 컴포넌트 + 도착 연출 프레임. 바운더리 기계는 `src/ErrorBoundary.tsx` 몫이다. 홈 라우트는 감싸지 않는다.
phase: prev-run (2 에서 추출)

path: src/siteStyles.ts
is: 홈과 목록이 공유하는 스타일 조각. `src/scene/homeStyles.ts` 를 대체하며 `src/` 바로 아래로 옮겼다. `works/ → scene/` 역임포트를 막기 위한 위치이므로 다시 인라인 복제하지 않는다.
phase: prev-run (1 에서 이동)

path: src/index.css
is: 전역 CSS. `page-enter`/`hint-enter` 에 더해 `slide-enter` keyframes 와 `--slide-enter-ms`(320ms). `prefers-reduced-motion` 에서 0ms 로 접힌다. CSS 모션은 여기, R3F 프레임 루프 모션은 `src/scene/reducedMotion.ts` 몫이다.
phase: prev-run (1 에서 추가)
