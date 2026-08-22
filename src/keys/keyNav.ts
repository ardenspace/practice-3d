// B2 — 키보드 조작 계약의 판정 계층. 화면도 DOM도 타이머도 모르는 순수
// 모듈이다.
//
// 사이트 전체에서 키의 뜻은 하나다. 그 뜻을 정하는 쪽은 방울·3D·씬에 대해
// 아무것도 알지 못한다 — 항목이 몇 개이고 지금 몇 번째인지만 받아서 다음
// 자리를 내놓는다 (Requirement 47). 방울을 걷어내고 다른 표현을 넣어도 이
// 파일은 손대지 않는다. 그래서 WebGL이 없는 jsdom에서도 조작 규칙 전부를
// 화면 없이 확인할 수 있다 (keyNav.test.ts).
//
// 씬 폴더 밖에 두는 이유가 그것이다 — 씬에 속한 물건이 아니다.
//
// ─── 아직 껍데기다 ─────────────────────────────────────────────────────
// 페이즈 3 스텝 1은 계약을 실패하는 테스트로 못 박는 스텝이라, 여기에는
// 공개 표면(이름·시그니처)만 있고 판정은 하나도 없다. keyNav.test.ts가
// 지금 실패하는 이유는 "규칙이 아직 없다"이지 "테스트가 깨졌다"가 아니다.
//
// 함수 모양과 자료 구조는 위임 구역이므로, 계약이 실제로 이름을 붙인 네
// 가지만 굳혔다: 키의 뜻, 활성인 항목 목록, 가로채기 여부, 목록 안의 다음
// 자리. 그 밖의 것(초점을 어디에 들고 있을지, 씬이 결과를 어떻게 쓰는지)은
// 열어 둔다.

/**
 * 지금 방문자가 서 있는 자리. 키의 뜻은 어디서나 같지만, 그 뜻이 향하는
 * 항목 목록과 브라우저 기본 동작을 막을지 여부는 자리마다 다르다.
 * - `home`: 목록이 닫힌 홈. 씬이 뜬 홈과 씬 없는 홈 두 종류 모두.
 * - `list`: 목록이 열려 있다 (씬 위 슬라이드든 전체 화면이든).
 * - `work`: 작품 페이지. 여기서 방향키와 스페이스는 브라우저 기본 그대로다.
 */
export type KeySurface = 'home' | 'list' | 'work'

/** 키 하나가 뜻하는 일. 표에 없는 키는 이 계층이 뜻을 정하지 않는다. */
export type KeyIntent = 'prev' | 'next' | 'enter' | 'exit'

/** 방향키가 향하는 항목 목록. */
export type ItemList = 'scene' | 'list'

/** 항목 사이를 옮기는 두 방향. */
export type MoveDirection = Extract<KeyIntent, 'prev' | 'next'>

/**
 * 키의 뜻 (B2의 표). 왼쪽·위는 이전, 오른쪽·아래는 다음, 엔터는 들어가기,
 * Esc는 나오기. 탭을 비롯한 나머지는 null — 표준 동작에 맡긴다.
 */
export function keyIntent(_key: string): KeyIntent | null {
  return null
}

/**
 * 지금 방향키가 도는 항목 목록. 목록이 열려 있으면 목록이고, 닫혀 있으면
 * 씬이다. 작품 페이지에는 도는 항목 목록이 없다 (null).
 */
export function activeItemList(_surface: KeySurface): ItemList | null {
  return null
}

/**
 * 이 키를 우리가 가로채는가 — 곧 브라우저 기본 동작(방향키·스페이스의
 * 페이지 스크롤)을 막고 이 계층이 처리하는가 (Requirement 6). 가로채기는
 * 홈(두 종류 모두)과 열린 목록에 한정되고 작품 페이지로 넘어가지 않는다.
 */
export function interceptsKey(_surface: KeySurface, _key: string): boolean {
  return false
}

/**
 * 항목 목록 안에서 다음 자리 (Requirements 2·3·4·29).
 *
 * - 순서는 목록이 준 순서 그대로다 (등록부 순서). 화면상의 위치는 모른다.
 * - 끝에서 처음으로 순환한다.
 * - 아직 아무 데도 없으면(`current === null`) 목록 안으로 들어온다.
 * - 항목이 하나도 없으면 아무 일도 없다 (null).
 */
export function moveCursor(
  _current: number | null,
  _count: number,
  _direction: MoveDirection,
): number | null {
  return null
}
