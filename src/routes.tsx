import { Navigate } from 'react-router'
import type { RouteObject } from 'react-router'
import Home from './scene/Home.tsx'
import { workPath, works } from './works/registry.ts'
import WorkErrorBoundary from './works/WorkErrorBoundary.tsx'

// B3 — 라우팅 표면의 단일 진실.
// `/` = 홈 씬 호스트(Home: WebGL 씬 vs HomeFallback 폴백을 결정, B4),
// `/works/<slug>` = 등록부에서 파생된 작품 페이지 (B1: 등록부에
// 항목을 추가하면 다른 코드 수정 없이 라우트가 늘어난다).
// 등록에 없는 slug와 알 수 없는 경로는 catch-all이 홈으로 보낸다.
// App/main과 테스트가 같은 이 배열로 각자 라우터를 만든다.
export const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  // 작품 라우트만 WorkErrorBoundary로 감싼다 (크래시 → 실패 문구 + 홈
  // 링크의 최소 화면; 정상 경로는 도착 페이드 프레임). 홈 라우트는 감싸지
  // 않는다 — 씬 오류가 여기로 흡수되면 B4 폴백 경로가 가려진다.
  ...works.map((w) => ({
    path: workPath(w.slug),
    element: (
      <WorkErrorBoundary>
        <w.Page />
      </WorkErrorBoundary>
    ),
  })),
  { path: '*', element: <Navigate to="/" replace /> },
]
