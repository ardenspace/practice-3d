import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { routes } from './routes.tsx'
import { WORK_ITEM_ATTR } from './theme.ts'
import { WORKS_PATH, workPath, works } from './works/registry.ts'
import WorksOpenIcon from './works/WorksOpenIcon.tsx'

// B3 — 라우팅 표면의 히스토리 규칙(다섯 행)과, 그 표의 네 번째 행이
// 말하는 작품 페이지의 Esc.
//
// 표는 방문자가 뒤로가기를 눌렀을 때 어디에 닿는지에 대한 약속이다:
//   ① 아이콘으로 목록 열기        → 하나 남긴다 (뒤로가기로 닫힌다)
//   ② 방울이나 목록에서 작품 열기 → 하나 남긴다
//   ③ Esc·바깥 클릭으로 목록 닫기 → 늘리지 않는다
//   ④ 작품 페이지에서 Esc         → 늘리지 않는다
//   ⑤ 씬 불가로 `/` → `/works`    → 남기지 않는다 (갈아친다)
//
// jsdom에는 WebGL이 없다 — 이 파일의 모든 렌더는 씬을 띄울 수 없는
// 방문자다. 그래서 확인할 수 없는 것과 그 이유:
// - ①의 아이콘은 씬이 뜬 홈에만 있다. 그래서 확인은 아이콘만 따로 렌더하는
//   씬 없는 seam을 통한다 (B3가 지정한 방식).
// - ②의 "방울에서 열기"는 씬이 있어야 존재한다. 목록에서 여는 쪽만 본다.
// - ③은 씬 위 슬라이드에서만 일어난다 (Requirement 22: 씬을 띄울 수 없는
//   방문자에게는 목록을 닫는 동작 자체가 없다 — 그 사실은
//   keys/keyboardSurfaces.test.tsx가 확인한다). 되감을지 갈아칠지의 규칙
//   자체는 화면 없는 works/listClose.ts에 있고 listClose.test.ts가 핀한다.
//   그 판정을 목록 닫기가 실제로 거치는지 — Esc도 바깥 클릭도 — 는 씬 셸을
//   대역으로 세워 보는 scene/sceneShell.test.tsx가 끝까지 확인한다.
//   닫는 길이 하나 더 생겨도 판정을 새로 내리지 말고 그 모듈을 거쳐야 한다.
// - ④의 목적지 가운데 "씬을 띄울 수 있으면 홈의 그 방울"(Requirement 41)은
//   씬이 필요하다. 씬 없는 쪽 목적지 — 전체 화면 목록의 그 항목 — 만 본다.

afterEach(cleanup)

const FIRST_SLUG = works[0].slug
const FIRST_WORK_PATH = workPath(FIRST_SLUG)

function renderAt(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  return { router, ...render(<RouterProvider router={router} />) }
}

/** 대기 중인 이동만 비운다. 타이머는 돌리지 않는다. */
async function settle() {
  await act(async () => {})
  await act(async () => {})
}

function focusedSlug(): string | null {
  return (
    document.activeElement
      ?.closest(`[${WORK_ITEM_ATTR}]`)
      ?.getAttribute(WORK_ITEM_ATTR) ?? null
  )
}

function pressEscape(target: Element | null): void {
  if (target === null) throw new Error('키를 보낼 화면이 없다')
  fireEvent.keyDown(target, { key: 'Escape' })
}

/** 목록에서 첫 작품의 항목 링크를 눌러 작품 페이지로 들어간다. */
async function enterWorkFromList(container: HTMLElement) {
  const item = container.querySelector(`[${WORK_ITEM_ATTR}="${FIRST_SLUG}"]`)
  expect(item, '목록에 그 작품의 항목이 있다').toBeTruthy()
  fireEvent.click(item as Element)
  await settle()
}

