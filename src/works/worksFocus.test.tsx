import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { WORKS_TESTID, WORK_ITEM_ATTR } from '../theme.ts'
import type { WorkEntry } from './registry.ts'
import WorksList from './WorksList.tsx'
import type { WorksListVariant } from './WorksList.tsx'
import { focusWorksList, planWorksFocusHandoff } from './worksFocus.ts'

// Requirement 38 — 화면이 바뀌면서 초점을 들고 있던 요소가 사라질 때 초점이
// 갈 곳.
//
// 그 순간은 실행 중에 씬이 무너지는 전이이고, 씬은 jsdom에서 뜨지 않는다.
// 그래서 규칙을 화면 없는 순수 모듈로 떼어 두었다 — 이 파일이 그 규칙을
// 그대로 확인한다. 초점을 넘길지 정하는 쪽(planWorksFocusHandoff)과 실제로
// 넘기는 쪽(focusWorksList)을 각각, 그리고 둘을 이어 붙인 전이 전체를 본다.
//
// 목록은 진짜 WorksList를 렌더해서 쓴다. 손으로 만든 DOM으로는 목록 표면의
// 표식이나 tabIndex가 바뀌어도 이 테스트가 계속 통과해 버린다.

afterEach(cleanup)

const SHELL_TESTID = 'scene-shell-stand-in'

function fixtureEntry(slug: string, title: string): WorkEntry {
  return {
    slug,
    title,
    blurb: `${title}의 한 줄 소개`,
    object: { type: 'image', src: `/works/${slug}/object.webp` },
    Page: () => null,
  }
}

// 슬러그가 사전순이 아니다 — "첫 항목"과 "지목된 항목"이 우연히 같아지지
// 않도록 지목 대상은 항상 첫 항목이 아닌 것을 고른다.
const MANY: readonly WorkEntry[] = [
  fixtureEntry('zephyr', '제퍼'),
  fixtureEntry('anemone', '아네모네'),
  fixtureEntry('marble', '마블'),
]

const FIRST_SLUG = MANY[0].slug
/** 첫 항목이 아닌 항목 — "항목 N에 있던 초점"의 N. */
const NTH_SLUG = MANY[2].slug

/** 씬 셸을 흉내 낸 껍데기 안에 목록을 그린다 (전이 직전의 모습). */
function renderInShell(
  variant: WorksListVariant,
  entries: readonly WorkEntry[] = MANY,
) {
  const view = render(
    <MemoryRouter>
      <div data-testid={SHELL_TESTID}>
        <WorksList variant={variant} entries={entries} />
      </div>
    </MemoryRouter>,
  )
  return { ...view, shell: view.getByTestId(SHELL_TESTID) }
}

function itemFor(slug: string): HTMLElement {
  const item = document.querySelector<HTMLElement>(
    `[${WORK_ITEM_ATTR}="${slug}"]`,
  )
  if (item === null) throw new Error(`no list item for ${slug}`)
  return item
}

/** 지금 초점이 놓인 항목의 slug. 항목 위가 아니면 null. */
function focusedSlug(): string | null {
  return (
    document.activeElement
      ?.closest(`[${WORK_ITEM_ATTR}]`)
      ?.getAttribute(WORK_ITEM_ATTR) ?? null
  )
}

describe('focusWorksList: 초점이 갈 곳의 순서', () => {
  it('지목된 slug의 항목으로 간다 — 첫 항목이 아니다', () => {
    // 목록 항목 N에 있던 초점은 새 화면에서도 항목 N에 있어야 한다
    // (Requirement 38). slug를 흘리면 초점이 항목 1로 튄다.
    renderInShell('fullscreen')

    expect(focusWorksList({ slug: NTH_SLUG })).toBe(true)
    expect(focusedSlug()).toBe(NTH_SLUG)
    expect(focusedSlug(), '첫 항목으로 떨어지지 않는다').not.toBe(FIRST_SLUG)
  })

  it('지목된 항목이 없으면 첫 항목으로 물러난다', () => {
    renderInShell('fullscreen')

    expect(focusWorksList({ slug: 'no-such-work' })).toBe(true)
    expect(focusedSlug()).toBe(FIRST_SLUG)
  })

  it('지목이 없으면 첫 항목이다', () => {
    renderInShell('fullscreen')

    expect(focusWorksList()).toBe(true)
    expect(focusedSlug()).toBe(FIRST_SLUG)
  })

  it('등록부가 비어 항목이 하나도 없으면 목록 표면 자체가 받는다', () => {
    // 초점이 <body>로 떨어지지 않는다 — 목록 표면이 tabIndex={-1}을 이고
    // 있는 이유가 이 갈래다.
    const { getByTestId } = renderInShell('fullscreen', [])

    expect(focusWorksList()).toBe(true)
    expect(document.activeElement).toBe(getByTestId(WORKS_TESTID))
    expect(document.activeElement, '<body>가 아니다').not.toBe(document.body)
  })

  it('목록이 아직 화면에 없으면 아무것도 하지 않는다', () => {
    // 부르는 쪽이 전이가 끝난 뒤에 부르도록 되어 있다. 초점을 엉뚱한 데로
    // 옮기지 않고 사실만 돌려준다.
    render(<div />)

    expect(focusWorksList({ slug: NTH_SLUG })).toBe(false)
    expect(document.activeElement).toBe(document.body)
  })
})

