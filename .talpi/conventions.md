# Conventions

## Prior work this phase (Phase 3)

<!-- phase 시작 시 리셋. Phase 1–2 산출물은 Shared Utilities 참조. -->

- step 1 (터치 입력, Req 4): `LONG_PRESS_MS = 250`을 `src/theme.ts`에
  (유일한 임계값 소스), 순수 판정 모듈 신규 `src/scene/touch.ts`
  (`decideTouchAction`: 뗄 때 경과시간 < 임계값 → 'tap', 이상 →
  'longpress-release'; `shouldSuppressClick`: 터치 유래 합성 click 억제 —
  pointerType 'touch'면 억제, 'mouse'/'pen'이면 절대 억제 안 함, 없으면
  `TOUCH_CLICK_SUPPRESS_MS`(constants.ts, 500ms) 시간창 폴백) + 경계
  테스트 `touch.test.ts` 9개. `BubbleField.tsx` Bubble에 터치 핸들러:
  touch pointerdown에서 LONG_PRESS_MS 타이머 → 도달 시 호버(정지+확대+
  오브제, 기존 hovered 상태 재사용), pointerup에서 판정 — 탭이면 데스크톱
  클릭과 공유하는 `startPop`(기존 handleClick 본문 추출), 길게 누르기
  해제면 un-hover만 (팝 절대 없음). pointerOver는 touch 무시(탭 호버
  번쩍임 방지), pointerOut/pointerCancel은 터치 취소(원복, 팝 없음).
  합성 click은 모듈 상태 `lastTouchEndAt` + shouldSuppressClick으로 전
  방울 공통 억제 (click이 뒤 방울에 떨어지는 경우 포함). 마우스는
  pointerType 분기로 기존 경로 무회귀. Home 캔버스 레이어에
  `touchAction: 'none'` (씬 레이어 한정 — 오버레이/링크 무관).
  25/25 green, 빌드/5173 liveness 확인.
- step 2 (마감 3종): (a) 홈 카피/타이포 — `src/theme.ts`에 카피 상수
  `SITE_TAGLINE`('고요한 우주를 떠도는 방울들', 홈 씬+폴백 공유)과
  `SCENE_HINT`('방울을 톡, 터뜨려 보세요', WebGL 씬 전용 — 폴백은 방울이
  없어 미표시). homeStyles에 `homeTaglineStyle`/`homeHeaderStyle` 추가,
  제목은 이중 성운 글로우 + letter-spacing 광학 보정(paddingLeft). 힌트는
  하단 중앙, 딜레이 페이드 인. h1 텍스트는 여전히 SITE_TITLE 그대로
  (App.test/Home.test 핀 유지). (b) 페이지 전환 — CSS-only: keyframes
  `page-enter`/`hint-enter` + `--page-enter-ms` 변수는 index.css
  (reduced-motion이면 0), 인라인 참조는 theme의 `PAGE_ENTER_ANIMATION`/
  `HINT_ENTER_ANIMATION` 상수로만. 홈 도착 페이드는 backdropStyle에,
  작품 페이지 도착 페이드는 WorkErrorBoundary의 정상 경로 프레임 div에.
  (c) 에러 바운더리 — 신규 `src/works/WorkErrorBoundary.tsx`(아래 Shared
  Utilities), routes.tsx에서 작품 라우트 element만 감싼다 (홈/씬 라우트는
  비포장 — B4 폴백 경로 불가침). 실패 문구 `WORK_ERROR_MESSAGE`
  ('이 방울은 잠시 쉬고 있어요.')와 홈 링크 라벨 `BACK_TO_HOME_LABEL`
  ('← 방울들에게로', 자판기 페이지와 공유)은 theme.ts 단일 소스.
  테스트 2개 추가(픽스처 라우트 크래시 → 문구+홈 링크, 정상 경로 투명).
  27/27 green, 빌드/5173 liveness 확인.
- smoke fix (favicon 404): `public/favicon.svg` 신규 — 손으로 쓴 작은
  SVG(핑크→시안 그라디언트 림의 비눗방울 원 + 흰 하이라이트 호, 보라빛
  반투명 채움, 투명 배경 — 우주 무드 셀프호스트). index.html `<head>`에
  `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` 추가로
  `/favicon.ico` 404 콘솔 에러 제거. 27/27 green, 빌드/4173에서
  favicon.svg 200 확인.

