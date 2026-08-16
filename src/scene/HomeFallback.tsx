import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import {
  BACKDROP_SRC,
  COLOR_ACCENT_CYAN,
  COLOR_NEBULA_PURPLE,
  COLOR_SPACE_BG,
  COLOR_TEXT,
  HOME_TESTID,
  SITE_TITLE,
} from '../theme.ts'
import { workPath, works } from '../works/registry.ts'

// 홈 화면 — Phase 1의 임시 홈이자 B4 씬 폴백 화면.
// Phase 2에서 홈 중앙은 WebGL 방울 씬이 차지하고, WebGL 컨텍스트 생성
// 실패/상실 시 이 컴포넌트가 그대로 폴백으로 렌더된다 (배경 이미지 +
// 사이트 제목 + 전 등록 작품 텍스트 링크 목록).
// 루트 요소의 data-testid={HOME_TESTID}는 B3 라우팅 테스트의 심이다.

const rootStyle: CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3rem',
  padding: '2rem 1.5rem',
  backgroundColor: COLOR_SPACE_BG,
  backgroundImage: `url(${BACKDROP_SRC})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: COLOR_TEXT,
  textAlign: 'center',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(2rem, 6vw, 3.25rem)',
  fontWeight: 300,
  letterSpacing: '0.35em',
  textShadow: `0 0 28px ${COLOR_NEBULA_PURPLE}`,
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.25rem',
}

const linkStyle: CSSProperties = {
  color: COLOR_ACCENT_CYAN,
  textDecoration: 'none',
  fontSize: '1.125rem',
  letterSpacing: '0.12em',
  textShadow: `0 0 18px ${COLOR_NEBULA_PURPLE}`,
}

export default function HomeFallback() {
  return (
    <main data-testid={HOME_TESTID} style={rootStyle}>
      <h1 style={titleStyle}>{SITE_TITLE}</h1>
      <nav aria-label="works">
        <ul style={listStyle}>
          {works.map((w) => (
            <li key={w.slug}>
              <Link to={workPath(w.slug)} style={linkStyle}>
                {w.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}
