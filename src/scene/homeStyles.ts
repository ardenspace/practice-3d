import type { CSSProperties } from 'react'
import {
  BACKDROP_SRC,
  COLOR_NEBULA_PURPLE,
  COLOR_SPACE_BG,
  COLOR_TEXT,
} from '../theme.ts'

// 홈 씬(Home)과 폴백(HomeFallback)이 공유하는 스타일 조각.
// 두 화면은 같은 무드(배경 이미지 + 제목 타이포그래피)를 유지해야 하므로
// 공통부는 여기 한 곳에만 두고, 각 컴포넌트는 spread 후 레이아웃 차이만
// 덧붙인다 (baseline: 두 곳 이상 인라인 중복 금지).

// 풀뷰포트 우주 배경 — backdrop.webp를 CSS 배경으로 깐다.
export const backdropStyle: CSSProperties = {
  minHeight: '100dvh',
  backgroundColor: COLOR_SPACE_BG,
  backgroundImage: `url(${BACKDROP_SRC})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: COLOR_TEXT,
}

// 사이트 제목 h1 타이포그래피 (성운 글로우 포함).
export const homeTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(2rem, 6vw, 3.25rem)',
  fontWeight: 300,
  letterSpacing: '0.35em',
  textShadow: `0 0 28px ${COLOR_NEBULA_PURPLE}`,
}
