import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import {
  COLOR_ACCENT_CYAN,
  COLOR_NEBULA_PURPLE,
  COLOR_SLIDE_EDGE,
  COLOR_SLIDE_SHADOW,
  COLOR_SLIDE_SURFACE,
  WORKS_OPEN_LABEL,
} from '../theme.ts'
import { WORKS_PATH } from './registry.ts'

// 방울 씬이 떠 있는 홈 오른쪽 위에서 작품 목록을 여는 아이콘
// (Requirement 14·15). 씬을 띄울 수 없는 방문자에게는 목록이 이미 홈이고
// 돌아갈 씬도 없으므로 이 아이콘은 존재하지 않는다 (Requirement 23) —
// 그래서 이 컴포넌트를 그리는 곳은 씬이 뜬 홈 한 곳뿐이다.
//
// 진짜 `<a href="/works">`다. 활성화하면 주소가 `/works`가 되고 히스토리에
// 항목 하나가 남아 브라우저 뒤로가기로 목록이 닫힌다. 새 탭으로 열거나
// 주소를 복사하는 것도 그대로 된다.
//
// 씬 없이 렌더할 수 있다 — 라우터 컨텍스트만 있으면 되고 R3F에 닿지 않는다.
// 아이콘이 존재하는 상태(씬이 뜬 홈)는 jsdom에서 만들 수 없으므로, 여는
// 동작의 확인은 이 씬 없는 seam을 통한다.

// 그림은 위임 구역 — 우주에 떠 있는 방울 무리 한 뭉치.
const GLYPH_STROKE = 1.3

const linkStyle: CSSProperties = {
  position: 'absolute',
  top: '1.5rem',
  right: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '3rem',
  height: '3rem',
  borderRadius: '50%',
  border: `1px solid ${COLOR_SLIDE_EDGE}`,
  background: COLOR_SLIDE_SURFACE,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxShadow: `0 0 22px ${COLOR_SLIDE_SHADOW}`,
  color: COLOR_ACCENT_CYAN,
  textDecoration: 'none',
  // 씬 레이어(absolute inset 0) 위에 뜬다.
  zIndex: 1,
}

const glyphStyle: CSSProperties = {
  display: 'block',
  filter: `drop-shadow(0 0 6px ${COLOR_NEBULA_PURPLE})`,
}

export default function WorksOpenIcon() {
  return (
    <Link
      to={WORKS_PATH}
      aria-label={WORKS_OPEN_LABEL}
      title={WORKS_OPEN_LABEL}
      style={linkStyle}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
        focusable="false"
        style={glyphStyle}
      >
        <circle cx="9" cy="9.5" r="5.5" strokeWidth={GLYPH_STROKE} />
        <circle
          cx="17.5"
          cy="6.5"
          r="3"
          strokeWidth={GLYPH_STROKE}
          opacity="0.7"
        />
        <circle
          cx="15.5"
          cy="17"
          r="4.5"
          strokeWidth={GLYPH_STROKE}
          opacity="0.85"
        />
      </svg>
    </Link>
  )
}
