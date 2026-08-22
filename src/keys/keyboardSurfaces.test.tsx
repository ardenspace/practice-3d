import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routes } from '../routes.tsx'
import { WORKS_DISMISS_TESTID, WORKS_TESTID, WORK_ITEM_ATTR } from '../theme.ts'
import { WORKS_PATH, workPath, works, type WorkEntry } from '../works/registry.ts'
import WorksList from '../works/WorksList.tsx'

// B2 — 키보드 조작 계약이 실제 화면 위에서 지켜지는지.
//
// jsdom에는 WebGL이 없다. 그래서 이 파일의 모든 렌더는 "씬을 띄울 수 없는
// 방문자"이고, 그가 보는 화면은 전체 화면 작품 목록(`/works`)과 작품
// 페이지뿐이다. getContext를 참으로 속이지 않는다 — 속이면 R3F 캔버스가
// 실제로 마운트되며 three.js가 죽는다.
//
// 슬라이드로 열린 목록도 여기서 확인한다. 방울 씬이 있어야 슬라이드가
// *열리지만*, 목록 자신은 씬을 모른다 — 어떤 모습으로 나타날지는 바깥에서
// `variant`로 받는다 (B5가 그러라고 낸 seam이고, WorksList.test.tsx와
// worksFocus.test.tsx가 이미 같은 길로 슬라이드를 렌더한다). 그래서 씬 없이
// `<WorksList variant="slide" onDismiss=… />`를 그대로 세울 수 있다.
//
// 여기서 확인할 수 없는 것과 그 이유:
// - 씬이 뜬 홈의 키보드(Requirements 1·5의 앞부분·7·8·9). 씬이 있어야 존재
//   하는 화면이라 이 환경에서 만들 수 없다. 순회 규칙 자체는 화면을 모르는
//   keyNav.test.ts가 전부 확인한다 (B2: 표현과의 분리). 씬 셸의 DOM 모양
//   (Requirements 11·12)과 슬라이드를 실제로 여닫는 길(B3 ③·Requirement 20)은
//   씬 셸을 세워 보는 scene/sceneShell.test.tsx가 본다.
// - 탭 키 자체. jsdom은 탭을 구현하지 않아 "탭을 눌러 다음 요소로 간다"를
//   실행할 수 없다. 그래서 탭에 대해 볼 수 있는 것은 배선까지다: 이 화면이
//   탭을 자기 것으로 claim 하는가(preventDefault), 그리고 claim 했다면 초점을
//   어디로 옮기는가. 실제로 탭을 눌렀을 때 초점이 그리로 가는지는 브라우저
//   스모크 몫이다. 아래 슬라이드·전체 화면 두 갈래 모두 그 선까지만 본다.
// - "한 번의 엔터가 정확히 한 번 발동한다"의 직접 확인. jsdom은 링크의
//   기본 활성화(엔터)를 실행하지 않는다. 대신 두 번 발동하는 유일한 조합을
//   금지하는 형태로 확인한다 (아래).

afterEach(cleanup)

const ARROW_KEYS = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']
const SPACE = ' '

function renderAt(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  return { router, ...render(<RouterProvider router={router} />) }
}

/** 대기 중인 이동만 비운다. 타이머는 돌리지 않는다. */
async function settle() {
  await act(async () => {})
  await act(async () => {})
}

function listSurface(container: HTMLElement): HTMLElement {
  const surface = container.querySelector<HTMLElement>(
    `[data-testid="${WORKS_TESTID}"]`,
  )
  if (surface === null) throw new Error('작품 목록 표면이 화면에 없다')
  return surface
}

/** 지금 초점이 놓인 항목의 slug. 항목 위가 아니면 null. */
function focusedSlug(): string | null {
  return (
    document.activeElement
      ?.closest(`[${WORK_ITEM_ATTR}]`)
      ?.getAttribute(WORK_ITEM_ATTR) ?? null
  )
}

/**
 * 키 하나를 누른다. 돌려주는 값은 "기본 동작이 살아남았는가" —
 * false면 누군가 preventDefault로 가로챘다는 뜻이다.
 */
function pressKey(target: Element, key: string): boolean {
  return fireEvent.keyDown(target, { key })
}