describe('B3 ①: 아이콘으로 목록 열기는 히스토리를 하나 남긴다', () => {
  // 아이콘은 씬이 떠 있을 때만 존재하므로(Requirement 23) 씬 없는 seam으로
  // 확인한다 — 아이콘 하나만 라우터에 얹어 그 링크가 무엇을 하는지 본다.
  const STAND_IN = 'works-stand-in'
  const iconRoutes: RouteObject[] = [
    { path: '/', element: <WorksOpenIcon /> },
    { path: WORKS_PATH, element: <div data-testid={STAND_IN} /> },
  ]

  it('아이콘을 활성화하면 주소가 `/works`가 되고 뒤로가기 한 번에 `/`로 돌아간다', async () => {
    const router = createMemoryRouter(iconRoutes, { initialEntries: ['/'] })
    const { container } = render(<RouterProvider router={router} />)

    fireEvent.click(container.querySelector(`a[href="${WORKS_PATH}"]`) as Element)
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(WORKS_PATH),
    )
    expect(router.state.historyAction, '항목 하나가 남는다').toBe('PUSH')

    await act(async () => {
      await router.navigate(-1)
    })
    expect(
      router.state.location.pathname,
      '뒤로가기 한 번이면 목록이 닫힌다',
    ).toBe('/')
  })
})

describe('B3 ②: 목록에서 작품을 열면 히스토리가 하나 는다', () => {
  it('항목을 누르면 그 작품 페이지가 새 항목으로 쌓인다', async () => {
    const { router, container } = renderAt(WORKS_PATH)
    await settle()

    await enterWorkFromList(container)

    expect(router.state.location.pathname).toBe(FIRST_WORK_PATH)
    expect(router.state.historyAction, '되감을 자리가 남는다').toBe('PUSH')
  })
})

describe('B3 ④: 작품 페이지에서 Esc는 히스토리를 늘리지 않는다', () => {
  it('들어온 자리로 되돌아간다 — 목록으로 들어왔으면 그 항목에 초점 (Requirement 40)', async () => {
    const { router, container } = renderAt(WORKS_PATH)
    await settle()
    await enterWorkFromList(container)
    expect(router.state.location.pathname).toBe(FIRST_WORK_PATH)

    pressEscape(container.firstElementChild)

    await waitFor(() =>
      expect(router.state.location.pathname, '왔던 자리로 나온다').toBe(
        WORKS_PATH,
      ),
    )
    expect(
      router.state.historyAction,
      '새 항목을 쌓지 않고 되감는다',
    ).toBe('POP')
    await waitFor(() =>
      expect(focusedSlug(), '들어올 때 눌렀던 그 항목에 초점').toBe(FIRST_SLUG),
    )
  })

  it('주소를 직접 열었으면 갈아친다 — 목적지는 주소에 적힌 작품에서 파생 (Requirement 41)', async () => {
    // 되감을 자리가 없다. 그대로 되감으면 사이트 밖으로 튕겨 나가므로
    // 현재 항목을 목적지로 갈아친다. 씬을 띄울 수 없는 방문자의 목적지는
    // 전체 화면 목록이고, 초점은 그 작품의 항목이다.
    const { router, container } = renderAt(FIRST_WORK_PATH)
    await settle()

    pressEscape(container.firstElementChild)

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(WORKS_PATH),
    )
    expect(
      router.state.historyAction,
      '히스토리를 늘리지 않는다 — 갈아친다',
    ).toBe('REPLACE')
    await waitFor(() =>
      expect(focusedSlug(), '주소에 적힌 그 작품의 항목에 초점').toBe(
        FIRST_SLUG,
      ),
    )
  })

  it('"들어온 자리"는 페이지 수명을 넘겨 살아남지 않는다', async () => {
    // 새로고침한 방문자에게는 들어온 자리가 없어야 Requirement 41의 기본
    // 목적지가 성립한다. 자리를 어디에 들고 있을지는 위임 구역이지만,
    // 페이지가 사라져도 남는 저장소만은 안 된다 — 거기 두면 새로고침한
    // 방문자가 남의 기억으로 되감긴다.
    const { container } = renderAt(WORKS_PATH)
    await settle()
    await enterWorkFromList(container)

    // 세션 저장소만 본다 — 이 환경의 window.localStorage는 빈 객체라
    // 들여다볼 것이 없다(쓰려고 하면 그 자리에서 터진다).
    expect(window.sessionStorage.length, '세션 저장소에 남기지 않는다').toBe(0)
  })
})

describe('B3 ⑤: 씬 불가로 `/` → `/works`는 히스토리를 남기지 않는다', () => {
  it('`/` 항목을 갈아친다', async () => {
    const { router } = renderAt('/')

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(WORKS_PATH),
    )
    expect(
      router.state.historyAction,
      '밀어 넣으면 뒤로가기가 `/`와 `/works`를 오간다',
    ).toBe('REPLACE')
  })
})
