// B6 — 보조기술에 드러나는 표면을 자동 테스트가 들여다보는 창.
//
// 계약이 자동 확인에 맡긴 것은 "이름·설명·위치 정보가 붙어 있는가"까지이고,
// 실제로 무엇이 들리는지는 사람이 VoiceOver로 확인한다. 그 사이를 잇는 것이
// 이 모듈이다: 붙이는 **수단**은 위임 구역이므로, 여기서는 표준 수단을 하나도
// 고르지 않고 전부 받아들인다. 이름은 aria-label이든 aria-labelledby든,
// 설명은 aria-description이든 aria-describedby든 title이든, 알림은
// role=status든 role=alert든 aria-live든 똑같이 읽어 낸다.
//
// 테스트 전용 모듈이다 — 앱 코드는 임포트하지 않는다 (파일명이 `.test.ts`가
// 아니므로 러너가 테스트로 수집하지도 않는다).

function textOfIdRefs(el: Element, attribute: string): string {
  const ids = el.getAttribute(attribute)
  if (ids === null) return ''
  const doc = el.ownerDocument
  return ids
    .split(/\s+/)
    .filter((id) => id.length > 0)
    .map((id) => doc.getElementById(id)?.textContent ?? '')
    .join(' ')
}

function squash(parts: readonly string[]): string {
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * 이 요소에 붙은 이름. 내용에서 이름을 얻는 요소(링크·항목 등)도 있으므로
 * 이름을 "있는가"로 물을 때는 readableTextOf를 쓴다.
 */
export function accessibleNameOf(el: Element): string {
  return squash([
    el.getAttribute('aria-label') ?? '',
    textOfIdRefs(el, 'aria-labelledby'),
  ])
}

/** 이 요소에 붙은 설명 — 조작법처럼 이름 뒤에 덧붙어 읽히는 것들. */
export function accessibleDescriptionOf(el: Element): string {
  return squash([
    el.getAttribute('aria-description') ?? '',
    textOfIdRefs(el, 'aria-describedby'),
    el.getAttribute('title') ?? '',
  ])
}

/** 이름이 붙었든 내용으로 읽히든, 이 요소에서 읽힐 만한 글자 전부. */
export function readableTextOf(el: Element): string {
  return squash([
    accessibleNameOf(el),
    el.getAttribute('alt') ?? '',
    el.textContent ?? '',
  ])
}

/**
 * 이 요소가 "지금 여기"라고 가리키고 있는 자손에서 읽힐 글자. 초점은 정거장
 * 하나에 머물고 그 안에서 자리를 옮기는 방식(aria-activedescendant)을 위한
 * 통로다 — 쓰지 않는 구현에서는 빈 문자열이다.
 */
export function activeDescendantTextOf(el: Element): string {
  const id = el.getAttribute('aria-activedescendant')
  if (id === null) return ''
  const target = el.ownerDocument.getElementById(id)
  return target === null ? '' : readableTextOf(target)
}

const LIVE_REGION_SELECTOR = [
  '[aria-live]:not([aria-live="off"])',
  '[role="status"]',
  '[role="alert"]',
  '[role="log"]',
].join(',')

/** 문서 안의 실시간 알림 영역들이 지금 담고 있는 글자. */
export function liveRegionTextIn(doc: Document = document): string {
  return squash(
    Array.from(doc.querySelectorAll(LIVE_REGION_SELECTOR)).map(
      (region) => region.textContent ?? '',
    ),
  )
}

function insideLiveRegion(el: Element): boolean {
  return el.closest(LIVE_REGION_SELECTOR) !== null
}

/**
 * 이 글자가 방문자에게 **알려지는가**. 화면에 떠 있는 것만으로는 모자란 자리
 * — 방금 화면이 바뀌었다는 사실처럼, 스스로 찾아 읽을 이유가 없는 소식에
 * 쓴다. 실시간 알림 영역에 담겨 있거나, 초점이 그리로 옮겨 갔으면 참이다.
 */
export function isAnnounced(el: Element): boolean {
  if (insideLiveRegion(el)) return true
  const active = el.ownerDocument.activeElement
  return active !== null && (active === el || el.contains(active))
}
