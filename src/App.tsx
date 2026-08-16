import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import BubblesSpace from './pages/BubblesSpace'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/works/bubbles-space" element={<BubblesSpace />} />
    </Routes>
  )
}
