import { Navigate } from 'react-router'
import type { RouteObject } from 'react-router'
import Home from './scene/Home.tsx'
import { WORKS_PATH, workPath, works } from './works/registry.ts'
import WorkErrorBoundary from './works/WorkErrorBoundary.tsx'
import WorksList from './works/WorksList.tsx'

// B3 — 라우팅 표면의 단일 진실.
// `/` = 홈 씬 호스트(Home: WebGL 씬 vs HomeFallback 폴백을 결정, B4),
// `/works` = 작품 목록이 열린 상태,
// `/works/<slug>` = 등록부에서 파생된 작품 페이지 (B1: 등록부에
// 항목을 추가하면 다른 코드 수정 없이 라우트가 늘어난다).
// 등록에 없는 slug와 알 수 없는 경로는 catch-all이 홈으로 보낸다.
// App/main과 테스트가 같은 이 배열로 각자 라우터를 만든다.
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
    children: [
      // `/works`를 홈의 자식으로 둔다. `/`와 `/works`가 같은 Home 인스턴스를
      // 공유해야 목록을 열고 닫아도 씬이 처음부터 다시 뜨지 않는다
      // (Requirement 32) — 형제 라우트였다면 이동할 때마다 Canvas가
      // 언마운트/재마운트된다.
      //
      // 이 자리의 요소는 씬 없는 방문자가 보는 전체 화면 목록이다. 씬을 띄울
      // 수 있으면 Home이 이 자리를 슬라이드 모습으로 바꿔 그린다
      // (Requirement 31: `/works`는 "목록이 열려 있다"는 뜻이고, 어떤 모습이
      // 되는지는 씬을 띄울 수 있는지가 정한다).
      // 절대 경로 자식 — 부모 경로(`/`)로 시작하므로 허용된다.
      { path: WORKS_PATH, element: <WorksList variant="fullscreen" /> },
    ],
  },
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
