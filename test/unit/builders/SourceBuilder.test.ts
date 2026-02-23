import { describe, it, expect } from 'vitest'
import { createSource } from '../../../src/builders'

describe('SourceBuilder', () => {
  it('should build an empty source', () => {
    const source = createSource().build()
    expect(source).toEqual({})
  })

  it('should build a source with URI', () => {
    const source = createSource()
      .uri('https://example.org/evidence.pdf')
      .build()

    expect(source.uri).toBe('https://example.org/evidence.pdf')
  })

  it('should build a source with all fields', () => {
    const now = new Date()
    const source = createSource()
      .uri('https://example.org/evidence.pdf')
      .digest('zQmHash123')
      .howKnown('WEB_DOCUMENT')
      .dateObserved(now)
      .author('did:plc:bob')
      .curator('did:plc:carol')
      .build()

    expect(source.uri).toBe('https://example.org/evidence.pdf')
    expect(source.digestMultibase).toBe('zQmHash123')
    expect(source.howKnown).toBe('WEB_DOCUMENT')
    expect(source.dateObserved).toBe(now.toISOString())
    expect(source.author).toBe('did:plc:bob')
    expect(source.curator).toBe('did:plc:carol')
  })

  it('should support method chaining', () => {
    const source = createSource()
      .uri('https://example.org')
      .howKnown('FIRST_HAND')
      .build()

    expect(source.uri).toBe('https://example.org')
    expect(source.howKnown).toBe('FIRST_HAND')
  })

  it('should handle string dates', () => {
    const isoDate = '2024-01-15T10:30:00Z'
    const source = createSource()
      .dateObserved(isoDate)
      .build()

    expect(source.dateObserved).toBe(isoDate)
  })

  it('should convert Date objects to ISO strings', () => {
    const now = new Date('2024-01-15T10:30:00Z')
    const source = createSource()
      .dateObserved(now)
      .build()

    expect(source.dateObserved).toBe('2024-01-15T10:30:00.000Z')
  })
})