## (지난 phase 기록 — Phase 2)

<!-- phase 시작 시 리셋. Phase 1 산출물은 Shared Utilities 참조:
     registry, deriveWorkBubbles, routes, HomeFallback, theme 토큰,
     test-setup. 에셋 렌더 주의사항은 git log의 phase 1 step 3 참조. -->

- step 1 (B4 핀): `src/scene/Home.test.tsx` — WebGL 명시 차단 환경에서
  홈 라우트가 폴백(배경 + 제목 + 등록부 전 작품 링크, 항목당 정확히 1개)
  을 렌더해야 한다는 계약. 의도적 red. `/`의 element를 새 씬 호스트 stub
  `src/scene/Home.tsx`로 교체 — stub은 B3(HOME_TESTID)와 스캐폴드 테스트
  (SITE_TITLE h1)만 만족하고 B4 의무는 미이행. 다음 스텝이 Home에
  WebGL 감지 + 씬/HomeFallback 분기를 구현하면 green이 된다.
- step 2 (Home 실구현): `src/scene/Home.tsx` — 마운트 전
  `isWebGLAvailable()`(신규 `src/scene/webgl.ts`) 프로브로 분기.
  WebGL 불가 → `<HomeFallback />` (B4 green, jsdom은 항상 이 경로 —
  R3F Canvas는 테스트에서 절대 마운트 안 됨). 가능 → 씬 셸: backdrop
  CSS 배경 + 투명 R3F Canvas (앰비언트 + 핑크/시안 pointLight만, 방울
  필드는 다음 스텝) + 제목 h1 오버레이. Canvas onCreated에서
  `webglcontextlost` 리스너 등록 → 상태 전환으로 폴백 렌더 (수동 검수
  범위). 16/16 green.
- step 3 (방울 필드): `src/scene/BubbleField.tsx` — Canvas 자식으로 방울
  필드. 작품 방울은 `deriveWorkBubbles(works)`에서만 파생 (씬은 등록부
  직접 소비 금지, B1 conformance) — `WorkBubbleView`가 entry를 들고 있어
  다음 스텝(호버/클릭)이 slug/title/object.src를 쓴다. 장식 방울 12개.
  재질은 transmission 없는 커스텀 프레넬 림 ShaderMaterial (alpha 캔버스
  + CSS backdrop 조합에서 transmission이 검게 뜨는 문제 회피;
  `public/bubbles.glb` 미사용, 파일 유지). 모션: 위 드리프트 + sin 좌우
  흔들림 + z 스웨이 + 느린 자전, 깊이별 가시 경계 밖에서 y 랩(리스폰).
  x/y 배치는 뷰포트 비율 기반이라 리사이즈/모바일 대응. 매직 넘버는 전부
  `src/scene/constants.ts`. Home Canvas에 카메라 상수(CAMERA_Z/FOV) 명시.
  상호작용은 다음 스텝 몫 — 지금은 떠다니기만. 16/16 green.
- step 4 (데스크톱 호버): `src/scene/BubbleField.tsx` — 방울 mesh에 R3F
  onPointerOver/Out (over는 stopPropagation — 겹친 방울 중 앞의 것만).
  호버 = 정지 + `BUBBLE_HOVER_SCALE`(1.3) 확대, 작품 방울은 오브제
  (`entry.object.src`)가 방울 안 정면 평면에 페이드+스케일 인. 무텔레포트
  정지: 위치를 clock 절대시간이 아닌 방울별 로컬시간(delta×speed 누적)
  으로 계산, speed는 1↔0 지수 감쇠(`dampTo`, 프레임레이트 독립) — 감속
  정지·멈춘 자리 재가속. 쉬머(uTime)는 실제 시간이라 정지 중에도 흐름.
  오브제 텍스처는 마운트 시 비동기 TextureLoader(수동, Suspense/throw
  없음) — 실패 시 방울만 빈 채로 정상(백지 금지). 오브제 mesh는
  `raycast={() => null}`. 커서는 모듈 카운터 기반 pointer 토글 (drei
  배럴 임포트 회피 — jsdom 테스트 경로 경량 유지). 새 상수 8개는
  `constants.ts` "호버" 섹션. 클릭/모바일 길게 누르기는 다음 스텝.
  16/16 green.
