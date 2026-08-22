# Code Map

이번 런이 만들거나 고친 파일만 담는다. 이전 런이 남긴 코드는 이 지도에 없으니
저장소에서 직접 읽는다. 정책은 `.talpi/conventions.md` 에 있다.

path: src/keys/keyNav.ts
is: 키 해석 계층. `keyIntent(key)`, `activeItemList(surface)`, `interceptsKey(surface, key)`, `moveCursor(current, count, direction)`, `ownsChord(modifiers)`. `ownsChord` 는 "이 조합이 우리 것인가"의 유일한 답으로, phase 3 검증자 지적으로 세 훅에 복사되어 있던 판정을 여기로 모았다. Shift 는 일부러 빼는데, 역방향 탭이 정상 조작이고 여기 넣으면 슬라이드의 탭 고리가 한 방향만 돌게 되기 때문이다. 방울·3D·씬을 모르고 항목 개수와 현재 위치만 안다(B2, Requirement 47). 씬 폴더 밖에 있는 것이 규약이다. 상태를 전혀 들지 않는다. 초점이 없을 때 방향키가 들어가는 자리는 인덱스 0 이고, 스페이스는 뜻이 없되(`keyIntent(' ')` 은 `null`) `interceptsKey` 는 참이라 홈과 목록에서 삼켜진다. Enter·Escape 는 가로채지 않는다 — 배선은 "가로챌지"를 `interceptsKey` 로, "무엇을 할지"를 `keyIntent` 로 따로 물어야 한다.
phase: 3

path: src/keys/useSceneKeyNav.ts
is: 씬이 뜬 홈의 키 배선. `keyNav` 의 판정을 `window` keydown 하나에 잇는다. 판정은 전부 `keyNav` 가 하고 여기는 상태를 읽고 바꿔 줄 뿐이다. 리스너를 창에 다는 근거는 Ledger 의 "홈에서 방향키를 페이지 전체에서 가로챈다"이다. `keyNav` 가 모르는 이벤트 타깃 판별(`usesKeysItself`)이 여기 있다. `focusedByKeyboard(element)`(브라우저의 `:focus-visible` 판정)도 함께 export 한다.
phase: 3

path: src/keys/useListKeyNav.ts
is: 열린 목록의 키 배선. `keyNav` 의 판정을 window keydown 에 잇는다. **목록은 커서 상태를 들지 않는다** — 항목이 전부 진짜 링크라 DOM 초점이 곧 커서이고, 키를 누를 때마다 `document.activeElement` 에서 현재 자리를 읽는다. 그래서 탭이나 마우스로 간 자리에서 방향키가 이어지고 드리프트할 상태가 없다. 따라 스크롤은 `preventScroll` 없이 `focus()` 를 불러 브라우저에 맡긴다. 엔터는 일부러 다루지 않는다 — 항목이 진짜 링크라 기본 활성화가 곧 옳은 동작이고 여기서 다루면 그것이 이중 발동이다. `trapTab` 은 `exit` 가 있을 때만 참이라, 나가는 길 없는 탭 고리를 만들 수 없다. 작품·등록부·slug 를 모르고 항목 선택자를 호출자에게서 받는다.
phase: 3

path: src/keys/useWorkExitKeyNav.ts
is: 작품 표면의 키 배선. `useSceneKeyNav`·`useListKeyNav` 와 짝을 이루는 세 번째 자리다. **`preventDefault` 가 하나도 없다** — 작품 페이지의 방향키·스페이스는 브라우저 기본 동작이어야 한다(Requirement 6). 키 표면이 하나 더 생기면 이 결을 따른다.
phase: 3

path: src/works/WorkExit.tsx
is: 작품 페이지에서 나오는 길. 화면을 그리지 않고 자식을 그대로 내보내며 배선만 얹는다. `routes.tsx` 의 `works.map(...)` 안에서 쓰이므로 Esc 가 **등록부 파생 라우팅에 딸려 붙는다**(Requirement 42) — 작품 페이지 파일에는 Esc 코드가 없다. 에러 바운더리 바깥에 있어 페이지가 크래시한 최소 화면에서도 Esc 가 산다.
phase: 3

