import { useEffect, useRef, type RefObject } from 'react'
import {
  activeItemList,
  interceptsKey,
  keyIntent,
  moveCursor,
  type KeySurface,
} from './keyNav.ts'
import { usesKeysItself } from './keyTargets.ts'

// 열린 작품 목록의 키 배선 (Requirements 6·10·17·18·20·22·24·29).
//
// 씬 쪽(useSceneKeyNav)과 짝을 이루는 자리다. 판정은 똑같이 전부 keyNav가
// 하고 — 키의 뜻, 가로챌지 여부, 다음 자리 — 여기는 그 판정을 창(window)의
// keydown 하나에 이어 붙인다. 두 배선의 차이는 항목이 무엇이냐 하나다:
// 씬은 방울 N개가 DOM 정거장 하나 뒤에 있어 "몇 번째"를 셸이 상태로 들어야
// 하지만, 목록의 항목은 각자 진짜 링크라 초점 자체가 곧 그 자리다. 그래서
// 이 훅은 커서를 들지 않고 매번 DOM에서 읽는다 — 방문자가 탭이나 마우스로
// 다른 항목에 가 있어도 방향키가 거기서부터 이어진다.
//
// 목록이 무엇인지(작품·등록부·슬러그)는 모른다. 무엇이 항목인지는 부르는
// 쪽이 셀렉터로 알려 준다 — 이 계층은 씬도 방울도 작품도 모른다.
//
// 새 모션 없음 (Requirement 45): 화면 밖 항목으로 갈 때의 따라 스크롤은
// 브라우저의 focus() 기본 동작이고 그 스크롤은 즉시다. 우리가 부드러운
// 스크롤을 얹지 않으므로 prefers-reduced-motion이 갈라야 할 움직임 자체가
// 생기지 않는다.

const SURFACE: KeySurface = 'list'

/** 탭 순서에 들어가는 요소들 — 슬라이드 안의 고리를 그릴 때 쓴다. */
const TAB_STOP_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export interface ListKeyNavOptions {
  /** 목록 표면. 항목도 탭 고리도 이 안에서 찾는다. */
  surfaceRef: RefObject<HTMLElement | null>
  /** 무엇이 "항목"인가. 방향키는 이 셀렉터에 걸리는 것들 사이만 돈다. */
  itemSelector: string
  /**
   * 목록에서 나가는 길 (Requirement 20). 슬라이드에만 있다 — 전체 화면
   * 목록은 그 방문자의 홈이라 닫을 것이 없고, 그래서 여기가 비면 Esc는
   * 아무 일도 하지 않는다 (Requirement 22).
   */
  onExit?: (() => void) | undefined
  /**
   * 탭을 목록 안에 가두는가 (Requirement 17). 슬라이드에서만 참이다.
   *
   * 이것은 금지된 키보드 함정이 아니다 (B2): 슬라이드는 씬 위에 열린 창이고
   * 나가는 길 — Esc와 바깥 클릭 — 이 함께 있다. 전체 화면 목록은 창이 아니라
   * 페이지 자체라 여기에 고리를 만들면 방문자를 가두는 것이 되므로 거짓이다
   * (Requirement 24 / Ledger: "탭은 페이지를 벗어날 수 있어야 한다").
   */
  trapTab?: boolean
}

function tabStops(surface: HTMLElement): HTMLElement[] {
  return Array.from(surface.querySelectorAll<HTMLElement>(TAB_STOP_SELECTOR))
}

export function useListKeyNav(options: ListKeyNavOptions): void {
  // 리스너는 한 번만 달고, 매 렌더 바뀌는 값은 ref로 최신을 읽는다.
  const latest = useRef(options)
  latest.current = options

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { surfaceRef, itemSelector, onExit, trapTab } = latest.current
      // 브라우저·OS 단축키(⌘←, Alt+←…)는 방문자의 것이다. 건드리지 않는다.
      // Shift는 여기 없다 — 역방향 탭이 방문자의 정상적인 조작이기 때문이다.
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const surface = surfaceRef.current
      if (surface === null) return
      const doc = surface.ownerDocument

      // 탭 — 슬라이드에서만 가로챈다. 고리의 끝에 서 있을 때만 우리가
      // 개입하고, 안쪽에서는 브라우저의 표준 탭 순서를 그대로 둔다.
      if (event.key === 'Tab') {
        if (!trapTab) return
        const stops = tabStops(surface)
        const active = doc.activeElement
        if (stops.length === 0) {
          // 갈 자리가 하나도 없다 (빈 등록부). 초점이 목록 밖으로 새지
          // 않도록 표면 자신에게 둔다 — 목록 루트는 tabIndex={-1}이라
          // 프로그램으로 초점을 받을 수 있다.
          event.preventDefault()
          if (active !== surface) surface.focus()
          return
        }
        const first = stops[0]
        const last = stops[stops.length - 1]
        const edge = event.shiftKey ? first : last
        // 목록 밖(예: 슬라이드가 막 열려 초점이 <body>에 있다)에서 탭이
        // 들어오는 경우도 같은 문으로 처리한다 — 어느 쪽 끝으로 들어올지는
        // 방향이 정한다.
        if (active === edge || !surface.contains(active)) {
          event.preventDefault()
          ;(event.shiftKey ? last : first).focus()
        }
        return
      }

      // 방향키·스페이스가 페이지를 미는 것을 막는다 (Requirement 6).
      // "가로챌지"는 interceptsKey가, "무엇을 할지"는 keyIntent가 따로
      // 답한다 — 스페이스는 뜻이 없어도 가로채이고, 엔터와 Esc는 뜻이
      // 있어도 가로채기 목록에 없다.
      if (interceptsKey(SURFACE, event.key) && !usesKeysItself(event.target)) {
        event.preventDefault()
      }

      const intent = keyIntent(event.key)

      if (intent === 'prev' || intent === 'next') {
        if (activeItemList(SURFACE) !== 'list') return
        const items = Array.from(
          surface.querySelectorAll<HTMLElement>(itemSelector),
        )
        // 지금 자리는 상태가 아니라 초점이다. 항목 안 어디에 초점이 있어도
        // 그 항목이 지금 자리다.
        const at = items.findIndex((item) => item.contains(doc.activeElement))
        const next = moveCursor(at < 0 ? null : at, items.length, intent)
        // 등록부가 비었다 — 갈 자리가 없으므로 초점도 옮기지 않는다
        // (Requirement 29).
        if (next === null) return
        // preventScroll을 주지 않는 것이 요구 18이다: 화면 밖 항목으로 가면
        // 브라우저가 그 항목이 보이는 자리까지 따라 스크롤한다. 슬라이드에서는
        // 창 안이, 전체 화면에서는 페이지가 움직인다.
        items[next].focus()
        return
      }

      // 엔터는 이 계층이 가져가지 않는다 (Requirement 10). 항목은 그 작품을
      // 가리키는 진짜 링크라 브라우저의 기본 활성화가 이미 정확히 그 일을
      // 한다 — 여기서 한 번 더 이동시키면 한 번의 엔터가 두 번 발동한다.

      if (intent === 'exit') {
        // 나가는 길이 없는 화면(전체 화면 목록)에서는 아무 일도 없다
        // (Requirement 22).
        onExit?.()
      }
    }

    const target = window
    target.addEventListener('keydown', handleKeyDown)
    return () => target.removeEventListener('keydown', handleKeyDown)
  }, [])
}