/** 초점을 목록 안으로 들여놓는다 (방향키 한 번). */
async function focusFirstItem(container: HTMLElement): Promise<void> {
  pressKey(listSurface(container), 'ArrowDown')
  await waitFor(() =>
    expect(focusedSlug(), '방향키가 초점을 목록 안으로 들여놓는다').not.toBeNull(),
  )
}

describe('B2: 전체 화면 목록에서의 키보드', () => {
  it('열자마자 초점을 항목으로 끌어가지 않는다 (Requirement 5)', async () => {
    renderAt(WORKS_PATH)
    await settle()

    expect(focusedSlug(), '아무 항목도 초점을 빼앗지 않는다').toBeNull()
  })

  it('방향키를 누르면 초점이 항목 목록 안으로 들어온다 (Requirements 5·24)', async () => {
    const { container } = renderAt(WORKS_PATH)
    await settle()

    // 초점이 아직 아무 데도 없어도 방향키가 목록을 활성으로 만든다.
    await focusFirstItem(container)
    expect(
      listSurface(container).contains(document.activeElement),
      '초점은 목록 표면 안에 있다',
    ).toBe(true)
  })

  it('이전 방향으로도 똑같이 들어온다', async () => {
    const { container } = renderAt(WORKS_PATH)
    await settle()

    pressKey(listSurface(container), 'ArrowUp')
    await waitFor(() => expect(focusedSlug()).not.toBeNull())
  })

  it('초점이 간 항목은 그 작품 페이지로 가는 진짜 링크다 (Requirement 10)', async () => {
    // 엔터의 목적지 — 초점이 놓인 자리 자체가 그 작품으로 가는 링크여야
    // 방문자가 어떤 경로로 엔터를 눌러도 한 곳으로 간다.
    const { container } = renderAt(WORKS_PATH)
    await settle()
    await focusFirstItem(container)

    const slug = focusedSlug()
    const link = document.activeElement?.closest('a')
    expect(link, '초점이 놓인 자리는 링크 안이다').toBeTruthy()
    expect(link?.getAttribute('href'), '그 작품의 주소').toBe(
      workPath(slug as string),
    )
  })

  it('한 번의 엔터가 두 번 발동하지 않는다 (Requirement 10)', async () => {
    // jsdom은 링크의 기본 활성화(엔터)를 실행하지 않아 "정확히 한 번"을
    // 직접 셀 수 없다. 셀 수 있는 것은 두 번 발동하는 유일한 조합이다:
    // 전역 처리가 스스로 이동해 놓고 브라우저 기본 활성화는 막지 않은 경우.
    // 실제 브라우저에서 그 조합은 링크가 두 번 열린다.
    const { router, container } = renderAt(WORKS_PATH)
    await settle()
    await focusFirstItem(container)

    const survived = pressKey(document.activeElement as Element, 'Enter')
    await settle()
    const navigated = router.state.location.pathname !== WORKS_PATH

    expect(
      navigated && survived,
      '스스로 이동했다면 브라우저 기본 활성화를 막았어야 한다',
    ).toBe(false)
  })

  it('방향키와 스페이스는 페이지를 스크롤하지 않는다 (Requirement 6)', async () => {
    const { container } = renderAt(WORKS_PATH)
    await settle()
    const surface = listSurface(container)

    for (const key of [...ARROW_KEYS, SPACE]) {
      expect(pressKey(surface, key), `${key}는 가로채인다`).toBe(false)
    }
  })

  it('탭은 가로채지 않는다 — 탭으로 페이지를 벗어날 수 있다 (Requirement 24)', async () => {
    // 전체 화면 목록은 고리를 만들지 않는다. jsdom이 탭 키를 구현하지 않아
    // 초점이 실제로 페이지 밖으로 나가는 것은 볼 수 없지만, 이 화면이 탭을
    // 자기 것으로 claim 하지 않는다는 사실은 볼 수 있다.
    const { container } = renderAt(WORKS_PATH)
    await settle()
    const surface = listSurface(container)

    expect(pressKey(surface, 'Tab'), '정방향 탭은 표준대로다').toBe(true)
    expect(
      fireEvent.keyDown(surface, { key: 'Tab', shiftKey: true }),
      '역방향 탭도 표준대로다',
    ).toBe(true)
  })

  it('Esc는 아무 일도 하지 않는다 (Requirement 22)', async () => {
    // 씬을 띄울 수 없는 방문자에게 이 화면은 홈이다. 닫을 것이 없으므로
    // 나갈 곳도 없다 — 어디로도 가지 않는다.
    const { router, container } = renderAt(WORKS_PATH)
    await settle()

    pressKey(listSurface(container), 'Escape')
    await settle()

    expect(router.state.location.pathname, '자리를 지킨다').toBe(WORKS_PATH)
  })

  it('바깥 클릭으로 닫히는 면이 아예 없다 (Requirement 22)', async () => {
    const { container } = renderAt(WORKS_PATH)
    await settle()

    expect(
      container.querySelector(`[data-testid="${WORKS_DISMISS_TESTID}"]`),
      '전체 화면 목록에는 닫는 면이 없다',
    ).toBeNull()
  })
})

