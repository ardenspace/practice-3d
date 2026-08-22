// Design tokens & shared constants (single source — no inline duplicates).
// Scene colors, LONG_PRESS_MS, etc. get added here by later build steps.

export const SITE_TITLE = 'practice-3d'

// 홈 카피 (한국어, 조용한 우주 무드). 태그라인은 홈 씬과 씬 없는 홈(전체
// 화면 목록)이 공유하고, 힌트는 방울이 실제로 뜨는 WebGL 씬에서만 보인다
// (터뜨릴 방울이 없는 화면에서는 "터뜨려 보세요"가 성립하지 않음).
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

// 씬을 띄우지 못해 방문자를 작품 목록으로 옮겼을 때 붙는 안내 (Requirement
// 36, B4). 문구는 스펙이 정한 그대로다 — 드리프트 가드는
// src/scene/Home.test.tsx.
// 이 안내는 화면이 아니라 "뜻하지 않은 이동"에 붙는다. 같은 화면을 직접
// 열었거나 새로고침했거나 스스로 누른 링크로 온 방문자에게는 나오지 않는다
// (Requirement 37).
export const SCENE_FALLBACK_NOTICE =
  '3D 씬을 띄우는 데 문제가 있어 대신 작품 목록을 바로 볼 수 있는 페이지로 이동했습니다.'

// 씬 홈 오른쪽 위, 목록을 여는 아이콘의 이름 (Requirement 14). 아이콘은
// 그림뿐이므로 무엇을 여는 물건인지는 이 문구가 맡는다 — 접근 가능한 이름
// 이자 마우스 hover 툴팁이다. 아이콘의 그림은 위임 구역, 이름은 아니다.
export const WORKS_OPEN_LABEL = '작품 목록 열기'

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

// Test seam (B5): 슬라이드 바깥의 닫기 면. 그림도 이름도 없는 면이라
// 역할이나 문구로 집을 수 없으므로 표식을 둔다 (Requirement 19).
export const WORKS_DISMISS_TESTID = 'works-dismiss'

// 목록 항목이 어느 작품인지 DOM에 남기는 표식. 목록 바깥에서 "이 작품의
// 항목"을 집어야 할 때 쓴다 — 지금은 씬이 무너질 때 초점을 목록 안으로
// 넘기는 works/worksFocus.ts 하나가 쓰고(Requirement 38), 방울에서 항목으로
// 초점이 건너가는 매핑도 같은 표식을 딛고 선다.
export const WORK_ITEM_ATTR = 'data-work-slug'

// 층 순서 — 화면 본체(씬 캔버스, 또는 씬이 없을 때의 전체 화면 목록)가 바닥,
// 그 위에 본체를 덮는 면들(목록을 여는 아이콘, 목록 바깥의 닫기 면, 씬 폴백
// 안내 띠), 맨 위가 목록 슬라이드다. 값이 두 곳 이상에서 쓰이므로 여기
// 한 곳에 둔다.
export const Z_ABOVE_SCENE = 1
export const Z_SLIDE = 2

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

// 키보드 초점 표시의 색 (Requirement 8) — 초점이 간 작품 방울에만 붙는
// 고리다. 방울의 림은 핑크/시안/보라가 흐르는 무지갯빛이라 그 안의 색을
// 쓰면 "지금 여기 서 있다"가 쉬머에 묻힌다. 흔들리지 않는 흰빛 하나만
// 우주 무드 밖에서 빌려 오지 않고 가장 밝은 자리로 끌어올려 쓴다.
export const COLOR_FOCUS_RING = '#ffffff'

// 작품 목록 슬라이드의 색 (B5) — 같은 우주 무드 안. 뒤의 방울이 비쳐야
// 하므로 반투명 유리면이고, 가장자리는 성운 보라의 옅은 선이다.
// 씬 폴백 안내 띠(B4)도 화면 위에 얹히는 같은 유리면이라 이 값을 나눠 쓴다.
export const COLOR_SLIDE_SURFACE = 'rgba(11, 7, 20, 0.82)'
export const COLOR_SLIDE_EDGE = 'rgba(139, 92, 246, 0.32)'
export const COLOR_SLIDE_SHADOW = 'rgba(11, 7, 20, 0.55)'
// 목록 카드의 면과 오브제 자리 (이미지가 오기 전/실패했을 때 남는 바탕).
export const COLOR_CARD_SURFACE = 'rgba(242, 238, 251, 0.05)'
export const COLOR_CARD_EDGE = 'rgba(242, 238, 251, 0.12)'
