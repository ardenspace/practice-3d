// 작품 목록을 바깥 클릭으로 닫을 때 히스토리를 어떻게 다룰지 정하는 순수
// 판정 (B3). 화면도 라우터도 모르고, 지금 주소가 방문자의 첫 화면이었는지만
// 받아서 무엇을 할지 돌려준다 — 그래서 씬 없이도 규칙 자체를 확인할 수 있다.
//
// 규칙: 바깥 클릭으로 닫는 것은 히스토리를 늘리지 않는다.
// - 목록을 사이트 안에서 열었다면(= 이 주소 앞에 우리 항목이 있다) 뒤로
//   가서 그 자리로 돌아간다. 아이콘이 만든 항목 하나가 되감기고 끝이다.
// - `/works`로 곧장 들어왔다면 뒤에 아무것도 없다. 그때 뒤로 가면 사이트
//   밖으로 튕겨 나가므로, 대신 현재 항목을 `/`로 갈아친다.

/**
 * 히스토리의 첫 항목이 갖는 키. react-router가 방문자가 처음 도착한
 * 항목에만 붙이는 값이고, 그 뒤의 이동은 매번 새 키를 받는다. 즉
 * "이 주소가 이 방문의 시작점이었다"는 뜻이다.
 */
export const INITIAL_LOCATION_KEY = 'default'

/** 바깥 클릭으로 목록을 닫을 때 할 일. */
export type ListCloseAction =
  /** 히스토리를 한 칸 되감아 목록을 열기 전 자리로 돌아간다. */
  | 'back'
  /** 되감을 자리가 없다 — 현재 항목을 홈으로 갈아친다. */
  | 'replace-home'

export function decideListClose(locationKey: string): ListCloseAction {
  return locationKey === INITIAL_LOCATION_KEY ? 'replace-home' : 'back'
}