path: src/works/returnFocus.ts
is: 나온 뒤 초점이 갈 작품 한 건짜리 넘김 상자. `requestWorkFocus` / `takeWorkFocus`. **모듈 변수 하나뿐이라 페이지가 다시 로드되면 반드시 비어 있다** — 새로고침한 방문자에게 들어온 자리가 없다는 요구(41)가 여기서 나온다. 세션 저장소도 `location.state` 도 쓰지 않는다(히스토리 state 는 새로고침을 넘겨 살아남아 그 요구를 조용히 깬다). 한 번 꺼내면 비므로 두 번 적용되지 않는다.
phase: 3

path: src/keys/useKeyboardInUse.ts
is: "이 방문자가 키보드를 쓰기 시작했는가"를 재는 한 방향 latch(phase 4). 기준은 탭 또는 이 계층이 뜻을 아는 키(방향키·엔터·Esc)의 keydown 한 번이며, 판정 자체는 `keyNav.beginsKeyboardUse(key)` 가 든다. 마우스만 쓰는 방문자에게는 keydown 이 오지 않아 한 번도 참이 되지 않는다. 참이 되면 리스너가 떨어진다. 되돌리지 않는 이유는 두 기기를 번갈아 쓰는 사람에게 안내가 깜빡이는 편이 더 나쁘기 때문이다. 키보드 전용 안내가 다른 화면에도 생기면 이 훅을 재사용한다.
phase: 4

path: src/keys/useLayerKeyDown.ts
is: 세 키 배선 훅이 공유하는 window keydown 층(phase 3 검증자 지적으로 추출). 한 번만 붙이고, `latest` ref 로 렌더마다 새 핸들러를 만들어도 다시 구독하지 않으며, `active` 게이트를 받고, 위임 전에 `ownsChord` 를 적용한다. 타이머는 없고 판정은 `keyNav` 몫이라 여기는 배선만 든다.
phase: 3

path: src/spokenSurface.ts
is: 낭독 표면 프로브(테스트 전용, 앱이 임포트하지 않고 `*.test.ts` 가 아니라 러너가 수집하지도 않는다). B6 의 수단이 위임 구역이므로 표준 수단을 하나도 고르지 않고 전부 받아들인다 — 이름은 `aria-label`/`aria-labelledby`, 설명은 `aria-description`/`aria-describedby`/`title`, 알림은 `role=status|alert|log`/`aria-live` 어느 쪽이든 같은 값으로 읽는다. 두 접근성 테스트 파일이 나눠 쓴다.
phase: 4

path: src/scene/sceneAccessibility.test.tsx
is: 씬 셸이 떠 있어야 확인할 수 있는 B6 ①②③⑤ 계약 테스트 8 개. sceneShell 기법(`./webgl.ts` + R3F `Canvas` 스텁)에 더해 **등록부 모듈까지 갈아 끼운다** — 진짜 등록부에 작품이 하나뿐이라 "순서"와 "초점 자리의 이름"이 항상 참이 되고, 씬은 `entries` 같은 주입 자리를 가지면 안 되기 때문이다(B1). 씬 정거장을 DOM 모양이 아니라 **방향키가 데려가는 자리**로 집으므로 정거장이 어떤 요소인지 바뀌어도 그대로다.
phase: 4

path: src/works/worksAccessibility.test.tsx
is: 씬 없이 확인되는 B6 ④⑥ 계약 테스트 5 개. 오브제 이미지 설명이 제목과 소개를 둘 다 담는지, 안내 문구가 알려지는지, 빈 등록부 문구가 낭독 표면에 존재하는지 본다.
phase: 4

