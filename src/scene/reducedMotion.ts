// prefers-reduced-motion 감지 — WebGL 씬 공유 헬퍼.
// CSS 쪽(index.css의 @media — 페이지 전환/힌트 페이드 0ms)은 브라우저가
// 알아서 처리하지만, R3F 프레임 루프의 모션은 JS에서 직접 물어봐야 한다.
//
// 감지는 라이브: matchMedia 'change' 리스너로 현재값을 캐시해 두므로
// prefersReducedMotion()은 프레임마다 불러도 공짜다 (matchMedia 재호출
// 없음). OS 설정을 켜고 끄면 새로고침 없이 다음 프레임부터 반영된다.
//
// jsdom 안전: window.matchMedia가 없거나 던지면 "축소 없음"(false)으로
// 고정 — 테스트 경로에서 절대 throw 하지 않는다.

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

interface MatchMediaHost {
  matchMedia?: (query: string) => MediaQueryList
}

/**
 * 주입 가능한 팩토리 (유닛 테스트용 — 모듈 싱글턴 상태에 안 얽힌다).
 * 반환값은 "지금 모션 축소를 원하는가"를 읽는 함수. matchMedia가 없으면
 * 항상 false를 돌려주는 함수를 반환한다.
 */
export function createReducedMotionSource(
  host: MatchMediaHost | undefined = typeof window === 'undefined'
    ? undefined
    : window,
): () => boolean {
  if (!host || typeof host.matchMedia !== 'function') return () => false
  let mql: MediaQueryList
  try {
    mql = host.matchMedia(REDUCED_MOTION_QUERY)
  } catch {
    return () => false
  }
  let reduced = mql.matches
  const onChange = (event: MediaQueryListEvent) => {
    reduced = event.matches
  }
  // 페이지 수명 동안 유지되는 구독이라 해제하지 않는다 (싱글턴 용도).
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange)
  } else if (typeof mql.addListener === 'function') {
    // 구형 Safari 폴백 (deprecated API).
    mql.addListener(onChange)
  }
  return () => reduced
}

let sharedSource: (() => boolean) | null = null

/** 사용자가 모션 축소를 원하는가 — 씬 코드가 쓰는 단일 진입점. */
export function prefersReducedMotion(): boolean {
  sharedSource ??= createReducedMotionSource()
  return sharedSource()
}