- step 5 (데스크톱 클릭 터짐): `src/scene/BubbleField.tsx` — 클릭 시 방울
  서브트리를 `PopBurst`(Points 1드로, 표면에서 바깥으로 튀는 무지갯빛
  조각 28개, 중력+드래그+페이드/축소, 버퍼 마운트 1회 할당)로 교체 →
  터지는 동안 레이캐스트 대상 자체가 없어 더블 팝/호버 불가. Bubble은
  idle→burst→gone 3단계, 클릭 시 stopPropagation(앞 방울만) + 호버/커서
  해제, 터진 순간의 위치·호버 확대 크기 그대로 터짐. 작품 방울(Req 5):
  터짐 시작 `POP_NAVIGATE_DELAY_MS`(420ms, 파티클 수명 650ms보다 짧아
  페이드 중 전환) 뒤 `onWorkOpen(entry.slug)` — 라우터 훅은 DOM 쪽
  Home(`useNavigate`+`workPath`)에만 두고 씬에는 콜백 주입 (R3F 리컨실러
  안에서 라우터 컨텍스트 금지). 언마운트 시 예약 취소. 장식 방울(Req 6):
  터지기만, 소멸 후 `POP_RESPAWN_DELAY_MS`(2.6s) 뒤 gen 시드로 새 모션
  파라미터 + key 리마운트로 화면 아래에서 리스폰 (필드 안 비고, 같은
  자리 유령 재등장 없음). 새 상수 10개는 `constants.ts` "터짐" 섹션.
  16/16 green, 빌드/5173 liveness 확인.
- fix (verifier 지적): Home/HomeFallback이 verbatim 중복하던 배경·제목
  스타일을 신규 `src/scene/homeStyles.ts`(`backdropStyle`,
  `homeTitleStyle`)로 추출해 양쪽에서 spread. Home의 라이트 리그 수치
  (앰비언트 0.4, 포인트 위치/강도)와 BubbleField의 시드 스트라이드 소수
  (7919/104729/15485863)를 `constants.ts` 명명 상수로 이동. 값/행동 변화
  없음. 16/16 green.

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
  `COLOR_TEXT`), `LONG_PRESS_MS`(250 — 탭/길게 누르기 임계값의 유일한
  소스, 씬 코드에 ms 리터럴 인라인 금지), 홈 카피(`SITE_TAGLINE`,
  `SCENE_HINT`), 사용자 노출 실패 문구 `WORK_ERROR_MESSAGE`(한 톤 한 곳 —
  실패 문구는 여기만), 홈 링크 라벨 `BACK_TO_HOME_LABEL`, 전환 애니메이션
  축약값 `PAGE_ENTER_ANIMATION`/`HINT_ENTER_ANIMATION`(keyframes와 CSS
  변수 정의는 index.css, 인라인 style은 이 상수로만 참조).
- `src/scene/touch.ts` — 터치 판정 순수 모듈 (타이머/이벤트 없음, 유닛
  테스트 대상). `decideTouchAction(elapsedMs)`: 'tap' | 'longpress-release'
  (임계값은 LONG_PRESS_MS 하나). `shouldSuppressClick(pointerType,
  msSinceTouchEnd)`: 터치 유래 합성 click 억제 판정 — 'touch' 억제,
  'mouse'/'pen' 절대 비억제, 미상이면 TOUCH_CLICK_SUPPRESS_MS 시간창.
  터치 관련 판정 로직은 여기 두고 컴포넌트에는 배선만 남긴다.
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
  element. 마운트 전 `isWebGLAvailable()` 프로브로 WebGL 씬(backdrop
  CSS 배경 + 투명 R3F Canvas + 제목 오버레이) vs `<HomeFallback />`
  (B4)을 분기하고, `webglcontextlost` 시 폴백으로 전환한다. 홈 루트
  testid 의무(B3)는 양쪽 경로 모두 이 컴포넌트 계층이 진다. 방울 필드/
  상호작용은 Canvas 자식으로 추가한다 (다음 스텝들).
- `src/scene/webgl.ts` — `isWebGLAvailable(): boolean`. 프로브 캔버스로
  webgl2 → webgl 순서 시도, null/예외 → false. R3F Canvas 마운트 *전*
  게이트로 사용 — jsdom(WebGL 없음)에서 three.js가 컨텍스트를 잡으려다
  죽는 일을 막는다. WebGL 필요 컴포넌트는 이 프로브를 재사용할 것.
