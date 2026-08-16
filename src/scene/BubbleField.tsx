import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
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
// 클릭(터짐/내비게이션)과 모바일 길게 누르기는 다음 스텝.

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

interface BubbleProps {
  name?: string
  radius: number
  motion: BubbleMotion
  rimAlpha: number
  /**
   * 오브제 등 방울과 함께 움직일 자식 (group 좌표계). 호버 상태를 받아
   * 렌더하는 함수 — 작품 방울의 오브제 공개가 이 인자로 구동된다.
   */
  children?: (hovered: boolean) => ReactNode
}

function Bubble({ name, radius, motion, rimAlpha, children }: BubbleProps) {
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
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

  return (
    <group ref={groupRef} name={name}>
      <mesh
        ref={meshRef}
        geometry={bubbleGeometry}
        material={material}
        scale={radius}
        onPointerOver={handlePointerOver}
        onPointerOut={() => setHovered(false)}
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
}

// 작품 방울 — entry(slug/title/object.src)를 여기서 들고 간다. 호버 시
// 오브제 공개는 Bubble의 함수 자식으로 구동. 클릭(터짐+내비게이션)은
// 다음 스텝에 이 컴포넌트에 얹는다.
function WorkBubbleView({ bubble, index, total }: WorkBubbleViewProps) {
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

  return (
    <Bubble
      name={bubble.entry.slug}
      radius={WORK_BUBBLE_RADIUS}
      motion={motion}
      rimAlpha={WORK_RIM_ALPHA}
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

function DecorativeBubble({ index }: { index: number }) {
  const { motion, radius } = useMemo(() => {
    const rand = mulberry32(BUBBLE_LAYOUT_SEED + 104729 + index * 7919)
    return {
      radius: lerp(DECORATIVE_RADIUS_MIN, DECORATIVE_RADIUS_MAX, rand()),
      motion: makeMotion(rand, {
        xFrac: (rand() * 2 - 1) * DECORATIVE_X_USABLE,
        zMin: DECORATIVE_Z_MIN,
        zMax: DECORATIVE_Z_MAX,
        speedScale: 1,
      }),
    }
  }, [index])

  return (
    <Bubble radius={radius} motion={motion} rimAlpha={DECORATIVE_RIM_ALPHA} />
  )
}

export default function BubbleField() {
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
        />
      ))}
      {Array.from({ length: DECORATIVE_BUBBLE_COUNT }, (_, index) => (
        <DecorativeBubble key={index} index={index} />
      ))}
    </>
  )
}
