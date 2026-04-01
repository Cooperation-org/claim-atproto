# Changelog

## 0.2.1 (2026-04-01)

### Fixed

- **`confidence` field type** changed from `number` to `string` — ATProto's data model only supports integer numerics, so decimal confidence values (e.g. 0.8) must be encoded as strings

## 0.2.0 (2026-03-24)

### Breaking Changes

- **Lexicon renamed** from `community.claim` to `com.linkedclaims.claim` — reflects DNS ownership of `linkedclaims.com`

### Added

- **`evidence` array** on claims — distinct from `source`. Evidence holds supporting materials (URIs, digests, media types, descriptions) while source tracks provenance (how the signer knows the claim)
- **`claimUri` field** — persistent identity for a claim, used to reference it in endorsements, disputes, and revocations
- **`respondAt` field** — URI where endorsements/disputes for a claim should be directed

### Fixed

- Missing `return` in `ClaimClient.publishTo()` — method now correctly returns the `PublishedClaim`

## 0.1.0 (2026-02-23)

Initial release.

- Lexicon definition for ATProto claim records
- `ClaimBuilder`, `SourceBuilder`, `ProofBuilder` — fluent builder API
- `ClaimClient` — publish, get, list, delete claims via ATProto
- `mapDatabaseClaim()` — convert flat DB rows to ATProto records
- `createEndorsement()`, `createDispute()`, `createSuperseding()`, `createRevocation()` — claims-about-claims helpers
- `computeDigestMultibase()`, `fetchAndHash()` — content integrity hashing
- `validateClaim()`, `isValidClaim()` — lexicon-based validation
- Full TypeScript types
- 61 unit tests
