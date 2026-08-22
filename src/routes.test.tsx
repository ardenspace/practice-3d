import { cleanup, render } from '@testing-library/react'
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
  return render(<RouterProvider router={router} />)
}

// 씬 없는 방문자(jsdom에는 WebGL이 없다)에게 `/works`가 되는 모습.
const FULLSCREEN: WorksListVariant = 'fullscreen'

describe('B3: routing surface', () => {
  it('/ renders the home screen', () => {
    const { queryByTestId } = renderAt('/')
    expect(queryByTestId(HOME_TESTID)).toBeTruthy()
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

  it('/ does not render the works list', () => {
    const { queryByTestId } = renderAt('/')
    expect(
      queryByTestId(WORKS_TESTID),
      'the list belongs to /works, not /',
    ).toBeNull()
  })

  it('deep link /works/vending-machine renders the work page, not home', () => {
    const { container, queryByTestId } = renderAt('/works/vending-machine')
    expect(queryByTestId(HOME_TESTID), 'must not redirect home').toBeNull()
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
        container.querySelector('a[href="/"]'),
        `${w.slug}: page must link back to /`,
      ).toBeTruthy()
      unmount()
    }
  })

  it('unknown work slug goes home', () => {
    const { queryByTestId } = renderAt('/works/no-such-work')
    expect(queryByTestId(HOME_TESTID)).toBeTruthy()
  })

  it('unknown path goes home', () => {
    const { queryByTestId } = renderAt('/definitely/not/a/route')
    expect(queryByTestId(HOME_TESTID)).toBeTruthy()
  })
})