path: src/scene/sceneShell.test.tsx
is: 씬 셸 계약 테스트 9 개(phase 3 검증자 지적). `./webgl.ts` 와 R3F `Canvas` 를 스텁해 씬 **셸**만 띄운 뒤 B3 히스토리 표 ③행(Esc·바깥 클릭으로 닫기가 히스토리를 늘리지 않는다), Requirement 20(Esc 뒤 초점이 아이콘으로), Requirement 11·12 의 DOM 모양(탭 정거장이 정확히 둘, 정거장 안에 탭 가능한 자손이 없음, 아이콘이 정거장 뒤)을 핀한다. `getContext` 는 속이지 않는다. 방울 생김새·초점 고리·진짜 탭 키 동작은 이 파일이 말하지 못하며 브라우저 스모크 몫이다. `vi.mock` 이 파일 단위라 별도 파일로 두었다.
phase: 3

path: src/keys/keyTargets.ts
is: 브라우저에 되묻는 두 헬퍼 `usesKeysItself`(input/textarea/select/button/contenteditable 판별)와 `focusedByKeyboard`(`:focus-visible` 판정). 씬과 목록이 같은 사본을 쓰도록 `useSceneKeyNav` 에서 빼냈다. 키 표면이 하나 더 생기면 여기서 임포트한다.
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
is: 온 사이트에서 작품 목록을 그리는 유일한 모듈. `variant: 'slide' | 'fullscreen'` 으로 표현을 받고 `entries` 로 등록부를 주입받아 씬 없이 렌더된다. 카드 링크에 `WORK_ITEM_ATTR`, 두 표면 루트에 `tabIndex={-1}`. slide 만 dismiss 면을 그린다. phase 3 에서 표면 ref 를 들고 `useListKeyNav` 를 한 번 부른다. Esc 와 바깥 클릭은 같은 `onDismiss` 로 나가므로 `decideListClose` 가 여전히 유일한 판정자다.
phase: 1 (2 에서 초점 표식, 3 에서 키 배선)

path: src/works/WorksList.test.tsx
is: B5 계약 테스트. 항목 수·순서, 등록부 파생, 이미지 실패 시 텍스트 유지, 빈 등록부 문구, 두 표면의 제목·태그라인 유무를 핀한다. 세 항목짜리 `entries` 주입 위에서 돈다.
phase: 1

path: src/works/WorksOpenIcon.tsx
is: 씬 홈 오른쪽 위에서 목록을 여는 아이콘. 진짜 `<a href="/works">` 라 히스토리가 늘고 뒤로가기로 닫힌다. `ref` 를 받아 목록을 닫은 뒤 초점이 돌아올 자리가 된다.
phase: 1

path: src/works/listClose.ts
is: 되감을 자리가 있는지 묻는 순수 규칙. phase 3 에서 묻는 자리가 둘이 되어 판정 근거를 `startedHere(locationKey)` 로 꺼냈고, `decideListClose` 는 그것을 부르는 얇은 껍데기가 되었다(계약은 그대로). DOM 도 라우터도 모른다. **되감을지 갈아칠지를 묻는 새 자리는 여기를 거친다.**
phase: 1 (3 에서 `startedHere` 추출)

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
is: 홈 씬 호스트이자 `/` 와 `/works` 가 공유하는 셸. 목록이 열렸는지는 `useOutlet()` 으로 안다. 열린 동안 캔버스 층에 `inert`+`aria-hidden`+`pointerEvents:none` 을 걸되 언마운트하지 않는다. 씬 불가·실행 중 상실은 `decideSceneFallback` 의 판정을 배선만 한다. 캔버스 층이 곧 씬의 초점 정거장이다(`tabIndex`, `outline:none`). 커서·정거장 초점 여부·엔터 요청 세 상태를 들고 `BubbleField` 에 내려보낸다. 탭 순서는 DOM 순서 그대로 씬 → 아이콘 → 페이지 밖이고 고리를 만들지 않는다. 빈 등록부에서는 정거장을 두지 않는다. phase 4 에서 보조기술 층을 함께 든다 — 정거장 안에 눈에 보이지 않는 `<ul>` 이 `deriveWorkBubbles(works)` 결과를 그대로 펴고(씬이 소비하는 그 파생 목록 하나를 두 번째 소비자가 딛으므로 개수·순서가 화면과 소리에서 따로 참이 될 수 없다), 정거장에 `role="group"` + 이름 + 조작법 설명이 붙고, 정거장 **밖** `<main>` 직속에 `role="status"` 알림 영역 하나가 세 갈래(목록 열림 / 씬 커서 자리 / 빈 문자열)를 말한다. 목록이 열리면 기존 `inert`+`aria-hidden` 이 이 층까지 덮으므로 뒤 씬이 읽히지 않고, 알림 영역만 밖에 있어 그 순간 "열렸다"를 말할 수 있다. phase 4 스텝 3 에서 씬 없는 갈래의 안내 띠 자체에 `role="alert"` 을 얹었다 — 눈에 보이는 그 요소가 곧 알림 영역이라 화면용·소리용 사본이 갈리지 않는다. 두 알림 영역은 갈래가 배타적이라 함께 그려지지 않으므로 화면에 알림 영역은 언제나 하나다. 강도가 갈리는 것도 의도다: 씬 쪽은 방문자 자기 조작의 중계라 polite, 폴백 안내는 요청하지 않은 화면 변화의 설명이라 assertive.
phase: prev-run (1·2 에서 개편, 3 에서 초점 정거장, 4 에서 보조기술 층)

