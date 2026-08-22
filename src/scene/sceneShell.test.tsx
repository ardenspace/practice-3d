import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routes } from '../routes.tsx'
import { visuallyHiddenStyle } from '../siteStyles.ts'
import {
  HOME_TESTID,
  KEYBOARD_HINT,
  WORKS_DISMISS_TESTID,
  WORKS_OPEN_LABEL,
  WORKS_TESTID,
} from '../theme.ts'
import { WORKS_PATH } from '../works/registry.ts'

// 씬 셸이 떠 있는 홈 — 그 화면에서만 존재하는 약속들.
//
// B3 히스토리 표의 ③행(Esc·바깥 클릭으로 목록 닫기 → 히스토리를 늘리지
// 않는다), Requirement 20(Esc를 누르면 목록이 닫히고 초점이 아이콘으로
// 돌아간다), Requirements 11·12(씬은 탭 정거장 하나, DOM 순서는 씬 →
// 아이콘)는 전부 "씬 셸이 떠 있다"를 전제로 한다. 다른 테스트 파일들은
// jsdom에 WebGL이 없어 그 전제를 만들 수 없다.
//
// ── 이 파일의 대역이 무엇을 대신하고 무엇을 대신하지 않는가 ──
//
// 두 모듈을 갈아 끼운다:
//  - `./webgl.ts` — 이 방문자에게 씬을 띄울 수 있다고 답하게 한다. 그래야
//    Home이 폴백이 아니라 씬 셸 쪽 갈래를 그린다.
//  - `@react-three/fiber` 의 `<Canvas>` — 아무것도 그리지 않는 빈 컴포넌트로
//    바꾼다. 캔버스 자식(광원·BubbleField)은 마운트되지 않는다.
//
// getContext를 참으로 속이지 않는다 — 속이면 R3F 캔버스가 실제로 마운트되며
// three.js가 죽는다. 대역은 그 반대 방향이다: 씬을 "띄우는" 것이 아니라
// 씬이 있는 화면의 *셸*만 세운다.
//
// 그래서 이 파일이 말할 수 있는 것은 셸의 DOM — 초점 정거장, 아이콘, 목록,
// 그리고 그 셋 사이를 오가는 라우팅과 초점 — 까지다. 말할 수 없는 것:
//  - 방울이 어떻게 보이는지, 몇 개가 떠다니는지, 초점 표시 고리가 어느
//    방울에 붙는지. 캔버스 안은 별도 리컨실러이고 여기서는 마운트조차 되지
//    않는다 (씬 안의 규칙은 bubbles.test.ts가 화면 없이 확인한다).
//  - 진짜 탭 키를 눌렀을 때 초점이 실제로 옮겨 가는지. jsdom은 탭을 실행하지
//    않으므로 아래 Requirements 11·12는 DOM 모양 — 정거장이 몇이고 어느
//    순서로 놓였는가 — 까지만 본다.
//  - 실제 WebGL에서 <Canvas>가 만드는 <canvas> 요소. 그 요소는 tabindex가
//    없어 탭 정거장이 되지 않으므로 아래 정거장 수는 진짜 씬에서도 같지만,
//    그 사실 자체를 이 파일이 증명하지는 못한다 — 브라우저 스모크 몫이다.

vi.mock('./webgl.ts', () => ({
  isWebGLAvailable: () => true,
}))

vi.mock('@react-three/fiber', () => ({
  // 자식을 그리지 않는다 — three.js에 닿는 것은 이 경계에서 전부 멎는다.
  Canvas: () => null,
  useFrame: () => {},
}))

afterEach(cleanup)

/** 탭 순서에 들어가는 요소들. */
const TAB_STOP_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function renderAt(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  return { router, ...render(<RouterProvider router={router} />) }
}

/** 대기 중인 이동만 비운다. 타이머는 돌리지 않는다. */
async function settle() {
  await act(async () => {})
  await act(async () => {})
}

function sceneShell(container: HTMLElement): HTMLElement {
  const shell = container.querySelector<HTMLElement>(
    `[data-testid="${HOME_TESTID}"]`,
  )
  if (shell === null) throw new Error('씬 셸이 화면에 없다 — 대역을 확인할 것')
  return shell
}

function tabStopsIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TAB_STOP_SELECTOR))
}

function openIcon(container: HTMLElement): HTMLElement {
  const icon = container.querySelector<HTMLElement>(
    `a[aria-label="${WORKS_OPEN_LABEL}"]`,
  )
  if (icon === null) throw new Error('목록을 여는 아이콘이 화면에 없다')
  return icon
}

/** 아이콘을 눌러 목록을 연다 — 사이트 안에서 연 목록(되감을 자리가 있다). */
async function openListFromIcon(container: HTMLElement, router: {
  state: { location: { pathname: string } }
}) {
  fireEvent.click(openIcon(container))
  await waitFor(() => expect(router.state.location.pathname).toBe(WORKS_PATH))
}

function listSurface(container: HTMLElement): HTMLElement {
  const surface = container.querySelector<HTMLElement>(
    `[data-testid="${WORKS_TESTID}"]`,
  )
  if (surface === null) throw new Error('작품 목록이 화면에 없다')
  return surface
}

/**
 * 이 요소가 눈에 보이는 자리에 있는가.
 *
 * "화면에 있다"를 요소 종류나 속성으로 집지 않는다 — 그쪽은 위임 구역이다.
 * 이 프로젝트가 "눈에는 없고 낭독에는 있다"를 만드는 수단은 siteStyles의
 * visuallyHiddenStyle 하나뿐이므로(그 파일이 그렇게 적어 두었다), 그 조각을
 * 그대로 기준으로 삼는다: 잘라 낸 자리 안에 있으면 화면에 없는 것이다.
 */
function isOnScreen(el: HTMLElement): boolean {
  for (let node: HTMLElement | null = el; node !== null; node = node.parentElement) {
    if (node.style.clipPath === visuallyHiddenStyle.clipPath) return false
  }
  return true
}

/** 조작법 안내가 지금 화면에 놓여 있는 자리들. */
function keyboardHintsOnScreen(container: HTMLElement): HTMLElement[] {
  return keyboardHintsAnywhere(container).filter(isOnScreen)
}

/** 조작법 안내가 지금 DOM에 있는 자리들 — 화면 갈래와 소리 갈래를 함께. */
function keyboardHintsAnywhere(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('*')).filter(
    (el) => el.children.length === 0 && el.textContent === KEYBOARD_HINT,
  )
}

describe('씬 셸이 떠 있다 (대역 sanity)', () => {
  it('`/`는 폴백이 아니라 씬 셸이고, 목록을 여는 아이콘이 있다', async () => {
    const { router, container } = renderAt('/')
    await settle()

    // 갈아치기가 일어났다면 이 파일의 전제가 무너진 것이다.
    expect(router.state.location.pathname, '`/`에 그대로 머문다').toBe('/')
    expect(sceneShell(container)).toBeTruthy()
    expect(openIcon(container)).toBeTruthy()
  })

  it('`/works`에서는 목록이 씬 위 슬라이드로 열린다', async () => {
    const { container } = renderAt(WORKS_PATH)
    await settle()

    expect(sceneShell(container), '씬 셸은 그대로 살아 있다').toBeTruthy()
    expect(
      listSurface(container).getAttribute('data-variant'),
      '씬이 있으므로 전체 화면이 아니라 슬라이드다',
    ).toBe('slide')
  })
})

