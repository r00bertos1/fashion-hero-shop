import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRICE,
  PRICE_VARIANTS,
  formatPriceLabel,
  isValidVariant,
  parseVariant,
  priceFromFlag,
} from './pricing'

describe('pricing helpers', () => {
  it('default price is 149 and is a valid variant', () => {
    expect(DEFAULT_PRICE).toBe(149)
    expect(PRICE_VARIANTS).toEqual([99, 149, 199])
    expect(isValidVariant(149)).toBe(true)
  })

  it('isValidVariant rejects non-variants', () => {
    expect(isValidVariant(49)).toBe(false)
    expect(isValidVariant('149')).toBe(false)
    expect(isValidVariant(null)).toBe(false)
  })

  it('parseVariant accepts valid query strings only', () => {
    expect(parseVariant('99')).toBe(99)
    expect(parseVariant('149')).toBe(149)
    expect(parseVariant('199')).toBe(199)
    expect(parseVariant('49')).toBeNull()
    expect(parseVariant('abc')).toBeNull()
    expect(parseVariant(null)).toBeNull()
    expect(parseVariant(undefined)).toBeNull()
  })

  it('priceFromFlag maps known variant keys', () => {
    expect(priceFromFlag('price-99')).toBe(99)
    expect(priceFromFlag('price-149')).toBe(149)
    expect(priceFromFlag('price-199')).toBe(199)
    expect(priceFromFlag('control')).toBeNull()
    expect(priceFromFlag(false)).toBeNull()
    expect(priceFromFlag(undefined)).toBeNull()
  })

  it('formatPriceLabel renders the PLN/mies label', () => {
    expect(formatPriceLabel(149)).toBe('149 PLN / mies')
  })
})
