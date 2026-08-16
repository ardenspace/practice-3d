import { Navigate } from 'react-router'
import type { RouteObject } from 'react-router'
import HomeFallback from './scene/HomeFallback.tsx'
import { workPath, works } from './works/registry.ts'

// B3 — 라우팅 표면의 단일 진실.
// `/` = 홈, `/works/<slug>` = 등록부에서 파생된 작품 페이지 (B1: 등록부에
// 항목을 추가하면 다른 코드 수정 없이 라우트가 늘어난다).
// 등록에 없는 slug와 알 수 없는 경로는 catch-all이 홈으로 보낸다.
// App/main과 테스트가 같은 이 배열로 각자 라우터를 만든다.
export const routes: RouteObject[] = [
  { path: '/', element: <HomeFallback /> },
  ...works.map((w) => ({
    path: workPath(w.slug),
    element: <w.Page />,
  })),
  { path: '*', element: <Navigate to="/" replace /> },
]