path: src/scene/Home.test.tsx
is: B4 계약 테스트 10 개. 씬 불가 시 `/works` 갈아치기, 중간 화면 없음, `historyAction === REPLACE`, 안내 문구의 두 경우, 작품 링크가 목록 표면 안에만 있을 것을 핀한다. 실행 중 상실과 뒤늦은 복구는 jsdom 에서 핀하지 못했다.
phase: prev-run (2 에서 교체)

path: src/scene/BubbleField.tsx
is: 방울 필드(Canvas 자식 전용). 작품 방울과 장식 방울, 공용 `Bubble`, 호버 상태, 팝 단계, 터치 배선. phase 3 에서 `focusedIndex`·`popRequest`·`onPopHandled` 를 받는다. 정지·확대·오브제 공개는 `engaged = hovered || focused` 하나를 보고, 초점에만 붙는 고리는 `FocusRing` 이 그린다. 엔터의 터짐은 클릭·탭과 같은 문(`startPop`)으로 들어간다. 고리는 방울 group 의 자식이라 방울이 터지면 함께 사라진다.
phase: prev-run (3 에서 초점 배선)

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
is: 홈과 목록이 공유하는 스타일 조각. phase 4 에서 `visuallyHiddenStyle`(1px clip + clip-path — 눈에는 없고 낭독에는 남는 자리. `display:none`·`visibility:hidden` 은 보조기술에서도 사라지므로 쓰지 않는다)을 더했다. `src/scene/homeStyles.ts` 를 대체하며 `src/` 바로 아래로 옮겼다. `works/ → scene/` 역임포트를 막기 위한 위치이므로 다시 인라인 복제하지 않는다.
phase: prev-run (1 에서 이동)

path: src/scene/constants.ts
is: 방울 씬 상수 모듈. 카메라·라이트·방울 배치와 모션 파라미터 등 씬 매직 넘버가 전부 여기 있다. 색상과 `LONG_PRESS_MS` 는 여기 두지 않는다(`src/theme.ts` 몫). phase 3 이 초점 고리 값 `FOCUS_RING_*` 여섯 개를 더했다.
phase: prev-run (3 에서 추가)

path: src/index.css
is: 전역 CSS. phase 4 에서 `--hint-enter-ms` 와 `--keyboard-hint-enter-ms` 를 더했다 — `HINT_ENTER_ANIMATION` 의 지속시간이 `2.4s` 로 하드코딩되어 있어 모션 축소를 요청한 방문자에게도 힌트가 2.4 초에 걸쳐 페이드되고 있었고, 그것이 이 파일 주석의 약속과 어긋나 있었다. `page-enter`/`hint-enter` 에 더해 `slide-enter` keyframes 와 `--slide-enter-ms`(320ms). `prefers-reduced-motion` 에서 0ms 로 접힌다. CSS 모션은 여기, R3F 프레임 루프 모션은 `src/scene/reducedMotion.ts` 몫이다.
phase: prev-run (1 에서 추가)
