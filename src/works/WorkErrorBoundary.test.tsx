import { cleanup, render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WORK_ERROR_MESSAGE } from '../theme.ts'
import WorkErrorBoundary from './WorkErrorBoundary.tsx'

// 작품 페이지 에러 바운더리 계약 (spec Conventions / Failure Behavior):
// 작품 라우트의 element가 렌더 중 크래시하면 백지 대신 실패 문구 +
// 홈(`/`) 링크의 최소 화면이 렌더된다. 실제 등록부 항목이 아니라
// 픽스처 라우트/컴포넌트로 검증한다 — 등록부(B1)와 무관한 순수 계약.

function CrashingFixturePage(): never {
  throw new Error('fixture: work page render crash')
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('WorkErrorBoundary', () => {
  it('a crashing work route renders the failure message and a home link', () => {
    // React가 잡힌 에러를 console.error로 시끄럽게 알리는 것만 잠재운다.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const router = createMemoryRouter(
      [
        {
          path: '/works/crashing-fixture',
          element: (
            <WorkErrorBoundary>
              <CrashingFixturePage />
            </WorkErrorBoundary>
          ),
        },
        { path: '/', element: <div /> },
      ],
      { initialEntries: ['/works/crashing-fixture'] },
    )
    const { container, getByText } = render(<RouterProvider router={router} />)

    expect(getByText(WORK_ERROR_MESSAGE)).toBeTruthy()
    expect(
      container.querySelector('a[href="/"]'),
      'crash screen must link back to /',
    ).toBeTruthy()
  })

  it('renders its children untouched when nothing crashes', () => {
    const { getByText, queryByText } = render(
      <WorkErrorBoundary>
        <p>healthy work page</p>
      </WorkErrorBoundary>,
    )
    expect(getByText('healthy work page')).toBeTruthy()
    expect(queryByText(WORK_ERROR_MESSAGE)).toBeNull()
  })
})