describe('planWorksFocusHandoff: 사라지기 직전에 무엇을 들고 있었나', () => {
  it('목록 항목에 초점이 있었으면 그 항목의 slug를 싣는다', () => {
    // 이 한 줄이 "항목 N에 있던 초점이 항목 N에 남는다"의 출발점이다.
    // slug를 읽지 않으면 여기서 null이 되어 초점이 항목 1로 간다.
    const { shell } = renderInShell('slide')
    itemFor(NTH_SLUG).focus()

    expect(planWorksFocusHandoff(shell, document.activeElement)).toEqual({
      slug: NTH_SLUG,
    })
  })

  it('항목 안쪽 요소에 초점이 있어도 그 항목으로 친다', () => {
    // 항목 안에 초점을 받을 수 있는 것이 더 생겨도(페이즈 3) 그것이 어느
    // 작품에 속하는지는 조상 표식으로 정해진다.
    const { shell } = renderInShell('slide')
    const inner = itemFor(NTH_SLUG).querySelector('span')

    expect(planWorksFocusHandoff(shell, inner)).toEqual({ slug: NTH_SLUG })
  })

  it('셸 안이지만 어느 항목도 아닌 자리면 slug 없이 넘긴다', () => {
    // 초점은 넘겨야 하지만 (그 자리도 곧 사라진다) 가리키는 작품은 없다.
    const { shell } = renderInShell('slide')

    expect(planWorksFocusHandoff(shell, shell)).toEqual({ slug: null })
  })

  it('셸 밖에 초점이 있었으면 넘기지 않는다', () => {
    // 방문자에게서 초점을 빼앗지 않는다 — 그가 보고 있던 것은 사라지지 않는다.
    const { shell } = renderInShell('slide')
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()

    expect(planWorksFocusHandoff(shell, document.activeElement)).toBeNull()
    outside.remove()
  })

  it('초점이 아무 데도 없었거나 셸이 없으면 넘기지 않는다', () => {
    const { shell } = renderInShell('slide')

    expect(planWorksFocusHandoff(shell, null)).toBeNull()
    expect(planWorksFocusHandoff(null, itemFor(NTH_SLUG))).toBeNull()
  })
})

describe('전이 전체: 슬라이드 항목 N → 전체 화면 항목 N', () => {
  it('목록이 열린 채 씬이 무너지면 초점은 있던 항목에 그대로 남는다', () => {
    // 씬 셸 안의 슬라이드 목록에서 항목 N에 초점 → 셸이 통째로 사라지고
    // 같은 목록이 화면 전체가 된다 → 초점은 항목 N (Requirement 38).
    // 씬 자체는 jsdom에서 뜨지 않으므로 셸이 사라지는 부분만 흉내 낸다.
    const slide = renderInShell('slide')
    itemFor(NTH_SLUG).focus()
    const handoff = planWorksFocusHandoff(slide.shell, document.activeElement)
    slide.unmount()

    expect(handoff, '셸 안에 초점이 있었으므로 넘길 것이 있다').not.toBeNull()
    if (handoff === null) return

    renderInShell('fullscreen')
    expect(focusWorksList(handoff)).toBe(true)
    expect(focusedSlug(), '항목 1로 튀지 않는다').toBe(NTH_SLUG)
  })
})
