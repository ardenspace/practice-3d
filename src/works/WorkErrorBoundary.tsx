import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import ErrorBoundary from '../ErrorBoundary.tsx'
import {
  BACK_TO_HOME_LABEL,
  COLOR_ACCENT_CYAN,
  COLOR_SPACE_BG,
  COLOR_TEXT,
  PAGE_ENTER_ANIMATION,
  WORK_ERROR_MESSAGE,
} from '../theme.ts'

// 작품 페이지 전용 에러 바운더리 + 도착 연출 프레임.
// - routes.tsx가 /works/<slug> 라우트의 element만 이 컴포넌트로 감싼다 —
//   홈(씬) 라우트는 감싸지 않으므로 씬 쪽 오류를 여기서 삼키지 않는다
//   (씬 실패는 Home이 자기 캔버스만 감싼 바운더리로 받아 B4 폴백으로 넘긴다).
// - 정상 경로: 자식을 page-enter 페이드 프레임으로 감싼다 (터짐→도착 연출).
// - 렌더 크래시: 조용한 최소 화면 — 실패 문구(WORK_ERROR_MESSAGE, 단일
//   소스) + 홈(`/`) 링크. 백지 화면 금지 (spec Conventions).
// - 라우트 전환 시 element가 언마운트되므로 crashed 상태는 재방문 때
//   자동으로 리셋된다.
//
// 오류를 잡는 기계 자체는 공용 ErrorBoundary에 있다 — 이 파일이 정하는 것은
// "무엇을 대신 보여줄 것인가" 하나뿐이다.

const frameStyle: CSSProperties = {
  animation: PAGE_ENTER_ANIMATION,
}

const crashedStyle: CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5rem',
  padding: '2rem 1.5rem',
  textAlign: 'center',
  background: COLOR_SPACE_BG,
  color: COLOR_TEXT,
  animation: PAGE_ENTER_ANIMATION,
}

const messageStyle: CSSProperties = {
  margin: 0,
  fontWeight: 300,
  letterSpacing: '0.08em',
  opacity: 0.85,
}

const homeLinkStyle: CSSProperties = {
  color: COLOR_ACCENT_CYAN,
  textDecoration: 'none',
  letterSpacing: '0.08em',
}

const crashedScreen = (
  <main style={crashedStyle}>
    <p style={messageStyle}>{WORK_ERROR_MESSAGE}</p>
    <Link to="/" style={homeLinkStyle}>
      {BACK_TO_HOME_LABEL}
    </Link>
  </main>
)

export default function WorkErrorBoundary({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ErrorBoundary fallback={crashedScreen}>
      <div style={frameStyle}>{children}</div>
    </ErrorBoundary>
  )
}
