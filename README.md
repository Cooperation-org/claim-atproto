# @cooperation/claim-atproto

> TypeScript library for creating and publishing linked claims on ATProto (Bluesky)

Also published as `@linked-claims/claim-atproto`.

A composable, type-safe library for working with verifiable claims on the AT Protocol. Implements the [LinkedClaims](https://identity.foundation/labs-linkedclaims/) specification from the Decentralized Identity Foundation (DIF).

**Start here:** [LinkedClaims repo](https://github.com/Cooperation-org/LinkedClaims) — spec, docs, field reference, and the core SDK (`@cooperation/linkedclaims`).
**Field Reference:** [docs/field-reference.md](https://github.com/Cooperation-org/LinkedClaims/blob/main/docs/field-reference.md) — the canonical contract for all claim fields.

## Features

- ✅ **Fluent Builder API** - Chainable, type-safe claim construction
- ✅ **ATProto Native** - Seamless integration with Bluesky/ATProto
- ✅ **Claims-about-Claims** - Built-in support for endorsements, disputes, revocations
- ✅ **Content Hashing** - Compute integrity hashes for evidence
- ✅ **Schema Validation** - Automatic validation against the `com.linkedclaims.claim` lexicon
- ✅ **Universal** - Works in Node.js and browser environments
- ✅ **TypeScript** - Full type safety with excellent IDE support

## Installation

```bash
npm install @cooperation/claim-atproto
```

**Requirements:**
- Node.js 18+ or modern browser
- `@atproto/api` (peer dependency)

## Quick Start

```typescript
import { AtpAgent } from '@atproto/api'
import { ClaimClient, createClaim } from '@cooperation/claim-atproto'

// Authenticate with Bluesky
const agent = new AtpAgent({ service: 'https://bsky.social' })
await agent.login({
  identifier: 'alice.bsky.social',
  password: 'app-password', // Use an app password, not your main password
})

// Create a claim client
const client = new ClaimClient({ agent })

// Build and publish a claim
const claim = createClaim()
  .subject('did:plc:alice')
  .type('skill')
  .object('React')
  .statement('5 years of production experience')
  .confidence(0.9)
  .build()

const published = await client.publish(claim)
console.log(`Published at: ${published.uri}`)
```

## Core Concepts

### Claims

A **claim** is an immutable, signed assertion about any URI-addressable subject:

```typescript
const claim = createClaim()
  .subject('did:plc:alice')           // Who/what the claim is about
  .type('skill')                      // Category of claim
  .object('TypeScript')               // Optional: specific object
  .statement('Expert level')          // Human-readable explanation
  .confidence(1.0)                    // Optional: confidence (0-1)
  .build()
```

### Claims-about-Claims

Endorsements, disputes, and other meta-claims reference another claim's AT-URI:

```typescript
import { createEndorsement } from '@cooperation/claim-atproto'

// Endorse another claim
const endorsement = createEndorsement(
  'at://did:plc:alice/com.linkedclaims.claim/xyz123',
  'I can confirm Alice has these skills',
  { confidence: 1.0, howKnown: 'FIRST_HAND' }
).build()

await client.publish(endorsement)
```

### Evidence & Provenance

Add structured evidence with content hashing:

```typescript
import { createSource, computeDigestMultibase } from '@cooperation/claim-atproto'

const evidenceHash = await computeDigestMultibase('Evidence content...')

const claim = createClaim()
  .subject('https://ngo.org/project')
  .type('impact')
  .statement('Delivered 500 water filters')
  .withSource(
    createSource()
      .uri('https://evidence.org/report.pdf')
      .digest(evidenceHash)
      .howKnown('WEB_DOCUMENT')
  )
  .build()
```

## API Overview

### Builders

- **`createClaim()`** - Build a claim with fluent API
- **`createSource()`** - Build evidence/provenance metadata
- **`createProof()`** - Build external proof (for future external signing support)

### Client

- **`ClaimClient`** - Publish and manage claims on ATProto
  - `.publish(claim)` - Publish to your repository
  - `.publishTo(did, claim)` - Publish to another repository
  - `.get(uri)` - Fetch a claim by AT-URI
  - `.delete(uri)` - Delete a claim

### Helpers

- **`createEndorsement(uri, statement, options)`** - Create an endorsement
- **`createDispute(uri, statement, options)`** - Create a dispute
- **`createSuperseding(uri, statement)`** - Create an update/replacement
- **`createRevocation(uri, reason)`** - Create a revocation
- **`computeDigestMultibase(content)`** - Hash content for integrity
- **`fetchAndHash(uri)`** - Fetch and hash remote content

### Validation

- **`validateClaim(claim)`** - Validate against lexicon (throws on error)
- **`isValidClaim(claim)`** - Check validity (returns boolean)

## Examples

### Basic Skill Claim

```typescript
const claim = createClaim()
  .subject('did:plc:alice')
  .type('skill')
  .object('React')
  .statement('3 years production experience')
  .build()

const published = await client.publish(claim)
```

### Impact Claim with Evidence

```typescript
const claim = createClaim()
  .subject('https://example.org/ngo/project-123')
  .type('impact')
  .statement('Distributed 500 water filters in Kibera')
  .withSource(
    createSource()
      .uri('ipfs://bafybei...')
      .howKnown('FIRST_HAND')
      .dateObserved(new Date('2024-12-15'))
  )
  .effectiveDate(new Date('2024-12-15'))
  .build()

await client.publish(claim)
```

### Endorsement

```typescript
import { createEndorsement } from '@cooperation/claim-atproto'

const endorsement = createEndorsement(
  'at://did:plc:bob/com.linkedclaims.claim/abc123',
  'I worked with Bob for 2 years and can confirm his skills',
  { confidence: 1.0, howKnown: 'FIRST_HAND' }
).build()

await client.publish(endorsement)
```

### Dispute

```typescript
import { createDispute } from '@cooperation/claim-atproto'

const dispute = createDispute(
  'at://did:plc:alice/com.linkedclaims.claim/xyz789',
  'The actual count was 200, not 500',
  {
    evidence: 'https://evidence.org/actual-count.pdf',
    howKnown: 'WEB_DOCUMENT'
  }
).build()

await client.publish(dispute)
```

### Rating

```typescript
const rating = createClaim()
  .subject('https://restaurant.example.com')
  .type('rating')
  .object('food-quality')
  .stars(4)
  .statement('Excellent pasta, slightly slow service')
  .build()

await client.publish(rating)
```

## TypeScript Types

Full TypeScript support with exported types:

```typescript
import type {
  Claim,
  ClaimSource,
  EmbeddedProof,
  PublishedClaim,
  HowKnown,
  ClaimClientConfig,
} from '@cooperation/claim-atproto'
```

## Claim Types

The `claimType` field is an open string. Common values include:

- **`skill`** - Professional skills
- **`credential`** - Certifications, degrees
- **`impact`** - NGO/charity impact claims
- **`endorsement`** - Endorsement of another claim
- **`dispute`** - Dispute of another claim
- **`rating`** - Star ratings (use `stars` field)
- **`review`** - Reviews with text
- **`membership`** - Organization membership
- **`supersedes`** - Claim that replaces another
- **`revocation`** - Claim revocation

You can use any string value that fits your use case.

## Claim Signing

All claims published to ATProto are automatically signed by the repository's signing key. This happens transparently when you call `client.publish()`.

**Who signed a claim?**
- If published to user's own repo → signer is the user's DID
- If published to server's repo → signer is the server's DID

For external signing (MetaMask, DIDs, etc.), see the `embeddedProof` field in the types. External signing support may be added in future versions.

## Validation

Claims are automatically validated against the `com.linkedclaims.claim` lexicon before publishing:

```typescript
import { validateClaim, isValidClaim } from '@cooperation/claim-atproto'

// Throws error if invalid
validateClaim(claim)

// Returns boolean
if (isValidClaim(claim)) {
  await client.publish(claim)
}

// Disable validation for testing
const client = new ClaimClient({ agent, validate: false })
```

## Browser Usage

The library works in browsers too:

```html
<script type="module">
  import { createClaim } from 'https://esm.sh/@cooperation/claim-atproto'

  const claim = createClaim()
    .subject('did:plc:alice')
    .type('endorsement')
    .build()
</script>
```

Or with a bundler (Vite, Webpack, etc.):

```typescript
import { ClaimClient, createClaim } from '@cooperation/claim-atproto'
// ... use normally
```

## More Examples

See the [`examples/`](./examples/) directory for complete working examples:

- **[basic-claim.ts](./examples/node/basic-claim.ts)** - Simple skill claim
- **[endorsement.ts](./examples/node/endorsement.ts)** - Endorsing another claim
- **[with-evidence.ts](./examples/node/with-evidence.ts)** - Claim with evidence and content hash

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Type check
npm run type-check

# Run examples
npx tsx examples/node/basic-claim.ts
```

## Lexicon: `com.linkedclaims.claim`

The lexicon definition is at `src/lexicons/com-linkedclaims-claim.json`. Key fields:

- **`subject`** (required) — URI the claim is about. Any URI: HTTPS, DID, AT-URI, IPFS CID
- **`claimType`** (required) — category: skill, credential, impact, endorsement, dispute, rating, etc.
- **`claimUri`** — persistent identity of this claim. Other claims reference it as their subject
- **`statement`** — human-readable explanation
- **`source`** — where the claim info comes from (uri, howKnown, digestMultibase, dateObserved, author, curator)
- **`evidence[]`** — supporting materials: photos, videos, documents (uri, digestMultibase, mediaType, description)
- **`confidence`** — signer's confidence (0-1)
- **`stars`** — star rating (1-5)
- **`respondAt`** — URI for sending endorsements/disputes
- **`embeddedProof`** — for claims signed externally (MetaMask, etc.) before publishing to ATProto

### Namespace Ownership

`com.linkedclaims.claim` maps to `linkedclaims.com`. DNS verification via TXT record on `_atproto.linkedclaims.com`.

### Architecture

ATProto is one publication channel — not the canonical home. Claims are signed assertions that can exist in multiple systems. The LinkedTrust backend (`trust_claim_backend`) acts as an **AppView**: it subscribes to the ATProto firehose via Jetstream, indexes `com.linkedclaims.claim` records from ALL publishers, and provides query/aggregation APIs.

When a claim is published to ATProto, its AT-URI (`at://did:plc:xyz/com.linkedclaims.claim/tid`) becomes its permanent decentralized address. Other claims can reference it by setting `subject` to that AT-URI — this is how endorsements, disputes, and other claims-about-claims work.

## Embeddable Web Component

A `<linked-claims-atproto>` web component is available for embedding ATProto claim feeds on any web page:

```html
<!-- Show claims about this page -->
<linked-claims-atproto api="https://live.linkedtrust.us"></linked-claims-atproto>

<!-- Show claims about a specific URL -->
<linked-claims-atproto subject="https://example.com" api="https://live.linkedtrust.us"></linked-claims-atproto>

<!-- Browse a specific user's claims (no backend needed) -->
<linked-claims-atproto repo="did:plc:xztctnvt5ycnsippd3orwqk7" subject="*"></linked-claims-atproto>
```

Source: `trust_claim/public/atproto-claims.js` (will move into this SDK as a built artifact).

## Related Projects

- **[claim-lexicon](https://github.com/Cooperation-org/claim-atproto)** - The `com.linkedclaims.claim` lexicon specification
- **[@atproto/api](https://www.npmjs.com/package/@atproto/api)** - ATProto SDK
- **[LinkedClaims](https://github.com/decentralized-identity/labs-linkedclaims)** - DIF specification

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Questions?

- **Lexicon Issues:** Report at the [claim-lexicon repo](https://github.com/Cooperation-org/claim-atproto/issues)
- **Library Issues:** Open an issue in this repo
- **ATProto Questions:** See [ATProto docs](https://atproto.com)
