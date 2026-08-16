import { LONG_PRESS_MS } from '../theme.ts'
import { TOUCH_CLICK_SUPPRESS_MS } from './constants.ts'

// 터치 판정 (Requirement 4, Decided 매핑: 길게 누르기 = 호버, 짧은 탭 =
// 터뜨리기). 손가락을 뗀 시점의 누른 시간으로 판정하는 순수 함수 —
// 임계값은 theme의 LONG_PRESS_MS 하나뿐이다.
//
// - 'tap': 임계값 미만으로 짧게 눌렀다 뗌 → 데스크톱 클릭과 동일 (터짐).
// - 'longpress-release': 임계값 이상 누르고 있다가 뗌 → 호버 해제와 동일
//   (원복만, 절대 터뜨리지 않는다).

export type TouchAction = 'tap' | 'longpress-release'

export function decideTouchAction(elapsedMs: number): TouchAction {
  return elapsedMs < LONG_PRESS_MS ? 'tap' : 'longpress-release'
}

// 터치 뒤에 브라우저가 합성하는 click 억제 판정 (순수 함수). 탭의 팝은
// pointerup에서 이미 처리했고 길게 누르기 해제는 절대 팝이 아니므로,
// 터치에서 유래한 click은 전부 무시해야 한다. 이중 판별:
// - click 이벤트가 pointerType을 주는 최신 브라우저: 'touch'면 억제,
//   'mouse'/'pen'이면 확실한 비터치라 절대 억제하지 않는다 (데스크톱
//   무회귀 보장).
// - pointerType이 없는 구형 브라우저: 마지막 터치 종료 후
//   TOUCH_CLICK_SUPPRESS_MS 안에 온 click을 터치 유래로 간주.
export function shouldSuppressClick(
  pointerType: string | undefined,
  msSinceTouchEnd: number,
): boolean {
  if (pointerType === 'touch') return true
  if (pointerType === 'mouse' || pointerType === 'pen') return false
  return msSinceTouchEnd < TOUCH_CLICK_SUPPRESS_MS
}
