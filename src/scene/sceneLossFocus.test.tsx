import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routes } from '../routes.tsx'
import { liveRegionTextIn } from '../spokenSurface.ts'
import { WORKS_OPEN_LABEL, WORKS_TESTID, WORK_ITEM_ATTR } from '../theme.ts'
import { WORKS_PATH, works } from '../works/registry.ts'

// Requirement 38의 방울 갈래 — 실행 중에 씬이 무너질 때 **방울에 있던**
// 초점이 가는 곳.
//
// 계약: "방울에 초점이 있었다면 초점은 그 방울에 해당하는 목록 항목으로 옮겨
// 간다. 사라진 요소에 초점이 남지 않는다."
//
// 이 갈래는 두 조각이 맞물려야 참이 된다 — 사라지기 직전의 DOM에서 무엇을
// 가리키고 있었는지 읽는 쪽(works/worksFocus.ts)과, 씬의 초점 정거장이 지금
// 어느 방울에 서 있는지를 그 DOM에 적어 두는 쪽(scene/Home.tsx). 어느 한쪽만
// 보는 테스트로는 둘 사이가 끊겨도 초록으로 남는다: 순수 모듈 쪽
// (works/worksFocus.test.tsx)은 목록 항목을 손으로 초점해서 부르므로 씬을
// 아예 지나가지 않고, 씬 셸 쪽 파일들은 씬이 무너지는 전이를 만들지 않는다.
// 그래서 이 파일은 전이를 통째로 — 방향키로 N번째 방울에 서고, 컨텍스트를
// 잃고, 화면이 전체 화면 목록이 될 때까지 — 지나간다.
//
// ── 대역 ──
// sceneShell.test.tsx·sceneAccessibility.test.tsx와 같은 기법이다: `./webgl.ts`
// 와 R3F `<Canvas>`를 갈아 끼워 씬의 **셸**만 세우고, 등록부도 갈아 끼워
// 작품을 여럿 만든다(진짜 등록부에는 하나뿐이라 "그 방울의 항목"과 "첫
// 항목"이 언제나 같아진다). getContext는 절대 참으로 속이지 않는다 — 속이면
// R3F 캔버스가 실제로 마운트되며 three.js가 죽는다.
//
// 여기서 한 가지가 더 필요하다: 무너지는 순간 자체. 진짜 R3F는 렌더러를 만든
// 뒤 그 캔버스 **요소**를 들고 onCreated를 부르고, Home은 그 요소에
// webglcontextlost를 듣는다. 대역은 그 요소 자리에 빈 <canvas>를 하나 놓아
// 준다 — 요소만 있으면 컨텍스트 상실을 실어 보낼 수 있고, 그리기에도
// getContext에도 닿지 않는다.

vi.mock('./webgl.ts', () => ({
  isWebGLAvailable: () => true,
}))

/** 대역 Canvas가 Home에 넘긴 캔버스 요소 — 컨텍스트 상실이 도착하는 자리. */
const sceneCanvas = vi.hoisted(() => ({
  current: null as HTMLCanvasElement | null,
}))

vi.mock('@react-three/fiber', async () => {
  const { useEffect } = await import('react')
  return {
    Canvas: (props: { onCreated?: unknown }) => {
      // 실제 R3F가 넘기는 상태(RootState) 가운데 Home이 쓰는 것은 gl.domElement
      // 하나다. 나머지를 흉내 내면 대역이 씬을 아는 척하게 된다.
      const onCreated = props.onCreated as
        | ((state: { gl: { domElement: HTMLCanvasElement } }) => void)
        | undefined
      useEffect(() => {
        const element = document.createElement('canvas')
        sceneCanvas.current = element
        onCreated?.({ gl: { domElement: element } })
        return () => {
          sceneCanvas.current = null
        }
      }, [onCreated])
      return null
    },
    useFrame: () => {},
  }
})

// 슬러그는 일부러 사전순이 아니고, 제목도 서로의 부분 문자열이 아니다.
const FIXTURES = vi.hoisted(() => {
  const entry = (slug: string, title: string) => ({
    slug,
    title,
    blurb: `${title}의 한 줄 소개`,
    object: { type: 'image' as const, src: `/works/${slug}/object.webp` },
    Page: () => null,
  })
  return [
    entry('zephyr', '제퍼'),
    entry('anemone', '아네모네'),
    entry('marble', '마블'),
  ]
})

vi.mock('../works/registry.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../works/registry.ts')>()),
  works: FIXTURES,
}))

afterEach(cleanup)

/** 첫 방울이 아닌 방울 — "방울 N에 있던 초점"의 N. */
const NTH = 2

function renderHome() {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  return { router, ...render(<RouterProvider router={router} />) }
}

