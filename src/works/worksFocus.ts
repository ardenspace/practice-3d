import { WORKS_TESTID, WORK_ITEM_ATTR } from '../theme.ts'

// 화면이 바뀌면서 초점을 들고 있던 요소가 사라질 때, 초점이 갈 곳을 정하는
// 한 곳 (Requirement 38, Failure Behavior: "초점이 사라진 요소에 남지
// 않는다"). 지금 그런 순간은 하나다 — 실행 중에 씬이 무너져 방울 씬 셸이
// 통째로 사라지고 작품 목록이 화면 전체가 되는 전이 (B4).
//
// 목록 표면은 온 사이트에 하나뿐이므로(Requirement 39, Home.test.tsx가
// 핀한다) 문서에서 그 하나를 찾는 것으로 충분하다. 목록을 그리는 쪽이
// 라우트의 element일 수도 있고 홈이 직접 그린 것일 수도 있어서, 이 함수는
// props가 아니라 DOM 표식으로 목록을 찾는다.

export interface WorksFocusOptions {
  /**
   * 초점을 받을 항목의 slug. 페이즈 3을 위한 자리다 — 방울에 초점이
   * 있었다면 그 방울에 해당하는 목록 항목으로 초점이 옮겨 가야 한다
   * (Requirement 38). 지금은 방울에 초점이 갈 수 있게 하는 키보드 계층이
   * 아직 없어 아무도 넘기지 않는다. 넘겨도 그런 항목이 없으면 아래 기본
   * 자리로 물러난다.
   */
  slug?: string | null
  /** 초점을 옮길 문서. 기본은 지금 문서. */
  doc?: Document
}

/**
 * 작품 목록 안으로 초점을 넘긴다. 갈 곳은 순서대로:
 * 지목된 slug의 항목 → 목록의 첫 항목 → 목록 표면 자체(등록부가 비어
 * 항목이 하나도 없는 경우). 어느 갈래에서도 초점이 `<body>`로 떨어지지
 * 않는다.
 *
 * 목록이 아직 화면에 없으면 아무것도 하지 않고 false를 돌려준다 — 부르는
 * 쪽이 전이가 끝난 뒤에 부르도록 되어 있다.
 */
export function focusWorksList({
  slug,
  doc = document,
}: WorksFocusOptions = {}): boolean {
  const surface = doc.querySelector<HTMLElement>(
    `[data-testid="${WORKS_TESTID}"]`,
  )
  if (!surface) return false

  const wanted =
    slug == null
      ? null
      : surface.querySelector<HTMLElement>(`[${WORK_ITEM_ATTR}="${slug}"]`)
  const target =
    wanted ??
    surface.querySelector<HTMLElement>(`[${WORK_ITEM_ATTR}]`) ??
    surface

  target.focus()
  return doc.activeElement === target
}
