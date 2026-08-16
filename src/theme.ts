// Design tokens & shared constants (single source — no inline duplicates).
// Scene colors, LONG_PRESS_MS, etc. get added here by later build steps.

export const SITE_TITLE = 'practice-3d'

// 홈 카피 (한국어, 조용한 우주 무드). 태그라인은 홈 씬과 폴백이 공유,
// 힌트는 방울이 실제로 뜨는 WebGL 씬에서만 보인다 (폴백은 텍스트 링크라
// "터뜨려 보세요"가 성립하지 않음).
export const SITE_TAGLINE = '고요한 우주를 떠도는 방울들'
export const SCENE_HINT = '방울을 톡, 터뜨려 보세요'

// 사용자 노출 실패 문구 — 한 가지 톤, 한 곳 (conventions Failure Behavior).
// 작품 페이지 크래시 시 에러 바운더리(WorkErrorBoundary)가 보여준다.
export const WORK_ERROR_MESSAGE = '이 방울은 잠시 쉬고 있어요.'

// 작품 페이지 → 홈 링크의 공통 라벨 (작품 페이지와 에러 바운더리가 공유).
export const BACK_TO_HOME_LABEL = '← 방울들에게로'

// 페이지 전환 연출 — CSS keyframes는 index.css에 정의(page-enter,
// hint-enter), 여기 상수는 인라인 style의 animation 축약값 단일 소스.
// 지속시간은 CSS 변수(--page-enter-ms 등)로 index.css에 있고
// prefers-reduced-motion이면 0으로 떨어진다.
export const PAGE_ENTER_ANIMATION =
  'page-enter var(--page-enter-ms, 560ms) ease-out both'
export const HINT_ENTER_ANIMATION =
  'hint-enter 2.4s ease-out var(--hint-enter-delay, 1.6s) both'

// Test seam (B3): 홈 화면의 루트 요소는 data-testid={HOME_TESTID}를 가진다.
// 라우팅 계약 테스트가 "홈이 렌더되었다"를 이 아이디로 판별한다.
export const HOME_TESTID = 'home'

// 배경 이미지 (B2: public/backdrop.webp 한 장). 홈/폴백과 Phase 2 씬이 공유.
export const BACKDROP_SRC = '/backdrop.webp'

// 탭/길게 누르기 시간 임계값 (Requirement 4). 이 상수가 유일한 임계값
// 소스다 — 씬 코드에 ms 리터럴 인라인 금지. 판정은 decideTouchAction
// (src/scene/touch.ts): 누른 시간 < LONG_PRESS_MS → 탭, 이상 → 길게 누르기.
export const LONG_PRESS_MS = 250

// 우주 무드 색상 토큰 — 어두운 배경 + 보라 성운 + 핑크/시안 광원.
// (conventions.md Design Tokens에 등록됨. 인라인 중복 금지.)
export const COLOR_SPACE_BG = '#0b0714'
export const COLOR_NEBULA_PURPLE = '#8b5cf6'
export const COLOR_ACCENT_PINK = '#ff8ad4'
export const COLOR_ACCENT_CYAN = '#8ae2ff'
export const COLOR_TEXT = '#f2eefb'
