import { describe, expect, it } from 'vitest'
import {
  activeItemList,
  beginsKeyboardUse,
  interceptsKey,
  keyIntent,
  moveCursor,
  ownsChord,
  type KeyModifiers,
  type KeySurface,
  type MoveDirection,
} from './keyNav.ts'

// B2 — 키보드 조작 계약 가운데 화면 없이 정해지는 부분.
//
// 계약이 못 박은 대로, 키를 해석하는 쪽은 방울·3D·씬에 대해 아무것도 모른
// 채로 단위 테스트된다 (Requirement 47). 그래서 이 파일에는 렌더가 한 줄도
// 없다 — 순회 규칙·순환·활성 항목 목록·가로채기는 전부 여기서 확인되고,
// 씬이 없는 jsdom은 이 확인에 아무 제약도 걸지 않는다.
//
// 여기서 확인하지 않는 것: 이 판정을 화면이 어떻게 쓰는지(초점이 실제로
// 어디로 가는지)는 keyboardSurfaces.test.tsx가 본다.

const ARROWS = {
  ArrowLeft: 'prev',
  ArrowUp: 'prev',
  ArrowRight: 'next',
  ArrowDown: 'next',
} as const

const SPACE = ' '

/** 목록 안에서 방향키를 `steps`번 눌러 지나간 자리들. */
function walk(
  count: number,
  direction: MoveDirection,
  steps: number,
): (number | null)[] {
  const visited: (number | null)[] = []
  let cursor: number | null = null
  for (let i = 0; i < steps; i += 1) {
    cursor = moveCursor(cursor, count, direction)
    visited.push(cursor)
  }
  return visited
}

describe('B2: 키의 뜻은 사이트 전체에서 하나다', () => {
  it('왼쪽과 위는 이전, 오른쪽과 아래는 다음이다', () => {
    for (const [key, intent] of Object.entries(ARROWS)) {
      expect(keyIntent(key), `${key}의 뜻`).toBe(intent)
    }
  })

  it('엔터는 들어가고 Esc는 나온다', () => {
    expect(keyIntent('Enter')).toBe('enter')
    expect(keyIntent('Escape')).toBe('exit')
  })

  it('탭은 이 계층이 뜻을 정하지 않는다 — 표준대로 움직인다', () => {
    // 탭은 "지금 활성인 영역의 조작 요소 사이를 표준대로" 옮기는 키다.
    // 뜻을 여기서 새로 정하는 순간 그 표준이 깨진다.
    expect(keyIntent('Tab')).toBeNull()
  })

  it('표에 없는 키는 아무 뜻도 아니다', () => {
    for (const key of ['a', 'Home', 'PageDown', 'F5', 'Backspace']) {
      expect(keyIntent(key), `${key}는 이 계층의 키가 아니다`).toBeNull()
    }
  })
})

describe('B2: ⌘·Ctrl·Alt 조합은 이 계층의 키가 아니다', () => {
  // 이 판정은 원래 세 배선(씬·목록·작품 페이지)에 똑같이 세 번 적혀 있었다.
  // 한 자리로 모았으므로 여기가 그 하나를 핀한다 — 조합이 눌린 방향키의 뜻이
  // 화면마다 달라지면 방문자가 ⌘←(뒤로 가기)를 화면 하나에서만 잃는다.
  it('아무 조합도 눌리지 않았으면 우리 것이다', () => {
    expect(ownsChord({})).toBe(true)
    expect(
      ownsChord({ metaKey: false, ctrlKey: false, altKey: false }),
    ).toBe(true)
  })

  it('⌘·Ctrl·Alt 가운데 하나라도 눌려 있으면 우리 것이 아니다', () => {
    for (const held of ['metaKey', 'ctrlKey', 'altKey'] as const) {
      expect(ownsChord({ [held]: true }), `${held}는 방문자의 것이다`).toBe(
        false,
      )
    }
    expect(
      ownsChord({ metaKey: true, ctrlKey: true, altKey: true }),
      '겹쳐 눌려도 마찬가지다',
    ).toBe(false)
  })

  it('Shift는 조합으로 치지 않는다 — 역방향 탭이 정상적인 조작이다', () => {
    // Shift를 조합에 넣으면 슬라이드의 탭 고리가 한쪽 방향으로만 돈다
    // (Requirement 17). 이벤트에는 shiftKey가 함께 실려 오므로, 실려 와도
    // 판정이 달라지지 않는다는 것까지 본다.
    const shiftHeld: KeyModifiers & { shiftKey: boolean } = { shiftKey: true }
    expect(ownsChord(shiftHeld)).toBe(true)
  })
})

