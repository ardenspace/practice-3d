// 키 배선이 이벤트 타깃과 초점 상태에 대해 브라우저에게 물어보는 자리.
//
// keyNav는 화면도 DOM도 모르는 판정 계층이라 이런 질문에 답할 수 없다 —
// 답하려면 요소를 봐야 하기 때문이다. 그렇다고 리스너를 다는 쪽마다 각자
// 판별하면 "무엇이 키를 자기 것으로 쓰는가"가 화면 수만큼 생긴다. 그래서
// 브라우저에게 묻는 헬퍼는 여기 한 벌만 두고 씬·목록 양쪽이 재사용한다
// (conventions: 브라우저 기능 탐지는 전용 헬퍼 하나).

// 방향키·스페이스를 자기 것으로 쓰는 요소들. 이런 요소 위에서 우리가
// preventDefault를 하면 방문자가 글자를 넘기지도, 선택지를 고르지도 못한다.
const SELF_MANAGED_TAGS: ReadonlySet<string> = new Set([
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'BUTTON',
])

/**
 * 이 타깃이 방향키·스페이스를 자기 것으로 쓰는가. 지금 홈과 목록에는 이런
 * 요소가 없지만, 하나 생기는 순간 조용히 망가지는 대신 여기 한 줄로 막힌다.
 */
export function usesKeysItself(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || SELF_MANAGED_TAGS.has(target.tagName)
}

/**
 * 이 요소가 지금 든 초점이 키보드로 들어온 것인가 — 브라우저의
 * `:focus-visible` 판정을 그대로 쓴다. 마우스로 씬을 눌러도 초점 정거장은
 * 초점을 받지만, 그때 방울 하나가 저 혼자 붙잡히면 마우스 방문자에게는
 * 없던 일이 생기는 것이다 (Requirement 46: 마우스 조작에 회귀 없음).
 *
 * 이 의사 클래스를 모르는 브라우저는 예외를 던진다 — 그 경우 판정하지
 * 못한 것이므로 초점 표시를 감추는 쪽이 아니라 보이는 쪽으로 기운다.
 */
export function focusedByKeyboard(element: Element): boolean {
  try {
    return element.matches(':focus-visible')
  } catch {
    return true
  }
}
