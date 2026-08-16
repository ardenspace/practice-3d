import { cleanup, render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../routes.tsx'
import { BACKDROP_SRC, HOME_TESTID, SITE_TITLE } from '../theme.ts'
import { workPath, works } from '../works/registry.ts'

// B4: 씬 폴백 계약 — "로드 시 차단" 케이스.
// WebGL 컨텍스트 생성이 실패하는 환경에서 홈 라우트를 로드하면
// 배경 이미지 + 사이트 제목 + 등록된 모든 작품의 텍스트 링크 목록이
// 렌더되어야 한다. (실행 중 상실은 같은 의무이나 수동 검수 범위 — spec B4.)

const realGetContext = HTMLCanvasElement.prototype.getContext

// jsdom은 원래 WebGL 컨텍스트에 null을 반환하지만, 여기서 명시적으로
// 차단한다 — 훗날 test setup에 canvas mock이 들어와도 이 계약은
// "WebGL 없음" 환경을 유지한 채 핀으로 남는다.
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

function renderHome() {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  return render(<RouterProvider router={router} />)
}

describe('B4: scene fallback when WebGL is blocked at load', () => {
  it('sanity: WebGL context creation is blocked in this environment', () => {
    const canvas = document.createElement('canvas')
    expect(canvas.getContext('webgl')).toBeNull()
    expect(canvas.getContext('webgl2')).toBeNull()
  })

  it('home renders the fallback: backdrop + site title + one text link per registered work', () => {
    const { getByTestId, getByRole } = renderHome()

    const home = getByTestId(HOME_TESTID)

    // 배경 이미지: 폴백 렌더가 BACKDROP_SRC를 참조해야 한다
    // (inline background-image든 <img>든 — 참조 자체가 계약).
    expect(
      home.outerHTML,
      'fallback must render the backdrop image',
    ).toContain(BACKDROP_SRC)

    // 사이트 제목.
    expect(getByRole('heading', { name: SITE_TITLE })).toBeTruthy()

    // 등록부 전 작품 — 항목당 정확히 하나의 텍스트 링크 (등록부를 순회,
    // 개수 하드코딩 금지: 항목 추가만으로 폴백 링크가 늘어야 한다).
    expect(works.length).toBeGreaterThan(0)
    for (const w of works) {
      const links = home.querySelectorAll(`a[href="${workPath(w.slug)}"]`)
      expect(
        links.length,
        `${w.slug}: fallback must contain exactly one link to its page`,
      ).toBe(1)
      expect(
        links[0]?.textContent,
        `${w.slug}: link text must show the work title`,
      ).toContain(w.title)
    }
  })
})
