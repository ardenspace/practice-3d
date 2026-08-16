// @vitest-environment node
// B2 is a file-existence contract (not an HTTP 200 from a SPA fallback),
// so this file runs in the node environment and checks the filesystem.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { works } from './registry.ts'

// `public/` is served at the site root in dev and copied verbatim into the
// build output — mapping rule: strip the leading `/` and resolve there.
const publicDir = fileURLToPath(new URL('../../public/', import.meta.url))

describe('B2: asset files exist under public/', () => {
  it('backdrop image exists at public/backdrop.webp', () => {
    expect(existsSync(join(publicDir, 'backdrop.webp'))).toBe(true)
  })

  it('every registered object.src resolves to a real file', () => {
    expect(works.length).toBeGreaterThan(0)
    for (const w of works) {
      const relative = w.object.src.replace(/^\//, '')
      expect(
        existsSync(join(publicDir, relative)),
        `${w.slug}: missing public/${relative}`,
      ).toBe(true)
    }
  })
})
