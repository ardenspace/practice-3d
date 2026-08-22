import { useEffect, useRef } from 'react'
import { ownsChord } from './keyNav.ts'

// 세 배선(씬·목록·작품 페이지)이 나눠 쓰는 창(window) keydown 한 겹.
//
// 셋은 서로 다른 일을 하지만 창에 이어 붙이는 방식은 한 벌이었다: 리스너는
// 한 번만 달고, 매 렌더 바뀌는 값은 ref로 최신을 읽고, ⌘·Ctrl·Alt 조합은
// 그냥 흘려보낸다. 같은 것이 세 번 있으면 언젠가 셋이 서로 달라진다 —
// 그래서 한 겹으로 모았다 (conventions: 두 번 나오는 로직은 공유 레이어로).
//
// 판정은 여기 없다. "이 조합이 우리 것인가"는 화면도 DOM도 모르는
// keyNav.ownsChord가 답하고, 이 파일은 그 답을 이벤트에 이어 붙이기만
// 한다 — 배선에는 배선만 둔다.
//
// 리스너를 요소가 아니라 창에 다는 이유는 세 자리가 같다 (Reversibility
// Ledger, Decided): 화면에 막 도착한 방문자는 아직 아무것도 초점하지 않았고,
// 그 상태에서도 키 하나가 통해야 한다.
//
// 타이머는 없다. 이 훅이 하는 일은 등록과 해제뿐이다.

/**
 * 이 계층이 갖는 키만 골라 창의 keydown을 넘겨준다.
 *
 * @param handler 키 하나가 왔을 때 할 일. 매 렌더 새로 만들어도 되고, 그때마다
 *   리스너를 다시 달지 않는다 — 언제나 가장 최근 것이 불린다.
 * @param active 지금 이 계층이 키를 받는가. 거짓인 동안에는 리스너 자체가
 *   달려 있지 않다. 기본값은 참 — 화면이 떠 있는 동안 늘 듣는 자리들.
 */
export function useLayerKeyDown(
  handler: (event: KeyboardEvent) => void,
  active = true,
): void {
  // 리스너는 한 번만 달고, 매 렌더 바뀌는 값은 ref로 최신을 읽는다 —
  // 커서가 움직일 때마다 리스너를 떼었다 다는 일이 없도록.
  const latest = useRef(handler)
  latest.current = handler

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // 브라우저·OS 단축키(⌘←, Alt+←…)는 방문자의 것이다. 건드리지 않는다.
      if (!ownsChord(event)) return
      latest.current(event)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active])
}
