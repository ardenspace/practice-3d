import { act, cleanup, render, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { routes } from '../routes.tsx'
import { isAnnounced, readableTextOf } from '../spokenSurface.ts'
import { SCENE_FALLBACK_NOTICE, WORKS_EMPTY_MESSAGE } from '../theme.ts'
import { WORKS_PATH, type WorkEntry } from './registry.ts'
import WorksList, { type WorksListVariant } from './WorksList.tsx'

// B6 — 화면을 보지 않는 사람에게 전달되어야 하는 것 가운데, 씬 셸 없이
// 확인되는 두 가지.
//  ④ 목록의 오브제 이미지에 설명이 붙고, 그 설명이 등록부의 제목과 한 줄
//     소개에서 파생된다 (Requirement 27).
//  ⑥ 안내 문구가 소리로도 전달된다 (Requirement 36·43) — 그리고 등록부가
//     비었을 때의 문구도 낭독 표면에 있다 (Requirement 29).
//
// 나머지 넷(①②③⑤)은 씬 셸이 떠 있어야 확인할 수 있어
// scene/sceneAccessibility.test.tsx에 있다 — 그 파일은 `vi.mock`으로 씬 셸을
// 세우고, `vi.mock`은 파일 단위라 여기와 섞일 수 없다. 이 파일은 아무것도
// 갈아 끼우지 않는다: jsdom에는 WebGL이 없으므로 아래 라우터 렌더는 그 자체로
// "씬을 띄울 수 없는 방문자"다 (getContext를 참으로 속이면 R3F 캔버스가 실제로
// 마운트되며 three.js가 죽으므로 절대 속이지 않는다).
//
// 위임 구역: 수단과 문구의 표현. 그래서 아래는 역할과 접근 가능한 이름으로만
// 묻고, 알림도 표준 수단을 가리지 않는 spokenSurface.ts를 통해 본다.
//
// 이 파일이 말하지 못하는 것: 실제로 VoiceOver가 무엇을 읽는지. 계약이
// 명시적으로 사람 몫으로 넘겼다.

afterEach(cleanup)

const VARIANTS: WorksListVariant[] = ['slide', 'fullscreen']

// 제목과 한 줄 소개가 서로 다른 글자를 갖도록 만든다 — 설명이 둘 다에서
// 파생되었는지 보려면 둘이 구별되어야 한다.
const ENTRIES: readonly WorkEntry[] = [
  {
    slug: 'zephyr',
    title: '제퍼',
    blurb: '서쪽에서 불어오는 미풍 한 줄',
    object: { type: 'image', src: '/works/zephyr/object.webp' },
    Page: () => null,
  },
  {
    slug: 'anemone',
    title: '아네모네',
    blurb: '물결을 따라 흔들리는 촉수',
    object: { type: 'image', src: '/works/anemone/object.webp' },
    Page: () => null,
  },
]

function renderList(variant: WorksListVariant, entries?: readonly WorkEntry[]) {
  return render(
    <MemoryRouter>
      <WorksList variant={variant} entries={entries} />
    </MemoryRouter>,
  )
}

describe.each(VARIANTS)('B6 ④: 오브제 이미지의 설명 — %s', (variant) => {
  it('이미지에 설명이 붙고, 제목과 한 줄 소개에서 파생된다 (Requirement 27)', () => {
    const { getAllByRole } = renderList(variant, ENTRIES)
    const items = getAllByRole('listitem')

    ENTRIES.forEach((entry, i) => {
      const item = items[i]
      expect(item, `${entry.slug}: 항목이 없다`).toBeTruthy()
      if (item === undefined) return

      // 설명이 없는 이미지는 보조기술에서 이름 없는 그림이거나 아예 장식으로
      // 사라진다 — 그러면 역할로 찾히지 않는다.
      const images = within(item).getAllByRole('img')
      expect(images.length, `${entry.slug}: 오브제 이미지가 읽혀야 한다`).toBe(1)

      const spoken = readableTextOf(images[0])
      expect(spoken, `${entry.slug}: 설명이 제목에서 파생된다`).toContain(
        entry.title,
      )
      expect(spoken, `${entry.slug}: 설명이 한 줄 소개에서 파생된다`).toContain(
        entry.blurb,
      )
    })
  })
})

describe.each(VARIANTS)('B6 ⑥: 빈 등록부 문구 — %s', (variant) => {
  it('작품이 아직 없다는 사실이 낭독 표면에 있다 (Requirement 29)', () => {
    const { getByText } = renderList(variant, [])

    // 눈에만 보이는 문구가 되면, 목록을 열고 아무것도 듣지 못한 방문자는
    // 목록이 비었는지 자기 조작이 실패했는지 알 수 없다.
    const message = getByText(WORKS_EMPTY_MESSAGE)
    expect(
      message.closest('[aria-hidden="true"]'),
      '문구가 보조기술에서 가려져 있으면 안 된다',
    ).toBeNull()
  })
})

describe('B6 ⑥: 씬을 못 띄워 화면이 바뀐 방문자에게 붙는 안내', () => {
  it('안내 문구가 소리로도 전달된다 (Requirement 36·43)', async () => {
    // 이 방문자는 `/`를 열었을 뿐인데 화면이 작품 목록으로 바뀌었다. 눈으로만
    // 보이는 사과가 되면, 이 라운드가 챙기려는 사람에게만 그 이유가 닿지
    // 않는다 — 그는 스스로 그 문구를 찾아 읽을 이유가 없다.
    const router = createMemoryRouter(routes, { initialEntries: ['/'] })
    const { getByText } = render(<RouterProvider router={router} />)

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(WORKS_PATH),
    )
    await act(async () => {})

    const notice = getByText(SCENE_FALLBACK_NOTICE)
    expect(
      isAnnounced(notice),
      '화면이 바뀐 사실과 이유가 방문자에게 알려져야 한다',
    ).toBe(true)
  })
})
