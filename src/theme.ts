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

// 등록부가 비었을 때 작품 목록이 보여주는 문구 (B5). 실패가 아니라 상태이지만
// 사용자 노출 문구는 종류를 가리지 않고 이 토큰 모듈에 둔다.
export const WORKS_EMPTY_MESSAGE = '아직 떠오른 방울이 없어요.'

// 작품 목록 표면(B5)의 라벨 — 슬라이드와 전체 화면이 같은 이름을 쓴다.
export const WORKS_LIST_LABEL = '작품 목록'

/**
 * 목록 오브제 이미지의 대체 텍스트 (Requirement 27). 등록부의 제목과 한 줄
 * 소개에서 파생 — 등록부에 alt 필드를 새로 요구하지 않는다. 시그니처가
 * 문자열만 받는 이유는 토큰 모듈이 등록부(기능 모듈)를 임포트하지 않기
 * 위해서다.
 */
export function workObjectAlt(title: string, blurb: string): string {
  return `${title} — ${blurb}`
}

// 페이지 전환 연출 — CSS keyframes는 index.css에 정의(page-enter,
// hint-enter), 여기 상수는 인라인 style의 animation 축약값 단일 소스.
// 지속시간은 CSS 변수(--page-enter-ms 등)로 index.css에 있고
// prefers-reduced-motion이면 0으로 떨어진다.
export const PAGE_ENTER_ANIMATION =
  'page-enter var(--page-enter-ms, 560ms) ease-out both'
export const HINT_ENTER_ANIMATION =
  'hint-enter 2.4s ease-out var(--hint-enter-delay, 1.6s) both'

// 작품 목록 슬라이드가 씬 위로 열리는 움직임 (B5, 생김새는 위임 구역).
// keyframes(slide-enter)와 지속시간 변수(--slide-enter-ms)는 index.css에
// 있고 prefers-reduced-motion이면 0으로 떨어진다 — CSS 모션은 브라우저가
// 처리하고, JS 프레임 루프 모션만 scene/reducedMotion.ts를 거친다.
export const SLIDE_ENTER_ANIMATION =
  'slide-enter var(--slide-enter-ms, 320ms) ease-out both'

// Test seam (B3): 홈 화면의 루트 요소는 data-testid={HOME_TESTID}를 가진다.
// 라우팅 계약 테스트가 "홈이 렌더되었다"를 이 아이디로 판별한다.
export const HOME_TESTID = 'home'

// Test seam (B3/B5): 작품 목록 표면의 루트 요소 표식. 라우팅 테스트가
// `/`(홈)와 `/works`(목록)를 구별할 수 있게 한다.
export const WORKS_TESTID = 'works'

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

// 작품 목록 슬라이드의 색 (B5) — 같은 우주 무드 안. 뒤의 방울이 비쳐야
// 하므로 반투명 유리면이고, 가장자리는 성운 보라의 옅은 선이다.
export const COLOR_SLIDE_SURFACE = 'rgba(11, 7, 20, 0.82)'
export const COLOR_SLIDE_EDGE = 'rgba(139, 92, 246, 0.32)'
export const COLOR_SLIDE_SHADOW = 'rgba(11, 7, 20, 0.55)'
// 목록 카드의 면과 오브제 자리 (이미지가 오기 전/실패했을 때 남는 바탕).
export const COLOR_CARD_SURFACE = 'rgba(242, 238, 251, 0.05)'
export const COLOR_CARD_EDGE = 'rgba(242, 238, 251, 0.12)'
