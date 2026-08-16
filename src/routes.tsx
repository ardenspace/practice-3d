import type { RouteObject } from 'react-router'

// Stub: 실제 라우팅 표면(B3 — `/` 홈, `/works/<slug>` 작품 페이지,
// 알 수 없는 경로 → 홈)은 이후 스텝에서 구현된다. catch-all은 라우터가
// 생성 가능하도록 하는 최소치 — 계약 테스트는 assertion에서 실패한다.
export const routes: RouteObject[] = [{ path: '*', element: null }]
