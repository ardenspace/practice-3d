import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../routes.tsx'
import { SCENE_FALLBACK_NOTICE, WORKS_TESTID } from '../theme.ts'
import { WORKS_PATH, workPath, works } from '../works/registry.ts'
import type { WorksListVariant } from '../works/WorksList.tsx'

// B4 — 씬을 띄울 수 없을 때 방문자가 보는 것.
//
// 씬을 못 띄우는 화면은 더 이상 작품 목록을 자기 손으로 그리지 않는다.
// 대신 목록이 사는 주소(`/works`)로 갈아치고, 그 이동이 방문자가 요청한
// 것이 아닐 때만 안내 문구가 붙는다 (Requirement 35~39).
//
// jsdom에는 WebGL이 없다 — 그래서 이 파일의 모든 렌더는 그 자체로 "씬을
// 띄울 수 없는 방문자"다. getContext를 참으로 속이면 R3F 캔버스가 실제로
// 마운트되며 three.js가 죽으므로 절대 속이지 않는다. 아래 beforeEach는
// 반대 방향의 못이다: 훗날 test setup에 canvas mock이 들어와도 이 파일만은
// WebGL 없는 환경을 유지한다.
//
// 여기서 핀하지 않는 것:
// - 실행 중 컨텍스트 상실(`webglcontextlost`)과 뒤늦은 복구
//   (`webglcontextrestored`). 씬이 떠 있어야 일어나는 사건이라 씬이 절대
//   뜨지 않는 jsdom에서는 재현할 수 없다. 로드 시점의 같은 의무 —
//   "`/works`에 있는데 씬이 끝내 올라오지 못하면 이동 없이 전체 화면 목록"
//   — 만 아래에서 확인한다.
// - 초점이 어디로 가는지 (Requirement 38의 뒷부분), 보조기술이 문구를
//   읽는지 (B6), 키보드 조작. 이 파일은 문구가 화면에 있는지까지만 본다.

const realGetContext = HTMLCanvasElement.prototype.getContext

const blockedGetContext = function (
  this: HTMLCanvasElement,
  ...args: Parameters<HTMLCanvasElement['getContext']>
) {
  // Parameters<>는 오버로드 중 마지막 시그니처만 뽑는다 — three의 타입이
  // getContext('webgpu') 오버로드를 추가해도 이 판정은 문자열 비교라
  // string으로 넓혀 비교한다 (런타임 동작 불변).
  const [contextId] = args as [string, ...unknown[]]
  if (
    contextId === 'webgl' ||
    contextId === 'webgl2' ||
    contextId === 'experimental-webgl'
  ) {
    return null
  }
  return realGetContext.apply(this, args)
} as HTMLCanvasElement['getContext']

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = blockedGetContext
})

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
  cleanup()
})

// 씬 없는 방문자에게 `/works`가 되는 모습.
const FULLSCREEN: WorksListVariant = 'fullscreen'

// 등록부의 첫 항목 — 작품 페이지에서 출발하는 시나리오의 출발점.
const FIRST_WORK_PATH = workPath(works[0].slug)

function renderAt(...entries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries: entries })
  return { router, ...render(<RouterProvider router={router} />) }
}

/**
 * 대기 중인 일만 비운다. 타이머는 한 칸도 돌리지 않는다 — 시간이 지나야
 * 일어나는 이동은 B4가 금지하므로, 이 함수 뒤에 이미 끝나 있어야 한다.
 */
async function settle() {
  await act(async () => {})
  await act(async () => {})
}

/** 안내 문구가 화면에 있는가 (어떤 요소로 그려졌는지는 묻지 않는다). */
function noticeShown(container: HTMLElement): boolean {
  return (container.textContent ?? '').includes(SCENE_FALLBACK_NOTICE)
}

function listSurface(container: HTMLElement): Element | null {
  return container.querySelector(`[data-testid="${WORKS_TESTID}"]`)
}

