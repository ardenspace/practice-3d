import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BubbleScene from '../scenes/BubbleScene'

export default function Home() {
  const navigate = useNavigate()
  const [fading, setFading] = useState(false)

  const handleNavigate = useCallback(
    (slug: string) => {
      setFading(true)
      setTimeout(() => navigate(`/works/${slug}`), 450)
    },
    [navigate],
  )

  return (
    <div className={fading ? 'home fading' : 'home'}>
      <BubbleScene onNavigate={handleNavigate} />
      <header className="home-header">
        <h1>arden's 3d practice</h1>
        <p>방울을 터뜨려 보세요 — 라벨이 달린 방울은 작품으로 이어져요</p>
      </header>
    </div>
  )
}
