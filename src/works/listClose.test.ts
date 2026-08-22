import { createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { WORKS_PATH } from './registry.ts'
import {
  decideListClose,
  INITIAL_LOCATION_KEY,
  type ListCloseAction,
} from './listClose.ts'

// B3 — 바깥 클릭으로 목록을 닫을 때의 히스토리 규칙.
//
// 이 판정은 씬도 라우터도 모르는 순수 함수라 여기서 그대로 확인할 수 있다.
// 다만 판정의 근거인 INITIAL_LOCATION_KEY는 우리 것이 아니라 react-router가
// 첫 항목에 붙이는 값이다. 그 값이 조용히 바뀌면 `/works`로 곧장 들어온
// 방문자에게 판정이 'back'으로 뒤집히고, 바깥을 누른 방문자가 사이트 밖으로
// 튕겨 나간다. 그래서 규칙과 함께 그 가정 자체를 라우터에게 다시 물어 핀한다.

// 판정만 확인하면 되므로 화면은 필요 없다 — 경로만 있는 라우터를 만든다.
function routerAt(...entries: string[]) {
  return createMemoryRouter(
    [
      { path: '/', element: null },
      { path: WORKS_PATH, element: null },
    ],
    { initialEntries: entries },
  )
}

describe('B3: closing the works list from outside', () => {
  it('react-router still marks the first location with INITIAL_LOCATION_KEY', async () => {
    const router = routerAt(WORKS_PATH)

    // 방문의 시작점 — 되감을 자리가 없는 항목.
    expect(
      router.state.location.key,
      'the first location of a visit must still carry this key',
    ).toBe(INITIAL_LOCATION_KEY)

    // 그 뒤의 이동은 매번 새 키를 받는다. 이 대비가 성립해야 키 하나로
    // "여기가 시작점이었나"를 판별할 수 있다.
    await router.navigate('/')
    expect(
      router.state.location.key,
      'a later location must not reuse the initial key',
    ).not.toBe(INITIAL_LOCATION_KEY)
  })

  it('replaces with home when the list is where the visit began', () => {
    const router = routerAt(WORKS_PATH)
    const action: ListCloseAction = decideListClose(router.state.location.key)

    // 되감으면 사이트 밖이다 — 홈으로 갈아친다.
    expect(action, 'no history behind a direct visit to the list').toBe(
      'replace-home',
    )
  })

  it('goes back when the list was opened from inside the site', async () => {
    const router = routerAt('/')
    await router.navigate(WORKS_PATH)

    expect(
      decideListClose(router.state.location.key),
      'rewind the one entry the icon added',
    ).toBe('back')
  })
})
