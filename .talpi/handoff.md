# Handoff

업데이트: 2026-08-16, Phase 2 완료 직후.

## 어디까지 왔나

- Phase 1 (뼈대 사이트) 완료: verifier CLEAN. 등록부·에셋·라우팅, B1–B3 green.
- Phase 2 (방울 씬 데스크톱) 완료: 5 스텝 + verifier [FIX] 2건 수정 커밋
  (2aee836). B4 green, 테스트 16/16.
- 씬 현황: 프레넬 셰이더 방울(작품 1 + 장식 12)이 우주 배경 위 부유,
  호버 시 정지+1.3x 확대+오브제 공개, 클릭 시 파티클 터짐 → 작품 방울은
  420ms 후 `/works/<slug>` 이동, 장식 방울은 2.6s 후 아래에서 리스폰.
  WebGL 실패/상실 시 HomeFallback 폴백.

## 다음 할 일

- Phase 3 (모바일 + 마감). Contracts 없음 → 첫 스텝 디스패치 시
  저널에 `phase 3 contracts: none` 기록.
  - step 1: 탭/길게 누르기 (`LONG_PRESS_MS = 250` 상수는 아직 없음 —
    theme.ts에 추가 예정, conventions Design Tokens 참조)
  - step 2: 홈 타이포·카피 + 페이지 전환 연출 + 작품 페이지 에러 바운더리
  - step 3: 마감 검수 패스 (스모크 데스크톱/모바일, vite preview 딥링크,
    정적 산출물·외부 요청 없음 확인)
- Phase 3 시작 시 conventions.md "Prior work this phase" 블록 리셋.

## 조심할 것

- `src/test-setup.ts` 삭제 금지 (jsdom 라우터 내비게이션 보정).
- `public/bubbles.glb` 미사용이지만 삭제는 사람 확인 필요 (Delegated 조항).
- 방울 재질: 알파 캔버스 + CSS 배경 구조라 transmission 계열 머티리얼은
  배경 샘플이 없어 어둡게 나옴 — 프레넬 ShaderMaterial 유지.
- 씬은 `deriveWorkBubbles(works)`만 소비 (B1). 스타일 공유는
  `src/scene/homeStyles.ts`, 매직 넘버는 `src/scene/constants.ts`.
- dev 서버 5173 (8080/8000/8081/5000/7000 금지).
