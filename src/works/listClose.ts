// 어떤 화면에서 나올 때 히스토리를 어떻게 다룰지 정하는 순수 판정 (B3).
// 화면도 라우터도 모르고, 지금 주소가 방문자의 첫 화면이었는지만 받아서
// 무엇을 할지 돌려준다 — 그래서 씬 없이도 규칙 자체를 확인할 수 있다.
//
// 규칙: 나오는 길은 히스토리를 늘리지 않는다.
// - 이 자리에 사이트 안에서 닿았다면(= 이 주소 앞에 우리 항목이 있다) 뒤로
//   가서 그 자리로 돌아간다. 들어올 때 쌓인 항목 하나가 되감기고 끝이다.
// - 이 주소로 곧장 들어왔다면 뒤에 아무것도 없다. 그때 뒤로 가면 사이트
//   밖으로 튕겨 나가므로, 대신 현재 항목을 갈아친다.
//
// 이 규칙을 묻는 자리가 둘이다 — 목록을 닫을 때(Requirement 19·20)와 작품
// 페이지에서 Esc로 나올 때(Requirement 41). 판정의 근거인 `startedHere`는
// 그래서 한 곳에 있고, 무엇으로 갈아칠지만 부르는 쪽이 정한다 (목록은 `/`,
// 작품 페이지는 그 작품에서 파생된 목적지).

/**
 * 히스토리의 첫 항목이 갖는 키. react-router가 방문자가 처음 도착한
 * 항목에만 붙이는 값이고, 그 뒤의 이동은 매번 새 키를 받는다. 즉
 * "이 주소가 이 방문의 시작점이었다"는 뜻이다.
 */
export const INITIAL_LOCATION_KEY = 'default'

/**
 * 지금 이 주소가 이 방문의 시작점인가 — 곧 뒤로가기로 닿을 우리 자리가
 * 뒤에 없는가. 나오는 길이 되감기가 될지 갈아치기가 될지는 전부 이 한
 * 가지가 정한다.
 */
export function startedHere(locationKey: string): boolean {
  return locationKey === INITIAL_LOCATION_KEY
}

/** 바깥 클릭으로 목록을 닫을 때 할 일. */
export type ListCloseAction =
  /** 히스토리를 한 칸 되감아 목록을 열기 전 자리로 돌아간다. */
  | 'back'
  /** 되감을 자리가 없다 — 현재 항목을 홈으로 갈아친다. */
  | 'replace-home'

export function decideListClose(locationKey: string): ListCloseAction {
  return startedHere(locationKey) ? 'replace-home' : 'back'
}
