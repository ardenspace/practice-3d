import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routes } from '../routes.tsx'
import {
  accessibleDescriptionOf,
  accessibleNameOf,
  activeDescendantTextOf,
  liveRegionTextIn,
  readableTextOf,
} from '../spokenSurface.ts'
import { HOME_TESTID, WORKS_OPEN_LABEL, WORKS_TESTID } from '../theme.ts'
import { WORKS_PATH, works } from '../works/registry.ts'

// B6 — 씬이 떠 있는 홈이 화면을 보지 않는 사람에게 전달하는 것.
//
// 3D 캔버스는 그 자체로 보조기술에 아무것도 드러내지 않는다 (Reversibility
// Ledger, Decided: "씬을 보조기술에 드러내는 층을 만든다"). 그래서 씬의 작품
// 방울들이 읽힐 수 있는 형태로 함께 존재해야 하고, 이 파일이 그 계약 가운데
// 씬 셸이 떠 있어야 확인할 수 있는 네 가지 — ①(방울 목록) ②(조작법)
// ③(아이콘 이름) ⑤(열림과 잠김) — 를 핀한다. ④(오브제 이미지 설명)와
// ⑥(안내 문구)는 씬 없이 확인되므로 works/worksAccessibility.test.tsx에 있다.
//
// ── 대역 ──
// sceneShell.test.tsx와 같은 기법이다: `./webgl.ts`와 R3F `<Canvas>`를 갈아
// 끼워 씬의 **셸**만 세운다. getContext는 절대 참으로 속이지 않는다 —
// 속이면 R3F 캔버스가 실제로 마운트되며 three.js가 죽는다.
//
// 여기에 더해 등록부도 갈아 끼운다. 진짜 등록부에는 작품이 하나뿐이라
// "초점이 있는 항목의 이름이 읽힌다"와 "순서가 등록부 순서다"가 항상 참이
// 되어 버린다(엉뚱한 항목을 읽어도 잡히지 않는다). 씬은 `entries` 같은
// 주입 자리를 갖지 않으므로 — 씬이 소비하는 것은 등록부에서 파생된 목록
// 하나여야 한다 (B1) — 모듈째 갈아 끼우는 것이 여러 항목을 세우는 유일한
// 길이다.
//
// ── 이 파일이 말하지 못하는 것 ──
// 실제로 VoiceOver가 무엇을 읽는지. 계약이 명시적으로 사람 몫으로 넘겼다.
// 아래 단언들은 그 앞 단계 — 읽힐 것이 붙어 있는가 — 까지다.
//
// ── 위임 구역을 밟지 않기 위해 ──
// 수단(요소 종류, 속성, 숨김 방식, 낭독 문구의 표현)은 위임되었다. 그래서
// 아래는 특정 속성을 이름으로 부르지 않는다: 항목은 역할(list/listitem)로,
// 이름은 접근 가능한 이름으로, 조작법은 접근 가능한 설명으로 묻고, 지금
// 어느 방울에 서 있는지는 표준 수단을 가리지 않는 spokenSurface.ts를 통해
// 읽는다. 문구의 표현은 한 글자도 단언하지 않는다.

vi.mock('./webgl.ts', () => ({
  isWebGLAvailable: () => true,
}))

vi.mock('@react-three/fiber', () => ({
  Canvas: () => null,
  useFrame: () => {},
}))

// 슬러그는 일부러 사전순이 아니고(z → a → m), 제목은 서로의 부분 문자열이
// 아니다 — 씬이 몰래 정렬하거나 엉뚱한 항목을 읽으면 어긋난다.
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

function renderHome() {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  return { router, ...render(<RouterProvider router={router} />) }
}

/** 대기 중인 이동만 비운다. 타이머는 돌리지 않는다. */
async function settle() {
  await act(async () => {})
  await act(async () => {})
}

function sceneShell(): HTMLElement {
  const shell = document.querySelector<HTMLElement>(
    `[data-testid="${HOME_TESTID}"]`,
  )
  if (shell === null) throw new Error('씬 셸이 화면에 없다 — 대역을 확인할 것')
  return shell
}

