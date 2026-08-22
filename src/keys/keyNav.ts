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
// 함수 모양과 자료 구조는 위임 구역이므로, 계약이 실제로 이름을 붙인 것들만
// 굳혔다: 이 조합이 우리 것인가, 키의 뜻, 활성인 항목 목록, 가로채기 여부,
// 목록 안의 다음 자리. 그 밖의 것(초점을 어디에 들고 있을지, 씬이 결과를
// 어떻게 쓰는지)은 열어 둔다.

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

/** 키 하나가 뜻하는 일 — B2의 표를 그대로 옮긴 자리. */
const KEY_INTENTS: Readonly<Record<string, KeyIntent>> = {
  ArrowLeft: 'prev',
  ArrowUp: 'prev',
  ArrowRight: 'next',
  ArrowDown: 'next',
  Enter: 'enter',
  Escape: 'exit',
}

/**
 * 눌렀을 때 브라우저가 페이지를 스크롤하는 키들 (Requirement 6). 스페이스는
 * 뜻은 없어도 여기 있다 — 항목 사이를 옮기는 동안 페이지가 밀리면 안 된다.
 */
const SCROLLING_KEYS: readonly string[] = [
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  ' ',
]

/**
 * 키를 누를 때 함께 눌려 있던 보조 키들. KeyboardEvent가 그대로 들어맞지만
 * 이 계층은 이벤트를 모른다 — 필요한 세 값만 받는다.
 */
export interface KeyModifiers {
  readonly metaKey?: boolean
  readonly ctrlKey?: boolean
  readonly altKey?: boolean
}

/**
 * 이 조합이 이 계층의 것인가 (B2). ⌘·Ctrl·Alt가 함께 눌린 조합은 방문자와
 * 그의 브라우저·OS의 것이다 — ⌘←(뒤로 가기), Alt+←, Ctrl+방향키를 사이트가
 * 가로채면 방문자가 자기 브라우저를 잃는다. 그래서 이 계층은 그 조합에
 * 아무 뜻도 붙이지 않고 손대지도 않는다.
 *
 * Shift는 여기 없다. 역방향 탭(Shift+Tab)은 방문자의 정상적인 조작이고 이
 * 계층이 마땅히 답해야 하는 키다 — Shift를 넣으면 슬라이드의 탭 고리가 한쪽
 * 방향으로만 돈다.
 *
 * 씬·목록·작품 페이지 세 배선이 각자 답하던 것을 여기 한 자리로 모았다.
 * 조합이 눌린 방향키의 뜻이 화면마다 달라질 수 있어서는 안 되고, 그런 "키의
 * 뜻" 판정은 화면을 모르는 이 모듈의 몫이다 (conventions: 키 해석은 순수
 * 모듈, 컴포넌트에는 배선만).
 */
export function ownsChord(modifiers: KeyModifiers): boolean {
  return !(modifiers.metaKey || modifiers.ctrlKey || modifiers.altKey)
}

/**
 * 키의 뜻 (B2의 표). 왼쪽·위는 이전, 오른쪽·아래는 다음, 엔터는 들어가기,
 * Esc는 나오기. 탭을 비롯한 나머지는 null — 표준 동작에 맡긴다.
 *
 * 스페이스는 표에 없어서 뜻이 없다. 그래도 `interceptsKey`는 참인데, 뜻이
 * 없다는 것과 페이지를 밀어도 된다는 것은 다른 말이기 때문이다.
 */
export function keyIntent(key: string): KeyIntent | null {
  return KEY_INTENTS[key] ?? null
}

/**
 * 지금 방향키가 도는 항목 목록. 목록이 열려 있으면 목록이고, 닫혀 있으면
 * 씬이다. 작품 페이지에는 도는 항목 목록이 없다 (null).
 *
 * 홈이 씬을 내놓는 데는 초점이 어디 있는지가 끼어들지 않는다 — 아이콘에
 * 있든 아직 아무 데도 없든 방향키는 씬을 활성으로 만든다 (Requirement 5).
 */
export function activeItemList(surface: KeySurface): ItemList | null {
  switch (surface) {
    case 'list':
      return 'list'
    case 'home':
      return 'scene'
    case 'work':
      return null
  }
}

/**
 * 이 키를 우리가 가로채는가 — 곧 브라우저 기본 동작(방향키·스페이스의
 * 페이지 스크롤)을 막고 이 계층이 처리하는가 (Requirement 6). 가로채기는
 * 홈(두 종류 모두)과 열린 목록에 한정되고 작품 페이지로 넘어가지 않는다.
 *
 * 작품 페이지가 빠지는 이유를 자리 이름으로 적지 않고 "도는 항목 목록이
 * 있는가"로 적는다. 자리가 하나 더 생겨도 두 규칙이 어긋나지 않는다.
 */
export function interceptsKey(surface: KeySurface, key: string): boolean {
  return activeItemList(surface) !== null && SCROLLING_KEYS.includes(key)
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
  current: number | null,
  count: number,
  direction: MoveDirection,
): number | null {
  if (!Number.isFinite(count) || count < 1) return null
  const size = Math.floor(count)

  // 아직 목록 밖이면 첫 항목으로 들어온다. 어느 방향이든 같은 자리인 것은
  // 고리에 시작점이 하나뿐이기 때문이다 — 등록부의 첫 항목이 그 자리다.
  if (current === null || !Number.isFinite(current)) return 0

  // 지금 자리가 범위 밖이어도(항목이 줄었거나 애초에 없던 자리) 고리 위로
  // 되접어 실재하는 항목에서 다시 센다. 초점이 사라진 자리에 남지 않는다.
  const from = ((Math.floor(current) % size) + size) % size
  const step = direction === 'next' ? 1 : -1
  return (from + step + size) % size
}
