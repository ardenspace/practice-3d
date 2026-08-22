import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { SITE_TAGLINE, SITE_TITLE, WORKS_EMPTY_MESSAGE } from '../theme.ts'
import { workPath, works, type WorkEntry } from './registry.ts'
import WorksList from './WorksList.tsx'
import type { WorksListVariant } from './WorksList.tsx'

// B5 — 작품 목록 표면 계약.
//
// 작품 목록을 그리는 곳은 온 사이트에 하나이고, 그 하나가 두 모습으로
// 나타난다. 이 파일이 그 계약을 핀한다.
//
// 이 테스트 파일 자체가 계약의 일부다: 두 모습 모두 방울 씬을 마운트하지
// 않고 렌더된다. jsdom에는 WebGL이 없고, 있다고 속이면 R3F 캔버스가 실제로
// 마운트되어 three.js가 죽는다. 아래 렌더가 씬 없이 성립한다는 사실이
// 슬라이드 모드 요구들을 자동으로 확인할 수 있게 하는 seam이다.

afterEach(cleanup)

const VARIANTS: WorksListVariant[] = ['slide', 'fullscreen']

// 여러 항목짜리 등록부 — 지금 등록부에는 작품이 하나뿐이라 "수가 같다"와
// "순서가 같다"를 진짜 등록부로만 확인하면 항상 참이 되어 버린다(항목을
// 떨어뜨리거나 순서를 뒤집는 버그를 잡지 못한다). `entries` seam으로 여러
// 항목을 넣어 두 성질이 실제로 걸리게 한다.
//
// 슬러그는 일부러 사전순이 아니고(z → a → m), 제목은 서로의 부분 문자열이
// 아니다 — 목록이 몰래 정렬하거나 항목을 섞으면 어긋난다.
function fixtureEntry(slug: string, title: string): WorkEntry {
  return {
    slug,
    title,
    blurb: `${title}의 한 줄 소개`,
    object: { type: 'image', src: `/works/${slug}/object.webp` },
    Page: () => null,
  }
}

const MANY: readonly WorkEntry[] = [
  fixtureEntry('zephyr', '제퍼'),
  fixtureEntry('anemone', '아네모네'),
  fixtureEntry('marble', '마블'),
]

function renderList(variant: WorksListVariant, entries?: readonly WorkEntry[]) {
  return render(
    <MemoryRouter>
      <WorksList variant={variant} entries={entries} />
    </MemoryRouter>,
  )
}