describe('B4: 씬을 띄울 수 없을 때', () => {
  it('sanity: WebGL context creation is blocked in this environment', () => {
    const canvas = document.createElement('canvas')
    expect(canvas.getContext('webgl')).toBeNull()
    expect(canvas.getContext('webgl2')).toBeNull()
  })

  describe('`/`를 연 방문자는 작품 목록으로 옮겨진다', () => {
    it('`/works`의 전체 화면 목록이 그 방문자의 화면이 된다', async () => {
      const { router, container } = renderAt('/')

      await waitFor(() =>
        expect(
          router.state.location.pathname,
          '씬을 띄울 수 없으면 목록이 사는 주소로 옮긴다',
        ).toBe(WORKS_PATH),
      )

      const surface = listSurface(container)
      expect(surface, '목록 표면이 화면에 있어야 한다').toBeTruthy()
      expect(
        surface?.getAttribute('data-variant'),
        '씬이 없으므로 슬라이드가 아니라 전체 화면이다',
      ).toBe(FULLSCREEN)
    })

    it('기다리게 하지 않는다 — 타이머를 돌리지 않아도 이미 목록이다', async () => {
      const { router, container } = renderAt('/')

      // settle()은 시간을 흘려보내지 않는다. 중간 화면을 보여 두었다가
      // 시간이 지나면 넘어가는 이동이었다면 여기서 잡힌다.
      await settle()

      expect(
        router.state.location.pathname,
        '지연된 이동 금지 (Requirement 35)',
      ).toBe(WORKS_PATH)
      expect(listSurface(container), '목록이 이미 떠 있어야 한다').toBeTruthy()
    })

    it('히스토리를 남기지 않는다 — `/` 항목을 갈아친다', async () => {
      const { router } = renderAt('/')

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(WORKS_PATH),
      )
      expect(
        router.state.historyAction,
        '밀어 넣으면 뒤로가기가 `/`와 `/works`를 오간다 (B3)',
      ).toBe('REPLACE')
    })

    it('뒤로가기가 `/`를 거쳐 다시 튕겨 나오지 않는다', async () => {
      // 작품 페이지 → 홈 링크 → (씬 불가) → 목록. 여기서 뒤로 가면 방문자가
      // 마지막으로 스스로 고른 자리, 즉 작품 페이지로 돌아가야 한다. `/`가
      // 히스토리에 남아 있으면 그리로 갔다가 즉시 목록으로 튕겨 나온다.
      const { router, container } = renderAt(FIRST_WORK_PATH)

      const homeLink = container.querySelector('a[href="/"]')
      expect(homeLink, '작품 페이지에는 홈 링크가 있다').toBeTruthy()
      fireEvent.click(homeLink as Element)

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(WORKS_PATH),
      )

      await act(async () => {
        await router.navigate(-1)
      })
      await settle()

      expect(
        router.state.location.pathname,
        '뒤로가기는 작품 페이지로 돌아간다',
      ).toBe(FIRST_WORK_PATH)
    })
  })

  describe('안내 문구는 뜻하지 않은 이동에만 붙는다', () => {
    it('문구는 스펙이 정한 그대로다', () => {
      // 드리프트 가드 (Requirement 36: "문구는 그대로 쓴다"). 토큰을 고치면
      // 여기서 시끄럽게 실패한다 — 리터럴은 스펙에서 그대로 옮겨 왔다.
      expect(SCENE_FALLBACK_NOTICE).toBe(
        '3D 씬을 띄우는 데 문제가 있어 대신 작품 목록을 바로 볼 수 있는 페이지로 이동했습니다.',
      )
    })

    it('씬을 못 띄워 옮겨진 방문자에게는 문구가 보인다', async () => {
      const { router, container } = renderAt('/')

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(WORKS_PATH),
      )
      expect(
        noticeShown(container),
        '요청하지 않은 이동에는 안내가 붙는다 (Requirement 36)',
      ).toBe(true)
    })

    it('`/works`를 직접 열었거나 새로고침했으면 문구가 없다', async () => {
      // 새로고침은 이 주소를 다시 여는 것과 같다 — 방문의 첫 화면으로
      // `/works`가 열리는 이 경우가 두 갈래를 함께 덮는다.
      const { router, container } = renderAt(WORKS_PATH)
      await settle()

      expect(
        router.state.location.pathname,
        '이미 목록에 있으므로 아무 데도 가지 않는다',
      ).toBe(WORKS_PATH)
      const surface = listSurface(container)
      expect(surface?.getAttribute('data-variant'), '같은 화면이다').toBe(
        FULLSCREEN,
      )
      expect(
        noticeShown(container),
        '스스로 연 화면에는 안내가 붙지 않는다 (Requirement 37)',
      ).toBe(false)
    })

    it('알 수 없는 주소를 연 방문자에게는 문구가 보인다', async () => {
      // 방문자는 없는 주소를 열었고, catch-all이 그를 `/`로 갈아친 뒤 씬이
      // 없어 다시 목록으로 옮긴다. 그는 작품 목록을 요청한 적이 없다 —
      // Requirement 37의 어느 면제에도 해당하지 않는다 (직접 열지도,
      // 새로고침하지도, 스스로 링크를 누르지도 않았다).
      //
      // 갈아치기는 새 히스토리 키를 받으므로 "이 방문의 첫 항목인가"만으로는
      // 이 방문자가 스스로 누른 링크로 온 방문자와 구별되지 않는다.
      const { router, container } = renderAt('/definitely/not/a/route')

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(WORKS_PATH),
      )
      expect(
        noticeShown(container),
        '요청하지 않은 이동에는 안내가 붙는다 (Requirement 36)',
      ).toBe(true)
    })

    it('작품 페이지의 홈 링크로 온 방문자에게는 문구가 없다', async () => {
      // 스스로 누른 링크로 닿았으므로 화면은 같고 안내만 없다
      // (Requirement 37).
      const { router, container } = renderAt(FIRST_WORK_PATH)

      fireEvent.click(container.querySelector('a[href="/"]') as Element)
      await waitFor(() =>
        expect(router.state.location.pathname).toBe(WORKS_PATH),
      )

      const surface = listSurface(container)
      expect(surface?.getAttribute('data-variant'), '같은 화면이다').toBe(
        FULLSCREEN,
      )
      expect(
        noticeShown(container),
        '스스로 누른 링크로 온 방문자에게는 안내가 붙지 않는다',
      ).toBe(false)
    })
  })

  it('작품 목록을 그리는 곳은 온 사이트에 하나다', async () => {
    // Requirement 39. 사이트의 모든 화면에서 작품 페이지로 가는 링크는
    // 목록 표면 안에서만 그려지고, 그 표면은 화면에 하나뿐이다. 폴백 화면이
    // 자기 손으로 목록을 그리던 자리가 남아 있으면 여기서 잡힌다.
    const paths = ['/', WORKS_PATH, ...works.map((w) => workPath(w.slug))]

    for (const path of paths) {
      const { container, unmount } = renderAt(path)
      await settle()

      const surfaces = container.querySelectorAll(
        `[data-testid="${WORKS_TESTID}"]`,
      )
      expect(
        surfaces.length,
        `${path}: 목록 표면은 화면에 많아야 하나다`,
      ).toBeLessThanOrEqual(1)

      const workLinks = Array.from(container.querySelectorAll('a')).filter((a) =>
        (a.getAttribute('href') ?? '').startsWith(`${WORKS_PATH}/`),
      )
      for (const link of workLinks) {
        expect(
          surfaces[0] !== undefined && surfaces[0].contains(link),
          `${path}: 작품 링크(${link.getAttribute('href')})가 목록 밖에서 그려졌다`,
        ).toBe(true)
      }

      unmount()
    }
  })
})
