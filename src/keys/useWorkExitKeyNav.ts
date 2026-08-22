import { useEffect, useRef } from 'react'
import { keyIntent } from './keyNav.ts'

// 작품 페이지의 키 배선 (Requirements 6·40·41·42).
//
// 씬(useSceneKeyNav)·목록(useListKeyNav)과 짝을 이루는 세 번째 자리다. 판정은
// 똑같이 keyNav가 하고 — 여기서 묻는 것은 "이 키가 나오기인가" 하나다 — 이
// 훅은 그 판정을 창(window)의 keydown에 이어 붙인다. 나오기가 실제로 무엇을
// 하는지(되감을지 갈아칠지, 초점을 어디로 보낼지)는 여기 없다.
//
// 리스너를 페이지 요소가 아니라 창에 다는 이유는 씬·목록과 같다: 작품
// 페이지에 막 도착한 방문자는 아직 아무것도 초점하지 않았고, 그래도 Esc
// 하나로 나올 수 있어야 한다.
//
// 이 자리에는 preventDefault가 없다 — 있어서는 안 된다. 작품 페이지에서
// 가로채는 키는 하나도 없고(`interceptsKey('work', …)`는 언제나 거짓),
// 방향키와 스페이스는 브라우저 기본 그대로여서 긴 페이지가 정상적으로
// 스크롤된다 (Requirement 6). Esc도 막지 않는다 — 브라우저가 Esc에 얹는
// 일(전체 화면 빠져나오기 등)을 방문자에게서 빼앗을 이유가 없다.
//
// 대가는 Reversibility Ledger에 적혀 있다: 앞으로 어떤 작품 페이지도 Esc를
// 자기 용도로 쓸 수 없다. 그 값으로 산 것이 Requirement 42다 — 새 작품
// 페이지를 만든 사람이 나가는 길을 붙이는 걸 깜빡할 여지가 없다.

export interface WorkExitKeyNavOptions {
  /** 이 페이지에서 나간다 (Esc). */
  onExit: () => void
}

export function useWorkExitKeyNav({ onExit }: WorkExitKeyNavOptions): void {
  // 리스너는 한 번만 달고, 매 렌더 바뀌는 콜백은 ref로 최신을 읽는다.
  const latest = useRef(onExit)
  latest.current = onExit

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 브라우저·OS 단축키는 방문자의 것이다. 건드리지 않는다.
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (keyIntent(event.key) !== 'exit') return
      latest.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
