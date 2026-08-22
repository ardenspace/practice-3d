import { Canvas } from '@react-three/fiber'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from 'react'
import { useLocation, useNavigate, useOutlet } from 'react-router'
import type { WebGLRenderer } from 'three'
import {
  backdropStyle,
  siteHeaderStyle,
  siteTaglineStyle,
  siteTitleStyle,
  visuallyHiddenStyle,
} from '../siteStyles.ts'
import ErrorBoundary from '../ErrorBoundary.tsx'
import { focusedByKeyboard } from '../keys/keyTargets.ts'
import { useSceneKeyNav } from '../keys/useSceneKeyNav.ts'
import { decideListClose } from '../works/listClose.ts'
import { WORKS_PATH, workPath, works } from '../works/registry.ts'
import { takeWorkFocus } from '../works/returnFocus.ts'
import {
  focusWorksList,
  planWorksFocusHandoff,
  type WorksFocusHandoff,
} from '../works/worksFocus.ts'
import WorksList from '../works/WorksList.tsx'
import WorksOpenIcon from '../works/WorksOpenIcon.tsx'
import {
  COLOR_ACCENT_CYAN,
  COLOR_ACCENT_PINK,
  COLOR_NEBULA_PURPLE,
  COLOR_SLIDE_EDGE,
  COLOR_SLIDE_SURFACE,
  COLOR_TEXT,
  HINT_ENTER_ANIMATION,
  HOME_TESTID,
  KEYBOARD_HINT,
  SCENE_BUBBLES_LABEL,
  SCENE_FALLBACK_NOTICE,
  SCENE_HINT,
  SCENE_LABEL,
  SITE_TAGLINE,
  SITE_TITLE,
  WORKS_OPENED_STATUS,
  Z_ABOVE_SCENE,
  sceneBubbleStatus,
} from '../theme.ts'
import BubbleField from './BubbleField.tsx'
import { deriveWorkBubbles } from './bubbles.ts'
import {
  AMBIENT_LIGHT_INTENSITY,
  CAMERA_FOV,
  CAMERA_Z,
  POINT_LIGHT_CYAN_POSITION,
  POINT_LIGHT_INTENSITY,
  POINT_LIGHT_PINK_POSITION,
} from './constants.ts'
import { decideSceneFallback, wasRedirectedHere } from './sceneFallback.ts'