describe('B3 ③: Esc·바깥 클릭으로 목록 닫기는 히스토리를 늘리지 않는다', () => {
  // 되감을지 갈아칠지의 규칙 자체는 화면 없는 works/listClose.ts가 들고
  // 있고 listClose.test.ts가 핀한다. 여기서 보는 것은 그 다음 — 목록을 닫는
  // 길이 실제로 그 판정을 거치는가다. 판정만 맞고 배선이 새 항목을 쌓으면
  // 방문자의 뒤로가기는 목록을 다시 연다.

  it('사이트 안에서 연 목록은 Esc가 한 칸 되감아 닫는다', async () => {
    const { router, container } = renderAt('/')
    await settle()
    await openListFromIcon(container, router)
    expect(router.state.historyAction, '아이콘은 항목 하나를 쌓는다').toBe(
      'PUSH',
    )

    fireEvent.keyDown(listSurface(container), { key: 'Escape' })

    await waitFor(() =>
      expect(router.state.location.pathname, '목록이 닫혀 홈으로 돌아간다').toBe(
        '/',
      ),
    )
    expect(
      router.state.historyAction,
      '새 항목을 쌓지 않고 열기 전 자리로 되감는다',
    ).toBe('POP')
  })

  it('`/works`로 곧장 들어왔으면 Esc가 홈으로 갈아친다', async () => {
    // 되감을 우리 자리가 뒤에 없다 — 그대로 되감으면 사이트 밖으로 나간다.
    const { router, container } = renderAt(WORKS_PATH)
    await settle()

    fireEvent.keyDown(listSurface(container), { key: 'Escape' })

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(
      router.state.historyAction,
      '히스토리를 늘리지 않는다 — 갈아친다',
    ).toBe('REPLACE')
  })

  it('바깥 클릭도 같은 문으로 나간다', async () => {
    // Esc와 바깥 클릭이 각자 판정하면 둘이 언젠가 어긋난다 (B3: 판정은 한 곳).
    const { router, container } = renderAt(WORKS_PATH)
    await settle()

    const dismiss = container.querySelector(
      `[data-testid="${WORKS_DISMISS_TESTID}"]`,
    )
    expect(dismiss, '슬라이드에는 닫는 면이 있다').toBeTruthy()
    fireEvent.click(dismiss as Element)

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(router.state.historyAction, 'Esc와 같은 답이다').toBe('REPLACE')
  })
})

describe('Requirement 20: Esc를 누르면 목록이 닫히고 초점이 아이콘으로 돌아간다', () => {
  it('닫은 뒤 초점은 방금 손댄 아이콘에 있다', async () => {
    // 초점이 사라진 슬라이드에 남거나 <body>로 떨어지면, 키보드 방문자는
    // 목록을 닫은 자리에서 다시 문서 처음부터 탭을 시작해야 한다.
    const { router, container } = renderAt('/')
    await settle()
    await openListFromIcon(container, router)

    fireEvent.keyDown(listSurface(container), { key: 'Escape' })

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    await waitFor(() =>
      expect(
        document.activeElement,
        '목록을 열었던 그 아이콘이 초점을 되받는다',
      ).toBe(openIcon(container)),
    )
  })

  it('목록이 화면에서 사라진다', async () => {
    const { router, container } = renderAt('/')
    await settle()
    await openListFromIcon(container, router)
    expect(listSurface(container), '열려 있었다').toBeTruthy()

    fireEvent.keyDown(listSurface(container), { key: 'Escape' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))

    expect(
      container.querySelector(`[data-testid="${WORKS_TESTID}"]`),
      '닫혔다',
    ).toBeNull()
  })
})

