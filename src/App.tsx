import { createBrowserRouter, RouterProvider } from 'react-router'
import { routes } from './routes.tsx'

// 라우팅 표면(src/routes.tsx)의 단일 배열로 브라우저 라우터를 만든다.
// 테스트는 같은 배열로 createMemoryRouter를 만든다 (B3).
const router = createBrowserRouter(routes)

export default function App() {
  return <RouterProvider router={router} />
}