function listSurface(): HTMLElement {
  const surface = document.querySelector<HTMLElement>(
    `[data-testid="${WORKS_TESTID}"]`,
  )
  if (surface === null) throw new Error('작품 목록이 화면에 없다')
  return surface
}

/**
 * 방향키 하나로 씬을 활성으로 만들고, 초점이 간 자리(씬의 정거장)를 돌려준다.
 * 정거장을 DOM 모양으로 집지 않는 이유는 그 자리가 어떤 요소인지가 위임
 * 구역이기 때문이다 — 방문자가 겪는 대로, 방향키가 데려가는 자리로 집는다.
 */
function stepScene(): HTMLElement {
  fireEvent.keyDown(document.body, { key: 'ArrowDown' })
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || active === document.body) {
    throw new Error('방향키가 씬의 초점 정거장으로 초점을 데려가지 않았다')
  }
  return active
}

/**
 * 씬에 초점이 있는 지금, 보조기술이 읽게 되는 것들. 어떤 수단으로 전달할지는
 * 위임 구역이므로 표준 수단을 전부 합쳐서 본다 — 정거장에 붙은 이름과 설명,
 * 정거장이 "지금 여기"라고 가리키는 자손, 그리고 실시간 알림 영역.
 */
function spokenAtScene(station: HTMLElement): string {
  return [
    accessibleNameOf(station),
    accessibleDescriptionOf(station),
    activeDescendantTextOf(station),
    liveRegionTextIn(),
  ].join(' ')
}

/**
 * 지금 서 있는 자리가 "전체 안에서 몇 번째"인지를 말하는 숫자들.
 *
 * 무엇으로 전달할지는 위임 구역이므로 표준 두 갈래를 모두 받아들인다:
 * 낭독되는 글자에 숫자로 섞여 있어도(스크린 리더가 문장으로 듣는 길), 지금
 * 지목된 항목의 aria-posinset/aria-setsize에 들어 있어도(보조기술이 목록
 * 구조에서 직접 세는 길) 똑같이 걷어 온다. 문구의 표현은 한 글자도 보지
 * 않는다 — 숫자만 센다.
 *
 * 지목된 항목만 보는 이유: 항목 전부의 posinset을 긁어모으면 "1·2·3이
 * 어딘가에 있다"가 언제나 참이 되어, 초점이 어디 있든 통과해 버린다.
 */
function currentItemOf(station: HTMLElement): HTMLElement | null {
  const id = station.getAttribute('aria-activedescendant')
  const pointed = id === null ? null : station.ownerDocument.getElementById(id)
  return (
    pointed ??
    station.querySelector<HTMLElement>('[aria-current]:not([aria-current="false"])')
  )
}

function positionNumbersAt(station: HTMLElement): number[] {
  const spoken = (spokenAtScene(station).match(/\d+/g) ?? []).map(Number)
  const current = currentItemOf(station)
  const marked =
    current === null
      ? []
      : ['aria-posinset', 'aria-setsize']
          .map((attr) => Number(current.getAttribute(attr)))
          .filter((value) => Number.isFinite(value) && value > 0)
  return [...spoken, ...marked]
}

async function openListFromIcon(
  router: { state: { location: { pathname: string } } },
  getByRole: ReturnType<typeof renderHome>['getByRole'],
) {
  fireEvent.click(getByRole('link', { name: WORKS_OPEN_LABEL }))
  await waitFor(() => expect(router.state.location.pathname).toBe(WORKS_PATH))
}

describe('B6 대역 sanity', () => {
  it('씬 셸이 떠 있고 등록부에 작품이 여럿이다', async () => {
    renderHome()
    await settle()

    expect(sceneShell()).toBeTruthy()
    expect(works.length, '여러 항목이 있어야 순서와 지목이 걸린다').toBe(3)
  })
})

