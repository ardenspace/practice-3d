// 방울 씬 상수 — 방울 개수/배치/모션/재질의 매직 넘버는 전부 여기.
// (Simplicity Zones: 개수·배치는 상수 하드코딩, 설정 UI 없음.
//  구체 값은 Reversibility Ledger의 Delegated — 눈으로 보고 조정한다.)

// ── 카메라 (배치 수학의 기준 — Home의 Canvas와 BubbleField가 공유) ──
export const CAMERA_Z = 6
export const CAMERA_FOV = 60 // deg

// ── 개수 ──
export const DECORATIVE_BUBBLE_COUNT = 12

// ── 크기 (구 반지름, world units) ──
// 작품 방울은 장식 방울보다 크고 카메라에 가깝다 (시각적 프로미넌스).
export const WORK_BUBBLE_RADIUS = 0.85
export const DECORATIVE_RADIUS_MIN = 0.28
export const DECORATIVE_RADIUS_MAX = 0.6

// ── 배치 ──
// x는 뷰포트 폭 대비 비율(xFrac ∈ [-1, 1])로 저장하고 매 프레임 현재
// 뷰포트 폭으로 환산한다 (리사이즈/모바일 대응). *_X_USABLE은 화면 가장자리
// 여백을 남기는 사용률.
export const DECORATIVE_X_USABLE = 0.85
export const WORK_X_USABLE = 0.55 // 작품 방울은 중앙 쪽에 유지
export const WORK_BUBBLE_Z = 1.4 // 카메라에 가까움 = 크게 보임
export const DECORATIVE_Z_MIN = -3
export const DECORATIVE_Z_MAX = 0.4
// 위로 떠서 화면 밖으로 나가면 아래로 리스폰(랩) — 랩 경계는 방울의 깊이별
// 가시 범위 + 이 여유만큼 화면 밖에서 일어난다 (팝 없음).
export const RESPAWN_MARGIN = 0.4

// ── 모션 ──
export const DRIFT_SPEED_MIN = 0.14 // units/s, 위쪽으로
export const DRIFT_SPEED_MAX = 0.32
export const WORK_DRIFT_SPEED_SCALE = 0.6 // 작품 방울은 느긋하게
export const WOBBLE_AMP_MIN = 0.25 // 좌우 sin 흔들림 진폭
export const WOBBLE_AMP_MAX = 0.55
export const WOBBLE_FREQ_MIN = 0.25 // rad/s
export const WOBBLE_FREQ_MAX = 0.6
export const DEPTH_SWAY_AMP = 0.25 // 얕은 z 흔들림 (입체감)
export const DEPTH_SWAY_FREQ_RATIO = 0.7 // 좌우 흔들림 주파수 대비
export const SPIN_SPEED_MIN = 0.05 // rad/s, 느린 자전
export const SPIN_SPEED_MAX = 0.2

// ── 지오메트리 ──
export const BUBBLE_WIDTH_SEGMENTS = 48
export const BUBBLE_HEIGHT_SEGMENTS = 32

// ── 재질 (비눗방울 프레넬 림 셰이더) ──
export const BUBBLE_FRESNEL_POWER = 2.6 // 클수록 림이 얇아짐
export const BUBBLE_BASE_ALPHA = 0.05 // 정면(중심부) 최소 불투명도
export const DECORATIVE_RIM_ALPHA = 0.65 // 림 최대 불투명도 기여
export const WORK_RIM_ALPHA = 0.9 // 작품 방울은 림이 더 또렷
export const BUBBLE_SHIMMER_SPEED = 0.5 // 무지갯빛 색 흐름 속도

// ── 시드 (레이아웃 결정론 — 새로고침마다 같은 배치) ──
export const BUBBLE_LAYOUT_SEED = 0x5eed
