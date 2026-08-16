import { HOME_TESTID, SITE_TITLE } from '../theme.ts'

// 홈 씬 호스트 (Phase 2 step 1의 정직한 stub).
// 다음 스텝에서 WebGL 가용성을 감지해 방울 씬(R3F Canvas) 또는
// HomeFallback(B4 폴백: 배경 이미지 + 사이트 제목 + 전 작품 텍스트 링크)을
// 렌더하도록 구현된다. 지금은 B3(홈 루트 testid)와 기존 스캐폴드 테스트
// (사이트 제목 heading)만 만족하는 빈 셸이라, B4 계약 테스트
// (Home.test.tsx)는 의도적으로 red다 — 폴백 의무(배경/링크 목록)를 아직
// 이행하지 않는다.
export default function Home() {
  return (
    <main data-testid={HOME_TESTID}>
      <h1>{SITE_TITLE}</h1>
    </main>
  )
}
