import { Component, type ReactNode } from 'react'

// 렌더(및 렌더가 부른 effect) 중에 던져진 오류를 잡는 공용 바운더리.
// 잡은 뒤 그 자리에 무엇을 그릴지도, 그 사실을 누구에게 알릴지도 이
// 컴포넌트는 모른다 — 둘 다 바깥에서 받는다 (공유는 개별을 모른다).
//
// 중립 위치(src/ 바로 아래)에 두는 이유는 siteStyles.ts와 같다: 씬과 작품
// 쪽이 둘 다 쓰므로 어느 한쪽 폴더 안에 있으면 역방향 임포트가 생긴다.
//
// 지금 두 곳이 쓴다.
// - works/WorkErrorBoundary — 작품 페이지가 크래시하면 실패 문구 + 홈 링크의
//   최소 화면을 그 자리에 그린다. 백지 화면 금지.
// - scene/Home — 씬이 끝내 올라오지 못하면 그 자리는 비우고(`fallback={null}`)
//   무너졌다는 사실만 위로 알린다. 화면을 무엇으로 바꿀지는 B4의 폴백 판정이
//   정하므로 바운더리가 대신 정하지 않는다.

interface Props {
  children: ReactNode
  /** 오류를 잡은 뒤 이 자리에 그릴 것. 아무것도 그리지 않으려면 `null`. */
  fallback: ReactNode
  /** 오류를 잡았다는 사실. 잡을 때 한 번 불린다. */
  onError?: () => void
}

interface State {
  crashed: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  render() {
    return this.state.crashed ? this.props.fallback : this.props.children
  }
}
