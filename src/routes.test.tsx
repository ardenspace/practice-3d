import { act, cleanup, render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { routes } from './routes.tsx'
import { HOME_TESTID, WORKS_TESTID } from './theme.ts'
import { WORKS_PATH, works } from './works/registry.ts'
import type { WorksListVariant } from './works/WorksList.tsx'

afterEach(cleanup)

// Deep-link semantics: the router is created at the given URL directly,
// mirroring a direct visit (production serving relies on `vite preview`'s
// default SPA fallback; client-side handling is what is pinned here).
function renderAt(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  return { router, ...render(<RouterProvider router={router} />) }
}

type TestRouter = ReturnType<typeof createMemoryRouter>

/** 대기 중인 이동만 비운다. 타이머는 돌리지 않는다. */
async function settle() {
  await act(async () => {})
  await act(async () => {})
}

/**
 * 이 주소를 맡은 최상위 라우트의 path.
 *
 * "홈이 렌더되었다"의 판별을 HOME_TESTID에서 여기로 옮겼다. 그 표식은 방울
 * 씬이 실제로 뜬 화면에만 있는데, 씬을 띄울 수 없는 방문자에게 `/`는
 * `/works`의 전체 화면 목록이 되므로(B4) 씬 없는 환경에서는 더 이상 참이
 * 아니다. 반면 `/works`는 `/`의 자식 라우트라 두 세계 모두에서 최상위 매치는
 * `/`다 — B3가 실제로 주장하던 바(이 경로는 홈 라우트가 맡는다, catch-all이
 * 조용히 새지 않는다)는 이 값으로 그대로 남는다.
 */
function topRoutePath(router: TestRouter): string | undefined {
  return router.state.matches[0]?.route.path
}

// 씬 없는 방문자(jsdom에는 WebGL이 없다)에게 `/works`가 되는 모습.
const FULLSCREEN: WorksListVariant = 'fullscreen'

describe('B3: routing surface', () => {
  it('/ is served by the home route', async () => {
    const { router, container } = renderAt('/')
    await settle()

    expect(topRoutePath(router), '`/` must be served by the home route').toBe(
      '/',
    )
    // 백지가 아니다 — 씬이든 목록이든 홈 라우트가 화면을 그려 낸다.
    expect(
      container.querySelector('main'),
      '`/` must render a screen, not nothing',
    ).toBeTruthy()
  })

  it('/works renders the works list, not home', () => {
    const { queryByTestId } = renderAt(WORKS_PATH)

    // 자기 표식이 있어야 목록이 열린 화면과 홈을 구별할 수 있다. 자식 라우트
    // 경로가 어긋나면 `/works`는 catch-all을 타고 조용히 홈이 되므로, 이
    // 단언이 그 조용한 낙하를 잡는 유일한 자리다.
    const list = queryByTestId(WORKS_TESTID)
    expect(list, '/works must render the works list surface').toBeTruthy()
    expect(
      list?.getAttribute('data-variant'),
      '/works without a scene is the fullscreen view',
    ).toBe(FULLSCREEN)
    expect(
      queryByTestId(HOME_TESTID),
      '/works must not fall through to the home screen',
    ).toBeNull()
  })

  it('the works list is never shown at /', async () => {
    // 앞의 진술은 "`/`에는 목록이 없다"였다. 씬을 띄울 수 없는 방문자에게는
    // 목록이 곧 홈이므로 그 문장 그대로는 더 이상 참이 아니다. 그러나 그
    // 문장이 지키려던 것 — 목록은 `/`가 아니라 자기 주소에 산다 — 은 그대로
    // 남는다: 목록이 화면에 있으면 주소는 `/works`다 (B4는 `/`를 그리로
    // 갈아친다).
    const { router, queryByTestId } = renderAt('/')
    await settle()

    expect(
      queryByTestId(WORKS_TESTID),
      'a visitor without a scene sees the list',
    ).toBeTruthy()
    expect(
      router.state.location.pathname,
      'the list belongs to /works, not /',
    ).toBe(WORKS_PATH)
  })

  it('deep link /works/vending-machine renders the work page, not home', () => {
    const { container, queryByTestId } = renderAt('/works/vending-machine')
    // 홈은 두 모습으로 나타난다 — 씬이 뜨면 HOME_TESTID, 못 뜨면 전체 화면
    // 목록. 작품 페이지는 그 어느 쪽도 아니다.
    expect(queryByTestId(HOME_TESTID), 'must not redirect home').toBeNull()
    expect(
      queryByTestId(WORKS_TESTID),
      'must not fall back to the scene-less home',
    ).toBeNull()
    expect(
      container.querySelector('a[href="/"]'),
      'work page must link back to /',
    ).toBeTruthy()
  })

  it('every registered work is reachable at /works/<slug>', () => {
    expect(works.length).toBeGreaterThan(0)
    for (const w of works) {
      const { container, queryByTestId, unmount } = renderAt(`/works/${w.slug}`)
      expect(queryByTestId(HOME_TESTID), `${w.slug}: must not redirect home`).toBeNull()
      expect(
        queryByTestId(WORKS_TESTID),
        `${w.slug}: must not fall back to the scene-less home`,
      ).toBeNull()
      expect(
        container.querySelector('a[href="/"]'),
        `${w.slug}: page must link back to /`,
      ).toBeTruthy()
      unmount()
    }
  })

  it('unknown work slug goes home', async () => {
    const { router } = renderAt('/works/no-such-work')
    await settle()

    // catch-all이 홈으로 보냈고, 거기 머물러 있다 — 홈 라우트가 이 방문자의
    // 화면을 맡는다. (씬이 없으면 홈 라우트 안에서 목록으로 한 번 더
    // 갈아치지만, 그것도 여전히 홈 라우트다.)
    expect(
      topRoutePath(router),
      'an unregistered slug must land on the home route',
    ).toBe('/')
  })

  it('unknown path goes home', async () => {
    const { router } = renderAt('/definitely/not/a/route')
    await settle()

    expect(
      topRoutePath(router),
      'an unknown path must land on the home route',
    ).toBe('/')
  })
})
