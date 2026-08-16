import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, MeshBasicMaterial, Object3D } from 'three'

const COUNT = 36
const LIFE = 0.8 // seconds

type Props = {
  id: number
  position: [number, number, number]
  radius: number
  onDone: (id: number) => void
}

// 방울이 터질 때 물방울들이 방사되는 파티클 (Blender 파티클 버스트의 웹 버전)
export default function Burst({ id, position, radius, onDone }: Props) {
  const mesh = useRef<InstancedMesh>(null)
  const material = useRef<MeshBasicMaterial>(null)
  const elapsed = useRef(0)
  const done = useRef(false)

  const particles = useMemo(() => {
    const dummy = new Object3D()
    const list = []
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = (1.2 + Math.random() * 1.8) * (0.6 + radius)
      list.push({
        dir: [
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed,
        ] as const,
        size: 0.35 + Math.random() * 0.9,
      })
    }
    return { dummy, list }
  }, [radius])

  useFrame((_, dt) => {
    if (!mesh.current || !material.current || done.current) return
    elapsed.current += dt
    const t = elapsed.current
    if (t > LIFE) {
      done.current = true
      onDone(id)
      return
    }
    const { dummy, list } = particles
    list.forEach((p, i) => {
      dummy.position.set(
        position[0] + p.dir[0] * t,
        position[1] + p.dir[1] * t - 0.4 * t * t, // 아주 약한 중력
        position[2] + p.dir[2] * t,
      )
      const s = p.size * (1 - t / LIFE)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    material.current.opacity = 1 - t / LIFE
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.055, 8, 8]} />
      <meshBasicMaterial ref={material} color="#d8ecff" transparent opacity={1} />
    </instancedMesh>
  )
}
