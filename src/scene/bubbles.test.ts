import { describe, expect, it } from 'vitest'
import type { WorkEntry } from '../works/registry.ts'
import { works } from '../works/registry.ts'
import { deriveWorkBubbles } from './bubbles.ts'

// Fixture entry: pins the derivation contract independently of the
// (eventually growing) real registry.
const fixtureEntry: WorkEntry = {
  slug: 'fixture-work',
  title: 'Fixture Work',
  blurb: 'fixture entry for derivation tests',
  object: { type: 'image', src: '/works/fixture-work/object.webp' },
  Page: () => null,
}

describe('B1: work-bubble derivation (scene guarantee)', () => {
  it('derives exactly one bubble per entry, carrying that entry', () => {
    const bubbles = deriveWorkBubbles([fixtureEntry])
    expect(bubbles.length).toBe(1)
    expect(bubbles[0].entry.slug).toBe('fixture-work')
  })

  it('derived list length always equals registry length', () => {
    const bubbles = deriveWorkBubbles(works)
    expect(bubbles.length).toBe(works.length)
    // Every registry entry appears exactly once, in registry order.
    expect(bubbles.map((b) => b.entry.slug)).toEqual(works.map((w) => w.slug))
  })
})
