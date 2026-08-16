import { useCallback, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import Bubble, { type BubbleConfig } from './Bubble'
import Burst from './Burst'
import { works } from '../works'

type BurstEntry = {
  key: number
  position: [number, number, number]
  radius: number
}

type Props = {
  onNavigate: (slug: string) => void
}

const DECORATIVE_COUNT = 12

export default function BubbleScene({ onNavigate }: Props) {
  const bubbles = useMemo<BubbleConfig[]>(() => {
    const list: BubbleConfig[] = []
    // 작품 방울: 크고, 라벨 달림
    works.forEach((work, i) => {
      list.push({
        id: i,
        radius: 0.85,
        x: -1.2 + i * 2.4,
        z: 0.5,
        speed: 0.22,
        phase: i * 2.1,
        swayAmp: 0.5,
        work,
      })
    })
    // 장식 방울
    for (let i = 0; i < DECORATIVE_COUNT; i++) {
      list.push({
        id: works.length + i,
        radius: 0.18 + Math.random() * 0.34,
        x: -4.5 + Math.random() * 9,
        z: -2.5 + Math.random() * 3.5,
        speed: 0.25 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        swayAmp: 0.25 + Math.random() * 0.5,
      })
    }
    return list
  }, [])

  const [bursts, setBursts] = useState<BurstEntry[]>([])

  const handlePop = useCallback(
    (config: BubbleConfig, position: [number, number, number]) => {
      setBursts((prev) => [
        ...prev,
        { key: config.id * 1000 + prev.length, position, radius: config.radius },
      ])
      if (config.work) onNavigate(config.work.slug)
    },
    [onNavigate],
  )

  const handleBurstDone = useCallback((key: number) => {
    setBursts((prev) => prev.filter((b) => b.key !== key))
  }, [])

  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 50 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} color="#e8ddff" />
      {/* 비눗방울 반사에 비칠 환경 — 핑크/시안 면광원 (Blender 씬의 KeyArea/FillArea 재현) */}
      <Environment resolution={128}>
        <Lightformer intensity={2.2} color="#ff8ecf" position={[-5, 2, 3]} scale={[4, 4, 1]} />
        <Lightformer intensity={1.8} color="#7fdcff" position={[5, -1, 2]} scale={[5, 5, 1]} />
        <Lightformer intensity={0.8} color="#8a5cff" position={[0, 5, -4]} scale={[10, 3, 1]} />
      </Environment>
      {bubbles.map((config) => (
        <Bubble key={config.id} config={config} onPop={handlePop} />
      ))}
      {bursts.map((b) => (
        <Burst key={b.key} id={b.key} position={b.position} radius={b.radius} onDone={handleBurstDone} />
      ))}
    </Canvas>
  )
}
