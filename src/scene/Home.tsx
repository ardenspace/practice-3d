import { Canvas } from '@react-three/fiber'
import { useCallback, useState, type CSSProperties } from 'react'
import type { WebGLRenderer } from 'three'
import {
  BACKDROP_SRC,
  COLOR_ACCENT_CYAN,
  COLOR_ACCENT_PINK,
  COLOR_NEBULA_PURPLE,
  COLOR_SPACE_BG,
  COLOR_TEXT,
  HOME_TESTID,
  SITE_TITLE,
} from '../theme.ts'
import BubbleField from './BubbleField.tsx'
import { CAMERA_FOV, CAMERA_Z } from './constants.ts'
import HomeFallback from './HomeFallback.tsx'

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
  position: 'relative',
  minHeight: '100dvh',
  backgroundColor: COLOR_SPACE_BG,
  backgroundImage: `url(${BACKDROP_SRC})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: COLOR_TEXT,
  overflow: 'hidden',
}

const canvasLayerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
}

const titleStyle: CSSProperties = {
  position: 'absolute',
  top: '2.5rem',
  left: 0,
  right: 0,
  margin: 0,
  textAlign: 'center',
  fontSize: 'clamp(2rem, 6vw, 3.25rem)',
  fontWeight: 300,
  letterSpacing: '0.35em',
  textShadow: `0 0 28px ${COLOR_NEBULA_PURPLE}`,
  pointerEvents: 'none',
}

export default function Home() {
  const [webglOk, setWebglOk] = useState(isWebGLAvailable)

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
          <ambientLight intensity={0.4} />
          <pointLight
            position={[-4, 3, 4]}
            color={COLOR_ACCENT_PINK}
            intensity={40}
          />
          <pointLight
            position={[4, -2, 3]}
            color={COLOR_ACCENT_CYAN}
            intensity={40}
          />
          <BubbleField />
        </Canvas>
      </div>
      <h1 style={titleStyle}>{SITE_TITLE}</h1>
    </main>
  )
}
