import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Color, Group, Mesh, ShaderMaterial, SphereGeometry } from 'three'
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
// 상호작용(호버/클릭)은 다음 스텝 — 여기선 떠다니기만 한다. 작품 방울의
// entry(slug/title/object.src)는 WorkBubbleView가 들고 있다.

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
  /** 훗날 오브제 등 방울과 함께 움직일 자식 (group 좌표계). */
  children?: ReactNode
}

function Bubble({ name, radius, motion, rimAlpha, children }: BubbleProps) {
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)

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

  useFrame(({ clock, viewport }) => {
    const group = groupRef.current
    const mesh = meshRef.current
    if (!group || !mesh) return

    const t = clock.elapsedTime
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
    // 자전은 mesh에만 — group은 회전하지 않으므로 훗날 오브제는 정면 유지.
    mesh.rotation.y = t * motion.spinSpeed
    uniforms.uTime.value = t
  })

  return (
    <group ref={groupRef} name={name}>
      <mesh
        ref={meshRef}
        geometry={bubbleGeometry}
        material={material}
        scale={radius}
      />
      {children}
    </group>
  )
}

interface WorkBubbleViewProps {
  bubble: WorkBubble
  index: number
  total: number
}

// 작품 방울 — entry(slug/title/object.src)를 여기서 들고 간다. 다음 스텝의
// 호버(정지+오브제 공개)/클릭(터짐+내비게이션) 상태는 이 컴포넌트에 얹는다.
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
    />
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