// 홈 씬 호스트 (B4 분기의 단일 지점)이자 `/`와 `/works`가 공유하는 셸.
// - 마운트 전 isWebGLAvailable()로 WebGL을 프로브한다. 불가 → 이 방문자의
//   화면은 전체 화면 작품 목록이고, 주소도 그 화면이 사는 `/works`로
//   갈아친다 (B4, Requirement 35). 무엇을 할지는 decideSceneFallback이
//   화면 없이 정한다. jsdom 테스트는 항상 이 경로를 타므로 R3F <Canvas>는
//   테스트에서 절대 마운트되지 않는다.
// - `/works`는 이 컴포넌트의 자식 라우트다 (routes.tsx). 목록을 열고 닫아도
//   Home 인스턴스가 유지되므로 씬이 처음부터 다시 뜨지 않는다
//   (Requirement 32). 씬을 띄울 수 있으면 목록은 씬 위 슬라이드가 되고,
//   띄울 수 없으면 자식 라우트의 전체 화면 목록이 그대로 화면이 된다
//   (Requirement 31).
// - 가능 → 씬 셸: backdrop.webp를 CSS 배경으로 깐 풀뷰포트 레이어 위에
//   투명 R3F Canvas (앰비언트 + 핑크/시안 광원 + 방울 필드 BubbleField).
//   제목 h1은 씬 위에 오버레이로 유지 (B3 testid 의무 포함).
// - 실행 중에 씬이 무너짐: 두 가지다. 캔버스의 webglcontextlost, 그리고 씬이
//   끝내 올라오지 못하는 것 — 후자의 판정 기준은 "씬 서브트리가 렌더/마운트
//   중에 던진다"이고 캔버스만 감싼 ErrorBoundary가 받는다. 둘 다 타이머를
//   쓰지 않으므로 방문자를 기다리게 하는 중간 화면도, 시간이 지나야 넘어가는
//   이동도 생기지 않는다 (Requirement 35). 무너졌다는 사실은 한 방향으로만
//   움직인다 — 컨텍스트가 뒤늦게 복구되어도 화면이 스스로 다시 뒤집히지
//   않는다 (B4). 씬이 실제로 뜨는 환경이 있어야 일어나는 사건이라 jsdom에서
//   재현할 수 없고, 화면 없이 확인할 수 있는 규칙 부분은 decideSceneFallback에
//   모여 있다.
// - 씬의 키보드 초점 정거장을 든다 (B2). 씬은 방울 N개짜리 그림이지만
//   DOM에서는 캔버스 레이어 하나가 초점을 받고, 지금 몇 번째 방울에 서
//   있는지는 이 셸의 상태다 — Canvas 자식은 별도 리컨실러라 DOM 초점도
//   라우터도 그 안에 두지 않는다. 키의 뜻을 정하는 일은 keys/keyNav.ts,
//   그 판정을 창에 이어 붙이는 일은 keys/useSceneKeyNav.ts 몫이고 여기는
//   상태를 들고 배선만 한다.
// - 씬을 보조기술에 드러내는 층도 함께 든다 (B6). 3D 캔버스는 그 자체로
//   아무것도 드러내지 않으므로, 씬이 그리는 것과 같은 파생 목록이 눈에 보이지
//   않는 <ul>로 한 번 더 존재한다 — 화면에서는 우주에 흩어진 방울이지만
//   소리로는 등록부 순서의 목록 하나다. 지금 어느 방울에 서 있는지와 목록이
//   열렸다는 사실은 상태 알림 영역 하나가 말한다. 이 층이 여기 있는 이유는
//   그것이 전부 이 셸이 이미 들고 있는 상태(커서·정거장 초점·열림)에서만
//   나오기 때문이다.
//
// 한 파일로 두는 이유 (conventions: 300줄 검토 신호): 이 파일이 긴 것은
// "홈이 무엇이 되는가"의 갈래(씬/폴백/목록 열림)가 하나의 결정이기
// 때문이다. 갈래를 나눠 담으면 그 결정이 두 곳에 흩어진다. 떼어낼 수
// 있는 것들은 이미 나가 있다 — 폴백 판정은 sceneFallback.ts, 목록 닫기
// 판정은 works/listClose.ts, 초점 넘기기는 works/worksFocus.ts, 키 배선은
// keys/useSceneKeyNav.ts, 스타일 조각은 siteStyles.ts.
import { isWebGLAvailable } from './webgl.ts'

const rootStyle: CSSProperties = {
  ...backdropStyle,
  position: 'relative',
  overflow: 'hidden',
}

const canvasLayerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  // 방울 터치 인터랙션(Requirement 4)이 브라우저 스크롤/제스처와 경합하지
  // 않도록 씬 레이어에서만 기본 터치 동작을 끈다 — DOM 오버레이(제목)와
  // 폴백/작품 페이지의 링크에는 영향 없음.
  touchAction: 'none',
  // 이 레이어가 곧 씬의 초점 정거장이다 (Requirement 11). 브라우저 기본
  // 초점 테두리는 뷰포트 전체를 두르는 사각형이라 "어느 방울에 서 있는가"를
  // 말해 주지 못한다 — 그 일은 씬 안의 초점 표시 고리가 맡으므로
  // (BubbleField의 FocusRing) 여기서는 끈다. 표시를 없애는 것이 아니라
  // 화면 밖 사각형에서 방울 옆으로 옮기는 것이다.
  outline: 'none',
}

// 목록이 열려 있는 동안의 씬 레이어. 방울은 계속 떠다니지만(캔버스는 그대로
// 돌아간다) 어느 쪽에서도 만질 수 없다 (Requirement 16). inert가 초점과
// 보조기술을, pointerEvents가 마우스를 막는다 — inert를 아직 모르는
// 브라우저에서도 마우스는 확실히 멎게 하려고 둘 다 둔다.
const lockedCanvasLayerStyle: CSSProperties = {
  ...canvasLayerStyle,
  pointerEvents: 'none',
}

// 제목 + 태그라인 오버레이 (씬 위, 포인터 통과).
const headerStyle: CSSProperties = {
  ...siteHeaderStyle,
  position: 'absolute',
  top: '2.5rem',
  left: 0,
  right: 0,
  pointerEvents: 'none',
}

