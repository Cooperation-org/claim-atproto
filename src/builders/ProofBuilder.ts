import type { EmbeddedProof } from '../types'

/**
 * Fluent builder for creating EmbeddedProof objects.
 * Used for claims signed by external methods (MetaMask, aca-py, etc.) before being published to ATProto.
 *
 * @example
 * ```typescript
 * const proof = createProof()
 *   .type('EthereumEip712Signature2021')
 *   .verificationMethod('did:pkh:eip155:1:0xABC...')
 *   .proofValue('0xSignature...')
 *   .created(new Date())
 *   .build()
 * ```
 */
export class ProofBuilder {
  private proof: Partial<EmbeddedProof> = {}

  /**
   * Set the signature suite type
   * @param type - e.g., 'EthereumEip712Signature2021', 'Ed25519Signature2020', 'JsonWebSignature2020'
   */
  type(type: string): this {
    this.proof.type = type
    return this
  }

  /**
   * Set the DID or key identifier of the actual claim signer
   * @param method - e.g., 'did:pkh:eip155:1:0xABC...', 'did:key:z6Mk...', 'did:web:example.com'
   */
  verificationMethod(method: string): this {
    this.proof.verificationMethod = method
    return this
  }

  /**
   * Set the signature value
   * @param value - The signature (format depends on type)
   */
  proofValue(value: string): this {
    this.proof.proofValue = value
    return this
  }

  /**
   * Set the purpose of the proof
   * @param purpose - Typically 'assertionMethod' for claims
   */
  proofPurpose(purpose: string): this {
    this.proof.proofPurpose = purpose
    return this
  }

  /**
   * Set when the signature was created
   * @param date - Date (will be converted to ISO string)
   */
  created(date: Date | string): this {
    this.proof.created = typeof date === 'string' ? date : date.toISOString()
    return this
  }

  /**
   * Build and return the EmbeddedProof object
   * @throws {Error} if required fields are missing
   */
  build(): EmbeddedProof {
    if (!this.proof.type) {
      throw new Error('EmbeddedProof.type is required')
    }
    if (!this.proof.verificationMethod) {
      throw new Error('EmbeddedProof.verificationMethod is required')
    }
    if (!this.proof.proofValue) {
      throw new Error('EmbeddedProof.proofValue is required')
    }
    if (!this.proof.created) {
      throw new Error('EmbeddedProof.created is required')
    }
    return this.proof as EmbeddedProof
  }
}

/**
 * Factory function to create a new ProofBuilder
 *
 * @example
 * ```typescript
 * const proof = createProof()
 *   .type('Ed25519Signature2020')
 *   .verificationMethod('did:key:z6Mk...')
 *   .proofValue('base64Signature...')
 *   .created(new Date())
 *   .build()
 * ```
 */
export function createProof(): ProofBuilder {
  return new ProofBuilder()
}
