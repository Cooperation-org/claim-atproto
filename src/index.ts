// Type exports
export type {
  Claim,
  ClaimSource,
  EmbeddedProof,
  PublishedClaim,
  HowKnown,
} from './types'

// Builder exports
export {
  ClaimBuilder,
  createClaim,
  SourceBuilder,
  createSource,
  ProofBuilder,
  createProof,
} from './builders'

// Client exports
export {
  ClaimClient,
  validateClaim,
  isValidClaim,
} from './client'
export type { ClaimClientConfig, ListClaimsOptions, ListClaimsResult } from './client'

// Helper exports
export {
  computeDigestMultibase,
  fetchAndHash,
  createEndorsement,
  createDispute,
  createSuperseding,
  createRevocation,
  mapDatabaseClaim,
} from './helpers'
export type { EndorsementOptions, DisputeOptions, DatabaseClaim, MapDatabaseClaimOptions } from './helpers'
