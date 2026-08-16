import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { SITE_TITLE } from './src/theme'

// index.html의 %SITE_TITLE% 자리표시자를 src/theme.ts의 SITE_TITLE(단일
// 소스)로 dev/build 양쪽에서 치환 — 사이트 이름 변경 = 상수 한 곳 수정.
// (src/theme.ts는 tsconfig.node.json include에도 올라 있어야 `tsc -b`가
// 통과한다. 드리프트 가드 테스트: src/siteTitle.test.ts.)
const siteTitlePlugin = (): Plugin => ({
  name: 'site-title',
  transformIndexHtml: (html) => html.replaceAll('%SITE_TITLE%', SITE_TITLE),
})

// dev/preview run on Vite's default port 5173 — do not move onto this
// machine's occupied ports (8080/8000/8081/5000/7000).
export default defineConfig({
  plugins: [react(), siteTitlePlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
