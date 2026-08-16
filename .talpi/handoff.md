# Handoff

업데이트: 2026-08-16, Phase 1 완료 직후.

## 어디까지 왔나

- Phase 1 (뼈대 사이트) 완료: 5 스텝 전부 커밋, 계약 테스트 14/14 green,
  verifier CLEAN. base 8dcc2f9, 마지막 커밋 0e2e61f.
- 스택: Vite 7 + React 19 + TS strict + bun + Vitest + react-router 7.
  `bun run dev`(5173) / `build` / `test` 전부 동작.
- 화면: `/` = HomeFallback(배경+제목+작품 링크, 아직 씬 없음),
  `/works/vending-machine` = v1 페이지 셸. 알 수 없는 경로 → 홈.
- 에셋: `public/backdrop.webp`, `public/works/vending-machine/object.webp`
  (렌더 완료, B2 green).

## 다음 할 일

- Phase 2 (방울 씬 — 데스크톱). 첫 스텝 = B4 폴백 계약 테스트 핀
  (WebGL 차단 로드 시 HomeFallback 렌더). plan.md Phase 2 체크박스 참조.
- 씬은 `src/scene/bubbles.ts`의 `deriveWorkBubbles(works)` 목록을
  소비해야 함 (B1 씬 보장 — 파생 모듈 수준으로 이미 핀됨).
- HomeFallback(`src/scene/HomeFallback.tsx`)을 B4 폴백으로 그대로 재사용.

## 조심할 것

- `src/test-setup.ts`는 지우면 안 됨 — jsdom에서 react-router 내비게이션
  깨짐 (conventions.md 참조).
- `public/bubbles.glb`(664KB) 사용 여부는 위임 사항이나, 안 쓰기로 해도
  파일 삭제는 사람 확인 필요 (spec Delegated 항목).
- .blend 파일은 읽기 전용 취급. 재렌더 시 카메라 Track-To 제약 주의
  (conventions.md step 3 노트).
- dev 서버 포트: 5173 (8080/8000/8081/5000/7000 금지).
