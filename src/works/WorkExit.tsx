import { useCallback, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useWorkExitKeyNav } from '../keys/useWorkExitKeyNav.ts'
import { startedHere } from './listClose.ts'
import { requestWorkFocus } from './returnFocus.ts'

// 작품 페이지에서 나오는 길 (Requirements 40·41·42, B3 ④).
//
// routes.tsx가 등록부에서 라우트를 파생시키면서 모든 작품 페이지를 이것으로
// 감싼다 — 작품 페이지 자신은 나가는 길을 모른다. 새 작품을 만든 사람이
// Esc를 붙이는 걸 깜빡할 여지가 없는 것이 이 자리의 존재 이유다
// (Requirement 42). 그래서 이 컴포넌트는 화면을 그리지 않는다: 자식을 그대로
// 내보내고 배선만 얹는다.
//
// 에러 바운더리 **바깥**에 있다. 페이지가 크래시해 최소 화면이 대신 떠 있을
// 때도 Esc는 살아 있어야 한다 — 그 화면의 홈 링크가 마우스 방문자의 퇴로이듯
// Esc는 키보드 방문자의 퇴로다.
//
// 나가는 일은 두 조각이다.
//
// ① 어디로: 아무도 기억하지 않는다. 들어온 자리가 히스토리에 있으면 되감기가
//    그 자리를 그대로 되돌려 놓고(방울로 들어왔으면 씬이 뜬 홈, 목록으로
//    들어왔으면 열린 목록), 되감을 자리가 없으면 `/`로 갈아친다 — 그 뒤
//    씬을 띄울 수 있는지에 따라 홈에 머물지 전체 화면 목록으로 옮겨질지는
//    홈 셸의 판정 한 곳(decideSceneFallback)이 정한다 (Requirement 41).
//    되감기든 갈아치기든 히스토리는 늘지 않는다 (B3 ④).
//
// ② 초점이 어느 작품에: 주소에 적힌 이 작품이다. 도착한 화면에서 그 작품이
//    방울이든 목록 항목이든 같은 slug로 찾아지므로, 들어온 자리가 그새
//    사라졌어도(방울로 들어왔는데 씬을 쓸 수 없게 된 경우) 초점은 여전히
//    그 작품에 놓인다.

export interface WorkExitProps {
  /** 이 라우트가 가리키는 작품. 주소에 적힌 그 작품이다. */
  slug: string
  children: ReactNode
}

export default function WorkExit({ slug, children }: WorkExitProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const exit = useCallback(() => {
    // 나온 뒤 초점이 갈 작품. 목적지가 어디로 정해지든 이 한 건은 같다.
    requestWorkFocus(slug)
    if (startedHere(location.key)) {
      // 되감을 자리가 없다 — 그대로 되감으면 사이트 밖이다. 현재 항목을
      // 홈으로 갈아친다. 씬을 띄울 수 없는 방문자라면 홈 셸이 이어서
      // 목록의 주소로 한 번 더 갈아치므로, 어느 갈래에서도 히스토리는
      // 늘지 않는다.
      navigate('/', { replace: true })
      return
    }
    navigate(-1)
  }, [location.key, navigate, slug])

  useWorkExitKeyNav({ onExit: exit })

  return <>{children}</>
}
