# Handoff

업데이트: 2026-08-22 — **새 런 진행 중.** 이전 런(비눗방울 오브제 포트폴리오
v1)은 2026-08-16 에 done 으로 끝났고, 그 산출물은
`.talpi/archive/2026-08-22/` 에 있다. journal.md 는 두 런을 이어서 기록한다.

## 이번 런은 무엇인가

공개 직전 라운드. 배포는 하지 않고 공개해도 괜찮은 상태로 만든다. 두 가지를
만든다.

- 키보드만으로 모든 작품에 도달하고 열 수 있을 것.
- 방울 씬을 거치지 않고도 작품 목록을 볼 수 있는 상시 경로가 있을 것.

둘 다 등록부(`src/works/registry.ts`)에서 파생되어야 하고, 작품을 추가할 때
손댈 곳이 늘어나면 안 된다.

## Done so far

- spec 승인(2026-08-22). 판넬은 세 리뷰어를 각각 다른 문맥으로 띄웠고,
  범위 없는 1회 + 범위를 좁힌 재실행 2회로 상한까지 돌았다. BLOCKING 은 전부
  해소됐다.
- plan 승인, 4 페이즈. conventions.md 와 codemap.md 도 같이 확정.
- 코드는 아직 한 줄도 안 바뀌었다. 페이즈 1 스텝 1 을 디스패치하려다 사람이
  세션을 넘기기로 해서 중단했고, 그때 나온 중간 산출물
  (`src/works/WorkList.*`, `src/theme.ts` 상수 추가)은 사람의 결정으로
  전부 버렸다. 작업 트리는 깨끗하다.

## Next step

**페이즈 1 스텝 1 부터.** plan.md 의 체크박스가 전부 비어 있고 journal 에
`phase 1 started (base: 3fda4975d4504a9b75f4605e46e06675ebe576a5)` 가 이미
찍혀 있다. 그 base 는 유효하다 — 이후 커밋은 `.talpi/` 기록뿐이고 페이즈 diff
범위는 `.talpi/` 를 제외하므로 영향이 없다.

스텝 1 은 B5(작품 목록 표면)를 실패하는 테스트로 핀하는 일이다. 이 스텝의
핵심은 **씬을 마운트하지 않고 슬라이드 모습과 전체 화면 모습을 각각 렌더하는
seam** 이다. jsdom 에는 WebGL 이 없고 있다고 속이면 R3F 캔버스가 실제로
마운트되어 죽기 때문에, 이 seam 이 없으면 슬라이드 모드를 자동으로 확인할
방법이 사라진다.

## Gotchas

- **jsdom 은 언제나 WebGL 이 없다.** `isWebGLAvailable()` 이 항상 false 라
  테스트는 늘 "씬을 못 띄우는" 경로를 탄다. 페이즈 2 이후에는 그 경로가
  `/works` 전체 화면 목록이 되므로, 기존 라우팅 테스트의 "홈으로 간다" 단언이
  `/` 와 `/works` 를 구별할 수 있어야 한다. 목록 화면에 자기 표식이 필요한
  이유다.
- **`getContext` 를 참으로 속이지 말 것.** R3F 캔버스가 진짜로 마운트되면서
  three.js 가 죽는다. 이전 런이 `src/scene/webgl.ts` 프로브를 Canvas 마운트
  *전* 게이트로 둔 것도 같은 이유다.
- **`src/test-setup.ts` 를 지우지 말 것.** jsdom 의 AbortController 를 Node
  네이티브로 교체하는데, 없으면 react-router 리다이렉트 테스트가 깨진다.
- **`bun run build` 가 가장 싼 기계적 확인이다** (`tsc -b && vite build`).
- **`tsconfig.node.json` 의 include 에 `src/theme.ts` 가 들어 있다.** vite
  설정이 `transformIndexHtml` 로 사이트 제목을 치환하느라 theme 을 임포트해서
  생긴 프로젝트 경계다. 건드리면 `tsc -b` 가 TS6307 로 실패한다.
- **이전 런의 규약 문서 원본**은 `.talpi/archive/2026-08-22/conventions-prev-run.md`
  에 있다. 거기 있던 모듈 지도는 `.talpi/codemap.md` 로 옮겼다.
