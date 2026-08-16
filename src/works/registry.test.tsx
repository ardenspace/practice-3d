import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { works } from './registry.ts'

afterEach(cleanup)

const SLUG_RE = /^[a-z0-9-]+$/

describe('B1: work registry contract', () => {
  it('has at least one registered work (v1: vending-machine)', () => {
    expect(works.length).toBeGreaterThanOrEqual(1)
    expect(works.map((w) => w.slug)).toContain('vending-machine')
  })

  it('slugs match [a-z0-9-]+ and are unique', () => {
    expect(works.length).toBeGreaterThan(0)
    for (const w of works) {
      expect(w.slug, `slug ${JSON.stringify(w.slug)}`).toMatch(SLUG_RE)
    }
    const slugs = works.map((w) => w.slug)
    expect(new Set(slugs).size, 'duplicate slugs').toBe(slugs.length)
  })

  it('object.src is a safe site-relative path under /works/<slug>/', () => {
    expect(works.length).toBeGreaterThan(0)
    for (const w of works) {
      const { src } = w.object
      // Site-relative, scoped to the entry's own asset folder.
      expect(
        src.startsWith(`/works/${w.slug}/`),
        `${w.slug}: src must start with /works/${w.slug}/ (got ${src})`,
      ).toBe(true)
      // No scheme/host (external URLs forbidden).
      expect(src.includes('://'), `${w.slug}: no scheme/host in src`).toBe(false)
      // No query or fragment.
      expect(src, `${w.slug}: no ? or # in src`).not.toMatch(/[?#]/)
      // No empty, `.` or `..` path segments.
      for (const segment of src.split('/').slice(1)) {
        expect(segment, `${w.slug}: empty path segment in src`).not.toBe('')
        expect(segment, `${w.slug}: '.' segment in src`).not.toBe('.')
        expect(segment, `${w.slug}: '..' segment in src`).not.toBe('..')
      }
    }
  })

  it('every Page renders a link back to home (/)', () => {
    expect(works.length).toBeGreaterThan(0)
    for (const w of works) {
      const { container, unmount } = render(
        <MemoryRouter>
          <w.Page />
        </MemoryRouter>,
      )
      expect(
        container.querySelector('a[href="/"]'),
        `Page for ${w.slug} must link to /`,
      ).toBeTruthy()
      unmount()
    }
  })
})