describe('B2: 씬 위 슬라이드로 열린 목록에서의 키보드', () => {
  // B2가 슬라이드 안의 탭 고리를 허용한 조건은 조건부다: "Esc 와 바깥 클릭
  // 이라는 나가는 길이 함께 있고 방문자에게 알려지기 때문이다." 그러니 두
  // 절이 함께 참이어야 한다 — 고리가 있다(Requirement 17), 그리고 Esc가
  // 나가는 길이다(Requirement 20). 하나만 참이면 방문자가 갇힌다.
  //
  // 이 describe가 씬 없이 성립하는 것이 B5의 `variant` seam 덕이다. 여기서
  // 그리는 것은 목록 하나뿐이고 씬 셸은 없다 — 그래서 Esc가 실제로 무엇을
  // 하는지(히스토리를 되감는지, 초점이 아이콘으로 돌아가는지)는 여기가 아니라
  // scene/sceneShell.test.tsx가 본다. 여기서 보는 것은 "목록이 나가는 길을
  // 낸다"까지다.
  //
  // 탭에 대해 볼 수 있는 선 (jsdom은 탭을 실행하지 않는다): 고리의 끝에서
  // 탭을 claim 하는가(preventDefault), 그리고 claim 했을 때 초점을 반대쪽
  // 끝으로 옮기는가. 실제 탭 키가 그 자리로 간다는 것은 브라우저 몫이다.

  function fixtureEntry(slug: string, title: string): WorkEntry {
    return {
      slug,
      title,
      blurb: `${title}의 한 줄 소개`,
      object: { type: 'image', src: `/works/${slug}/object.webp` },
      Page: () => null,
    }
  }

  // 세 항목 — 지금 등록부에는 작품이 하나뿐이라 첫 정거장과 마지막 정거장이
  // 같아져서 고리가 도는지 아닌지를 구별할 수 없다.
  const SLIDE_ENTRIES: readonly WorkEntry[] = [
    fixtureEntry('zephyr', '제퍼'),
    fixtureEntry('anemone', '아네모네'),
    fixtureEntry('marble', '마블'),
  ]

  function renderSlide(onDismiss: () => void) {
    const view = render(
      <MemoryRouter>
        <WorksList
          variant="slide"
          entries={SLIDE_ENTRIES}
          onDismiss={onDismiss}
        />
      </MemoryRouter>,
    )
    const surface = listSurface(view.container)
    // 목록 안의 탭 정거장 — 카드 하나가 링크 하나다.
    const stops = Array.from(surface.querySelectorAll<HTMLElement>('a[href]'))
    expect(stops.length, '고리를 볼 수 있을 만큼 정거장이 있다').toBe(
      SLIDE_ENTRIES.length,
    )
    return { ...view, surface, stops }
  }

  it('Esc가 나가는 길이다 (Requirement 20)', () => {
    // 이 절이 깨지면 아래 탭 고리는 방문자를 가두는 함정이 된다.
    const onDismiss = vi.fn()
    const { surface } = renderSlide(onDismiss)

    pressKey(surface, 'Escape')

    expect(onDismiss, 'Esc 한 번이면 목록이 닫힌다').toHaveBeenCalledTimes(1)
  })

  it('⌘·Ctrl·Alt가 눌린 Esc는 나가는 길이 아니다', () => {
    // 조합이 눌린 키는 방문자와 그의 브라우저·OS의 것이다 (keyNav.ownsChord).
    // 세 배선이 나눠 쓰는 그 판정이 이 화면에서도 실제로 걸리는지 본다.
    const onDismiss = vi.fn()
    const { surface } = renderSlide(onDismiss)

    for (const held of ['metaKey', 'ctrlKey', 'altKey'] as const) {
      fireEvent.keyDown(surface, { key: 'Escape', [held]: true })
    }

    expect(onDismiss, '조합이 눌린 Esc는 목록을 닫지 않는다').not.toHaveBeenCalled()
  })

  it('탭이 마지막 정거장에서 처음으로 돈다 (Requirement 17)', () => {
    const { surface, stops } = renderSlide(vi.fn())
    const [first, , last] = stops
    last.focus()

    expect(pressKey(surface, 'Tab'), '고리의 끝에서는 탭을 가로챈다').toBe(false)
    expect(document.activeElement, '초점은 처음 정거장으로 감긴다').toBe(first)
  })

  it('역방향 탭은 처음 정거장에서 마지막으로 돈다', () => {
    // Shift는 조합으로 치지 않는다 (keyNav.ownsChord) — 여기가 그 결과다.
    // Shift를 조합에 넣으면 고리가 한쪽으로만 돌아 이 단언이 어긋난다.
    const { surface, stops } = renderSlide(vi.fn())
    const [first, , last] = stops
    first.focus()

    expect(
      fireEvent.keyDown(surface, { key: 'Tab', shiftKey: true }),
      '고리의 반대쪽 끝에서도 가로챈다',
    ).toBe(false)
    expect(document.activeElement, '초점은 마지막 정거장으로 감긴다').toBe(last)
  })

  it('고리 안쪽에서는 브라우저의 표준 탭 순서를 그대로 둔다', () => {
    // 가로채는 것은 끝에서뿐이다. 안쪽까지 가져가면 이 계층이 목록 안의 탭
    // 순서를 새로 정하는 셈이 된다 (B2: 탭의 뜻은 표준이다).
    const { surface, stops } = renderSlide(vi.fn())
    stops[0].focus()

    expect(pressKey(surface, 'Tab'), '안쪽 탭은 표준대로다').toBe(true)
    expect(document.activeElement, '초점을 우리가 옮기지 않는다').toBe(stops[0])
  })

  it('방향키는 목록 항목 사이만 움직인다 (Requirement 17)', () => {
    // 고리의 다른 절 — 방향키는 목록을 벗어나지 않고, 끝에서 처음으로
    // 순환한다. 슬라이드가 씬 위에 있어도 방향키가 뒤의 씬으로 새지 않는다.
    const { surface } = renderSlide(vi.fn())

    const visited: (string | null)[] = []
    for (let i = 0; i < SLIDE_ENTRIES.length + 1; i += 1) {
      pressKey(surface, 'ArrowDown')
      expect(surface.contains(document.activeElement), '초점은 목록 안이다').toBe(
        true,
      )
      visited.push(focusedSlug())
    }

    expect(visited.slice(0, SLIDE_ENTRIES.length), '항목 순서대로 돈다').toEqual(
      SLIDE_ENTRIES.map((entry) => entry.slug),
    )
    expect(visited[SLIDE_ENTRIES.length], '마지막 다음은 처음이다').toBe(
      SLIDE_ENTRIES[0].slug,
    )
  })
})

describe('B2: 작품 페이지의 키는 브라우저 기본 그대로다 (Requirement 6)', () => {
  const FIRST_WORK_PATH = workPath(works[0].slug)

  it('방향키와 스페이스를 가로채지 않는다 — 페이지가 스크롤된다', async () => {
    const { container } = renderAt(FIRST_WORK_PATH)
    await settle()
    const page = container.firstElementChild
    expect(page, '작품 페이지가 화면에 있다').toBeTruthy()

    for (const key of [...ARROW_KEYS, SPACE]) {
      expect(pressKey(page as Element, key), `${key}는 그대로 산다`).toBe(true)
    }
  })

  it('탭을 가로채지 않는다 — 탭으로 페이지를 벗어날 수 있다', async () => {
    const { container } = renderAt(FIRST_WORK_PATH)
    await settle()
    const page = container.firstElementChild as Element

    expect(pressKey(page, 'Tab'), '정방향').toBe(true)
    expect(
      fireEvent.keyDown(page, { key: 'Tab', shiftKey: true }),
      '역방향',
    ).toBe(true)
  })
})
