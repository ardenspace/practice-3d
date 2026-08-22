import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { routes } from '../routes.tsx'
import { WORKS_DISMISS_TESTID, WORKS_TESTID, WORK_ITEM_ATTR } from '../theme.ts'
import { WORKS_PATH, workPath, works } from '../works/registry.ts'

// B2 — 키보드 조작 계약이 실제 화면 위에서 지켜지는지.
//
// jsdom에는 WebGL이 없다. 그래서 이 파일의 모든 렌더는 "씬을 띄울 수 없는
// 방문자"이고, 그가 보는 화면은 전체 화면 작품 목록(`/works`)과 작품
// 페이지뿐이다. getContext를 참으로 속이지 않는다 — 속이면 R3F 캔버스가
// 실제로 마운트되며 three.js가 죽는다.
//
// 여기서 확인할 수 없는 것과 그 이유:
// - 씬이 뜬 홈의 키보드(Requirements 1·5의 앞부분·7·8·9·11·12). 씬이 있어야
//   존재하는 화면이라 이 환경에서 만들 수 없다. 순회 규칙 자체는 화면을
//   모르는 keyNav.test.ts가 전부 확인한다 (B2: 표현과의 분리).
// - 슬라이드로 열린 목록(Requirements 17·20)과 그 안의 탭 고리. 슬라이드는
//   씬 위에만 존재한다.
// - 탭 키 자체. jsdom은 탭을 구현하지 않아 "탭을 눌러 다음 요소로 간다"를
//   실행할 수 없다. 대신 이 화면들이 탭을 가로채지 않는다는 것(= 탭으로
//   페이지를 벗어날 수 있다)은 아래에서 확인한다. 정방향·역방향 탈출의
//   실제 확인은 브라우저 스모크 몫이다.
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
