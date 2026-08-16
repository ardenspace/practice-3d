import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import gsap from 'gsap'
import type { Work } from '../works'

export type BubbleConfig = {
  id: number
  radius: number
  x: number
  z: number
  speed: number
  phase: number
  swayAmp: number
  work?: Work
}

type Props = {
  config: BubbleConfig
  onPop: (config: BubbleConfig, position: [number, number, number]) => void
}

const TOP_Y = 6.5
const BOTTOM_Y = -6.5

export default function Bubble({ config, onPop }: Props) {
  const group = useRef<Group>(null)
  const mesh = useRef<Mesh>(null)
  const state = useRef({
    x: config.x,
    y: BOTTOM_Y + Math.random() * (TOP_Y - BOTTOM_Y),
    popped: false,
  })
  const [visible, setVisible] = useState(true)

  useFrame(({ clock }, dt) => {
    const s = state.current
    if (s.popped || !group.current) return
    s.y += config.speed * dt
    if (s.y > TOP_Y) {
      // 화면 위로 나가면 아래에서 리스폰
      s.y = BOTTOM_Y
      s.x = -4.5 + Math.random() * 9
    }
    const t = clock.elapsedTime
    group.current.position.set(
      s.x + Math.sin(t * 0.6 + config.phase) * config.swayAmp,
      s.y + Math.sin(t * 1.3 + config.phase * 2) * 0.08,
      config.z,
    )
  })

  const pop = () => {
    const s = state.current
    if (s.popped || !mesh.current || !group.current) return
    s.popped = true
    document.body.style.cursor = 'auto'
    const pos = group.current.position
    const at: [number, number, number] = [pos.x, pos.y, pos.z]
    gsap.to(mesh.current.scale, {
      x: 1.35,
      y: 1.35,
      z: 1.35,
      duration: 0.12,
      ease: 'power2.out',
      onComplete: () => {
        setVisible(false)
        onPop(config, at)
      },
    })
  }

  const hover = (on: boolean) => {
    if (state.current.popped || !mesh.current) return
    document.body.style.cursor = on ? 'pointer' : 'auto'
    gsap.to(mesh.current.scale, {
      x: on ? 1.1 : 1,
      y: on ? 1.1 : 1,
      z: on ? 1.1 : 1,
      duration: 0.25,
      ease: 'power2.out',
    })
  }

  if (!visible) return null

  return (
    <group ref={group}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation()
          pop()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          hover(true)
        }}
        onPointerOut={() => hover(false)}
      >
        <sphereGeometry args={[config.radius, 48, 32]} />
        <meshPhysicalMaterial
          transmission={0.95}
          thickness={0.02}
          roughness={0}
          ior={1.15}
          iridescence={1}
          iridescenceIOR={1.33}
          iridescenceThicknessRange={[100, 800]}
          envMapIntensity={1.6}
          transparent
        />
      </mesh>
      {config.work && (
        <Html center position={[0, -config.radius - 0.45, 0]} zIndexRange={[10, 0]}>
          <span className="bubble-label">{config.work.title}</span>
        </Html>
      )}
    </group>
  )
}
