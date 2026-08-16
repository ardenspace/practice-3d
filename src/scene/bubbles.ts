import type { WorkEntry } from '../works/registry.ts'

/**
 * 방울 목록 파생 모듈 — 등록부에서 작품 방울 목록을 만든다.
 * 씬(B1의 씬 보장: 등록 항목 N개 = 작품 방울 정확히 N개)은 이 목록만 소비한다.
 */
export interface WorkBubble {
  entry: WorkEntry
}

/** 등록부 순서 그대로, 항목당 정확히 방울 1개. */
export function deriveWorkBubbles(entries: readonly WorkEntry[]): WorkBubble[] {
  return entries.map((entry) => ({ entry }))
}