describe.each(VARIANTS)('B5: works list — %s view', (variant) => {
  it('renders one item per registered work, in registry order', () => {
    expect(works.length).toBeGreaterThan(0)
    const { getAllByRole } = renderList(variant)

    const items = getAllByRole('listitem')
    expect(items.length, 'one list item per registry entry').toBe(works.length)

    // 배열의 순서가 방문자에게 보이는 목록 순서다 (B1).
    works.forEach((w, i) => {
      expect(
        items[i]?.textContent,
        `item ${i} must be the registry entry ${w.slug}`,
      ).toContain(w.title)
    })
  })

  it('keeps every entry, once each, in the given order when there are several', () => {
    const { getAllByRole } = renderList(variant, MANY)
    const items = getAllByRole('listitem')

    // 하나도 떨어뜨리지 않고, 같은 항목을 두 번 그리지도 않는다.
    expect(items.length, 'one list item per entry — none dropped, none doubled')
      .toBe(MANY.length)

    // 배열의 순서가 방문자에게 보이는 목록 순서다 (B1). 링크 주소가 항목의
    // 정체이므로 순서를 통째로 비교한다 — 뒤섞이면 여기서 어긋난다.
    const hrefs = items.map((item) =>
      within(item).getAllByRole('link')[0]?.getAttribute('href'),
    )
    expect(hrefs, 'visible order must be the array order').toEqual(
      MANY.map((w) => workPath(w.slug)),
    )

    // 보이는 글자도 같은 순서다 — 주소만 맞고 내용이 밀려 있는 경우를 막는다.
    MANY.forEach((w, i) => {
      expect(items[i]?.textContent, `item ${i} must read as ${w.slug}`).toContain(
        w.title,
      )
    })
  })

  it('derives title, blurb, object image and /works/<slug> link from the registry', () => {
    expect(works.length).toBeGreaterThan(0)
    const { getAllByRole } = renderList(variant)
    const items = getAllByRole('listitem')

    works.forEach((w, i) => {
      const item = items[i]
      expect(item, `no list item for ${w.slug}`).toBeTruthy()
      if (!item) return

      // 제목과 한 줄 소개.
      expect(item.textContent, `${w.slug}: title`).toContain(w.title)
      expect(item.textContent, `${w.slug}: blurb`).toContain(w.blurb)

      // 오브제 이미지 — 여기서 처음으로 DOM 이미지로 요청된다.
      const image = item.querySelector('img')
      expect(image, `${w.slug}: object image must be a DOM <img>`).toBeTruthy()
      expect(image?.getAttribute('src'), `${w.slug}: image src`).toBe(
        w.object.src,
      )

      // 진짜 링크 — 새 탭으로 열거나 주소를 복사하거나 검색 로봇이 따라갈 수
      // 있어야 하므로 href를 가진 <a>다.
      const links = within(item).getAllByRole('link')
      const hrefs = links.map((a) => a.getAttribute('href'))
      expect(hrefs, `${w.slug}: link to its work page`).toContain(
        workPath(w.slug),
      )
    })
  })

  it('keeps title and blurb when the object image fails to load', () => {
    expect(works.length).toBeGreaterThan(0)
    const { getAllByRole } = renderList(variant)
    const items = getAllByRole('listitem')

    works.forEach((w, i) => {
      const item = items[i]
      expect(item, `no list item for ${w.slug}`).toBeTruthy()
      if (!item) return

      const image = item.querySelector('img')
      expect(image, `${w.slug}: object image must be a DOM <img>`).toBeTruthy()
      if (!image) return
      fireEvent.error(image)

      // 빈 자리만 남기지 않는다 — 텍스트는 그대로 남는다.
      expect(item.textContent, `${w.slug}: title survives`).toContain(w.title)
      expect(item.textContent, `${w.slug}: blurb survives`).toContain(w.blurb)
    })
  })

  it('shows the empty message when the registry is empty', () => {
    const { getByText, queryAllByRole } = renderList(variant, [])

    expect(queryAllByRole('listitem').length, 'no items to show').toBe(0)
    expect(getByText(WORKS_EMPTY_MESSAGE)).toBeTruthy()
  })
})

describe('B5: site title & tagline belong to the fullscreen view only', () => {
  it('slide view renders the list without the site title or tagline', () => {
    expect(works.length).toBeGreaterThan(0)
    const { getAllByRole, queryByRole, queryByText } = renderList('slide')

    // 목록은 그려져 있다 (아래 부재 단언의 기준점).
    expect(getAllByRole('listitem').length).toBe(works.length)

    // 제목·태그라인은 홈이 이미 그리므로 목록이 다시 그리지 않는다.
    expect(
      queryByRole('heading', { name: SITE_TITLE }),
      'slide view must not repeat the site title',
    ).toBeNull()
    expect(
      queryByText(SITE_TAGLINE),
      'slide view must not repeat the tagline',
    ).toBeNull()
  })

  it('fullscreen view carries the site title and tagline', () => {
    expect(works.length).toBeGreaterThan(0)
    const { getAllByRole, getByRole, getByText } = renderList('fullscreen')

    expect(getAllByRole('listitem').length).toBe(works.length)

    // 씬을 띄울 수 없는 방문자에게는 이 화면이 홈이다.
    expect(getByRole('heading', { name: SITE_TITLE })).toBeTruthy()
    expect(getByText(SITE_TAGLINE)).toBeTruthy()
  })
})
