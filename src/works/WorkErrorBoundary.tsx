import { Component, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
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
//   (씬 실패는 Home의 WebGL 폴백 경로가 담당, B4).
// - 정상 경로: 자식을 page-enter 페이드 프레임으로 감싼다 (터짐→도착 연출).
// - 렌더 크래시: 조용한 최소 화면 — 실패 문구(WORK_ERROR_MESSAGE, 단일
//   소스) + 홈(`/`) 링크. 백지 화면 금지 (spec Conventions).
// - 라우트 전환 시 element가 언마운트되므로 crashed 상태는 재방문 때
//   자동으로 리셋된다.

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

interface Props {
  children: ReactNode
}

interface State {
  crashed: boolean
}

export default class WorkErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  render() {
    if (this.state.crashed) {
      return (
        <main style={crashedStyle}>
          <p style={messageStyle}>{WORK_ERROR_MESSAGE}</p>
          <Link to="/" style={homeLinkStyle}>
            {BACK_TO_HOME_LABEL}
          </Link>
        </main>
      )
    }
    return <div style={frameStyle}>{this.props.children}</div>
  }
}
