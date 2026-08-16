// Design tokens & shared constants (single source — no inline duplicates).
// Scene colors, LONG_PRESS_MS, etc. get added here by later build steps.

export const SITE_TITLE = 'practice-3d'

// Test seam (B3): 홈 화면의 루트 요소는 data-testid={HOME_TESTID}를 가진다.
// 라우팅 계약 테스트가 "홈이 렌더되었다"를 이 아이디로 판별한다.
export const HOME_TESTID = 'home'

// 배경 이미지 (B2: public/backdrop.webp 한 장). 홈/폴백과 Phase 2 씬이 공유.
export const BACKDROP_SRC = '/backdrop.webp'

// 우주 무드 색상 토큰 — 어두운 배경 + 보라 성운 + 핑크/시안 광원.
// (conventions.md Design Tokens에 등록됨. 인라인 중복 금지.)
export const COLOR_SPACE_BG = '#0b0714'
export const COLOR_NEBULA_PURPLE = '#8b5cf6'
export const COLOR_ACCENT_PINK = '#ff8ad4'
export const COLOR_ACCENT_CYAN = '#8ae2ff'
export const COLOR_TEXT = '#f2eefb'
