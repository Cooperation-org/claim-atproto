import { describe, it, expect } from 'vitest'
import {
  createEndorsement,
  createDispute,
  createSuperseding,
  createRevocation,
} from '../../../src/helpers'

describe('claims-about-claims', () => {
  const claimUri = 'at://did:plc:alice/com.linkedclaims.claim/3kfxyz'

  describe('createEndorsement', () => {
    it('should create an endorsement claim', () => {
      const endorsement = createEndorsement(
        claimUri,
        'I can confirm this claim'
      ).build()

      expect(endorsement.subject).toBe(claimUri)
      expect(endorsement.claimType).toBe('endorsement')
      expect(endorsement.statement).toBe('I can confirm this claim')
    })

    it('should include confidence when provided', () => {
      const endorsement = createEndorsement(
        claimUri,
        'I can confirm this',
        { confidence: 0.9 }
      ).build()

      expect(endorsement.confidence).toBe(0.9)
    })

    it('should include source with howKnown when provided', () => {
      const endorsement = createEndorsement(
        claimUri,
        'I witnessed this',
        { howKnown: 'FIRST_HAND' }
      ).build()

      expect(endorsement.source?.howKnown).toBe('FIRST_HAND')
    })

    it('should be further customizable', () => {
      const endorsement = createEndorsement(
        claimUri,
        'Strong endorsement'
      )
        .object('verified')
        .build()

      expect(endorsement.object).toBe('verified')
    })
  })

  describe('createDispute', () => {
    it('should create a dispute claim', () => {
      const dispute = createDispute(
        claimUri,
        'This claim is incorrect'
      ).build()

      expect(dispute.subject).toBe(claimUri)
      expect(dispute.claimType).toBe('dispute')
      expect(dispute.statement).toBe('This claim is incorrect')
    })

    it('should include evidence when provided', () => {
      const dispute = createDispute(
        claimUri,
        'Incorrect data',
        { evidence: 'https://example.org/proof.pdf' }
      ).build()

      expect(dispute.source?.uri).toBe('https://example.org/proof.pdf')
    })

    it('should include howKnown when provided', () => {
      const dispute = createDispute(
        claimUri,
        'Wrong count',
        { howKnown: 'WEB_DOCUMENT' }
      ).build()

      expect(dispute.source?.howKnown).toBe('WEB_DOCUMENT')
    })
  })

  describe('createSuperseding', () => {
    it('should create a superseding claim', () => {
      const superseding = createSuperseding(
        claimUri,
        'Updated information'
      ).build()

      expect(superseding.subject).toBe(claimUri)
      expect(superseding.claimType).toBe('supersedes')
      expect(superseding.statement).toBe('Updated information')
    })

    it('should use default statement if not provided', () => {
      const superseding = createSuperseding(claimUri).build()

      expect(superseding.statement).toContain(claimUri)
      expect(superseding.statement).toContain('supersedes')
    })
  })

  describe('createRevocation', () => {
    it('should create a revocation claim', () => {
      const revocation = createRevocation(
        claimUri,
        'Claim was inaccurate'
      ).build()

      expect(revocation.subject).toBe(claimUri)
      expect(revocation.claimType).toBe('revocation')
      expect(revocation.statement).toBe('Claim was inaccurate')
    })

    it('should use default reason if not provided', () => {
      const revocation = createRevocation(claimUri).build()

      expect(revocation.statement).toContain(claimUri)
      expect(revocation.statement).toContain('Revoking')
    })
  })
})
