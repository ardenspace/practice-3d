import type { CSSProperties } from 'react'
import { Link } from 'react-router'

// 이 작품의 메타 텍스트 단일 소스 — 등록부 항목과 페이지가 함께 임포트한다.
export const VENDING_MACHINE_TITLE = '자판기'
export const VENDING_MACHINE_BLURB = '우주 한구석에서 방울을 파는 자판기.'
export const VENDING_MACHINE_OBJECT_SRC = '/works/vending-machine/object.webp'

// v1 최소 페이지 셸 — 이후 라운드에서 살이 붙는다.
// 작품 페이지는 스타일 자유 구역 (홈 토큰을 따를 의무 없음).
const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  padding: '2rem 1.5rem',
  background: '#16121f',
  color: '#f2eefb',
  textAlign: 'center',
}

export default function VendingMachinePage() {
  return (
    <main style={pageStyle}>
      <img
        src={VENDING_MACHINE_OBJECT_SRC}
        alt={VENDING_MACHINE_TITLE}
        style={{ width: 'min(60vw, 20rem)', maxWidth: '100%' }}
      />
      <h1 style={{ margin: 0, fontSize: '2rem' }}>{VENDING_MACHINE_TITLE}</h1>
      <p style={{ margin: 0, opacity: 0.8 }}>{VENDING_MACHINE_BLURB}</p>
      <Link to="/" style={{ color: '#9fd8ff', marginTop: '1rem' }}>
        ← 방울들에게로
      </Link>
    </main>
  )
}
