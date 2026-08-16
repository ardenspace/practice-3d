import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointsMaterial,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three'
import {
  COLOR_ACCENT_CYAN,
  COLOR_ACCENT_PINK,
  COLOR_NEBULA_PURPLE,
} from '../theme.ts'
import { works } from '../works/registry.ts'
import { deriveWorkBubbles, type WorkBubble } from './bubbles.ts'
import {
  BUBBLE_BASE_ALPHA,
  BUBBLE_FRESNEL_POWER,
  BUBBLE_HEIGHT_SEGMENTS,
  BUBBLE_HOVER_SCALE,
  BUBBLE_LAYOUT_SEED,
  BUBBLE_SHIMMER_SPEED,
  BUBBLE_WIDTH_SEGMENTS,
  CAMERA_Z,
  DECORATIVE_BUBBLE_COUNT,
  DECORATIVE_RADIUS_MAX,
  DECORATIVE_RADIUS_MIN,
  DECORATIVE_RIM_ALPHA,
  DECORATIVE_X_USABLE,
  DECORATIVE_Z_MAX,
  DECORATIVE_Z_MIN,
  DEPTH_SWAY_AMP,
  DEPTH_SWAY_FREQ_RATIO,
  DRIFT_SPEED_MAX,
  DRIFT_SPEED_MIN,
  HOVER_PAUSE_DAMP,
  HOVER_SCALE_DAMP,
  OBJET_FADE_DAMP,
  OBJET_REVEAL_SCALE_FROM,
  OBJET_SIZE_RATIO,
  OBJET_VISIBLE_EPSILON,
  OBJET_Z_OFFSET_RATIO,
  POP_NAVIGATE_DELAY_MS,
  POP_PARTICLE_COUNT,
  POP_PARTICLE_DRAG,
  POP_PARTICLE_GRAVITY,
  POP_PARTICLE_LIFETIME,
  POP_PARTICLE_SHRINK,
  POP_PARTICLE_SIZE_RATIO,
  POP_PARTICLE_SPEED_MAX,
  POP_PARTICLE_SPEED_MIN,
  POP_RESPAWN_DELAY_MS,
  RESPAWN_MARGIN,
  SPIN_SPEED_MAX,
  SPIN_SPEED_MIN,
  WOBBLE_AMP_MAX,
  WOBBLE_AMP_MIN,
  WOBBLE_FREQ_MAX,
  WOBBLE_FREQ_MIN,
  WORK_BUBBLE_RADIUS,
  WORK_BUBBLE_Z,
  WORK_DRIFT_SPEED_SCALE,
  WORK_RIM_ALPHA,
  WORK_X_USABLE,
} from './constants.ts'

