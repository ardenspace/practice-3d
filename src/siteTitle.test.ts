// 드리프트 가드: index.html의 <title>은 리터럴이 아니라 %SITE_TITLE%
// 자리표시자여야 한다 (vite.config.ts site-title 플러그인이 src/theme.ts의
// SITE_TITLE로 치환 — 사이트 이름의 단일 소스). 누군가 자리표시자를
// 리터럴로 되돌리면(조용한 드리프트 경로) 여기서 시끄럽게 실패한다.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// jsdom 환경에서 import.meta.url은 http 스킴이라 파일 경로로 못 쓴다 —
// Vitest는 프로젝트 루트를 cwd로 실행하므로 cwd 기준으로 읽는다.
const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')

describe('index.html site title', () => {
  it('uses the %SITE_TITLE% placeholder as its only <title>', () => {
    const titles = html.match(/<title>[\s\S]*?<\/title>/g) ?? []
    expect(titles).toEqual(['<title>%SITE_TITLE%</title>'])
  })
})
