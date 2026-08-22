import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
} from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { moveCursor } from '../keys/keyNav.ts'
import { routes } from '../routes.tsx'
import { deriveWorkBubbles } from '../scene/bubbles.ts'
import { workPath, works, type WorkEntry } from './registry.ts'
import WorksList from './WorksList.tsx'

// B1 — 등록부가 이번 라운드에 얻는 뜻, 확인 가능한 형태 그대로.
//
// "등록부에 항목을 하나 더 넣으면 다른 파일을 고치지 않아도
//  (a) 씬의 방향키 순회에 그 작품이 끼어들고,
//  (b) 목록에 그 작품이 나타나고,
//  (c) `/works/<slug>` 라우트가 생기고,
//  (d) 그 페이지에서 Esc가 동작한다."
//
// 새 필드는 없다. 다만 기존 필드 둘이 뜻을 새로 얻는다 — **배열의 순서가
// 방문자에게 보이는 순회 순서이자 목록 순서**이고, **object는 이제 목록
// 화면에도 쓰인다**.
//
// (a)와 (b)는 등록부에 실제로 항목을 하나 더 얹은 배열로 확인한다. (c)와
// (d)는 라우팅 표면이 등록부 배열 자체에서 파생되므로 등록된 작품 전부를
// 돌며 확인한다 — 작품 페이지 파일에는 Esc를 다루는 코드가 한 줄도 없고,
// 그래도 동작해야 한다 (Requirement 42).

afterEach(cleanup)

function fixtureEntry(slug: string, title: string): WorkEntry {
  return {
    slug,
    title,
    blurb: `${title}의 한 줄 소개`,
    object: { type: 'image', src: `/works/${slug}/object.webp` },
    Page: () => null,
  }
}

/** 등록부에 항목을 하나 더 넣은 세계. 새 항목은 배열의 끝에 온다. */
const EXTRA = fixtureEntry('anemone', '아네모네')
const PLUS_ONE: readonly WorkEntry[] = [...works, EXTRA]

async function settle() {
  await act(async () => {})
  await act(async () => {})
}

describe('B1 (a): 새 항목이 씬의 방향키 순회에 끼어든다', () => {
  it('순회할 자리가 등록 항목 수만큼 있다', () => {
    // 씬은 등록부가 아니라 파생 목록을 소비한다. 그 목록의 길이가 곧
    // 순회의 정거장 수다.
    const bubbles = deriveWorkBubbles(PLUS_ONE)
    expect(bubbles.map((b) => b.entry.slug)).toEqual(
      PLUS_ONE.map((w) => w.slug),
    )
  })

  it('한 바퀴 돌면 새 작품을 정확히 한 번 지나고, 순서는 등록부 순서다', () => {
    const bubbles = deriveWorkBubbles(PLUS_ONE)
    const order = bubbles.map((b) => b.entry.slug)

    // 초점이 아무 데도 없는 데서 시작해 항목 수만큼 다음으로 옮긴다.
    const visited: string[] = []
    let cursor: number | null = null
    for (let i = 0; i < order.length; i += 1) {
      cursor = moveCursor(cursor, order.length, 'next')
      expect(cursor, `${i}번째 이동: 갈 자리가 있다`).not.toBeNull()
      visited.push(order[cursor as number])
    }

    expect(visited, '새 작품이 순회에 들어 있다').toContain(EXTRA.slug)
    expect(new Set(visited).size, '모든 작품을 한 번씩').toBe(order.length)

    // 화면상의 위치가 아니라 배열의 순서다 (Requirement 3). 어느 항목에서
    // 시작하는지는 위임 구역이므로 시작점을 맞춰 놓고 순서만 비교한다.
    const start = order.indexOf(visited[0])
    expect(visited, '등록부에 적힌 순서 그대로 돈다').toEqual([
      ...order.slice(start),
      ...order.slice(0, start),
    ])
  })
})

describe('B1 (b): 새 항목이 목록에 나타난다', () => {
  it('목록의 마지막에 그 작품이 붙는다 — 오브제와 링크까지', () => {
    const { getAllByRole } = render(
      <MemoryRouter>
        <WorksList variant="fullscreen" entries={PLUS_ONE} />
      </MemoryRouter>,
    )

    const items = getAllByRole('listitem')
    expect(items.length, '항목이 하나 늘었다').toBe(works.length + 1)

    const added = items[items.length - 1]
    expect(added.textContent, '배열의 순서가 목록의 순서다').toContain(
      EXTRA.title,
    )
    expect(
      added.querySelector('a')?.getAttribute('href'),
      '그 작품의 주소로 가는 링크',
    ).toBe(workPath(EXTRA.slug))
    // object는 이제 목록 화면에도 쓰인다 (이번 라운드에 얻은 뜻).
    expect(
      added.querySelector('img')?.getAttribute('src'),
      '등록부의 오브제가 목록에 그려진다',
    ).toBe(EXTRA.object.src)
  })
})

describe('B1 (c)(d): 등록된 작품마다 라우트와 Esc가 따라온다', () => {
  it('등록부에 있는 작품은 모두 자기 주소를 갖고, 그 페이지에서 Esc가 동작한다', async () => {
    expect(works.length).toBeGreaterThan(0)

    for (const work of works) {
      const path = workPath(work.slug)
      const router = createMemoryRouter(routes, { initialEntries: [path] })
      const { container, unmount } = render(<RouterProvider router={router} />)
      await settle()

      // (c) 라우트가 있다 — 홈으로 새지 않고 그 작품 페이지가 뜬다.
      expect(router.state.location.pathname, `${work.slug}: 자기 주소`).toBe(
        path,
      )
      const page = container.firstElementChild
      expect(page, `${work.slug}: 페이지가 그려진다`).toBeTruthy()

      // (d) Esc가 동작한다 — 작품 페이지 파일에는 Esc 코드가 없다.
      // 등록부에서 파생된 라우팅에 딸려온다 (Requirement 42).
      fireEvent.keyDown(page as Element, { key: 'Escape' })
      await waitFor(() =>
        expect(
          router.state.location.pathname,
          `${work.slug}: Esc로 작품 페이지에서 나온다`,
        ).not.toBe(path),
      )

      unmount()
    }
  })
})