// 방울 필드 — Canvas 자식. 작품 방울은 deriveWorkBubbles(works)에서만
// 파생한다 (B1: 등록 항목 N개 = 작품 방울 정확히 N개, 씬은 등록부를 직접
// 소비하지 않는다). 장식 방울은 상수 개수만큼.
//
// 재질: three 표준 재질 대신 가벼운 프레넬 림 셰이더 (ShaderMaterial).
// - 정면은 거의 투명, 가장자리(림)로 갈수록 핑크/시안/보라 무지갯빛이
//   차오르는 비눗방울 룩. transmission을 안 쓰는 이유: 배경이 캔버스 밖
//   CSS 이미지(alpha 캔버스)라 transmission 패스가 샘플할 씬 배경이 없어
//   방울이 어둡게 뜬다. public/bubbles.glb는 사용하지 않음 (파일 유지).
//
// 모션: 위로 드리프트 + sin 좌우 흔들림 + 얕은 z 스웨이 + 느린 자전.
// y는 방울의 깊이별 가시 경계 + RESPAWN_MARGIN에서 랩 — 위로 나가면
// 아래에서 리스폰. x는 뷰포트 폭 비율(xFrac)로 저장해 매 프레임 환산
// (리사이즈/모바일 대응).
//
// 호버(데스크톱, Requirement 3): 방울에 포인터를 올리면 그 방울만 정지 +
// BUBBLE_HOVER_SCALE 확대. 작품 방울은 오브제(entry.object.src 이미지)가
// 방울 안에서 페이드+스케일 인, 장식 방울은 빈 채로 같은 반응. 해제 시
// 전부 부드럽게 원복.
// - 무텔레포트 정지: 위치를 clock 절대시간이 아니라 방울별 로컬시간
//   (매 프레임 delta × speed 누적)으로 계산한다. speed는 호버에 따라
//   1↔0으로 지수 감쇠 — 급정지 대신 감속, 해제 시 멈춘 자리에서 재가속.
// - 쉬머(uTime)는 실제 경과시간을 계속 받아 정지 중에도 색이 흐른다
//   (죽은 정지가 아니라 살아있는 정지).
//
// 클릭(터짐, Requirements 5–6): 클릭하면 방울 mesh가 즉시 사라지고 그
// 자리에서 무지갯빛 조각 파티클(PopBurst)이 터진다. 터지는 동안 방울
// 서브트리는 언마운트라 레이캐스트 대상이 아예 없다 — 더블 팝/터지는
// 방울 호버 불가. 작품 방울은 터짐 시작 POP_NAVIGATE_DELAY_MS 뒤
// onWorkOpen(slug)으로 내비게이션 (라우터 컨텍스트는 DOM 쪽 Home이 들고
// 있고 콜백으로 주입 — R3F 리컨실러 안에서 useNavigate를 쓰지 않는다).
// 장식 방울은 터지기만 하고, 파티클 소멸 후 POP_RESPAWN_DELAY_MS 뒤 새
// 모션 파라미터로 화면 아래에서 리스폰한다 (필드가 비어가지 않게).
// 모바일 길게 누르기/탭은 다음 스텝.

// 오브제 평면 공유 지오메트리 (단위 정사각형, 크기는 mesh scale).
const objetGeometry = new PlaneGeometry(1, 1)

