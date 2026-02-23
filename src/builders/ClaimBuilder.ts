import type { Claim, ClaimSource, EmbeddedProof } from '../types'
import { SourceBuilder } from './SourceBuilder'
import { ProofBuilder } from './ProofBuilder'

/**
 * Fluent builder for creating Claim objects.
 * Provides a chainable API with validation for building verifiable claims.
 *
 * @example
 * ```typescript
 * const claim = createClaim()
 *   .subject('did:plc:alice')
 *   .type('skill')
 *   .object('React')
 *   .statement('5 years of production experience')
 *   .confidence(0.9)
 *   .build()
 * ```
 */
export class ClaimBuilder {
  private claim: Partial<Claim> = {}

  /**
   * Set the subject of the claim (required)
   * @param subject - URI of what this claim is about (DID, URL, AT-URI, IPFS CID, etc.)
   */
  subject(subject: string): this {
    this.claim.subject = subject
    return this
  }

  /**
   * Set the claim type (required)
   * @param claimType - Category: skill, credential, impact, endorsement, dispute, rating, review, etc.
   */
  type(claimType: string): this {
    this.claim.claimType = claimType
    return this
  }

  /**
   * Set the object of the claim
   * @param object - e.g., skill name, credential type, rating value
   */
  object(object: string): this {
    this.claim.object = object
    return this
  }

  /**
   * Set the statement (human-readable explanation)
   * @param statement - Explanation of the claim (max 10000 characters)
   */
  statement(statement: string): this {
    if (statement.length > 10000) {
      throw new Error('Statement cannot exceed 10000 characters')
    }
    this.claim.statement = statement
    return this
  }

  /**
   * Add provenance/evidence using a SourceBuilder or ClaimSource object
   * @param builder - SourceBuilder instance or ClaimSource object
   */
  withSource(builder: SourceBuilder | ClaimSource): this {
    this.claim.source = builder instanceof SourceBuilder ? builder.build() : builder
    return this
  }

  /**
   * Set the createdAt timestamp (defaults to current time if not set)
   * @param date - Date (will be converted to ISO string)
   */
  createdAt(date: Date | string): this {
    this.claim.createdAt = typeof date === 'string' ? date : date.toISOString()
    return this
  }

  /**
   * Set the effective date (when the claim became/becomes true)
   * @param date - Date (will be converted to ISO string)
   */
  effectiveDate(date: Date | string): this {
    this.claim.effectiveDate = typeof date === 'string' ? date : date.toISOString()
    return this
  }

  /**
   * Add an external proof (for claims signed outside ATProto)
   * @param builder - ProofBuilder instance or EmbeddedProof object
   */
  withProof(builder: ProofBuilder | EmbeddedProof): this {
    this.claim.embeddedProof = builder instanceof ProofBuilder ? builder.build() : builder
    return this
  }

  /**
   * Set confidence level (0-1)
   * @param confidence - Signer's confidence (must be between 0 and 1)
   */
  confidence(confidence: number): this {
    if (confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be between 0 and 1')
    }
    this.claim.confidence = confidence
    return this
  }

  /**
   * Set star rating (1-5)
   * @param stars - Star rating (must be an integer between 1 and 5)
   */
  stars(stars: number): this {
    if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
      throw new Error('Stars must be an integer between 1 and 5')
    }
    this.claim.stars = stars
    return this
  }

  /**
   * Build and validate the claim
   * @returns The constructed Claim object
   * @throws {Error} if required fields are missing
   */
  build(): Claim {
    if (!this.claim.subject) {
      throw new Error('Claim subject is required. The subject field identifies what this claim is about.')
    }
    if (!this.claim.claimType) {
      throw new Error('Claim type is required. The claimType categorizes the claim (e.g., skill, credential, endorsement).')
    }

    // Auto-set createdAt if not provided
    if (!this.claim.createdAt) {
      this.claim.createdAt = new Date().toISOString()
    }

    return this.claim as Claim
  }
}

/**
 * Factory function to create a new ClaimBuilder
 *
 * @example
 * ```typescript
 * const claim = createClaim()
 *   .subject('did:plc:alice')
 *   .type('endorsement')
 *   .statement('Excellent collaborator')
 *   .confidence(1.0)
 *   .build()
 * ```
 */
export function createClaim(): ClaimBuilder {
  return new ClaimBuilder()
}
