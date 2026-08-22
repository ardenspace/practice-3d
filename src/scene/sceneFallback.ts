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
// (Requirement 36·37). 방문이 `/`에서 시작했다면 방문자는 아무것도 누르지
// 않았는데 다른 주소로 옮겨진다 — 그때 문구가 붙는다. 스스로 누른 링크로
// `/`에 닿았다면(작품 페이지의 홈 링크가 그렇다) 그 이동은 방문자가 시작한
// 것이고, `/works`를 직접 열었거나 새로고침했다면 애초에 이동이 없다.
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
    notice: locationKey === INITIAL_LOCATION_KEY,
  }
}
