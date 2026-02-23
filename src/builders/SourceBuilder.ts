import type { ClaimSource, HowKnown } from '../types'

/**
 * Fluent builder for creating ClaimSource objects.
 * Provides a chainable API for building structured evidence/provenance metadata.
 *
 * @example
 * ```typescript
 * const source = createSource()
 *   .uri('https://example.org/evidence.pdf')
 *   .digest('zQmHash...')
 *   .howKnown('WEB_DOCUMENT')
 *   .dateObserved(new Date())
 *   .build()
 * ```
 */
export class SourceBuilder {
  private source: ClaimSource = {}

  /**
   * Set the URI of the evidence
   * @param uri - Evidence URI (URL, IPFS CID, AT-URI, etc.)
   */
  uri(uri: string): this {
    this.source.uri = uri
    return this
  }

  /**
   * Set the multibase-encoded hash of the evidence content
   * @param digestMultibase - Multibase hash (e.g., zQm...)
   */
  digest(digestMultibase: string): this {
    this.source.digestMultibase = digestMultibase
    return this
  }

  /**
   * Set how the signer knows this claim to be true
   * @param how - How the claim is known
   */
  howKnown(how: HowKnown): this {
    this.source.howKnown = how
    return this
  }

  /**
   * Set when the evidence was observed/collected
   * @param date - Date (will be converted to ISO string)
   */
  dateObserved(date: Date | string): this {
    this.source.dateObserved = typeof date === 'string' ? date : date.toISOString()
    return this
  }

  /**
   * Set the original author of the evidence
   * @param author - Author URI (if different from claim signer)
   */
  author(author: string): this {
    this.source.author = author
    return this
  }

  /**
   * Set the entity that curated/surfaced this evidence
   * @param curator - Curator URI
   */
  curator(curator: string): this {
    this.source.curator = curator
    return this
  }

  /**
   * Build and return the ClaimSource object
   */
  build(): ClaimSource {
    return this.source
  }
}

/**
 * Factory function to create a new SourceBuilder
 *
 * @example
 * ```typescript
 * const source = createSource()
 *   .uri('https://evidence.example.org')
 *   .howKnown('FIRST_HAND')
 *   .build()
 * ```
 */
export function createSource(): SourceBuilder {
  return new SourceBuilder()
}
