import type { WorkEntry } from '../works/registry.ts'

/**
 * 방울 목록 파생 모듈 — 등록부에서 작품 방울 목록을 만든다.
 * 씬(B1의 씬 보장: 등록 항목 N개 = 작품 방울 정확히 N개)은 이 목록만 소비한다.
 */
export interface WorkBubble {
  entry: WorkEntry
}

// Stub: 실제 파생은 씬 구현 스텝에서 채워진다. 계약 테스트가 임포트할 수 있는
// 정직한 최소치 — 구현 전까지 파생 계약 테스트는 실패한다.
export function deriveWorkBubbles(_entries: readonly WorkEntry[]): WorkBubble[] {
  return []
}