describe('Requirement 43: 이 키를 누른 것이 곧 "키보드를 쓰기 시작했다"인가', () => {
  // 조작법의 화면 갈래는 이 판정 하나에 걸려 있다 — 참이 되어야 안내가
  // 화면에 나타난다. 판정 자체는 화면도 DOM도 모르므로 여기서 확인한다
  // (conventions: 입력 판정은 순수 모듈, 컴포넌트에는 배선만).
  //
  // 참이 되는 **키의 집합**이 정확히 무엇인가는 Simplicity Zone이라
  // ("기준은 일부러 단순하다") 전부를 못 박지 않는다. 계약이 정한 것만
  // 못 박는다: 이 사이트를 키보드로 지나가는 길이 실제로 신호로 쳐지는가.
  // 그 길을 걷는 방문자가 신호로 안 쳐지면 안내가 끝내 나타나지 않는다.
  //
  // 마우스만 쓰는 사람 쪽(안내가 끝까지 보이지 않는다)은 이 함수가 아니라
  // "keydown이 아예 오지 않는다"가 만든다 — 배선 쪽에서 확인한다
  // (scene/sceneShell.test.tsx).

  it('안내가 말하는 키들 — 방향키·엔터·Esc — 은 전부 신호다', () => {
    for (const key of [...Object.keys(ARROWS), 'Enter', 'Escape']) {
      expect(
        beginsKeyboardUse(key),
        `${key}로 조작을 시작한 방문자에게 안내가 나타나야 한다`,
      ).toBe(true)
    }
  })

  it('탭도 신호다 — 씬에 처음 닿는 길이 탭이다', () => {
    // 탭의 뜻은 여전히 브라우저의 것이다(위 "표에 없는 키"). 뜻이 없다는
    // 것과 키보드를 쓰기 시작하지 않았다는 것은 다른 말이다.
    expect(keyIntent('Tab'), '뜻은 이 계층이 정하지 않는다').toBeNull()
    expect(beginsKeyboardUse('Tab'), '그래도 키보드를 쓰기 시작했다').toBe(true)
  })
})

describe('B2: 활성인 항목 목록', () => {
  it('목록이 열려 있으면 목록, 닫혀 있으면 씬이다', () => {
    expect(activeItemList('list')).toBe('list')
    expect(activeItemList('home')).toBe('scene')
  })

  it('작품 페이지에는 도는 항목 목록이 없다', () => {
    expect(activeItemList('work')).toBeNull()
  })
})

describe('B2: 방향키와 스페이스가 페이지를 스크롤하지 않는다 (Requirement 6)', () => {
  const SCROLLING_KEYS = [...Object.keys(ARROWS), SPACE]

  it.each<KeySurface>(['home', 'list'])(
    '%s 에서는 가로챈다',
    (surface) => {
      for (const key of SCROLLING_KEYS) {
        expect(interceptsKey(surface, key), `${surface}/${key}`).toBe(true)
      }
    },
  )

  it('작품 페이지로는 넘어가지 않는다 — 브라우저 기본 그대로다', () => {
    for (const key of SCROLLING_KEYS) {
      expect(interceptsKey('work', key), `work/${key}`).toBe(false)
    }
  })
})