// 프레임레이트 독립 지수 감쇠 (수동 damp — 외부 라이브러리 없이).
function dampTo(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

// 포인터 커서 — 호버 중인 방울이 하나라도 있으면 pointer. 카운터 방식이라
// 인접 방울 간 over/out 이벤트 순서가 뒤섞여도 안전하다. (drei useCursor를
// 안 쓰는 이유: drei 배럴 임포트를 피해 jsdom 테스트 경로를 가볍게 유지.)
let cursorHoverCount = 0

function useHoverCursor(hovered: boolean): void {
  useEffect(() => {
    if (!hovered) return
    cursorHoverCount += 1
    document.body.style.cursor = 'pointer'
    return () => {
      cursorHoverCount -= 1
      if (cursorHoverCount === 0) document.body.style.cursor = ''
    }
  }, [hovered])
}

// 전 방울이 공유하는 단위 구 (반지름은 mesh scale). 지오메트리는 순수
// 계산이라 import 시점 생성이 jsdom에서도 안전하다.
const bubbleGeometry = new SphereGeometry(
  1,
  BUBBLE_WIDTH_SEGMENTS,
  BUBBLE_HEIGHT_SEGMENTS,
)

// 셰이더는 linear space에서 계산하므로 sRGB 토큰을 변환해 둔다.
const rimPink = new Color(COLOR_ACCENT_PINK).convertSRGBToLinear()
const rimCyan = new Color(COLOR_ACCENT_CYAN).convertSRGBToLinear()
const rimPurple = new Color(COLOR_NEBULA_PURPLE).convertSRGBToLinear()

const bubbleVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`

const bubbleFragmentShader = /* glsl */ `
uniform vec3 uPink;
uniform vec3 uCyan;
uniform vec3 uPurple;
uniform float uTime;
uniform float uPhase;
uniform float uFresnelPower;
uniform float uBaseAlpha;
uniform float uRimAlpha;
uniform float uShimmerSpeed;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec3 normal = normalize(vNormal);
  float facing = clamp(dot(normal, normalize(vViewDir)), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, uFresnelPower);

  // 법선 방향 + 시간으로 천천히 흐르는 무지갯빛 밴드 (박막 간섭 흉내).
  float t = uTime * uShimmerSpeed + uPhase;
  float bandA = 0.5 + 0.5 * sin(normal.y * 4.0 + t);
  float bandB = 0.5 + 0.5 * sin(normal.x * 3.0 - t * 0.8 + 1.7);
  vec3 rim = mix(uCyan, uPink, bandA);
  rim = mix(rim, uPurple, bandB * 0.5);

  // 림은 밝게, 중심부는 어둡고 투명하게.
  vec3 color = rim * (0.35 + 0.85 * fresnel);
  float alpha = uBaseAlpha + fresnel * uRimAlpha;
  gl_FragColor = vec4(color, alpha);
}
`

// ── 시드 결정론 랜덤 (새로고침마다 같은 배치) ──
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function euclideanMod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}

// ── 터짐 파티클 (PopBurst) ──
// 방울 하나가 터질 때의 일회성 버스트. Points 하나(1 드로우콜)로 그리고,
// 위치/속도 버퍼는 마운트 시 1회 할당 — 프레임 루프는 그 버퍼를 제자리
// 갱신만 한다 (프레임당 할당 없음). 조각은 방울 표면에서 바깥 방향으로
// 튀고, 약한 중력 + 공기 저항으로 처지며 수명 동안 페이드/축소.
// 색은 테마 악센트(핑크/시안/보라) 순환.
const popPalette = [rimPink, rimCyan, rimPurple]

interface PopBurstProps {
  center: readonly [number, number, number]
  radius: number
  /** 파티클 수명이 끝나면 정확히 1회 호출. */
  onDone: () => void
}

function PopBurst({ center, radius, onDone }: PopBurstProps) {
  // onDone은 ref로 — useFrame 클로저가 항상 최신 콜백을 부른다.
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const ageRef = useRef(0)
  const doneRef = useRef(false)

  const { geometry, material, positionAttribute, velocities } = useMemo(() => {
    const positions = new Float32Array(POP_PARTICLE_COUNT * 3)
    const colors = new Float32Array(POP_PARTICLE_COUNT * 3)
    const velocities = new Float32Array(POP_PARTICLE_COUNT * 3)
    for (let i = 0; i < POP_PARTICLE_COUNT; i += 1) {
      // 균일 구면 방향 — 방울 표면에서 시작해 그 방향으로 튄다.
      const y = Math.random() * 2 - 1
      const phi = Math.random() * Math.PI * 2
      const s = Math.sqrt(Math.max(0, 1 - y * y))
      const dx = s * Math.cos(phi)
      const dz = s * Math.sin(phi)
      positions[i * 3] = dx * radius
      positions[i * 3 + 1] = y * radius
      positions[i * 3 + 2] = dz * radius
      const speed =
        lerp(POP_PARTICLE_SPEED_MIN, POP_PARTICLE_SPEED_MAX, Math.random()) *
        radius
      velocities[i * 3] = dx * speed
      velocities[i * 3 + 1] = y * speed
      velocities[i * 3 + 2] = dz * speed
      const color = popPalette[i % popPalette.length]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    const geometry = new BufferGeometry()
    const positionAttribute = new BufferAttribute(positions, 3)
    geometry.setAttribute('position', positionAttribute)
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
    const material = new PointsMaterial({
      size: POP_PARTICLE_SIZE_RATIO * radius,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
    })
    return { geometry, material, positionAttribute, velocities }
  }, [radius])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((_, delta) => {
    if (doneRef.current) return
    ageRef.current += delta
    const life = ageRef.current / POP_PARTICLE_LIFETIME
    if (life >= 1) {
      doneRef.current = true
      onDoneRef.current()
      return
    }
    const positions = positionAttribute.array as Float32Array
    const drag = Math.exp(-POP_PARTICLE_DRAG * delta)
    for (let i = 0; i < velocities.length; i += 3) {
      velocities[i] *= drag
      velocities[i + 1] =
        velocities[i + 1] * drag - POP_PARTICLE_GRAVITY * delta
      velocities[i + 2] *= drag
      positions[i] += velocities[i] * delta
      positions[i + 1] += velocities[i + 1] * delta
      positions[i + 2] += velocities[i + 2] * delta
    }
    positionAttribute.needsUpdate = true
    material.opacity = 1 - life
    material.size =
      POP_PARTICLE_SIZE_RATIO * radius * (1 - POP_PARTICLE_SHRINK * life)
  })

  return (
    <points
      geometry={geometry}
      material={material}
      position={center}
      raycast={() => null}
    />
  )
}

// 방울 하나의 모션 파라미터 — 마운트 시 한 번 뽑고 이후 불변.
// (호버 스텝이 "정지/확대" 상태를 얹을 때도 이 베이스는 그대로 둔다.)
interface BubbleMotion {
  xFrac: number // 뷰포트 반폭 대비 x 위치 비율 [-1, 1]
  baseZ: number
  startFrac: number // 랩 구간 내 시작 위치 비율 [0, 1)
  driftSpeed: number
  wobbleAmp: number
  wobbleFreq: number
  wobblePhase: number
  spinSpeed: number
}

interface MotionRange {
  xFrac: number
  zMin: number
  zMax: number
  speedScale: number
}

function makeMotion(rand: () => number, range: MotionRange): BubbleMotion {
  return {
    xFrac: range.xFrac,
    baseZ: lerp(range.zMin, range.zMax, rand()),
    startFrac: rand(),
    driftSpeed: lerp(DRIFT_SPEED_MIN, DRIFT_SPEED_MAX, rand()) * range.speedScale,
    wobbleAmp: lerp(WOBBLE_AMP_MIN, WOBBLE_AMP_MAX, rand()),
    wobbleFreq: lerp(WOBBLE_FREQ_MIN, WOBBLE_FREQ_MAX, rand()),
    wobblePhase: rand() * Math.PI * 2,
    spinSpeed:
      lerp(SPIN_SPEED_MIN, SPIN_SPEED_MAX, rand()) * (rand() < 0.5 ? -1 : 1),
  }
}

// 터짐 단계: idle(떠다님/호버 가능) → burst(파티클만, 상호작용 없음) →
// gone(아무것도 렌더 안 함 — 리스폰은 부모 몫).
type PopPhase = 'idle' | 'burst' | 'gone'

interface BubbleProps {
  name?: string
  radius: number
  motion: BubbleMotion
  rimAlpha: number
  /** 클릭으로 터짐이 시작되는 순간 호출 (작품 방울: 내비게이션 예약). */
  onPop?: () => void
  /** 파티클까지 끝나 방울이 완전히 사라진 뒤 호출 (장식 방울: 리스폰 예약). */
  onPopFinished?: () => void
  /**
   * 오브제 등 방울과 함께 움직일 자식 (group 좌표계). 호버 상태를 받아
   * 렌더하는 함수 — 작품 방울의 오브제 공개가 이 인자로 구동된다.
   */
  children?: (hovered: boolean) => ReactNode
}

function Bubble({
  name,
  radius,
  motion,
  rimAlpha,
  onPop,
  onPopFinished,
  children,
}: BubbleProps) {
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [popPhase, setPopPhase] = useState<PopPhase>('idle')
  // 터진 순간의 위치/크기 — 파티클이 방울이 있던 바로 그 자리에서 터진다.
  const popCenterRef = useRef<readonly [number, number, number]>([0, 0, 0])
  const popRadiusRef = useRef(radius)
  // 무텔레포트 정지의 상태: 로컬시간(위치의 유일한 시간축) + 진행 속도 +
  // 현재 스케일. 렌더가 아니라 프레임 루프가 굴리는 값이라 ref.
  const localTimeRef = useRef(0)
  const speedRef = useRef(1)
  const scaleRef = useRef(1)

  useHoverCursor(hovered)

  const uniforms = useMemo(
    () => ({
      uPink: { value: rimPink },
      uCyan: { value: rimCyan },
      uPurple: { value: rimPurple },
      uTime: { value: 0 },
      uPhase: { value: motion.wobblePhase },
      uFresnelPower: { value: BUBBLE_FRESNEL_POWER },
      uBaseAlpha: { value: BUBBLE_BASE_ALPHA },
      uRimAlpha: { value: rimAlpha },
      uShimmerSpeed: { value: BUBBLE_SHIMMER_SPEED },
    }),
    [motion.wobblePhase, rimAlpha],
  )

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: bubbleVertexShader,
        fragmentShader: bubbleFragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false, // 반투명 방울끼리의 정렬 아티팩트 방지
      }),
    [uniforms],
  )

  useEffect(() => () => material.dispose(), [material])

  useFrame(({ clock, viewport }, delta) => {
    const group = groupRef.current
    const mesh = meshRef.current
    if (!group || !mesh) return

    // 호버 → 속도가 0으로 감쇠(감속 정지), 해제 → 1로 복귀(재가속).
    // 위치는 로컬시간의 함수이므로 멈춘 자리에서 그대로 이어진다.
    speedRef.current = dampTo(
      speedRef.current,
      hovered ? 0 : 1,
      HOVER_PAUSE_DAMP,
      delta,
    )
    localTimeRef.current += delta * speedRef.current
    const t = localTimeRef.current
    // 카메라(z=CAMERA_Z)에서 이 방울 깊이까지의 뷰포트 크기 환산 계수.
    const depthScale = (CAMERA_Z - motion.baseZ) / CAMERA_Z
    const halfWidth = (viewport.width / 2) * depthScale
    // 랩 경계: 이 깊이의 가시 반높이 + 방울 반지름 + 여유 (화면 밖 리스폰).
    const yBound = (viewport.height / 2) * depthScale + radius + RESPAWN_MARGIN
    const span = yBound * 2

    group.position.x =
      motion.xFrac * halfWidth +
      Math.sin(t * motion.wobbleFreq + motion.wobblePhase) * motion.wobbleAmp
    group.position.y =
      -yBound + euclideanMod(motion.startFrac * span + t * motion.driftSpeed, span)
    group.position.z =
      motion.baseZ +
      Math.sin(
        t * motion.wobbleFreq * DEPTH_SWAY_FREQ_RATIO + motion.wobblePhase * 1.7,
      ) * DEPTH_SWAY_AMP
    // 호버 확대/복귀 — group 스케일이라 오브제 자식도 함께 커진다.
    scaleRef.current = dampTo(
      scaleRef.current,
      hovered ? BUBBLE_HOVER_SCALE : 1,
      HOVER_SCALE_DAMP,
      delta,
    )
    group.scale.setScalar(scaleRef.current)
    // 자전은 mesh에만 — group은 회전하지 않으므로 오브제는 정면 유지.
    mesh.rotation.y = t * motion.spinSpeed
    // 쉬머는 실제 시간 — 정지 중에도 무지갯빛은 계속 흐른다.
    uniforms.uTime.value = clock.elapsedTime
  })

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    // 겹친 방울 중 가장 앞의 것만 반응.
    event.stopPropagation()
    setHovered(true)
  }

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    // 앞의 방울만 터진다 — 뒤에 겹친 방울까지 연쇄 팝 금지.
    event.stopPropagation()
    if (popPhase !== 'idle') return
    const group = groupRef.current
    if (group) {
      popCenterRef.current = [
        group.position.x,
        group.position.y,
        group.position.z,
      ]
    }
    // 호버 확대 중이면 커진 크기 그대로 터진다.
    popRadiusRef.current = radius * scaleRef.current
    // mesh가 언마운트되면 pointerOut이 안 오므로 여기서 호버/커서 해제.
    setHovered(false)
    setPopPhase('burst')
    onPop?.()
  }

  if (popPhase === 'gone') return null

  if (popPhase === 'burst') {
    // 방울 서브트리 전체를 파티클로 교체 — 레이캐스트 대상이 없어
    // 터지는 동안 호버/재클릭이 원천 차단된다 (더블 팝 불가).
    return (
      <PopBurst
        center={popCenterRef.current}
        radius={popRadiusRef.current}
        onDone={() => {
          setPopPhase('gone')
          onPopFinished?.()
        }}
      />
    )
  }

  return (
    <group ref={groupRef} name={name}>
      <mesh
        ref={meshRef}
        geometry={bubbleGeometry}
        material={material}
        scale={radius}
        onPointerOver={handlePointerOver}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
      />
      {children?.(hovered)}
    </group>
  )
}

// ── 오브제 (작품 방울 안의 이미지) ──

// 비동기 텍스처 로드 — Suspense/throw 없이 상태로만. 로드 실패(파일 누락·
// 지연)는 오브제가 안 보일 뿐 씬은 그대로 산다 (Failure Behavior: 백지
// 금지, 조용하게). src는 등록부 검증(B1)을 거친 사이트 상대 경로다.
function useObjetTexture(src: string): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    let disposed = false
    let loaded: Texture | null = null
    new TextureLoader().load(
      src,
      (tex) => {
        if (disposed) {
          tex.dispose()
          return
        }
        tex.colorSpace = SRGBColorSpace
        loaded = tex
        setTexture(tex)
      },
      undefined,
      () => {
        // 실패는 조용히 — 방울은 빈 채로 정상 동작.
      },
    )
    return () => {
      disposed = true
      loaded?.dispose()
      setTexture(null)
    }
  }, [src])

  return texture
}

interface BubbleObjetProps {
  src: string
  bubbleRadius: number
  hovered: boolean
}

// 방울 중심보다 살짝 카메라 쪽의 정면 평면에 오브제 텍스처(투명 배경
// webp)를 얹는다. 호버 시 페이드 인 + REVEAL_SCALE_FROM→1 스케일 인,
// 해제 시 역재생. 마운트 즉시 로드를 시작해 첫 호버에 지연이 없다.
function BubbleObjet({ src, bubbleRadius, hovered }: BubbleObjetProps) {
  const texture = useObjetTexture(src)
  const meshRef = useRef<Mesh>(null)
  const opacityRef = useRef(0)

  const material = useMemo(
    () =>
      texture
        ? new MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false, // 원본 렌더 색 그대로
          })
        : null,
    [texture],
  )

  useEffect(() => () => material?.dispose(), [material])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh || !material) return
    opacityRef.current = dampTo(
      opacityRef.current,
      hovered ? 1 : 0,
      OBJET_FADE_DAMP,
      delta,
    )
    material.opacity = opacityRef.current
    const size = bubbleRadius * OBJET_SIZE_RATIO
    mesh.scale.setScalar(
      size * lerp(OBJET_REVEAL_SCALE_FROM, 1, opacityRef.current),
    )
    mesh.visible = opacityRef.current > OBJET_VISIBLE_EPSILON
  })

  if (!material) return null

  return (
    <mesh
      ref={meshRef}
      geometry={objetGeometry}
      material={material}
      position={[0, 0, bubbleRadius * OBJET_Z_OFFSET_RATIO]}
      visible={false}
      // 오브제가 방울의 포인터 이벤트를 가로채지 않도록 레이캐스트 제외.
      raycast={() => null}
    />
  )
}

interface WorkBubbleViewProps {
  bubble: WorkBubble
  index: number
  total: number
  /** 터짐 연출 후 작품 페이지를 열 콜백 (slug 전달) — Home이 주입. */
  onWorkOpen?: (slug: string) => void
}

// 작품 방울 — entry(slug/title/object.src)를 여기서 들고 간다. 호버 시
// 오브제 공개는 Bubble의 함수 자식으로 구동. 클릭(Requirement 5): 터짐이
// 시작되면 POP_NAVIGATE_DELAY_MS 뒤 onWorkOpen(slug) — 사용자가 터지는
// 순간을 본 다음 페이지가 전환된다. slug는 항상 entry에서 (하드코딩 금지).
function WorkBubbleView({ bubble, index, total, onWorkOpen }: WorkBubbleViewProps) {
  const navigateTimerRef = useRef<number | undefined>(undefined)
  // 내비게이션 전에 다른 이유(WebGL 상실 폴백 등)로 언마운트되면 예약 취소.
  useEffect(() => () => window.clearTimeout(navigateTimerRef.current), [])

  const motion = useMemo(() => {
    const rand = mulberry32(BUBBLE_LAYOUT_SEED + index * 7919)
    // 작품 방울은 x 슬롯에 고르게 분배 (작품 1개면 중앙).
    const slotFrac = ((index + 0.5) / total) * 2 - 1
    return makeMotion(rand, {
      xFrac: slotFrac * WORK_X_USABLE,
      zMin: WORK_BUBBLE_Z,
      zMax: WORK_BUBBLE_Z,
      speedScale: WORK_DRIFT_SPEED_SCALE,
    })
  }, [index, total])

  const handlePop = () => {
    if (!onWorkOpen) return
    const slug = bubble.entry.slug
    navigateTimerRef.current = window.setTimeout(
      () => onWorkOpen(slug),
      POP_NAVIGATE_DELAY_MS,
    )
  }

  return (
    <Bubble
      name={bubble.entry.slug}
      radius={WORK_BUBBLE_RADIUS}
      motion={motion}
      rimAlpha={WORK_RIM_ALPHA}
      onPop={handlePop}
    >
      {(hovered) => (
        <BubbleObjet
          src={bubble.entry.object.src}
          bubbleRadius={WORK_BUBBLE_RADIUS}
          hovered={hovered}
        />
      )}
    </Bubble>
  )
}

// 장식 방울 — 클릭하면 터지기만 한다 (Requirement 6, 내비게이션 없음).
// 리스폰(위임): 파티클 소멸 후 POP_RESPAWN_DELAY_MS 뒤 같은 슬롯이 새
// 모션 파라미터(gen을 시드에 섞음)로 화면 아래 경계에서 다시 떠오른다 —
// 터뜨려도 필드가 비어가지 않고, 같은 자리에 유령처럼 재등장하지도 않는다.
function DecorativeBubble({ index }: { index: number }) {
  const [gen, setGen] = useState(0)
  const respawnTimerRef = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(respawnTimerRef.current), [])

  const { motion, radius } = useMemo(() => {
    const rand = mulberry32(
      BUBBLE_LAYOUT_SEED + 104729 + index * 7919 + gen * 15485863,
    )
    const radius = lerp(DECORATIVE_RADIUS_MIN, DECORATIVE_RADIUS_MAX, rand())
    const motion = makeMotion(rand, {
      xFrac: (rand() * 2 - 1) * DECORATIVE_X_USABLE,
      zMin: DECORATIVE_Z_MIN,
      zMax: DECORATIVE_Z_MAX,
      speedScale: 1,
    })
    // 리스폰 세대는 랩 구간의 시작(화면 아래 경계)에서 떠오른다.
    if (gen > 0) motion.startFrac = 0
    return { motion, radius }
  }, [index, gen])

  const handlePopFinished = () => {
    respawnTimerRef.current = window.setTimeout(
      () => setGen((g) => g + 1),
      POP_RESPAWN_DELAY_MS,
    )
  }

  return (
    <Bubble
      key={gen} // 리스폰 = 새 Bubble (로컬시간/속도/스케일 리셋)
      radius={radius}
      motion={motion}
      rimAlpha={DECORATIVE_RIM_ALPHA}
      onPopFinished={handlePopFinished}
    />
  )
}

interface BubbleFieldProps {
  /**
   * 작품 방울이 터진 뒤 해당 작품 페이지를 열 콜백. 라우터 컨텍스트
   * (useNavigate)는 DOM 쪽 Home에 있으므로 여기로 주입받는다 — R3F
   * 리컨실러 내부에서 라우터 훅을 직접 쓰지 않는다.
   */
  onWorkOpen?: (slug: string) => void
}

export default function BubbleField({ onWorkOpen }: BubbleFieldProps) {
  // B1 씬 보장의 소비 지점: 등록부가 아니라 파생 목록에서 방울을 만든다.
  const workBubbles = useMemo(() => deriveWorkBubbles(works), [])

  return (
    <>
      {workBubbles.map((bubble, index) => (
        <WorkBubbleView
          key={bubble.entry.slug}
          bubble={bubble}
          index={index}
          total={workBubbles.length}
          onWorkOpen={onWorkOpen}
        />
      ))}
      {Array.from({ length: DECORATIVE_BUBBLE_COUNT }, (_, index) => (
        <DecorativeBubble key={index} index={index} />
      ))}
    </>
  )
}
