import { describe, expect, it } from 'vitest'
import { hashEmail, isValidEmail, normalizeEmail } from './email'

describe('email helpers', () => {
  it('normalizeEmail trims and lowercases', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com')
  })

  it('isValidEmail accepts well-formed addresses', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('  Anna.Kowalska@sklep.pl ')).toBe(true)
  })

  it('isValidEmail rejects malformed addresses', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('no-at-sign')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('a @b.co')).toBe(false)
  })

  it('hashEmail is a deterministic 64-char hex digest, case/space-insensitive', async () => {
    const a = await hashEmail('Test@Example.com ')
    const b = await hashEmail('test@example.com')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })
})
