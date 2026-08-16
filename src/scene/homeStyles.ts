import type { CSSProperties } from 'react'
import {
  BACKDROP_SRC,
  COLOR_NEBULA_PURPLE,
  COLOR_SPACE_BG,
  COLOR_TEXT,
  PAGE_ENTER_ANIMATION,
} from '../theme.ts'

// 홈 씬(Home)과 폴백(HomeFallback)이 공유하는 스타일 조각.
// 두 화면은 같은 무드(배경 이미지 + 제목 타이포그래피)를 유지해야 하므로
// 공통부는 여기 한 곳에만 두고, 각 컴포넌트는 spread 후 레이아웃 차이만
// 덧붙인다 (baseline: 두 곳 이상 인라인 중복 금지).

// 풀뷰포트 우주 배경 — backdrop.webp를 CSS 배경으로 깐다.
// 홈 도착(작품 페이지에서 돌아올 때 포함)은 page-enter 페이드로 부드럽게.
export const backdropStyle: CSSProperties = {
  minHeight: '100dvh',
  backgroundColor: COLOR_SPACE_BG,
  backgroundImage: `url(${BACKDROP_SRC})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: COLOR_TEXT,
  animation: PAGE_ENTER_ANIMATION,
}

// 사이트 제목 h1 타이포그래피 — 가는 굵기 + 넓은 자간 + 이중 성운 글로우.
// paddingLeft는 letter-spacing이 마지막 글자 뒤에도 붙어 중앙이 왼쪽으로
// 치우쳐 보이는 것의 광학 보정 (자간과 같은 값).
export const homeTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(2rem, 6vw, 3.25rem)',
  fontWeight: 300,
  letterSpacing: '0.35em',
  paddingLeft: '0.35em',
  textShadow: `0 0 16px ${COLOR_NEBULA_PURPLE}, 0 0 46px ${COLOR_NEBULA_PURPLE}`,
}

// 태그라인(SITE_TAGLINE) — 제목 아래 한 줄, 조용한 우주 톤.
export const homeTaglineStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
  fontWeight: 300,
  letterSpacing: '0.24em',
  paddingLeft: '0.24em',
  opacity: 0.78,
  textShadow: `0 0 14px ${COLOR_NEBULA_PURPLE}`,
}

// 제목 + 태그라인 묶음 (홈 씬 오버레이와 폴백이 같은 수직 리듬을 공유).
export const homeHeaderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  textAlign: 'center',
}