- `src/scene/constants.ts` — 방울 씬 상수 모듈 (카메라 z/fov, 라이트 리그
  `AMBIENT_LIGHT_INTENSITY`/`POINT_LIGHT_INTENSITY`/
  `POINT_LIGHT_PINK_POSITION`/`POINT_LIGHT_CYAN_POSITION`, 방울 개수/
  크기/배치/모션 파라미터, 림 셰이더 강도, 레이아웃 시드 + 시드 스트라이드
  소수 `SEED_STRIDE_INDEX`/`SEED_OFFSET_DECORATIVE`/
  `SEED_STRIDE_RESPAWN_GEN`, 터치 click 억제 시간창
  `TOUCH_CLICK_SUPPRESS_MS`). 씬 매직 넘버는 전부 여기 — 씬 코드 인라인
  금지. 색상과 LONG_PRESS_MS는 여기 두지 않는다 (`src/theme.ts` 몫).
- `src/scene/homeStyles.ts` — Home/HomeFallback 공유 스타일 조각.
  `backdropStyle`(풀뷰포트 우주 배경: 100dvh + BACKDROP_SRC cover/center
  + COLOR_SPACE_BG/COLOR_TEXT + 홈 도착 page-enter 페이드),
  `homeTitleStyle`(제목 h1 타이포 + 이중 성운 글로우 + letter-spacing
  광학 보정), `homeTaglineStyle`(SITE_TAGLINE 한 줄), `homeHeaderStyle`
  (제목+태그라인 세로 묶음). 두 컴포넌트는 spread 후 레이아웃 차이만
  덧붙인다 — 이 스타일을 다시 인라인 복제하지 말 것.
- `src/works/WorkErrorBoundary.tsx` — 작품 페이지 전용 에러 바운더리 +
  도착 연출 프레임 (default export, 클래스 컴포넌트). routes.tsx가
  `/works/<slug>` 라우트의 element만 이걸로 감싼다 — 홈/씬 라우트는 절대
  감싸지 않는다 (씬 오류는 B4 폴백 몫, 여기로 흡수 금지). 정상 경로:
  자식을 `PAGE_ENTER_ANIMATION` 페이드 div로 감쌈 (작품 페이지가 전환
  연출을 개별 구현할 필요 없음). 크래시: `WORK_ERROR_MESSAGE` +
  `BACK_TO_HOME_LABEL` 홈 링크의 최소 화면. 라우트 이탈 시 언마운트로
  crashed 상태 자동 리셋.
- `src/scene/BubbleField.tsx` — 방울 필드 (default export, Canvas 자식
  전용 — DOM 아님). 작품 방울(`WorkBubbleView`, entry 보유) + 장식 방울
  (`DecorativeBubble`) + 공용 `Bubble`(모션 useFrame + 프레넬 림
  ShaderMaterial + group/mesh 분리 — 자전은 mesh만, group은 오브제
  자식용으로 무회전). 방울별 모션 파라미터는 mulberry32 시드 랜덤으로
  마운트 시 1회 생성. 호버 상태는 `Bubble` 내부(useState) — 자식은
  `children?: (hovered: boolean) => ReactNode` 함수로 받아 오브제
  (`BubbleObjet`)가 호버를 구동받는다. 파일 내 공용: `dampTo`(지수 감쇠
  스무딩), `useHoverCursor`(카운터 기반 pointer 커서), `useObjetTexture`
  (비동기 텍스처, 실패 조용), `PopBurst`(일회성 파티클 버스트 — 원점
  기준 구면 버스트, center/radius/onDone만 받아 재사용 가능). 클릭 터짐은
  구현 완료: Bubble이 idle→burst→gone 단계 + `onPop`/`onPopFinished`
  콜백, 루트 `BubbleField`는 `onWorkOpen?: (slug) => void` prop (Home이
  주입 — 씬 안에서 라우터 훅 사용 금지). 터치(Req 4)도 구현 완료:
  Bubble의 touch pointerdown → LONG_PRESS_MS 타이머로 호버 전환,
  pointerup에서 `decideTouchAction` — 탭은 `startPop`(마우스 클릭과 공유
  경로), 길게 누르기 해제는 un-hover만. 합성 click은 `lastTouchEndAt`
  모듈 상태 + `shouldSuppressClick`으로 억제. 판정 로직은 touch.ts,
  이 파일에는 배선만.
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
