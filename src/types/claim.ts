/**
 * How the signer knows this claim to be true
 */
export type HowKnown =
  | 'FIRST_HAND'
  | 'SECOND_HAND'
  | 'WEB_DOCUMENT'
  | 'VERIFIED_LOGIN'
  | 'SIGNED_DOCUMENT'
  | 'BLOCKCHAIN'
  | 'RESEARCH'
  | 'OPINION'
  | 'OTHER'

/**
 * Structured provenance/evidence for a claim.
 * Based on cooperation.org/credentials/v1 ClaimSource vocabulary.
 */
export interface ClaimSource {
  /** URI of the evidence (URL, IPFS CID, AT-URI, etc.) */
  uri?: string
  /** Multibase-encoded hash of the evidence content for integrity verification (e.g., zQm...) */
  digestMultibase?: string
  /** How the signer knows this claim to be true */
  howKnown?: HowKnown
  /** When the evidence was observed/collected */
  dateObserved?: string
  /** Original author of the evidence (if different from claim signer) */
  author?: string
  /** Entity that curated/surfaced this evidence */
  curator?: string
}

/**
 * A piece of supporting material for a claim.
 * Evidence is what backs up the claim; source is where the claim comes from.
 */
export interface EvidenceItem {
  /** URI of the evidence (HTTPS URL, IPFS CID, AT-URI, etc.) */
  uri?: string
  /** Multibase-encoded hash of the content for integrity verification */
  digestMultibase?: string
  /** MIME type (e.g., image/jpeg, video/mp4, application/pdf) */
  mediaType?: string
  /** What this evidence shows or contains */
  description?: string
}

/**
 * Cryptographic proof from external signing methods.
 * Allows claims signed via MetaMask, aca-py, Digital Bazaar, etc. to be published on ATProto
 * while preserving the original signer identity.
 */
export interface EmbeddedProof {
  /** Signature suite type (e.g., EthereumEip712Signature2021, Ed25519Signature2020, JsonWebSignature2020) */
  type: string
  /** DID or key identifier of the actual claim signer (e.g., did:pkh:eip155:1:0xABC..., did:key:z6Mk...) */
  verificationMethod: string
  /** The signature value (format depends on type) */
  proofValue: string
  /** Purpose of the proof (typically assertionMethod for claims) */
  proofPurpose?: string
  /** When the signature was created */
  created: string
}

/**
 * A LinkedClaim-style verifiable claim record.
 * Claims are immutable, signed assertions about any URI-addressable subject.
 * Per the DIF Labs LinkedClaims spec, each claim MUST have a persistent URI (claimUri).
 */
export interface Claim {
  /** Persistent URI identity of this claim per the DIF Labs LinkedClaims spec. How other claims reference this one. If not set before publishing, the AT-URI becomes the claimUri. */
  claimUri?: string
  /** The entity this claim is about. Can be any URI: https URL, DID, AT-URI (for claims-about-claims), IPFS CID, etc. */
  subject: string
  /** Category of claim: skill, credential, impact, endorsement, dispute, rating, review, membership, etc. */
  claimType: string
  /** Optional object of the claim (e.g., skill name, rating value, credential type) */
  object?: string
  /** Human-readable explanation of the claim (max 10000 characters) */
  statement?: string
  /** Where this claim comes from — a person, website, document */
  source?: ClaimSource
  /** Supporting materials — photos, videos, screenshots, documents */
  evidence?: EvidenceItem[]
  /** When this record was created */
  createdAt: string
  /** When the claim became/becomes true (may differ from createdAt) */
  effectiveDate?: string
  /** URI where endorsements, disputes, or other responses may be sent */
  respondAt?: string
  /** For claims signed by external methods (MetaMask, aca-py, etc.) before being published to ATProto */
  embeddedProof?: EmbeddedProof
  /** Signer's confidence in this claim (0-1) */
  confidence?: number
  /** Star rating (for rating-type claims, 1-5) */
  stars?: number
  /** The specific aspect being rated or assessed */
  aspect?: string
}

/**
 * A published claim with its AT-URI and CID
 */
export interface PublishedClaim extends Claim {
  /** The AT-URI of the published claim */
  uri: string
  /** The CID (content identifier) of the claim record */
  cid: string
}