describe('Requirement 43: 조작법의 화면 갈래', () => {
  // 조작법은 두 갈래로 알려진다. 소리 갈래("씬에 닿을 때 항상 읽힌다")는
  // sceneAccessibility.test.tsx가 정거장의 설명으로 확인한다. 여기서 보는
  // 것은 화면 갈래 — 키보드를 쓰기 시작한 순간 나타나고, 마우스만 쓴
  // 방문자에게는 끝까지 나타나지 않는다.
  //
  // 이 화면은 씬 셸이 떠 있어야 존재하므로 이 파일의 대역이 필요하다.
  // jsdom이 탭을 실행하지 않는 것은 걸림돌이 되지 않는다 — 방향키만으로도
  // 같은 latch를 지나간다.

  it('키보드를 쓰기 전에는 화면에 없다', async () => {
    const { container } = renderAt('/')
    await settle()

    // 소리 갈래는 처음부터 있다 — 아래 0이 "안내가 아예 없다"가 아니라
    // "화면에는 아직 없다"라는 뜻임을 여기서 못 박는다.
    expect(
      keyboardHintsAnywhere(container).length,
      '소리로 듣는 사람에게는 처음부터 있다',
    ).toBeGreaterThan(0)
    expect(
      keyboardHintsOnScreen(container),
      '화면에는 아직 나타나지 않는다',
    ).toHaveLength(0)
  })

  it('키보드를 쓰기 시작한 순간 나타난다', async () => {
    const { container } = renderAt('/')
    await settle()

    fireEvent.keyDown(document.body, { key: 'ArrowDown' })

    expect(
      keyboardHintsOnScreen(container),
      '방향키를 누른 방문자에게 조작법이 화면에 나타난다',
    ).toHaveLength(1)
  })

  it('마우스만 쓴 방문자에게는 끝까지 나타나지 않는다', async () => {
    const { container } = renderAt('/')
    await settle()

    // 마우스로 할 수 있는 일을 다 한다 — 씬을 누르고, 움직이고, 놓는다.
    const shell = sceneShell(container)
    for (const target of [shell, openIcon(container)]) {
      fireEvent.pointerDown(target)
      fireEvent.mouseDown(target)
      fireEvent.mouseMove(target)
      fireEvent.mouseUp(target)
    }
    fireEvent.click(shell)

    expect(
      keyboardHintsOnScreen(container),
      '키보드 설명은 마우스만 쓰는 사람에게 아무 쓸모 없는 글자다',
    ).toHaveLength(0)

    // 위 0이 "이 화면에서는 언제나 0"이 아니라는 것 — 같은 화면이 키 하나에
    // 안내를 내놓는다. 이것이 없으면 화면 갈래를 통째로 지워도 위가 초록이다.
    fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    expect(
      keyboardHintsOnScreen(container),
      '같은 화면이 키 하나에는 안내를 내놓는다',
    ).toHaveLength(1)
  })
})

describe('Requirements 11·12: 씬이 차지하는 탭 정거장', () => {
  it('씬은 정거장 하나이고, 방울 수가 그 수를 바꿀 수 없다 (Requirement 11)', async () => {
    const { container } = renderAt('/')
    await settle()

    const stops = tabStopsIn(sceneShell(container))
    expect(stops.length, '씬 하나 + 아이콘 하나').toBe(2)

    const [station, icon] = stops
    expect(icon, '두 번째는 목록을 여는 아이콘이다').toBe(openIcon(container))

    // 첫 번째가 씬의 정거장이라는 것은 방향키가 확인해 준다 — 방향키는 씬을
    // 활성으로 만들고 초점을 그 정거장으로 데려간다.
    fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    expect(document.activeElement, '방향키가 데려가는 자리다').toBe(station)

    // 방울은 캔버스 안에 있고 캔버스 안은 DOM이 아니다. 그래서 정거장 안에는
    // 탭이 설 자리가 하나도 없고, 등록부에 작품이 몇 개든 씬을 지나는 탭은
    // 한 번이다. 방울마다 DOM 요소를 두는 순간 여기서 어긋난다.
    expect(
      tabStopsIn(station).length,
      '정거장 안에는 탭이 설 자리가 없다',
    ).toBe(0)
  })

  it('DOM 순서가 씬 → 아이콘이다 (Requirement 12)', async () => {
    const { container } = renderAt('/')
    await settle()

    const [station, icon] = tabStopsIn(sceneShell(container))
    expect(
      station.compareDocumentPosition(icon) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      '아이콘은 씬 뒤에 있다',
    ).toBeTruthy()

    // 탭 순서가 DOM 순서와 같으려면 양수 tabindex가 없어야 한다. 하나라도
    // 있으면 그 요소가 순서 맨 앞으로 끌려 나가 위 순서가 뜻을 잃는다.
    // (jsdom은 탭을 실행하지 않으므로 여기까지가 이 환경이 볼 수 있는 선이다.)
    for (const stop of tabStopsIn(sceneShell(container))) {
      expect(
        Number(stop.getAttribute('tabindex') ?? '0'),
        `${stop.tagName}: 양수 tabindex는 탭 순서를 뒤집는다`,
      ).toBeLessThanOrEqual(0)
    }
  })
})
