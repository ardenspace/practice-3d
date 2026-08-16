import { cleanup, render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { routes } from './routes.tsx'
import { HOME_TESTID } from './theme.ts'
import { works } from './works/registry.ts'

afterEach(cleanup)

// Deep-link semantics: the router is created at the given URL directly,
// mirroring a direct visit (production serving relies on `vite preview`'s
// default SPA fallback; client-side handling is what is pinned here).
function renderAt(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  return render(<RouterProvider router={router} />)
}

describe('B3: routing surface', () => {
  it('/ renders the home screen', () => {
    const { queryByTestId } = renderAt('/')
    expect(queryByTestId(HOME_TESTID)).toBeTruthy()
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
