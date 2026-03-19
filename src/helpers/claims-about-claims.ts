import type { HowKnown } from '../types'
import { ClaimBuilder } from '../builders/ClaimBuilder'
import { createSource } from '../builders/SourceBuilder'

/**
 * Options for creating an endorsement claim
 */
export interface EndorsementOptions {
  /** Confidence level (0-1) */
  confidence?: number
  /** How the endorser knows this claim is true */
  howKnown?: HowKnown
}

/**
 * Create an endorsement of another claim.
 * Returns a ClaimBuilder that you can further customize before building.
 *
 * @param claimUri - AT-URI of the claim being endorsed
 * @param statement - Explanation of the endorsement
 * @param options - Optional confidence and howKnown settings
 * @returns ClaimBuilder instance
 *
 * @example
 * ```typescript
 * const endorsement = createEndorsement(
 *   'at://did:plc:alice/com.linkedclaims.claim/3kfxyz',
 *   'I can confirm Alice has these skills',
 *   { confidence: 1.0, howKnown: 'FIRST_HAND' }
 * ).build()
 *
 * await client.publish(endorsement)
 * ```
 */
export function createEndorsement(
  claimUri: string,
  statement: string,
  options?: EndorsementOptions
): ClaimBuilder {
  const builder = new ClaimBuilder()
    .subject(claimUri)
    .type('endorsement')
    .statement(statement)

  if (options?.confidence !== undefined) {
    builder.confidence(options.confidence)
  }

  if (options?.howKnown) {
    builder.withSource(
      createSource().howKnown(options.howKnown)
    )
  }

  return builder
}

/**
 * Options for creating a dispute claim
 */
export interface DisputeOptions {
  /** URI of supporting evidence */
  evidence?: string
  /** How the disputer knows the original claim is wrong */
  howKnown?: HowKnown
}

/**
 * Create a dispute of another claim.
 * Returns a ClaimBuilder that you can further customize before building.
 *
 * @param claimUri - AT-URI of the claim being disputed
 * @param statement - Explanation of why the claim is disputed
 * @param options - Optional evidence and howKnown settings
 * @returns ClaimBuilder instance
 *
 * @example
 * ```typescript
 * const dispute = createDispute(
 *   'at://did:plc:alice/com.linkedclaims.claim/3kfxyz',
 *   'The count was actually 200, not 500',
 *   {
 *     evidence: 'https://example.org/actual-count.pdf',
 *     howKnown: 'WEB_DOCUMENT'
 *   }
 * ).build()
 *
 * await client.publish(dispute)
 * ```
 */
export function createDispute(
  claimUri: string,
  statement: string,
  options?: DisputeOptions
): ClaimBuilder {
  const builder = new ClaimBuilder()
    .subject(claimUri)
    .type('dispute')
    .statement(statement)

  if (options?.evidence || options?.howKnown) {
    const source = createSource()
    if (options.evidence) {
      source.uri(options.evidence)
    }
    if (options.howKnown) {
      source.howKnown(options.howKnown)
    }
    builder.withSource(source)
  }

  return builder
}

/**
 * Create a superseding claim that replaces/updates an original claim.
 * Returns a ClaimBuilder that you can further customize before building.
 *
 * @param originalClaimUri - AT-URI of the claim being superseded
 * @param statement - Explanation of how this supersedes the original
 * @returns ClaimBuilder instance
 *
 * @example
 * ```typescript
 * const superseding = createSuperseding(
 *   'at://did:plc:alice/com.linkedclaims.claim/old123',
 *   'Updated skill level after additional 2 years of experience'
 * )
 *   .object('Senior React Developer')
 *   .build()
 *
 * await client.publish(superseding)
 * ```
 */
export function createSuperseding(
  originalClaimUri: string,
  statement?: string
): ClaimBuilder {
  return new ClaimBuilder()
    .subject(originalClaimUri)
    .type('supersedes')
    .statement(statement || `This claim supersedes ${originalClaimUri}`)
}

/**
 * Create a revocation claim for an existing claim.
 * Returns a ClaimBuilder that you can further customize before building.
 *
 * Note: This creates a revocation CLAIM. The original claim remains in the repo.
 * To delete the original record entirely, use ClaimClient.delete()
 *
 * @param claimUri - AT-URI of the claim being revoked
 * @param reason - Optional reason for revocation
 * @returns ClaimBuilder instance
 *
 * @example
 * ```typescript
 * const revocation = createRevocation(
 *   'at://did:plc:alice/com.linkedclaims.claim/xyz789',
 *   'Information was found to be inaccurate'
 * ).build()
 *
 * await client.publish(revocation)
 * ```
 */
export function createRevocation(
  claimUri: string,
  reason?: string
): ClaimBuilder {
  return new ClaimBuilder()
    .subject(claimUri)
    .type('revocation')
    .statement(reason || `Revoking claim ${claimUri}`)
}
