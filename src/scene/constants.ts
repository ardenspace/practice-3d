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

// ── 호버 (정지 + 확대 + 오브제 공개 — Requirement 3, 연출은 Delegated) ──
// 스무딩은 프레임레이트 독립 지수 감쇠: v += (target - v) * (1 - exp(-λ·dt)).
// λ(1/s)가 클수록 빠르게 수렴한다.
export const BUBBLE_HOVER_SCALE = 1.3 // 호버 시 방울 확대 배율 (spec 위임: 1.2–1.4)
export const HOVER_SCALE_DAMP = 6 // 확대↔복귀 스무딩 λ
export const HOVER_PAUSE_DAMP = 5 // 모션 속도 1↔0 스무딩 λ (급정지 대신 감속)
export const OBJET_SIZE_RATIO = 1.15 // 오브제 평면 한 변 / 방울 반지름 (구 안에 수렴)
export const OBJET_Z_OFFSET_RATIO = 0.2 // 오브제 평면의 방울 중심 대비 +z (카메라 쪽)
export const OBJET_FADE_DAMP = 7 // 오브제 페이드 인/아웃 스무딩 λ
export const OBJET_REVEAL_SCALE_FROM = 0.75 // 공개 시작 스케일 (페이드와 함께 1로)
export const OBJET_VISIBLE_EPSILON = 0.01 // 이하 불투명도는 렌더 스킵

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
