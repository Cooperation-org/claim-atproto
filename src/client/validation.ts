import { Lexicons } from '@atproto/lexicon'
import type { Claim } from '../types'
import lexiconJson from '../lexicons/com-linkedclaims-claim.json'

// Create lexicon validator instance
const lexicons = new Lexicons([lexiconJson as any])

/**
 * Validate a claim against the com.linkedclaims.claim lexicon schema
 * @param claim - The claim to validate
 * @throws {Error} if validation fails with details about what's wrong
 */
export function validateClaim(claim: Claim): void {
  try {
    lexicons.assertValidRecord('com.linkedclaims.claim', claim)
  } catch (error: any) {
    throw new Error(`Claim validation failed: ${error.message}`)
  }
}

/**
 * Check if a claim is valid (non-throwing version)
 * @param claim - The claim to check
 * @returns true if valid, false otherwise
 */
export function isValidClaim(claim: Claim): boolean {
  try {
    validateClaim(claim)
    return true
  } catch {
    return false
  }
}