// 인터랙션 힌트 — 하단에서 딜레이 뒤 은은하게 떠오른다 (씬 전용 카피,
// 폴백은 텍스트 링크라 이 힌트가 성립하지 않음).
const hintStyle: CSSProperties = {
  position: 'absolute',
  bottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
  left: 0,
  right: 0,
  margin: 0,
  textAlign: 'center',
  pointerEvents: 'none',
  fontSize: '0.8rem',
  fontWeight: 300,
  letterSpacing: '0.28em',
  paddingLeft: '0.28em',
  opacity: 0.6,
  textShadow: `0 0 12px ${COLOR_NEBULA_PURPLE}`,
  animation: HINT_ENTER_ANIMATION,
}

// 씬을 띄우지 못해 방문자를 목록으로 옮겼을 때 붙는 안내 (Requirement 36).
// 목록 위에 겹쳐 놓는 얇은 띠다 — 목록의 레이아웃을 밀지 않으므로 문구가
// 있든 없든 화면이 같은 자리에 선다 (Requirement 37: "화면은 같고 안내만
// 없다"). 유리면은 슬라이드와 같은 값을 쓴다.
const noticeStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: Z_ABOVE_SCENE,
  margin: 0,
  padding: '0.75rem 1.25rem',
  textAlign: 'center',
  fontSize: '0.8125rem',
  fontWeight: 300,
  lineHeight: 1.6,
  color: COLOR_TEXT,
  background: COLOR_SLIDE_SURFACE,
  borderBottom: `1px solid ${COLOR_SLIDE_EDGE}`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
}

// 씬 정거장의 설명(조작법)이 사는 요소의 아이디. aria-describedby가 이
// 아이디로 문구를 찾아 와 이름 뒤에 이어 붙인다 — 화면에 보이지 않는 문구를
// 초점이 닿을 때마다 읽히게 하는 표준 통로다 (Requirement 43의 "항상").
// 씬 셸은 화면에 한 번만 뜨므로 고정 아이디로 충분하다.
const SCENE_KEYBOARD_HINT_ID = 'scene-keyboard-hint'

