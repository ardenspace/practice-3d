import { INITIAL_LOCATION_KEY } from '../works/listClose.ts'

// 씬을 띄울 수 있는지가 화면을 어떻게 바꾸는지 정하는 순수 판정 (B4).
// 화면도 라우터도 모른다 — 지금이 어떤 상황인지만 받아서 세 가지 사실을
// 돌려준다. 그래서 WebGL이 없는 jsdom에서도, 아무것도 렌더하지 않고도
// 규칙 자체를 확인할 수 있다.
//
// 규칙 하나: 씬이 없으면 이 방문자의 화면은 전체 화면 작품 목록이고, 그
// 화면이 사는 주소는 `/works` 하나뿐이다. 그래서 주소가 아직 `/`라면 갈아친다
// (Requirement 35, B3 — 밀어 넣지 않는다. 밀어 넣으면 뒤로가기가 `/`와
// `/works` 사이를 튕겨 다닌다). 이미 `/works`라면 갈 곳이 없다 — 목록이
// 슬라이드에서 화면 전체로 바뀔 뿐 이동은 일어나지 않는다.
//
// 규칙 둘: 안내 문구는 화면이 아니라 **뜻하지 않은 변화**에 붙는다
// (Requirement 36·37). 방문자가 이 자리를 스스로 고르지 않았다면, 이어지는
// 이동은 그가 요청한 적 없는 이동이다 — 그때 문구가 붙는다. 스스로 고르지
// 않은 자리는 두 가지다:
//   ① 방문이 여기서 시작했다 (`locationKey === INITIAL_LOCATION_KEY`).
//      아무것도 누르지 않았는데 다른 주소로 옮겨진다.
//   ② 사이트가 이 자리로 갈아쳤다 (`redirectedHere`). 알 수 없는 주소를
//      연 방문자를 catch-all이 `/`로 데려다 놓은 경우가 그렇다 — 히스토리
//      키는 새것이라 ①로는 보이지 않지만, 방문자가 고른 자리가 아닌 것은
//      마찬가지다.
// 반대로 스스로 누른 링크로 `/`에 닿았다면(작품 페이지의 홈 링크가 그렇다)
// 그 이동은 방문자가 시작한 것이고, `/works`를 직접 열었거나 새로고침했다면
// 애초에 이동이 없다.
//
// 규칙 셋: 실행 중에 씬이 무너지는 것(`sceneLost`)은 언제나 뜻하지 않은
// 변화다. 방문자는 방금까지 방울을 보고 있었다 — 이동이 따르든(`/`에 있던
// 경우) 안 따르든(`/works`에 있던 경우) 문구가 붙는다 (B4, Requirement 38).
// 그리고 이 사실은 다른 무엇보다 세다: 컨텍스트가 뒤늦게 복구되어
// `sceneAvailable`이 다시 참이 되어도 씬으로 되돌아가지 않는다. 방문자가
// 보고 있던 화면이 스스로 다시 뒤집히지 않는다는 B4의 약속이 여기 한 줄로
// 있다.

export interface SceneFallbackInput {
  /** 씬을 띄울 수 있는가 (WebGL 프로브 결과). */
  sceneAvailable: boolean
  /**
   * 씬이 떠 있다가 실행 중에 무너졌는가 — 컨텍스트 상실
   * (`webglcontextlost`), 또는 씬이 끝내 올라오지 못함(마운트 실패).
   * 한 방향으로만 움직이는 사실이다.
   */
  sceneLost: boolean
  /** 지금 주소가 이미 목록이 사는 자리(`/works`)인가. */
  listOpen: boolean
  /** 지금 위치의 히스토리 키. `INITIAL_LOCATION_KEY`면 방문의 첫 화면이다. */
  locationKey: string
  /**
   * 이 자리를 방문자가 고른 것이 아니라 사이트가 갈아쳤는가 — 알 수 없는
   * 주소를 받은 catch-all이 `/`로 데려다 놓은 경우 (routes.tsx).
   * 그 이동은 히스토리 키를 새로 받으므로 `locationKey`만으로는 방문자가
   * 스스로 누른 링크와 구별되지 않는다. 사실을 실어 오는 통로는
   * `REDIRECTED_HERE_STATE` / `wasRedirectedHere` 한 쌍이다.
   */
  redirectedHere?: boolean
}

/**
 * catch-all이 `/`로 갈아치면서 히스토리 항목에 남기는 표식
 * (react-router `location.state`). "이 자리는 방문자가 고른 것이 아니다".
 * 남기는 쪽(routes.tsx)과 읽는 쪽(Home.tsx)이 같은 값을 쓰도록 여기 둔다.
 */
export const REDIRECTED_HERE_STATE = { redirectedHere: true } as const

/** `location.state`가 위 표식을 달고 있는가. 모양이 다르면 거짓이다. */
export function wasRedirectedHere(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { redirectedHere?: unknown }).redirectedHere === true
  )
}

export interface SceneFallbackDecision {
  /** 방울 씬을 그려도 되는가. 거짓이면 화면은 전체 화면 작품 목록이다. */
  showScene: boolean
  /** 목록이 사는 주소로 갈아쳐야 하는가. */
  redirect: boolean
  /** 안내 문구(`SCENE_FALLBACK_NOTICE`)를 붙여야 하는가. */
  notice: boolean
}

const SCENE_UP: SceneFallbackDecision = {
  showScene: true,
  redirect: false,
  notice: false,
}
const STAY: SceneFallbackDecision = {
  showScene: false,
  redirect: false,
  notice: false,
}

export function decideSceneFallback({
  sceneAvailable,
  sceneLost,
  listOpen,
  locationKey,
  redirectedHere = false,
}: SceneFallbackInput): SceneFallbackDecision {
  // 실행 중에 무너졌다. 이 사실이 프로브 결과를 이긴다 — 복구되었다는
  // 소식이 와도 씬으로 돌아가지 않는다 (B4).
  if (sceneLost) {
    return { showScene: false, redirect: !listOpen, notice: true }
  }
  // 씬이 뜬다 — 폴백이 아니다.
  if (sceneAvailable) return SCENE_UP
  // 씬은 없지만 이미 목록의 주소다. 방문자가 스스로 연 화면이므로 옮길 곳도
  // 알릴 것도 없다 (Requirement 37).
  if (listOpen) return STAY
  return {
    showScene: false,
    redirect: true,
    notice: locationKey === INITIAL_LOCATION_KEY || redirectedHere,
  }
}