describe('B6 ①: 씬의 작품 방울들이 목록으로 드러난다', () => {
  it('작품 하나당 항목 하나가 등록부 순서대로 드러난다', async () => {
    // 목록으로 드러나야 "전체 몇 개 중 몇 번째"가 함께 읽힌다 — 위치 정보는
    // 목록 구조가 이고 있다. 그래서 수를 세고 순서를 본다: 하나라도 빠지거나
    // 순서가 뒤집히면 방문자가 듣는 자리 번호가 씬과 어긋난다.
    const { getAllByRole } = renderHome()
    await settle()

    const items = getAllByRole('listitem')
    expect(items.length, '등록 항목 N개 = 읽히는 항목 정확히 N개').toBe(
      works.length,
    )

    works.forEach((work, i) => {
      const item = items[i]
      expect(item, `${i}번째 항목이 없다`).toBeTruthy()
      if (item === undefined) return
      expect(
        readableTextOf(item),
        `${i}번째로 읽히는 것은 등록부 ${i}번째(${work.slug})여야 한다`,
      ).toContain(work.title)
    })
  })

  it('초점이 옮겨 가면 그 자리의 작품 이름이 읽힌다', async () => {
    renderHome()
    await settle()

    // 방향키 한 번 — 첫 작품에 선다.
    const station = stepScene()
    expect(
      spokenAtScene(station),
      '초점이 닿은 자리의 작품 이름이 읽혀야 한다',
    ).toContain(works[0].title)

    // 한 칸 더 — 이제 읽히는 것은 두 번째 작품이고, 첫·셋째가 아니다.
    // (전체 목록을 통째로 읽어 주는 것은 "초점이 있는 항목의 이름"이 아니다.)
    fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    const spoken = spokenAtScene(station)
    expect(spoken, '두 번째 작품으로 옮겨 갔다').toContain(works[1].title)
    expect(spoken, '지나온 자리를 계속 읽지 않는다').not.toContain(
      works[0].title,
    )
    expect(spoken, '아직 닿지 않은 자리를 미리 읽지 않는다').not.toContain(
      works[2].title,
    )
  })

  it('이름과 함께 "전체 안에서의 위치"도 전달된다', async () => {
    // B6 ①은 이름**과** 전체 안에서의 위치를 함께 요구한다. 위 테스트는
    // 이름 쪽만 잡으므로, 자리 번호와 전체 개수를 통째로 걷어내도 초록으로
    // 남는다 — 그 절반을 여기서 못 박는다.
    //
    // 문구의 표현은 위임 구역이라 한 글자도 단언하지 않는다. 대신 방문자가
    // 자리를 알 수 있으려면 반드시 있어야 하는 두 수 — 지금 몇 번째인가와
    // 전부 몇 개인가 — 가 전달되는지만 본다 (수단은 positionNumbersAt이
    // 표준 두 갈래를 모두 받아들인다). 초점을 한 바퀴 돌리며 매번 확인하므로
    // 고정된 숫자 하나를 읽어 주는 것으로는 통과하지 못한다.
    renderHome()
    await settle()

    const station = stepScene()

    for (let index = 0; index < works.length; index += 1) {
      if (index > 0) fireEvent.keyDown(document.body, { key: 'ArrowDown' })
      const numbers = positionNumbersAt(station)
      expect(
        numbers,
        `${index + 1}번째 자리에 서 있다는 것이 전달되어야 한다`,
      ).toContain(index + 1)
      expect(
        numbers,
        '전체가 몇 개인지도 함께 전달되어야 한다 — 번째만으로는 자리를 모른다',
      ).toContain(works.length)
    }
  })
})

