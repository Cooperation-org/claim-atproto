import { describe, it, expect } from 'vitest'
import { mapDatabaseClaim } from '../../../src/helpers/database-mapper'
import type { DatabaseClaim } from '../../../src/helpers/database-mapper'

function minimalDbClaim(overrides: Partial<DatabaseClaim> = {}): DatabaseClaim {
  return {
    subject: 'did:plc:alice',
    claim: 'skill',
    createdAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  }
}

describe('mapDatabaseClaim', () => {
  it('should map required fields correctly', () => {
    const result = mapDatabaseClaim(minimalDbClaim())

    expect(result.subject).toBe('did:plc:alice')
    expect(result.claimType).toBe('skill')
    expect(result.createdAt).toBe('2025-01-15T00:00:00.000Z')
  })

  it('should map "claim" field to "claimType"', () => {
    const result = mapDatabaseClaim(minimalDbClaim({ claim: 'endorsement' }))
    expect(result.claimType).toBe('endorsement')
  })

  it('should map optional scalar fields', () => {
    const result = mapDatabaseClaim(minimalDbClaim({
      object: 'React',
      statement: 'Expert developer',
      confidence: 0.9,
      stars: 4,
      aspect: 'frontend',
    }))

    expect(result.object).toBe('React')
    expect(result.statement).toBe('Expert developer')
    expect(result.confidence).toBe(0.9)
    expect(result.stars).toBe(4)
    expect(result.aspect).toBe('frontend')
  })

  it('should build source object from flat sourceURI field', () => {
    const result = mapDatabaseClaim(minimalDbClaim({
      sourceURI: 'https://evidence.org/doc.pdf',
    }))

    expect(result.source).toBeDefined()
    expect(result.source?.uri).toBe('https://evidence.org/doc.pdf')
  })

  it('should nest all source fields into source object', () => {
    const result = mapDatabaseClaim(minimalDbClaim({
      sourceURI: 'https://evidence.org/doc.pdf',
      howKnown: 'WEB_DOCUMENT',
      digestMultibase: 'zQm123',
      dateObserved: '2025-01-10T00:00:00.000Z',
      author: 'Bob',
      curator: 'Carol',
    }))

    expect(result.source).toEqual({
      uri: 'https://evidence.org/doc.pdf',
      howKnown: 'WEB_DOCUMENT',
      digestMultibase: 'zQm123',
      dateObserved: '2025-01-10T00:00:00.000Z',
      author: 'Bob',
      curator: 'Carol',
    })
  })

  it('should not include source if no source fields are set', () => {
    const result = mapDatabaseClaim(minimalDbClaim())
    expect(result.source).toBeUndefined()
  })

  it('should convert Date objects to ISO strings for createdAt', () => {
    const date = new Date('2025-06-15T12:30:00.000Z')
    const result = mapDatabaseClaim(minimalDbClaim({ createdAt: date }))
    expect(result.createdAt).toBe('2025-06-15T12:30:00.000Z')
  })

  it('should convert Date objects to ISO strings for effectiveDate', () => {
    const date = new Date('2025-03-01T00:00:00.000Z')
    const result = mapDatabaseClaim(minimalDbClaim({ effectiveDate: date }))
    expect(result.effectiveDate).toBe('2025-03-01T00:00:00.000Z')
  })

  it('should convert Date objects to ISO strings for dateObserved in source', () => {
    const date = new Date('2025-02-20T10:00:00.000Z')
    const result = mapDatabaseClaim(minimalDbClaim({
      sourceURI: 'https://example.com',
      dateObserved: date,
    }))
    expect(result.source?.dateObserved).toBe('2025-02-20T10:00:00.000Z')
  })

  it('should parse JSON proof string and build embeddedProof', () => {
    const proof = JSON.stringify({
      type: 'EthereumEip712Signature2021',
      verificationMethod: 'did:pkh:eip155:1:0xABC',
      proofValue: 'sig123',
      proofPurpose: 'assertionMethod',
      created: '2025-01-15T00:00:00.000Z',
    })

    const result = mapDatabaseClaim(minimalDbClaim({
      proof,
      issuerId: 'did:pkh:eip155:1:0xABC',
      issuerIdType: 'DID',
    }))

    expect(result.embeddedProof).toEqual({
      type: 'EthereumEip712Signature2021',
      verificationMethod: 'did:pkh:eip155:1:0xABC',
      proofValue: 'sig123',
      proofPurpose: 'assertionMethod',
      created: '2025-01-15T00:00:00.000Z',
    })
  })

  it('should accept proof as an object (not just string)', () => {
    const proof = {
      type: 'Ed25519Signature2020',
      proofValue: 'sig456',
    }

    const result = mapDatabaseClaim(minimalDbClaim({
      proof,
      issuerId: 'did:key:z6Mk123',
      issuerIdType: 'DID',
    }))

    expect(result.embeddedProof).toBeDefined()
    expect(result.embeddedProof?.type).toBe('Ed25519Signature2020')
    expect(result.embeddedProof?.verificationMethod).toBe('did:key:z6Mk123')
  })

  it('should skip embeddedProof when issuerIdType is URL', () => {
    const proof = JSON.stringify({
      type: 'EthereumEip712Signature2021',
      proofValue: 'sig123',
    })

    const result = mapDatabaseClaim(minimalDbClaim({
      proof,
      issuerId: 'https://example.com/issuer',
      issuerIdType: 'URL',
    }))

    expect(result.embeddedProof).toBeUndefined()
  })

  it('should skip embeddedProof when proof is invalid JSON', () => {
    const result = mapDatabaseClaim(minimalDbClaim({
      proof: 'not-valid-json',
      issuerId: 'did:pkh:eip155:1:0xABC',
      issuerIdType: 'DID',
    }))

    expect(result.embeddedProof).toBeUndefined()
  })

  it('should skip embeddedProof when proof lacks type or proofValue', () => {
    const proof = JSON.stringify({ type: 'SomeType' }) // missing proofValue

    const result = mapDatabaseClaim(minimalDbClaim({
      proof,
      issuerId: 'did:pkh:eip155:1:0xABC',
      issuerIdType: 'DID',
    }))

    expect(result.embeddedProof).toBeUndefined()
  })

  it('should generate claimUri from baseUrl and id', () => {
    const result = mapDatabaseClaim(
      minimalDbClaim({ id: 42 }),
      { baseUrl: 'https://myapp.com' }
    )
    expect(result.claimUri).toBe('https://myapp.com/api/claim/42')
  })

  it('should use claimAddress as claimUri when present', () => {
    const result = mapDatabaseClaim(minimalDbClaim({
      id: 42,
      claimAddress: 'at://did:plc:xyz/com.linkedclaims.claim/tid1',
    }))
    expect(result.claimUri).toBe('at://did:plc:xyz/com.linkedclaims.claim/tid1')
  })

  it('should generate respondAt from baseUrl and id', () => {
    const result = mapDatabaseClaim(
      minimalDbClaim({ id: 99 }),
      { baseUrl: 'https://myapp.com' }
    )
    expect(result.respondAt).toBe('https://myapp.com/api/claim/99/validate')
  })

  it('should use explicit respondAt when present', () => {
    const result = mapDatabaseClaim(minimalDbClaim({
      id: 99,
      respondAt: 'https://custom.com/respond',
    }))
    expect(result.respondAt).toBe('https://custom.com/respond')
  })

  it('should use default baseUrl when not specified', () => {
    const result = mapDatabaseClaim(minimalDbClaim({ id: 1 }))
    expect(result.claimUri).toBe('https://live.linkedtrust.us/api/claim/1')
    expect(result.respondAt).toBe('https://live.linkedtrust.us/api/claim/1/validate')
  })

  it('should ignore null optional fields', () => {
    const result = mapDatabaseClaim(minimalDbClaim({
      object: null,
      statement: null,
      confidence: null,
      stars: null,
      aspect: null,
      effectiveDate: null,
      sourceURI: null,
      howKnown: null,
    }))

    expect(result.object).toBeUndefined()
    expect(result.statement).toBeUndefined()
    expect(result.confidence).toBeUndefined()
    expect(result.stars).toBeUndefined()
    expect(result.aspect).toBeUndefined()
    expect(result.effectiveDate).toBeUndefined()
    expect(result.source).toBeUndefined()
  })

  it('should ignore score field (not part of ATProto record)', () => {
    const result = mapDatabaseClaim(minimalDbClaim({ score: 42 }))
    expect((result as any).score).toBeUndefined()
  })

  it('should accept howKnown values not in the HowKnown union (Prisma extras)', () => {
    const result = mapDatabaseClaim(minimalDbClaim({
      howKnown: 'CUSTOM_VALUE',
    }))
    expect(result.source?.howKnown).toBe('CUSTOM_VALUE')
  })
})
