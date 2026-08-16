import { Canvas } from '@react-three/fiber'
import { useCallback, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import type { WebGLRenderer } from 'three'
import { workPath } from '../works/registry.ts'
import {
  COLOR_ACCENT_CYAN,
  COLOR_ACCENT_PINK,
  HOME_TESTID,
  SITE_TITLE,
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
import HomeFallback from './HomeFallback.tsx'
import { backdropStyle, homeTitleStyle } from './homeStyles.ts'

// 홈 씬 호스트 (B4 분기의 단일 지점).
// - 마운트 전 isWebGLAvailable()로 WebGL을 프로브한다. 불가 →
//   <HomeFallback /> (배경 + 제목 + 전 작품 텍스트 링크). jsdom 테스트는
//   항상 이 경로를 타므로 R3F <Canvas>는 테스트에서 절대 마운트되지 않는다.
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
}

const titleStyle: CSSProperties = {
  ...homeTitleStyle,
  position: 'absolute',
  top: '2.5rem',
  left: 0,
  right: 0,
  textAlign: 'center',
  pointerEvents: 'none',
}

export default function Home() {
  const [webglOk, setWebglOk] = useState(isWebGLAvailable)
  const navigate = useNavigate()

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
    return <HomeFallback />
  }

  return (
    <main data-testid={HOME_TESTID} style={rootStyle}>
      <div style={canvasLayerStyle}>
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
      <h1 style={titleStyle}>{SITE_TITLE}</h1>
    </main>
  )
}