describe('B6 ②: 씬에 초점이 닿으면 조작법이 읽힌다', () => {
  // 방향키를 페이지 전체에서 가로채는 편의는 스크린 리더를 쓰는 사람에게
  // 닿지 않는다 — 방향키가 그의 읽기 키이기 때문이다 (Reversibility Ledger,
  // Decided). 그 사람은 탭으로 씬 정거장에 들어오고, 거기서 조작법을 듣는다.
  // 그래서 조작법은 정거장에 붙어 있어야 하고, 문구의 표현은 위임 구역이므로
  // 여기서는 "붙어 있는가"만 묻는다.

  it('씬의 초점 정거장에 설명이 붙어 있다', async () => {
    renderHome()
    await settle()

    const station = stepScene()
    expect(
      accessibleDescriptionOf(station),
      '조작법이 정거장에 설명으로 붙어 있어야 한다',
    ).not.toBe('')
  })

  it('목록을 열었다 닫아도 그대로 붙어 있다 (Requirement 43: 항상)', async () => {
    const { router, getByRole } = renderHome()
    await settle()

    stepScene()

    await openListFromIcon(router, getByRole)
    fireEvent.keyDown(listSurface(), { key: 'Escape' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))

    // 열려 있는 동안 떼었다가 다시 붙이는 식이면 여기서 어긋난다. 무엇을
    // 읽어 주는지는 위임 구역이므로 첫 번째와 같은 문구인지는 묻지 않는다 —
    // 붙어 있는가만 묻는다.
    expect(
      accessibleDescriptionOf(stepScene()),
      '두 번째로 씬에 닿은 방문자도 조작법을 듣는다',
    ).not.toBe('')
  })
})

describe('B6 ③: 목록을 여는 아이콘에 이름이 있다', () => {
  it('그림뿐인 아이콘이 아니라 이름으로 집힌다 (Requirement 14)', async () => {
    const { getByRole } = renderHome()
    await settle()

    // 역할과 이름으로 찾는다 — 이름이 없으면 여기서 찾히지 않는다.
    const icon = getByRole('link', { name: WORKS_OPEN_LABEL })
    expect(icon.getAttribute('href'), '진짜 링크다').toBe(WORKS_PATH)
  })
})

describe('B6 ⑤: 목록이 열렸다는 사실과, 열려 있는 동안의 씬', () => {
  it('목록이 열렸다는 사실이 소리로 듣는 사람에게 전달된다 (Requirement 21)', async () => {
    const { router, getByRole } = renderHome()
    await settle()

    await openListFromIcon(router, getByRole)

    // 무엇으로 전달할지는 위임 구역이라 두 표준 수단을 모두 받아들인다:
    // 초점이 목록 안으로 옮겨 가 목록의 이름이 읽히거나, 실시간 알림 영역이
    // 열렸다고 말하거나. 화면만 바뀌고 아무것도 말하지 않으면 소리로 듣는
    // 사람에게는 아무 일도 일어나지 않은 것과 같다.
    const surface = listSurface()
    const active = document.activeElement
    const focusEntered =
      active !== null && (active === surface || surface.contains(active))
    const announced = liveRegionTextIn() !== ''

    expect(
      focusEntered || announced,
      '목록이 열렸다는 사실이 전달되어야 한다',
    ).toBe(true)
  })

  it('슬라이드가 열려 있는 동안 뒤의 씬은 읽히지 않는다 (Requirement 16)', async () => {
    const { router, getAllByRole, getByRole } = renderHome()
    await settle()

    // 열기 전 — 씬의 방울들이 읽힌다 (①).
    expect(
      getAllByRole('listitem').length,
      '열기 전에는 씬의 방울들이 읽힌다',
    ).toBe(works.length)

    await openListFromIcon(router, getByRole)

    // 열린 뒤 — 읽히는 항목은 전부 목록 안에 있다. 씬 쪽 방울이 하나라도
    // 남아 있으면 방문자는 만질 수 없는 것을 계속 듣게 된다.
    const surface = listSurface()
    const items = getAllByRole('listitem')
    expect(items.length, '읽히는 목록은 하나뿐이다').toBe(works.length)
    for (const item of items) {
      expect(
        surface.contains(item),
        '읽히는 항목은 전부 열린 목록 안에 있어야 한다',
      ).toBe(true)
    }

    // 전부 숨겨서 통과하는 것이 아니다 — 목록 자체는 읽힌다.
    expect(
      readableTextOf(items[0]),
      '열린 목록은 그대로 읽힌다',
    ).toContain(works[0].title)
  })
})