export default function Home() {
  // 이 방문자에게 씬을 띄울 수 있는가 — 마운트 전에 한 번 프로브하고 그
  // 뒤로 다시 묻지 않는다.
  const [webglOk] = useState(isWebGLAvailable)

  // 씬이 떠 있다가 무너졌는가. 참으로만 가는 latch다 — 되돌리는 setter를
  // 두지 않는 것이 곧 "webglcontextrestored가 와도 화면을 되돌리지 않는다"
  // (B4)이고, 판정 쪽에서도 이 사실이 프로브 결과를 이긴다.
  const [sceneLost, setSceneLost] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  // 홈의 자식 라우트는 `/works` 하나뿐이다 — 자식이 매치되었다는 것이 곧
  // "작품 목록이 열려 있다"는 뜻이다. 주소를 여기서 다시 비교하지 않으므로
  // 열림 여부의 진실은 라우팅 표면 한 곳에만 있다.
  const worksOutlet = useOutlet()
  const worksOpen = worksOutlet !== null

  // 씬이 없을 때 무엇을 할지 (B4). 판정은 화면 없는 순수 모듈이 하고 여기는
  // 배선만 한다.
  const fallback = decideSceneFallback({
    sceneAvailable: webglOk,
    sceneLost,
    listOpen: worksOpen,
    locationKey: location.key,
    // 알 수 없는 주소를 열어 catch-all이 여기로 데려다 놓은 방문자인가
    // (routes.tsx). 이 자리는 그가 고른 자리가 아니므로 이어지는 이동에는
    // 안내가 붙는다 (Requirement 36). 무엇을 뜻하는지는 판정 쪽이 알고,
    // 여기는 사실만 실어 준다.
    redirectedHere: wasRedirectedHere(location.state),
  })

  // 안내 문구가 붙는 길은 두 갈래다.
  //
  // 하나는 이 셸이 뜬 순간의 판정이다. 그 값은 그때 한 번 latch 한다 —
  // 갈아치고 나면 주소도 히스토리 키도 달라지지만, 방금 일어난 이동이
  // 방문자가 요청한 것이었는지는 그때 다시 물을 수 없기 때문이다. 셸이 새로
  // 뜨는 순간 — 새로고침, 작품 페이지에서 돌아옴 — 마다 다시 정해진다.
  const [unaskedAtMount] = useState(() => fallback.notice)

  // 다른 하나는 실행 중에 씬이 무너진 경우다. 이쪽은 latch가 필요 없다 —
  // 무너졌다는 사실 자체가 한 방향이라 판정이 계속 참으로 남고, `/works`에
  // 있어 이동이 따르지 않는 경우에도 문구는 붙는다 (B4).
  const showNotice = unaskedAtMount || fallback.notice

  // 갈아치기는 effect에서 한다. 렌더 중에 주소를 바꿀 수는 없다.
  // 방문자를 기다리게 하는 중간 화면도, 시간이 지나야 넘어가는 이동도 두지
  // 않는다 (Requirement 35) — 아래 렌더가 `/`에서도 이미 목록이므로
  // 갈아치기가 끝나도 화면은 그대로다.
  useEffect(() => {
    if (!fallback.redirect) return
    navigate(WORKS_PATH, { replace: true })
  }, [fallback.redirect, navigate])

  // 목록을 여는 아이콘. 바깥 클릭으로 닫았을 때 초점을 여기로 되돌린다
  // (Requirement 19) — 방문자가 방금 손댄 물건이 그 아이콘이므로 초점이
  // 사라진 슬라이드에 남거나 문서 처음으로 튀지 않는다. 뒤로가기나 주소로
  // 닫은 경우에는 방문자가 초점을 옮겨 달라고 한 적이 없으므로 건드리지
  // 않는다 — 그래서 "되돌려야 한다"는 사실을 ref로 따로 기억한다.
  const openIconRef = useRef<HTMLAnchorElement>(null)
  const restoreIconFocus = useRef(false)

  // 슬라이드 바깥이 눌렸다 → 목록을 닫는다. 히스토리를 늘리지 않는다 (B3):
  // 사이트 안에서 열었으면 한 칸 되감고, `/works`로 곧장 들어왔으면 되감을
  // 자리가 없으므로 홈으로 갈아친다 (그대로 되감으면 사이트 밖으로 나간다).
  // 둘 다 `/` 안에서의 이동이라 씬은 그대로 살아 있다 (Requirement 32).
  const handleDismiss = useCallback(() => {
    restoreIconFocus.current = true
    if (decideListClose(location.key) === 'back') {
      navigate(-1)
    } else {
      navigate('/', { replace: true })
    }
  }, [location.key, navigate])

  useEffect(() => {
    if (worksOpen || !restoreIconFocus.current) return
    restoreIconFocus.current = false
    openIconRef.current?.focus()
  }, [worksOpen])

  // 작품 방울 터짐 → 페이지 이동 (Requirement 5). 라우터 훅은 DOM 쪽인
  // 여기서만 쓰고, R3F 씬(BubbleField)에는 콜백으로 주입한다 — Canvas
  // 자식은 별도 리컨실러라 라우터 컨텍스트 의존을 씬 안에 두지 않는다.
  const handleWorkOpen = useCallback(
    (slug: string) => navigate(workPath(slug)),
    [navigate],
  )

  // ── 씬의 키보드 초점 (B2) ──
  // 씬은 화면 가득 흩어진 방울 N개짜리 그림이지만 DOM에서는 정거장
  // 하나다 (Requirement 11): 탭 한 번이면 씬을 지나간다. 그 정거장이
  // 캔버스 레이어이므로 탭 순서는 DOM 순서 그대로 씬 → 아이콘 → 페이지
  // 밖이고 (Requirement 12), 안에 고리를 만들지 않으니 정방향으로도
  // 역방향으로도 페이지를 벗어날 수 있다 (Requirement 13 / Ledger:
  // "탭은 페이지를 벗어날 수 있어야 한다").
  const sceneStationRef = useRef<HTMLDivElement>(null)

  // 씬 안에서 몇 번째 작품 방울에 서 있는가. 자리 번호는 씬이 소비하는
  // 파생 목록의 순서, 곧 등록부의 순서다 (Requirement 3).
  const [sceneCursor, setSceneCursor] = useState<number | null>(null)
  // 정거장이 지금 DOM 초점을 들고 있는가. 커서와 따로 두는 이유는 초점이
  // 아이콘으로 넘어가면 씬의 초점 표시는 사라져야 하지만(초점은 한 곳이다)
  // 돌아왔을 때 서 있던 자리는 그대로여야 하기 때문이다.
  const [sceneFocused, setSceneFocused] = useState(false)
  // 엔터가 터뜨려 달라고 지목한 자리. 씬이 받아 처리하면 곧바로 비운다 —
  // 한 번의 엔터가 두 번 발동하지 않는다 (Requirement 10).
  const [popRequest, setPopRequest] = useState<number | null>(null)

  // 씬이 든 방울들. 씬과 같은 파생을 거친다 — 등록부를 직접 세거나 훑으면
  // "등록 항목 N개 = 작품 방울 N개"와 그 순서가 두 곳에서 따로 참이 되어야
  // 한다.
  const workBubbles = useMemo(() => deriveWorkBubbles(works), [])
  const workBubbleCount = workBubbles.length

  // 씬이 떠 있고 목록이 닫혀 있을 때만 씬이 키를 받는다. 목록이 열린
  // 동안의 키는 목록 몫이고, 씬 없는 홈의 키는 그 화면인 전체 화면 목록
  // 몫이다.
  const sceneKeysActive = fallback.showScene && !worksOpen

  useSceneKeyNav({
    active: sceneKeysActive,
    count: workBubbleCount,
    stationRef: sceneStationRef,
    cursor: sceneCursor,
    onCursorChange: setSceneCursor,
    onEnter: setPopRequest,
  })

  // 탭으로 들어온 방문자에게도 지금 어디에 서 있는지가 보여야 한다 —
  // 정거장이 초점을 받았는데 어느 방울에도 표시가 없으면 초점이 사라진
  // 것처럼 보인다. 그래서 키보드로 들어오는 순간 첫 작품에 선다. 페이지가
  // 열리는 것만으로는 일어나지 않는다 (Requirement 5의 단서) — 방문자가
  // 탭이나 방향키를 누른 뒤다.
  const handleStationFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      setSceneFocused(true)
      if (!focusedByKeyboard(event.currentTarget)) return
      setSceneCursor((current) =>
        current === null && workBubbleCount > 0 ? 0 : current,
      )
    },
    [workBubbleCount],
  )

  const handleStationBlur = useCallback(() => setSceneFocused(false), [])
  const handlePopHandled = useCallback(() => setPopRequest(null), [])

  // ── 소리로 듣는 사람에게 지금 무슨 일이 일어났는가 (B6 ①⑤) ──
  // 화면 위에서 스스로 말하지 않는 두 사건 — 초점 고리가 다른 방울로 옮겨
  // 간 것(Requirement 8의 소리 쪽 짝)과 목록이 열린 것(Requirement 21) — 을
  // 상태 알림 영역 하나가 맡는다. 하나로 두는 이유는 둘이 동시에 일어나지
  // 않기 때문이다: 목록이 열려 있는 동안 씬은 잠겨 커서가 움직이지 않는다.
  //
  // 목록이 열렸다는 사실에 aria-expanded를 쓸 수 없다. 열리면 아이콘 대신
  // 슬라이드가 그려져 "펼쳐졌다"고 말해 줄 물건이 화면에서 사라지기 때문이다.
  // 초점을 목록 안으로 끌고 가는 길도 있지만 그쪽은 Requirement 5(페이지가
  // 열리자마자 초점을 끌어가지 않는다)와 Requirement 20(Esc로 닫으면 초점이
  // 아이콘으로 돌아간다)이 이미 정해 둔 초점의 길과 겹친다 — 그래서 초점은
  // 건드리지 않고 말로만 알린다.
  //
  // 씬에서 초점이 떠나면 빈 문자열이 된다. 빈 값은 낭독되지 않으므로, 목록을
  // 닫아 초점이 아이콘으로 돌아간 방문자가 있지도 않은 방울 자리를 다시
  // 듣는 일이 없다.
  const focusedBubble =
    sceneCursor === null ? undefined : workBubbles[sceneCursor]
  const sceneStatus = worksOpen
    ? WORKS_OPENED_STATUS
    : sceneFocused && focusedBubble !== undefined && sceneCursor !== null
      ? sceneBubbleStatus(
          focusedBubble.entry.title,
          sceneCursor,
          workBubbleCount,
        )
      : ''

  // 실행 중에 씬이 무너졌다. 컨텍스트 상실과 마운트 실패가 같은 문 하나로
  // 들어온다 — 방문자가 겪는 일이 같기 때문이다: 방금까지 보고 있던 씬 셸이
  // 통째로 사라지고 화면이 작품 목록이 된다.
  //
  // 그 셸 안에 초점이 있었다면 초점을 들고 있던 요소도 함께 사라지므로
  // 초점이 <body>로 떨어진다. 그 사실을 지금 — 아직 셸이 DOM에 있을 때 —
  // 확인해 두었다가 전이가 끝난 뒤 목록 안으로 넘긴다 (Requirement 38).
  // 무엇을 확인하고 어디로 넘길지는 화면을 모르는 planWorksFocusHandoff가
  // 정한다: 셸 밖에 초점이 있었거나 아무 데도 없었으면 null(방문자에게서
  // 초점을 빼앗지 않는다), 목록 항목에 있었으면 그 항목의 slug를 함께 실어
  // 준다. 목록이 열려 있었다면 초점은 있던 항목에 그대로 남는다 — 항목 N에
  // 있던 초점이 항목 1로 튀지 않는다.
  const sceneShellRef = useRef<HTMLElement>(null)
  const focusHandoff = useRef<WorksFocusHandoff | null>(null)

  const loseScene = useCallback(() => {
    focusHandoff.current = planWorksFocusHandoff(
      sceneShellRef.current,
      document.activeElement,
    )
    setSceneLost(true)
  }, [])

  // 초점 넘기기는 화면이 제자리를 잡은 뒤에 한다. 갈아치기가 남아 있으면
  // (`/`에서 무너진 경우) 목록이 곧 한 번 더 다시 뜨므로, 지금 초점을 준
  // 요소는 그 다음 렌더에서 사라진다 — 갈아치기가 끝나 redirect가 내려간
  // 뒤에 넘긴다. 계획을 통째로 넘기므로 도중에 slug를 흘릴 자리가 없다.
  useEffect(() => {
    const handoff = focusHandoff.current
    if (!sceneLost || fallback.redirect || handoff === null) return
    focusHandoff.current = null
    focusWorksList(handoff)
  }, [sceneLost, fallback.redirect])

  // 작품 페이지에서 Esc로 나온 방문자가 방금 도착했다 (Requirements 40·41).
  // 어디로 올지는 나오는 쪽이 정했고(되감기 또는 갈아치기), 이 셸은 그가
  // 보고 있던 작품 하나만 넘겨받아 이 화면에서 그 작품이 있는 자리에 초점을
  // 얹는다: 씬이 떠 있으면 그 작품의 방울에, 목록이면 그 작품의 항목에.
  // 목적지가 무엇이 되었든 같은 slug로 찾으므로, 방울로 들어왔다가 그새 씬을
  // 쓸 수 없게 되어 목록으로 옮겨진 방문자도 그 작품 앞에 선다.
  //
  // 걸린 것이 없으면 아무 일도 없다 — 마우스로 홈 링크를 눌러 나온 방문자
  // 에게서 초점을 빼앗지 않는다.
  useEffect(() => {
    // 갈아치기가 남아 있으면 화면이 곧 한 번 더 바뀐다. 지금 초점을 준
    // 요소는 그 다음 렌더에서 사라지므로, 끝난 뒤에 얹는다 (위 전이와 같은
    // 이유). 꺼내는 것도 그때까지 미룬다 — 상자는 한 번 꺼내면 빈다.
    if (fallback.redirect) return
    const slug = takeWorkFocus()
    if (slug === null) return

    if (fallback.showScene && !worksOpen) {
      const index = workBubbles.findIndex((b) => b.entry.slug === slug)
      // 등록부에서 사라진 작품(직접 연 주소가 그새 없어진 경우)이면 설
      // 자리가 없다. 초점을 아무 데나 옮기지 않는다.
      if (index < 0) return
      setSceneCursor(index)
      // 씬은 뷰포트를 통째로 덮으므로 스크롤해서 보이게 할 것이 없다.
      sceneStationRef.current?.focus({ preventScroll: true })
      return
    }

    // 목록 — 슬라이드든 전체 화면이든 초점이 갈 곳을 정하는 자리는 하나다.
    focusWorksList({ slug })
  }, [fallback.redirect, fallback.showScene, worksOpen, workBubbles])

  // 실행 중 컨텍스트 상실. Canvas onCreated에서 실제 렌더러의 캔버스 요소에
  // 리스너를 단다 (Canvas가 언마운트되면 요소째 사라지므로 별도 해제는
  // 불필요). webglcontextrestored는 듣지 않는다 — 복구를 살려 쓰는 일은
  // 이번 라운드 밖이고, 화면이 스스로 다시 뒤집혀서도 안 된다 (B4).
  const handleCreated = useCallback(
    ({ gl }: { gl: WebGLRenderer }) => {
      gl.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault()
        loseScene()
      })
    },
    [loseScene],
  )

  if (!fallback.showScene) {
    // 씬 없음 — 이 방문자의 화면은 전체 화면 작품 목록이다 (Requirement 22:
    // 그에게는 이 화면이 홈이다). 목록을 그리는 곳은 온 사이트에 하나뿐인
    // WorksList이고, 이 셸은 그것을 자기 손으로 다시 그리지 않는다
    // (Requirement 39). WorksList가 이미 <main>을 이고 있어 덧씌우지 않는다.
    //
    // 주소가 아직 `/`면 위 effect가 `/works`로 갈아치는 중이다. 그 사이에도
    // 화면은 지금 이 목록이라 갈아치기가 끝나도 아무것도 깜빡이지 않는다 —
    // 씬 없는 방문자에게 `/`와 `/works`는 같은 한 화면이고, 주소만 뒤늦게
    // 그 화면이 사는 자리로 맞춰진다.
    //
    // 씬이 떠 있다가 무너진 경우에도 도착지는 똑같이 이 한 화면이다. 이미
    // `/works`에 있었다면 갈 곳이 없으므로 이동 없이 슬라이드가 화면 전체가
    // 되고, 제목과 태그라인은 전체 화면 목록이 이고 있는 그 하나로 그대로
    // 이어진다 (Requirement 30 — 규칙이 하나뿐이라 둘이 되거나 사라지지
    // 않는다).
    return (
      <>
        {showNotice && <p style={noticeStyle}>{SCENE_FALLBACK_NOTICE}</p>}
        {worksOutlet ?? <WorksList variant="fullscreen" />}
      </>
    )
  }

  return (
    <main data-testid={HOME_TESTID} style={rootStyle} ref={sceneShellRef}>
      {/* 목록이 열려 있는 동안 씬은 뒤에서 계속 돌지만 잠긴다
          (Requirement 16). 닫히면 그대로 다시 살아난다 (Requirement 19) —
          캔버스는 언마운트되지 않으므로 씬이 처음부터 다시 뜨지 않는다. */}
      <div
        ref={sceneStationRef}
        style={worksOpen ? lockedCanvasLayerStyle : canvasLayerStyle}
        // 씬 전체가 정거장 하나 (Requirement 11) — 방울이 몇 개든 탭 한
        // 번으로 지나간다. 순회할 작품이 하나도 없으면(빈 등록부) 서 있을
        // 자리가 없으므로 정거장도 두지 않는다: 초점만 받고 아무 표시도
        // 없는 자리를 만들지 않기 위해서다 (Requirement 29와 같은 뜻).
        tabIndex={workBubbleCount > 0 ? 0 : -1}
        onFocus={handleStationFocus}
        onBlur={handleStationBlur}
        inert={worksOpen}
        aria-hidden={worksOpen || undefined}
        // 정거장이 무엇인지와 어떻게 조작하는지 (B6 ②, Requirement 43).
        // 이름과 설명은 초점이 닿을 때마다 함께 읽히므로, 조작법은 화면에
        // 나타나든 말든 소리로는 "항상" 있다. role=group을 얹는 이유는
        // 이름 없는 div에는 이름·설명이 붙어도 드러나지 않는 보조기술이
        // 있기 때문이다 — 안에 무엇이 들어 있는 자리라고 말해 준다.
        role="group"
        aria-label={SCENE_LABEL}
        aria-describedby={SCENE_KEYBOARD_HINT_ID}
      >
        {/* 씬을 보조기술에 드러내는 층 (B6 ①). 눈에는 없고 낭독에는 있다.
            방울은 캔버스 안에 있어 DOM에 없으므로, 씬이 소비하는 그 파생
            목록(deriveWorkBubbles)이 여기서 한 번 더 목록이 된다 — 두 곳이
            같은 파생을 딛고 서므로 "등록 항목 N개 = 방울 N개"와 그 순서가
            화면과 소리에서 따로 참이 될 수 없다.
            항목을 링크로 만들지 않는 이유는 씬이 탭 정거장 하나이기
            때문이다 (Requirement 11) — 작품으로 들어가는 길은 엔터와, 목록을
            여는 아이콘 쪽에 이미 있다.
            목록이 열려 있는 동안에는 정거장째 aria-hidden이 되어 이 층도
            함께 잠긴다 (Requirement 16) — 뒤의 씬과 앞의 목록이 섞여
            들리지 않는다. */}
        <div style={visuallyHiddenStyle}>
          <p id={SCENE_KEYBOARD_HINT_ID}>{KEYBOARD_HINT}</p>
          {workBubbleCount > 0 && (
            <ul aria-label={SCENE_BUBBLES_LABEL}>
              {workBubbles.map((bubble) => (
                <li key={bubble.entry.slug}>{bubble.entry.title}</li>
              ))}
            </ul>
          )}
        </div>
        {/* "씬이 끝내 올라오지 못했다"의 판정 기준: 씬 서브트리가 렌더나
            마운트 중에 던진다. 기다리지 않으므로 중간 화면도 지연된 이동도
            없다 (Requirement 35). 잡히면 이 자리는 비우고(fallback={null})
            무너졌다는 사실만 위로 알린다 — 화면을 무엇으로 바꿀지는 B4의
            폴백 판정이 정한다. 캔버스만 감싸므로 목록·제목 쪽 오류는 여기서
            삼켜지지 않는다. */}
        <ErrorBoundary fallback={null} onError={loseScene}>
          <Canvas
            gl={{ alpha: true }}
            camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
            onCreated={handleCreated}
          >
            <ambientLight intensity={AMBIENT_LIGHT_INTENSITY} />
            <pointLight
              position={POINT_LIGHT_PINK_POSITION}
              color={COLOR_ACCENT_PINK}
              intensity={POINT_LIGHT_INTENSITY}
            />
            <pointLight
              position={POINT_LIGHT_CYAN_POSITION}
              color={COLOR_ACCENT_CYAN}
              intensity={POINT_LIGHT_INTENSITY}
            />
            {/* 초점은 씬이 아니라 이 셸이 든다 — 씬은 지금 어디에 서
                있는지와 무엇을 터뜨릴지를 받아 그리기만 한다. 정거장이
                초점을 놓았거나(아이콘으로 넘어감) 목록이 열려 씬이 잠긴
                동안에는 초점 표시도 함께 사라진다. */}
            <BubbleField
              onWorkOpen={handleWorkOpen}
              focusedIndex={
                sceneKeysActive && sceneFocused ? sceneCursor : null
              }
              popRequest={popRequest}
              onPopHandled={handlePopHandled}
            />
          </Canvas>
        </ErrorBoundary>
      </div>
      {/* 상태 알림 (B6 ①⑤). 정거장 밖에 두는 이유는 목록이 열리면 정거장이
          통째로 잠기는데(aria-hidden), 바로 그 순간 "목록이 열렸다"를 말해야
          하기 때문이다. polite한 자리라 방문자가 읽고 있던 것을 끊지
          않는다 — 방금 일어난 일을 다 읽은 뒤에 이어서 알려 준다. */}
      <p role="status" style={visuallyHiddenStyle}>
        {sceneStatus}
      </p>
      <header style={headerStyle}>
        <h1 style={siteTitleStyle}>{SITE_TITLE}</h1>
        <p style={siteTaglineStyle}>{SITE_TAGLINE}</p>
      </header>
      {/* 씬이 떠 있는 홈에서만 목록을 여는 아이콘이 있다 (Requirement 14).
          목록이 열려 있는 동안에는 아이콘도 힌트도 두지 않는다 — 열 목록이
          이미 열려 있고, 방울은 슬라이드 뒤에 있어 지금 터뜨릴 수 없다. */}
      {worksOpen ? (
        <WorksList variant="slide" onDismiss={handleDismiss} />
      ) : (
        <>
          <p style={hintStyle}>{SCENE_HINT}</p>
          <WorksOpenIcon ref={openIconRef} />
        </>
      )}
    </main>
  )
}