/** 대기 중인 이동만 비운다. 타이머는 돌리지 않는다. */
async function settle() {
  await act(async () => {})
  await act(async () => {})
}

/**
 * 방향키로 씬 안 N번째 방울에 선다. 정거장을 DOM 모양으로 집지 않는 이유는
 * 그 자리가 어떤 요소인지가 위임 구역이기 때문이다 — 방문자가 겪는 대로,
 * 방향키가 데려가는 자리로 집는다.
 */
function standOnBubble(index: number): HTMLElement {
  for (let step = 0; step <= index; step += 1) {
    fireEvent.keyDown(document.body, { key: 'ArrowDown' })
  }
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || active === document.body) {
    throw new Error('방향키가 씬의 초점 정거장으로 초점을 데려가지 않았다')
  }
  // 커서가 정말 그 방울에 섰는지는 방문자가 듣는 것으로 확인한다 — 여기가
  // 어긋나면 아래 단언은 엉뚱한 작품을 기다리게 된다.
  expect(liveRegionTextIn(), `${index}번째 방울에 서 있다`).toContain(
    works[index].title,
  )
  return active
}

/** 씬이 무너진다 — 방문자가 보고 있던 캔버스가 컨텍스트를 잃는다. */
function loseWebGLContext(): void {
  const canvas = sceneCanvas.current
  if (canvas === null) {
    throw new Error('씬이 뜨지 않았다 — 대역을 확인할 것')
  }
  act(() => {
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
  })
}

/** 씬 없는 화면(전체 화면 목록)이 자리를 잡을 때까지 기다린다. */
async function waitForFullscreenList(router: {
  state: { location: { pathname: string } }
}): Promise<void> {
  await waitFor(() => expect(router.state.location.pathname).toBe(WORKS_PATH))
  await settle()
  expect(
    document.querySelector(`[data-testid="${WORKS_TESTID}"]`),
    '씬 없는 화면은 작품 목록이다',
  ).toBeTruthy()
}

/** 지금 초점이 놓인 항목의 slug. 어느 작품도 가리키지 않으면 null. */
function focusedSlug(): string | null {
  return (
    document.activeElement
      ?.closest(`[${WORK_ITEM_ATTR}]`)
      ?.getAttribute(WORK_ITEM_ATTR) ?? null
  )
}

describe('대역 sanity', () => {
  it('씬이 떠 있고, 작품이 여럿이고, 무너뜨릴 캔버스가 있다', async () => {
    renderHome()
    await settle()

    expect(works.length, '여러 작품이 있어야 "그 방울"이 뜻을 가진다').toBe(3)
    expect(sceneCanvas.current, '씬의 캔버스가 만들어졌다').not.toBeNull()
  })
})

describe('Requirement 38: 씬이 무너질 때 방울에 있던 초점', () => {
  it('방울 N에 서 있었으면 그 작품의 목록 항목으로 옮겨 간다', async () => {
    // 이 한 줄이 페이즈 2(초점을 읽는 쪽)와 페이즈 3(방울에 초점을 주는 쪽)
    // 사이의 이음매다. 정거장이 자기 방울의 표식을 달지 않으면 넘길 계획에
    // slug가 실리지 않고, 초점은 방문자가 보고 있던 방울과 아무 상관 없는
    // 첫 항목으로 떨어진다.
    const { router } = renderHome()
    await settle()

    standOnBubble(NTH)

    loseWebGLContext()
    await waitForFullscreenList(router)

    expect(focusedSlug(), '서 있던 그 방울의 작품이다').toBe(works[NTH].slug)
    expect(focusedSlug(), '첫 항목으로 튀지 않는다').not.toBe(works[0].slug)
    expect(document.activeElement, '<body>가 아니다').not.toBe(document.body)
  })

  it('방울이 아닌 자리에 초점이 있었으면 그 방울로 데려가지 않는다', async () => {
    // 커서는 방울 N에 남아 있지만 초점은 목록을 여는 아이콘으로 옮겨 갔다.
    // 초점이 그 방울에 "있었다"가 아니므로 방문자를 N번째 작품 앞에 세울
    // 근거가 없다 — 목록의 기본 자리로 간다. (커서를 그냥 들고 있다가 무너질
    // 때 꺼내 쓰는 고침은 여기서 어긋난다.)
    const { router, getByRole } = renderHome()
    await settle()

    standOnBubble(NTH)
    getByRole('link', { name: WORKS_OPEN_LABEL }).focus()

    loseWebGLContext()
    await waitForFullscreenList(router)

    expect(focusedSlug(), '초점이 서 있던 자리가 근거다').toBe(works[0].slug)
  })
})
