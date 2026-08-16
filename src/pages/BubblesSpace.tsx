import { Link } from 'react-router-dom'

const BASE = '/works/bubbles-space'

export default function BubblesSpace() {
  return (
    <article className="work-page">
      <Link className="back" to="/">
        ← 방울들에게 돌아가기
      </Link>
      <h1>Bubbles in Space</h1>
      <p className="desc">
        Blender로 만든 첫 연습작. Principled BSDF의 thin film(박막 간섭)으로
        비눗방울 재질을 만들고, 노이즈 텍스처로 막 두께를 흔들어 표면에 흐르는
        소용돌이 무늬를 넣었다. 배경 성운과 별밭은 절차적 텍스처, 터지는 연출은
        구면을 따라 퍼지는 디졸브 마스크 + 파티클 400개. Cycles(Metal GPU),
        1280×720, 240프레임.
      </p>

      <h2>터지는 버전</h2>
      <video src={`${BASE}/bubbles_space_pop.mp4`} poster={`${BASE}/poster.webp`} controls loop playsInline />

      <h2>떠다니는 버전</h2>
      <video src={`${BASE}/bubbles_space.mp4`} poster={`${BASE}/poster.webp`} controls loop playsInline />

      <h2>스틸</h2>
      <div className="stills">
        <img src={`${BASE}/still_0090.webp`} alt="우주를 떠다니는 비눗방울들" />
        <img src={`${BASE}/still_0121.webp`} alt="막이 찢어지며 터지는 순간" />
        <img src={`${BASE}/still_0171.webp`} alt="물방울이 흩어지는 두 번째 터짐" />
      </div>
    </article>
  )
}
