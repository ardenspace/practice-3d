import { useEffect, useRef, type RefObject } from 'react'
import {
  activeItemList,
  interceptsKey,
  keyIntent,
  moveCursor,
  type KeySurface,
} from './keyNav.ts'

// 씬이 뜬 홈에서 키를 실제 DOM에 배선하는 자리. 판정은 전부 keyNav가
// 하고(순수, 화면 없음) 여기는 그 판정을 창(window)의 keydown 하나에
// 이어 붙인다 — 초점을 어디에 둘지, 무엇을 터뜨릴지는 호출하는 쪽(Home)이
// 상태로 들고 있고 이 훅은 그것을 읽고 바꿔 줄 뿐이다.
//
// 리스너를 씬 요소가 아니라 창에 다는 이유 (Reversibility Ledger, Decided):
// 홈에 막 들어온 방문자는 아직 아무것도 초점하지 않았다. 그 상태에서
// 방향키 하나로 방울이 움직이려면 홈 화면 전체가 방향키를 자기 것으로
// 써야 한다 (Requirement 5). 대가는 그 항목에 적혀 있다 — 앞으로 홈에
// 방향키를 자기 것으로 쓰는 요소(스크롤 영역·선택 메뉴)를 둘 수 없다.
//
// 씬 안(R3F Canvas 자식)이 아니라 DOM 쪽에 있는 것도 규율이다. Canvas
// 자식은 별도 리컨실러라 DOM 이벤트·라우터에 기대지 않는다.

const SURFACE: KeySurface = 'home'

// 방향키·스페이스를 자기 것으로 쓰는 요소들. keyNav는 이벤트 타깃을 모르니
// (알 필요도 없다 — 화면 없는 판정 계층이다) 타깃 판별은 리스너를 다는
// 이쪽 몫이다. 지금 홈에는 이런 요소가 없지만, 하나 생기는 순간 조용히
// 망가지는 대신 여기 한 줄로 막힌다.
const SELF_MANAGED_TAGS: ReadonlySet<string> = new Set([
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'BUTTON',
])

function usesKeysItself(target: EventTarget | null): boolean {
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

export interface SceneKeyNavOptions {
  /**
   * 씬이 지금 키를 받는가 — 씬이 떠 있고 목록이 닫혀 있을 때만 참.
   * 목록이 열려 있는 동안의 키는 목록 몫이고, 씬 없는 홈의 키는 그 화면인
   * 전체 화면 목록 몫이다.
   */
  active: boolean
  /** 씬 안에서 초점이 도는 항목(작품 방울)의 수. 0이면 아무 일도 없다. */
  count: number
  /** 씬이 차지하는 단 하나의 초점 정거장 (Requirement 11). */
  stationRef: RefObject<HTMLElement | null>
  /** 지금 초점이 놓인 항목의 자리 (아직 아무 데도 없으면 null). */
  cursor: number | null
  /** 초점을 옮긴다. */
  onCursorChange: (index: number) => void
  /** 엔터 — 초점이 씬 정거장에 있을 때만, 그 자리의 항목에 대해. */
  onEnter: (index: number) => void
}

/**
 * 씬이 뜬 홈의 키보드 배선 (Requirements 1–6·10·29).
 *
 * - 방향키: 초점이 어디에 있든(아이콘이든 아무 데도 아니든) 씬을 활성으로
 *   만들고, 씬 정거장으로 초점을 데려온 뒤 커서를 한 칸 옮긴다. 등록부가
 *   비어 있으면 moveCursor가 null을 돌려주므로 초점도 옮겨오지 않는다.
 * - 엔터: 초점이 씬 정거장에 있을 때만 이 훅이 가져간다. 아이콘에 있으면
 *   손대지 않아 링크의 기본 활성화가 목록을 연다 — 한 번의 엔터가 두 곳에서
 *   발동하지 않는다 (Requirement 10).
 * - 방향키·스페이스의 페이지 스크롤은 막는다 (Requirement 6). "가로챌지"는
 *   interceptsKey가, "무엇을 할지"는 keyIntent가 따로 답한다 — 스페이스는
 *   뜻이 없어도 가로채이고, 엔터는 뜻이 있어도 가로채기 목록에 없다.
 */
export function useSceneKeyNav(options: SceneKeyNavOptions): void {
  // 리스너는 한 번만 달고, 매 프레임 바뀌는 값(커서·개수)은 ref로 최신을
  // 읽는다 — 커서가 움직일 때마다 리스너를 떼었다 다는 일이 없도록.
  const latest = useRef(options)
  latest.current = options

  const { active } = options

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        active: stillActive,
        count,
        cursor,
        stationRef,
        onCursorChange,
        onEnter,
      } = latest.current
      if (!stillActive) return
      // 브라우저·OS 단축키(⌘←, Alt+←…)는 방문자의 것이다. 건드리지 않는다.
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const station = stationRef.current
      if (station === null) return

      if (interceptsKey(SURFACE, event.key) && !usesKeysItself(event.target)) {
        event.preventDefault()
      }

      const intent = keyIntent(event.key)

      if (intent === 'prev' || intent === 'next') {
        if (activeItemList(SURFACE) !== 'scene') return
        const next = moveCursor(cursor, count, intent)
        // 등록부가 비었다 — 갈 자리가 없으므로 초점도 데려오지 않는다
        // (Requirement 29).
        if (next === null) return
        if (document.activeElement !== station) {
          // 씬은 뷰포트를 통째로 덮으므로 스크롤해서 "보이게" 할 것이
          // 없다. 초점을 옮기느라 페이지가 밀리는 일만 막는다.
          station.focus({ preventScroll: true })
        }
        onCursorChange(next)
        return
      }

      if (intent === 'enter') {
        if (document.activeElement !== station || cursor === null) return
        // 우리가 처리했다는 표시 — 이 자리에서 기본 동작이 겹쳐 두 번
        // 열리는 일이 없도록.
        event.preventDefault()
        onEnter(cursor)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active])
}
