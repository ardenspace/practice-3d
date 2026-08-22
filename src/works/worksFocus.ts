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
   * 초점을 받을 항목의 slug. 사라지기 직전의 초점이 어느 작품을 가리키고
   * 있었는지다 — 목록 항목 N에 있었다면 새 목록에서도 항목 N에 있어야
   * 한다 (Requirement 38). `planWorksFocusHandoff`가 사라지기 직전의 DOM에서
   * 읽어 온다. 그런 항목이 없으면 아래 기본 자리로 물러난다.
   *
   * 방울에 초점이 있었던 경우도 같은 통로로 들어온다 — 방울이 자기 slug를
   * 표식으로 달면 여기 그대로 실린다. 방울이 초점을 받을 수 있게 하는
   * 키보드 계층 자체는 페이즈 3의 몫이다.
   */
  slug?: string | null
  /** 초점을 옮길 문서. 기본은 지금 문서. */
  doc?: Document
}

/** 사라지는 화면에서 새 목록으로 넘길 초점 한 건. */
export interface WorksFocusHandoff {
  /** 초점이 가리키고 있던 작품. 어느 항목도 아니었으면 null. */
  slug: string | null
}

/**
 * 씬 셸이 사라지기 직전에, 초점을 넘길지 그리고 어디로 넘길지를 정한다
 * (Requirement 38). 셸이 아직 DOM에 있을 때 불러야 한다 — 사라지고 나면
 * 초점이 이미 `<body>`로 떨어져 무엇을 들고 있었는지 알 수 없다.
 *
 * 초점이 셸 밖에 있었거나 아무 데도 없었으면 null — 방문자에게서 초점을
 * 빼앗지 않는다. 셸 안에 있었으면 그 초점이 어느 작품 항목에 속해 있었는지
 * (`WORK_ITEM_ATTR`를 단 조상)를 함께 실어 보낸다. 항목이 아닌 자리에
 * 있었다면 slug는 null이고, 초점은 목록의 기본 자리로 간다.
 *
 * 돌려주는 값을 그대로 `focusWorksList`에 넘길 수 있다 — 중간에 slug를
 * 떨어뜨릴 자리를 두지 않기 위해서다.
 */
export function planWorksFocusHandoff(
  shell: Element | null,
  active: Element | null,
): WorksFocusHandoff | null {
  if (shell === null || active === null || !shell.contains(active)) return null
  const item = active.closest(`[${WORK_ITEM_ATTR}]`)
  return { slug: item?.getAttribute(WORK_ITEM_ATTR) ?? null }
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
