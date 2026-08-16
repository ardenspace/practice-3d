import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import App from './App.tsx'
import { SITE_TITLE } from './theme.ts'

it('renders the site title', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: SITE_TITLE })).toBeTruthy()
})
