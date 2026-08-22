import { useState } from 'react'
import { beginsKeyboardUse } from './keyNav.ts'
import { useLayerKeyDown } from './useLayerKeyDown.ts'

// "이 방문자가 키보드를 쓰기 시작했는가" 한 줄 (Requirement 43).
//
// 화면에만 나타나는 안내는 그것을 쓸 사람에게만 나타나야 하고, 마우스만 쓰는
// 사람에게는 끝까지 보이지 않아야 한다. 그 판정을 화면마다 각자 하면 "키보드를
// 쓰기 시작했다"가 화면 수만큼 생기므로, 다른 키 배선들과 같은 자리에 한 벌만
// 둔다 — 안내를 띄우고 싶은 화면이 하나 더 생기면 이 훅을 부르면 된다.
//
// 판정 자체는 여기 없다. 어떤 키가 그 신호인가는 화면도 DOM도 모르는
// keyNav.beginsKeyboardUse가 답하고, 창에 이어 붙이는 일은 다른 세 배선과
// 똑같이 useLayerKeyDown이 맡는다 (⌘·Ctrl·Alt 조합은 거기서 걸러진다).
//
// 한 방향 latch다. 키보드로 들어온 방문자가 그 뒤에 마우스를 한 번 만졌다고
// 안내가 사라지면, 화면이 방문자를 따라다니며 깜빡이게 된다 — 두 기기를 번갈아
// 쓰는 사람에게 안내가 사라지는 것이 나타나는 것보다 나쁘다. 참이 되고 나면
// 리스너도 함께 떨어지므로 그 뒤의 키는 아무 일도 하지 않는다.

/**
 * 방문자가 이 페이지에서 키보드를 쓰기 시작했는가. 처음에는 거짓이고, 첫
 * 신호에 참이 된 뒤로는 다시 거짓이 되지 않는다.
 */
export function useKeyboardInUse(): boolean {
  const [inUse, setInUse] = useState(false)

  useLayerKeyDown((event) => {
    if (beginsKeyboardUse(event.key)) setInUse(true)
  }, !inUse)

  return inUse
}
