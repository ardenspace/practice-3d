import type { WorkEntry } from './registry.ts'

// B5 — 작품 목록 표면. 작품 목록을 그리는 곳은 온 사이트에 하나이고,
// 그 하나가 두 가지 모습(슬라이드 / 전체 화면)으로 나타난다.
//
// 표현 분기는 컴포넌트 바깥에서 `variant`로 받는다. 그래야 방울 씬을
// 마운트하지 않고도 두 모습을 각각 렌더해 확인할 수 있다 — jsdom에는
// WebGL이 없고, 있다고 속이면 R3F 캔버스가 실제로 마운트되어 죽는다.
//
// ⚠️ 아직 껍데기다. 공개 표면(모듈 경로, export 이름, props 타입)만
// 정해 두었고 계약 동작은 하나도 구현되어 있지 않다 — 계약 테스트
// (WorksList.test.tsx)는 지금 전부 실패한다.

/**
 * 목록이 나타나는 두 모습.
 * - `slide`: 방울 씬 위에 창처럼 열린다. 제목·태그라인은 홈이 이미
 *   그리므로 목록이 다시 그리지 않는다.
 * - `fullscreen`: 씬을 띄울 수 없는 방문자의 홈. 사이트 제목과 태그라인을
 *   함께 이고 있다.
 */
export type WorksListVariant = 'slide' | 'fullscreen'

export interface WorksListProps {
  variant: WorksListVariant
  /**
   * 그릴 항목들. 기본값은 등록부(`works`) 전체 — 목록의 내용은 전부 B1에서
   * 파생된다. 주입은 빈 등록부 같은 경계를 씬 없이 확인하기 위한 seam이다.
   */
  entries?: readonly WorkEntry[]
}

export default function WorksList(_props: WorksListProps) {
  return null
}
