import { describe, expect, it } from 'vitest'
import { LONG_PRESS_MS } from '../theme.ts'
import { TOUCH_CLICK_SUPPRESS_MS } from './constants.ts'
import { decideTouchAction, shouldSuppressClick } from './touch.ts'

// 터치 판정의 순수 로직 계약 (Requirement 4, Decided 매핑: 길게 누르기 =
// 호버, 짧은 탭 = 터뜨리기). 임계값 소스는 theme의 LONG_PRESS_MS 하나 —
// 테스트도 그 상수를 기준으로 경계를 검사한다 (리터럴 중복 없음).
// 실제 제스처 감각(타이머·프레임 연동)은 수동 검수 범위.

describe('decideTouchAction', () => {
  it('즉시 뗀 터치는 탭이다', () => {
    expect(decideTouchAction(0)).toBe('tap')
  })

  it('임계값 직전까지는 탭이다', () => {
    expect(decideTouchAction(LONG_PRESS_MS - 1)).toBe('tap')
  })

  it('임계값 정확히 도달하면 길게 누르기다 (spec: 이상이면 길게 누르기)', () => {
    expect(decideTouchAction(LONG_PRESS_MS)).toBe('longpress-release')
  })

  it('임계값을 훌쩍 넘겨도 길게 누르기 해제다 — 절대 탭(팝) 아님', () => {
    expect(decideTouchAction(LONG_PRESS_MS * 10)).toBe('longpress-release')
  })
})

describe('shouldSuppressClick', () => {
  it("pointerType 'touch'인 click은 시간과 무관하게 억제한다", () => {
    expect(shouldSuppressClick('touch', Number.POSITIVE_INFINITY)).toBe(true)
  })

  it("pointerType 'mouse'는 최근 터치가 있었어도 억제하지 않는다 (데스크톱 무회귀)", () => {
    expect(shouldSuppressClick('mouse', 0)).toBe(false)
  })

  it("pointerType 'pen'도 억제하지 않는다", () => {
    expect(shouldSuppressClick('pen', 0)).toBe(false)
  })

  it('pointerType이 없으면 터치 종료 직후의 click만 억제한다 (폴백 시간창)', () => {
    expect(shouldSuppressClick(undefined, TOUCH_CLICK_SUPPRESS_MS - 1)).toBe(
      true,
    )
    expect(shouldSuppressClick(undefined, TOUCH_CLICK_SUPPRESS_MS)).toBe(false)
  })

  it('pointerType 없이 터치 이력도 없으면 억제하지 않는다 (순수 마우스 환경)', () => {
    expect(shouldSuppressClick(undefined, Number.POSITIVE_INFINITY)).toBe(false)
  })
})
