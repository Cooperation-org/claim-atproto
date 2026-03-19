import { describe, it, expect } from 'vitest'
import { createClaim, createSource } from '../../../src/builders'

describe('ClaimBuilder', () => {
  it('should build a valid minimal claim (no claimUri — gets set on publish)', () => {
    const claim = createClaim()
      .subject('did:plc:alice')
      .type('skill')
      .build()

    expect(claim.subject).toBe('did:plc:alice')
    expect(claim.claimType).toBe('skill')
    expect(claim.claimUri).toBeUndefined()
    expect(claim.createdAt).toBeDefined()
  })

  it('should build a claim with explicit claimUri (originated elsewhere)', () => {
    const claim = createClaim()
      .claimUri('https://live.linkedtrust.us/api/claim/123')
      .subject('did:plc:alice')
      .type('skill')
      .build()

    expect(claim.claimUri).toBe('https://live.linkedtrust.us/api/claim/123')
  })

  it('should throw if subject is missing', () => {
    expect(() => {
      createClaim().type('skill').build()
    }).toThrow('Claim subject is required')
  })

  it('should throw if claimType is missing', () => {
    expect(() => {
      createClaim().subject('did:plc:alice').build()
    }).toThrow('Claim type is required')
  })

  it('should build a claim with all optional fields', () => {
    const now = new Date()
    const claim = createClaim()
      .claimUri('https://example.com/claims/2')
      .subject('did:plc:alice')
      .type('skill')
      .object('React')
      .statement('5 years of production experience')
      .createdAt(now)
      .effectiveDate(now)
      .confidence(0.9)
      .stars(5)
      .aspect('frontend')
      .respondAt('https://example.com/claims/2/responses')
      .build()

    expect(claim.object).toBe('React')
    expect(claim.statement).toBe('5 years of production experience')
    expect(claim.confidence).toBe(0.9)
    expect(claim.stars).toBe(5)
    expect(claim.aspect).toBe('frontend')
    expect(claim.respondAt).toBe('https://example.com/claims/2/responses')
  })

  it('should build a claim with source', () => {
    const claim = createClaim()
      .subject('https://example.org/project')
      .type('impact')
      .withSource(
        createSource()
          .uri('https://evidence.org/doc.pdf')
          .howKnown('WEB_DOCUMENT')
      )
      .build()

    expect(claim.source).toBeDefined()
    expect(claim.source?.uri).toBe('https://evidence.org/doc.pdf')
    expect(claim.source?.howKnown).toBe('WEB_DOCUMENT')
  })

  it('should validate confidence bounds', () => {
    expect(() => {
      createClaim().subject('did:plc:bob').type('endorsement').confidence(1.5)
    }).toThrow('Confidence must be between 0 and 1')

    expect(() => {
      createClaim().subject('did:plc:bob').type('endorsement').confidence(-0.1)
    }).toThrow('Confidence must be between 0 and 1')
  })

  it('should validate stars bounds', () => {
    expect(() => {
      createClaim().subject('https://restaurant.com').type('rating').stars(6)
    }).toThrow('Stars must be an integer between 1 and 5')

    expect(() => {
      createClaim().subject('https://restaurant.com').type('rating').stars(0)
    }).toThrow('Stars must be an integer between 1 and 5')

    expect(() => {
      createClaim().subject('https://restaurant.com').type('rating').stars(3.5)
    }).toThrow('Stars must be an integer between 1 and 5')
  })

  it('should validate statement length', () => {
    const longStatement = 'a'.repeat(10001)
    expect(() => {
      createClaim().subject('did:plc:alice').type('skill').statement(longStatement)
    }).toThrow('Statement cannot exceed 10000 characters')
  })

  it('should auto-generate createdAt if not provided', () => {
    const before = new Date()
    const claim = createClaim()
      .subject('did:plc:alice')
      .type('skill')
      .build()
    const after = new Date()

    const createdAt = new Date(claim.createdAt)
    expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('should support method chaining', () => {
    const claim = createClaim()
      .subject('did:plc:alice')
      .type('skill')
      .object('TypeScript')
      .statement('Expert level')
      .confidence(1.0)
      .build()

    expect(claim.subject).toBe('did:plc:alice')
    expect(claim.claimType).toBe('skill')
    expect(claim.object).toBe('TypeScript')
    expect(claim.statement).toBe('Expert level')
    expect(claim.confidence).toBe(1.0)
  })
})
