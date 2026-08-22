import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate, useOutlet } from 'react-router'
import type { WebGLRenderer } from 'three'
import {
  backdropStyle,
  siteHeaderStyle,
  siteTaglineStyle,
  siteTitleStyle,
} from '../siteStyles.ts'
import { decideListClose } from '../works/listClose.ts'
import { WORKS_PATH, workPath } from '../works/registry.ts'
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
  SCENE_FALLBACK_NOTICE,
  SCENE_HINT,
  SITE_TAGLINE,
  SITE_TITLE,
  Z_ABOVE_SCENE,
} from '../theme.ts'
import BubbleField from './BubbleField.tsx'
import {
  AMBIENT_LIGHT_INTENSITY,
  CAMERA_FOV,
  CAMERA_Z,
  POINT_LIGHT_CYAN_POSITION,
  POINT_LIGHT_INTENSITY,
  POINT_LIGHT_PINK_POSITION,
} from './constants.ts'
import { decideSceneFallback } from './sceneFallback.ts'

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
// - 실행 중 컨텍스트 상실: 캔버스의 webglcontextlost → 폴백으로 전환
//   (예외 없음, 백지 없음 — 검증은 수동 검수 범위, spec B4).
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

export default function Home() {
  const [webglOk, setWebglOk] = useState(isWebGLAvailable)
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
    listOpen: worksOpen,
    locationKey: location.key,
  })

  // 안내 문구는 이 셸이 뜬 순간에 정해지고 그 뒤로 바뀌지 않는다. 갈아치고
  // 나면 주소도 히스토리 키도 달라지지만, 방금 일어난 이동이 방문자가
  // 요청한 것이었는지는 그때 다시 물을 수 없기 때문이다. 셸이 새로 뜨는
  // 순간 — 새로고침, 작품 페이지에서 돌아옴 — 마다 다시 정해진다.
  const [movedUnasked] = useState(() => fallback.notice)

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

  // 실행 중 컨텍스트 상실 → 폴백 전환. Canvas onCreated에서 실제 렌더러의
  // 캔버스 요소에 리스너를 단다 (Canvas가 언마운트되면 요소째 사라지므로
  // 별도 해제는 불필요).
  const handleCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    gl.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      setWebglOk(false)
    })
  }, [])

  if (!webglOk) {
    // 씬 없음 — 이 방문자의 화면은 전체 화면 작품 목록이다 (Requirement 22:
    // 그에게는 이 화면이 홈이다). 목록을 그리는 곳은 온 사이트에 하나뿐인
    // WorksList이고, 이 셸은 그것을 자기 손으로 다시 그리지 않는다
    // (Requirement 39). WorksList가 이미 <main>을 이고 있어 덧씌우지 않는다.
    //
    // 주소가 아직 `/`면 위 effect가 `/works`로 갈아치는 중이다. 그 사이에도
    // 화면은 지금 이 목록이라 갈아치기가 끝나도 아무것도 깜빡이지 않는다 —
    // 씬 없는 방문자에게 `/`와 `/works`는 같은 한 화면이고, 주소만 뒤늦게
    // 그 화면이 사는 자리로 맞춰진다.
    return (
      <>
        {movedUnasked && <p style={noticeStyle}>{SCENE_FALLBACK_NOTICE}</p>}
        {worksOutlet ?? <WorksList variant="fullscreen" />}
      </>
    )
  }

  return (
    <main data-testid={HOME_TESTID} style={rootStyle}>
      {/* 목록이 열려 있는 동안 씬은 뒤에서 계속 돌지만 잠긴다
          (Requirement 16). 닫히면 그대로 다시 살아난다 (Requirement 19) —
          캔버스는 언마운트되지 않으므로 씬이 처음부터 다시 뜨지 않는다. */}
      <div
        style={worksOpen ? lockedCanvasLayerStyle : canvasLayerStyle}
        inert={worksOpen}
        aria-hidden={worksOpen || undefined}
      >
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
          <BubbleField onWorkOpen={handleWorkOpen} />
        </Canvas>
      </div>
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
