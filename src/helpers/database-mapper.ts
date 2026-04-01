import type { Claim, HowKnown } from '../types'

/**
 * A flat database claim structure matching Prisma/SQL patterns.
 * This is the shape of a claim row as it typically comes from a database
 * (e.g., the LinkedTrust backend's Prisma schema).
 */
export interface DatabaseClaim {
  /** Database row ID */
  id?: number | string
  /** The entity this claim is about (URI) */
  subject: string
  /** Category of claim (mapped to claimType) */
  claim: string
  /** Optional object of the claim */
  object?: string | null
  /** Human-readable explanation */
  statement?: string | null
  /** URI of the evidence source */
  sourceURI?: string | null
  /** How the signer knows this claim to be true */
  howKnown?: HowKnown | string | null
  /** Multibase-encoded hash of evidence content */
  digestMultibase?: string | null
  /** When the evidence was observed */
  dateObserved?: Date | string | null
  /** Original author of the evidence */
  author?: string | null
  /** Entity that curated this evidence */
  curator?: string | null
  /** When the record was created */
  createdAt: Date | string
  /** When the claim became/becomes true */
  effectiveDate?: Date | string | null
  /** Signer's confidence (0-1) */
  confidence?: number | null
  /** Star rating (1-5) */
  stars?: number | null
  /** The specific aspect being rated */
  aspect?: string | null
  /** URI where responses may be sent */
  respondAt?: string | null
  /** Existing claim address (becomes claimUri) */
  claimAddress?: string | null
  /** JSON proof string or object from external signer */
  proof?: string | object | null
  /** DID or identifier of the issuer */
  issuerId?: string | null
  /** Type of the issuer ID (e.g., 'DID', 'URL') */
  issuerIdType?: string | null
  /** Score field — ignored in mapping (not part of ATProto record) */
  score?: number | null
}

/**
 * Options for mapping a database claim
 */
export interface MapDatabaseClaimOptions {
  /** Base URL for generating claimUri and respondAt when not already set.
   *  Defaults to 'https://live.linkedtrust.us' */
  baseUrl?: string
}

/**
 * Map a flat database claim row to an ATProto `com.linkedclaims.claim` record.
 *
 * Mirrors the backend's `mapClaimToRecord()` logic so that external developers
 * building on LinkedClaims with their own databases can produce valid ATProto records.
 *
 * @param dbClaim - The flat database claim row
 * @param options - Optional configuration (baseUrl for URI generation)
 * @returns A valid Claim object ready for publishing
 *
 * @example
 * ```typescript
 * import { mapDatabaseClaim, ClaimClient } from '@cooperation/claim-atproto'
 *
 * const dbRow = await prisma.claim.findFirst({ where: { id: 123 } })
 * const claim = mapDatabaseClaim(dbRow, { baseUrl: 'https://myapp.com' })
 * await client.publish(claim)
 * ```
 */
export function mapDatabaseClaim(dbClaim: DatabaseClaim, options?: MapDatabaseClaimOptions): Claim {
  const baseUrl = options?.baseUrl || 'https://live.linkedtrust.us'

  const createdAt = dbClaim.createdAt instanceof Date
    ? dbClaim.createdAt.toISOString()
    : dbClaim.createdAt

  // Build claimUri
  let claimUri: string | undefined
  if (dbClaim.claimAddress) {
    claimUri = dbClaim.claimAddress
  } else if (dbClaim.id !== undefined && dbClaim.id !== null) {
    claimUri = `${baseUrl}/api/claim/${dbClaim.id}`
  }

  const record: Claim = {
    subject: dbClaim.subject,
    claimType: dbClaim.claim,
    createdAt,
  }

  if (claimUri) record.claimUri = claimUri
  if (dbClaim.object) record.object = dbClaim.object
  if (dbClaim.statement) record.statement = dbClaim.statement
  if (dbClaim.confidence !== null && dbClaim.confidence !== undefined) record.confidence = dbClaim.confidence
  if (dbClaim.stars !== null && dbClaim.stars !== undefined) record.stars = dbClaim.stars
  if (dbClaim.aspect) record.aspect = dbClaim.aspect

  // Build respondAt
  if (dbClaim.respondAt) {
    record.respondAt = dbClaim.respondAt
  } else if (dbClaim.id !== undefined && dbClaim.id !== null) {
    record.respondAt = `${baseUrl}/api/claim/${dbClaim.id}/validate`
  }

  // effectiveDate
  if (dbClaim.effectiveDate) {
    record.effectiveDate = dbClaim.effectiveDate instanceof Date
      ? dbClaim.effectiveDate.toISOString()
      : dbClaim.effectiveDate
  }

  // Build source object if any source fields present
  const source: Record<string, any> = {}
  if (dbClaim.sourceURI) source.uri = dbClaim.sourceURI
  if (dbClaim.howKnown) source.howKnown = dbClaim.howKnown
  if (dbClaim.digestMultibase) source.digestMultibase = dbClaim.digestMultibase
  if (dbClaim.dateObserved) {
    source.dateObserved = dbClaim.dateObserved instanceof Date
      ? dbClaim.dateObserved.toISOString()
      : dbClaim.dateObserved
  }
  if (dbClaim.author) source.author = dbClaim.author
  if (dbClaim.curator) source.curator = dbClaim.curator
  if (Object.keys(source).length > 0) record.source = source

  // Build embeddedProof if claim has a JSON proof from external signer
  if (dbClaim.proof && dbClaim.issuerId && dbClaim.issuerIdType !== 'URL') {
    try {
      const proofData = typeof dbClaim.proof === 'string'
        ? JSON.parse(dbClaim.proof)
        : dbClaim.proof
      if (proofData.type && proofData.proofValue) {
        record.embeddedProof = {
          type: proofData.type,
          verificationMethod: proofData.verificationMethod || dbClaim.issuerId,
          proofValue: proofData.proofValue,
          proofPurpose: proofData.proofPurpose || 'assertionMethod',
          created: proofData.created || createdAt,
        }
      }
    } catch {
      // proof is not parseable JSON — skip embeddedProof
    }
  }

  return record
}
