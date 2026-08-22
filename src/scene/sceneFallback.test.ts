import { describe, expect, it } from 'vitest'
import { INITIAL_LOCATION_KEY } from '../works/listClose.ts'
import {
  decideSceneFallback,
  REDIRECTED_HERE_STATE,
  wasRedirectedHere,
  type SceneFallbackInput,
} from './sceneFallback.ts'

// B4 — 씬을 띄울 수 없을 때 화면을 어떻게 바꿀지 정하는 규칙 그 자체.
//
// 이 판정은 화면도 라우터도 모르는 순수 모듈이다. 규칙을 컴포넌트에서 떼어
// 놓은 이유가 바로 이 파일이다: jsdom에는 WebGL이 없어 "씬이 떠 있다가
// 무너지는" 세계를 렌더로는 재현할 수 없지만, 그 세계에서 무엇을 해야 하는지는
// 여기서 전부 확인할 수 있다 (conventions: 화면 없이 판정만 하는 로직은 순수
// 모듈로 떼어내고 컴포넌트에는 배선만 남긴다).
//
// Home.test.tsx가 렌더로 확인하는 것과 겹치는 갈래도 있지만, 실행 중 씬
// 상실(`sceneLost`)이 걸린 갈래는 이 파일에만 있다 — 다른 어디에서도 확인할
// 수 없다.

/** 방문의 첫 화면이 아닌 자리 — 방문자가 스스로 눌러 만든 히스토리 항목. */
const LATER_KEY = 'a1b2c3'

function input(over: Partial<SceneFallbackInput> = {}): SceneFallbackInput {
  return {
    sceneAvailable: false,
    sceneLost: false,
    listOpen: false,
    locationKey: LATER_KEY,
    ...over,
  }
}

describe('B4: 씬을 띄울 수 있는지가 화면을 어떻게 바꾸는가', () => {
  it('씬이 뜨면 폴백이 아니다 — 옮기지도 알리지도 않는다', () => {
    expect(decideSceneFallback(input({ sceneAvailable: true }))).toEqual({
      showScene: true,
      redirect: false,
      notice: false,
    })
  })

  it('`/`를 처음 연 방문자는 목록 주소로 옮겨지고 안내가 붙는다', () => {
    // 아무것도 누르지 않았는데 다른 주소로 옮겨진다 (Requirement 36).
    expect(
      decideSceneFallback(input({ locationKey: INITIAL_LOCATION_KEY })),
    ).toEqual({ showScene: false, redirect: true, notice: true })
  })

  it('이미 `/works`면 갈 곳이 없다 — 이동도 안내도 없다', () => {
    // 직접 열었거나 새로고침한 방문자 (Requirement 37).
    expect(
      decideSceneFallback(
        input({ listOpen: true, locationKey: INITIAL_LOCATION_KEY }),
      ),
    ).toEqual({ showScene: false, redirect: false, notice: false })
  })

  it('스스로 누른 링크로 `/`에 닿았으면 옮기되 안내는 없다', () => {
    // 작품 페이지의 홈 링크 — 방문자가 시작한 이동이다 (Requirement 37).
    expect(decideSceneFallback(input())).toEqual({
      showScene: false,
      redirect: true,
      // 스스로 고른 자리에서 출발한 이동이므로 안내가 없다.
      notice: false,
    })
  })
})

describe('B4: 알 수 없는 주소를 열어 갈아쳐진 방문자', () => {
  it('히스토리 키가 새것이어도 안내가 붙는다', () => {
    // catch-all이 `/`로 갈아친 자리다. 갈아치기는 새 키를 받으므로 키만
    // 보면 방문자가 누른 링크와 구별되지 않는다 — 그러나 방문자는 작품
    // 목록을 요청한 적이 없다 (Requirement 36).
    expect(
      decideSceneFallback(input({ redirectedHere: true })),
    ).toEqual({ showScene: false, redirect: true, notice: true })
  })

  it('표식이 없으면 예전 규칙 그대로다 — 안내가 남발되지 않는다', () => {
    expect(decideSceneFallback(input({ redirectedHere: false })).notice).toBe(
      false,
    )
  })

  it('표식은 남기는 쪽과 읽는 쪽이 같은 값을 쓴다', () => {
    // routes.tsx가 실어 보내고 Home.tsx가 읽는다. 한쪽만 바뀌면 여기서
    // 어긋난다.
    expect(wasRedirectedHere(REDIRECTED_HERE_STATE)).toBe(true)
  })

  it('아무 state나 표식으로 읽지 않는다', () => {
    for (const state of [null, undefined, {}, 'redirectedHere', 42, [], {
      redirectedHere: false,
    }]) {
      expect(wasRedirectedHere(state), `${JSON.stringify(state)}`).toBe(false)
    }
  })
})

describe('B4: 실행 중에 씬이 무너졌을 때', () => {
  it('목록이 열려 있었으면 이동하지 않는다 — 그 자리에서 화면 전체가 된다', () => {
    const decision = decideSceneFallback(input({ sceneLost: true, listOpen: true }))

    expect(decision.showScene, '씬은 더 이상 없다').toBe(false)
    expect(
      decision.redirect,
      '이미 목록이 사는 주소다 — 슬라이드가 화면 전체로 바뀔 뿐 이동은 없다',
    ).toBe(false)
  })

  it('이동이 없어도 안내는 붙는다', () => {
    // 방금까지 방울을 보고 있던 방문자에게 화면이 바뀌었다. 이동이
    // 따르지 않는다고 해서 요청한 변화가 되지는 않는다 (Requirement 36, B4).
    expect(
      decideSceneFallback(input({ sceneLost: true, listOpen: true })).notice,
    ).toBe(true)
  })

  it('`/`에서 무너지면 목록이 사는 주소로 옮긴다', () => {
    const decision = decideSceneFallback(input({ sceneLost: true }))

    expect(decision.redirect).toBe(true)
    expect(decision.notice).toBe(true)
  })

  it('무너졌다는 사실이 프로브 결과를 이긴다 — 컨텍스트가 복구되어도 돌아가지 않는다', () => {
    // `webglcontextrestored`로 sceneAvailable이 다시 참이 된 세계. 방문자가
    // 보고 있던 화면이 스스로 다시 뒤집히지 않는다는 B4의 약속이고, 확인할
    // 수 있는 곳은 여기뿐이다 (jsdom에는 씬이 뜨지 않는다).
    for (const listOpen of [true, false]) {
      expect(
        decideSceneFallback(
          input({ sceneAvailable: true, sceneLost: true, listOpen }),
        ).showScene,
        `listOpen=${listOpen}`,
      ).toBe(false)
    }
  })

  it('어떤 자리에서 무너졌든 안내는 붙는다', () => {
    for (const locationKey of [INITIAL_LOCATION_KEY, LATER_KEY]) {
      for (const listOpen of [true, false]) {
        expect(
          decideSceneFallback(input({ sceneLost: true, listOpen, locationKey }))
            .notice,
          `key=${locationKey} listOpen=${listOpen}`,
        ).toBe(true)
      }
    }
  })
})
