import { sha256 } from 'multiformats/hashes/sha2'
import { base58btc } from 'multiformats/bases/base58'

/**
 * Compute a multibase-encoded hash for content (digestMultibase).
 * Uses SHA-256 and base58btc encoding (results in 'zQm...' format).
 *
 * @param content - String content or Uint8Array to hash
 * @returns Multibase-encoded hash string (e.g., zQmHash...)
 *
 * @example
 * ```typescript
 * const hash = await computeDigestMultibase('Hello, world!')
 * // Returns: 'zQm...'
 *
 * const claim = createClaim()
 *   .subject('https://example.org/project')
 *   .type('impact')
 *   .withSource(
 *     createSource()
 *       .uri('https://evidence.org/doc.pdf')
 *       .digest(hash)
 *   )
 *   .build()
 * ```
 */
export async function computeDigestMultibase(
  content: string | Uint8Array
): Promise<string> {
  const bytes = typeof content === 'string'
    ? new TextEncoder().encode(content)
    : content

  const hash = await sha256.digest(bytes)
  return base58btc.encode(hash.bytes)
}

/**
 * Fetch content from a URI and compute its digestMultibase hash.
 * Works in both Node.js and browser environments.
 *
 * @param uri - The URI to fetch content from
 * @returns Multibase-encoded hash of the fetched content
 *
 * @example
 * ```typescript
 * const hash = await fetchAndHash('https://example.org/evidence.pdf')
 *
 * const claim = createClaim()
 *   .subject('https://example.org/project')
 *   .type('impact')
 *   .withSource(
 *     createSource()
 *       .uri('https://example.org/evidence.pdf')
 *       .digest(hash)
 *       .howKnown('WEB_DOCUMENT')
 *   )
 *   .build()
 * ```
 */
export async function fetchAndHash(uri: string): Promise<string> {
  const response = await fetch(uri)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${uri}: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  return computeDigestMultibase(bytes)
}
