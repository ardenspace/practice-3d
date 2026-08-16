import { describe, expect, it } from 'vitest'
import {
  createReducedMotionSource,
  prefersReducedMotion,
} from './reducedMotion.ts'

type ChangeListener = (event: MediaQueryListEvent) => void

// 최소 MediaQueryList 페이크 — matches + change 리스너만 흉내낸다.
function fakeHost(initialMatches: boolean, legacy = false) {
  const listeners: ChangeListener[] = []
  const mql = {
    matches: initialMatches,
    ...(legacy
      ? { addListener: (cb: ChangeListener) => listeners.push(cb) }
      : {
          addEventListener: (_type: string, cb: ChangeListener) =>
            listeners.push(cb),
        }),
  } as unknown as MediaQueryList
  return {
    host: { matchMedia: () => mql },
    fire(matches: boolean) {
      for (const cb of listeners) cb({ matches } as MediaQueryListEvent)
    },
  }
}

describe('createReducedMotionSource', () => {
  it('호스트가 없으면(SSR/미지원) 항상 false, throw 없음', () => {
    expect(createReducedMotionSource(undefined)()).toBe(false)
  })

  it('matchMedia가 없으면(jsdom) 항상 false, throw 없음', () => {
    expect(createReducedMotionSource({})()).toBe(false)
  })

  it('matchMedia가 던지면 조용히 false', () => {
    const host = {
      matchMedia: () => {
        throw new Error('boom')
      },
    }
    expect(createReducedMotionSource(host)()).toBe(false)
  })

  it('초기 matches 값을 그대로 반영한다', () => {
    expect(createReducedMotionSource(fakeHost(true).host)()).toBe(true)
    expect(createReducedMotionSource(fakeHost(false).host)()).toBe(false)
  })

  it('change 이벤트로 라이브 갱신된다 (양방향)', () => {
    const { host, fire } = fakeHost(false)
    const source = createReducedMotionSource(host)
    expect(source()).toBe(false)
    fire(true)
    expect(source()).toBe(true)
    fire(false)
    expect(source()).toBe(false)
  })

  it('구형 addListener만 있는 브라우저에서도 라이브 갱신된다', () => {
    const { host, fire } = fakeHost(false, true)
    const source = createReducedMotionSource(host)
    fire(true)
    expect(source()).toBe(true)
  })
})

describe('prefersReducedMotion (공유 싱글턴)', () => {
  it('jsdom(matchMedia 없음)에서 throw 없이 false', () => {
    expect(prefersReducedMotion()).toBe(false)
  })
})