describe('B2: 항목 목록 안에서 옮기기', () => {
  const COUNT = 3

  it('다음은 뒤로 한 칸, 이전은 앞으로 한 칸이다 (Requirement 3)', () => {
    expect(moveCursor(0, COUNT, 'next')).toBe(1)
    expect(moveCursor(1, COUNT, 'next')).toBe(2)
    expect(moveCursor(2, COUNT, 'prev')).toBe(1)
    expect(moveCursor(1, COUNT, 'prev')).toBe(0)
  })

  it('끝에서 처음으로, 처음에서 끝으로 순환한다 (Requirement 4)', () => {
    expect(moveCursor(COUNT - 1, COUNT, 'next'), '마지막 다음은 처음').toBe(0)
    expect(moveCursor(0, COUNT, 'prev'), '처음 이전은 마지막').toBe(COUNT - 1)
  })

  it('네 키가 같은 하나의 고리를 돈다 (Requirement 2)', () => {
    // 왼쪽·위와 오른쪽·아래가 뜻을 나눠 갖는다는 것은 위에서 확인했다.
    // 남은 것은 그 둘이 같은 고리의 양방향이라는 것 — 다음으로 갔다가
    // 이전으로 오면 제자리다. 두 축이 각자 다른 고리를 돌면 어긋난다.
    for (let i = 0; i < COUNT; i += 1) {
      const next = moveCursor(i, COUNT, 'next')
      expect(next, `${i}의 다음 자리`).not.toBeNull()
      expect(moveCursor(next, COUNT, 'prev'), `${i}에서 다음→이전`).toBe(i)

      const prev = moveCursor(i, COUNT, 'prev')
      expect(prev, `${i}의 이전 자리`).not.toBeNull()
      expect(moveCursor(prev, COUNT, 'next'), `${i}에서 이전→다음`).toBe(i)
    }
  })

  it('한 바퀴 돌면 모든 항목을 한 번씩 지난다', () => {
    // 순회가 어느 항목도 건너뛰지 않고 같은 항목을 두 번 밟지도 않는다 —
    // 등록부에 항목이 하나 더 늘면 정거장도 하나 더 는다 (B1).
    const forward = walk(COUNT, 'next', COUNT)
    expect(new Set(forward).size, '모든 자리를 한 번씩').toBe(COUNT)
    const backward = walk(COUNT, 'prev', COUNT)
    expect(new Set(backward).size, '반대 방향도 마찬가지').toBe(COUNT)
  })

  it('초점이 아직 아무 데도 없어도 목록 안으로 들어온다 (Requirement 5)', () => {
    // 어느 항목으로 들어오는지는 위임 구역이다. 들어온다는 사실과, 그 자리가
    // 실재하는 항목이라는 것만 계약이다.
    for (const direction of ['prev', 'next'] as const) {
      const entered = moveCursor(null, COUNT, direction)
      expect(entered, `${direction}: 목록 밖에 머물지 않는다`).not.toBeNull()
      expect(entered, `${direction}: 실재하는 항목이다`).toBeGreaterThanOrEqual(0)
      expect(entered).toBeLessThan(COUNT)
    }
  })

  it('항목이 하나도 없으면 아무 일도 일어나지 않는다 (Requirement 29)', () => {
    // 등록부가 비면 방향키는 씬에서 아무 일도 하지 않는다 — 갈 자리가 없다.
    for (const direction of ['prev', 'next'] as const) {
      expect(moveCursor(null, 0, direction)).toBeNull()
      expect(moveCursor(0, 0, direction)).toBeNull()
    }
  })

  it('사라진 자리에 남지 않는다', () => {
    // 방울이 터지거나 항목이 줄어 지금 자리가 범위 밖이 되어도, 다음 자리는
    // 언제나 실재하는 항목이다 (Failure Behavior: 초점이 사라진 요소에
    // 남지 않는다).
    for (const direction of ['prev', 'next'] as const) {
      const moved = moveCursor(COUNT + 4, COUNT, direction)
      expect(moved, `${direction}: 범위 밖에 머물지 않는다`).not.toBeNull()
      expect(moved).toBeGreaterThanOrEqual(0)
      expect(moved).toBeLessThan(COUNT)
    }
  })

  it('항목이 하나뿐이면 어느 방향으로도 그 항목이다', () => {
    expect(moveCursor(null, 1, 'next')).toBe(0)
    expect(moveCursor(0, 1, 'next')).toBe(0)
    expect(moveCursor(0, 1, 'prev')).toBe(0)
  })
})
