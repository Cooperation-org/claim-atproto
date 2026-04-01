# @cooperation / claim-atproto

> TypeScript library for creating and publishing LinkedClaims on ATProto (Bluesky)

Also published as `@linked-claims/claim-atproto`.

This package implements the [`com.linkedclaims.claim`](./src/lexicons/com-linkedclaims-claim.json) lexicon and a fluent builder API. For the LinkedClaims specification and field semantics, see the [DIF Labs LinkedClaims](https://identity.foundation/labs-linkedclaims/) work and the [LinkedClaims repo](https://github.com/Cooperation-org/LinkedClaims).

**Field reference (canonical contract):** [docs/field-reference.md](https://github.com/Cooperation-org/LinkedClaims/blob/main/docs/field-reference.md)

## Installation

```bash
npm install @cooperation/claim-atproto
```

**Requirements:** Node.js 18+ (or a modern browser), and `@atproto/api` as a peer dependency.

---

## Architecture Overview

**trust_claim_backend** (`trust_claim_backend`) acts as an **AppView** for LinkedClaims on ATProto. It ingests `com.linkedclaims.claim` records from the network, stores them in its own database using the same **Prisma `Claim`** model as the rest of the product, and exposes HTTP APIs for querying that index. The SDK in this repo is for reading and writing records on ATProto (`com.atproto.repo.*` and, for consumers, Jetstream); the AppView adds aggregation, deduplication, and LinkedTrust-specific query endpoints.

**Live indexing (Jetstream):** When `ATPROTO_INDEX_ENABLED=true`, the indexer opens a WebSocket to Jetstream. The default endpoint is:

`wss://jetstream2.us-west.bsky.network/subscribe`

The client appends `?wantedCollections=` plus a URL-encoded `com.linkedclaims.claim` so only that collection is received (overridable via `ATPROTO_JETSTREAM_URL`).

For each **commit** event where `commit.collection` is `com.linkedclaims.claim`, on **create** or **update**, the service maps `commit.record` into a `Claim` row. Records without `subject` are skipped. **Deletes** are not handled in the indexer (claims are treated as immutable there).

**Deduplication:** Before inserting, the indexer looks up an existing claim where `claimAddress` equals the AT-URI for that record:

`at://${did}/com.linkedclaims.claim/${rkey}`

If a row already exists for that `claimAddress`, the event is ignored so the same record is not indexed twice.

**Record → Prisma `Claim` mapping:** The indexer sets fields such as `subject` from `record.subject`; `claim` from `record.claimType` (default `'claim'` if missing); `object`, `statement`, `confidence`, `stars`, `aspect`, `respondAt` when present; `sourceURI`, `howKnown` (only values matching the backend’s allowed enum list are stored), `digestMultibase`, `dateObserved`, `author`, `curator` from `record.source` when present; `effectiveDate` and `createdAt` from the record when present; `claimAddress` to the AT-URI above; `proof` to the commit **CID**; `issuerId` to the publisher **DID**; `issuerIdType` to `'DID'`. Each entry in `record.evidence` that includes a `uri` is stored as an **`Image`** row linked to the new claim, with optional metadata derived from `mediaType`, `description`, and simple video detection.

**Backfill:** Repos can be backfilled with `com.atproto.repo.listRecords` against `https://public.api.bsky.app` for the same collection—on startup via `ATPROTO_INDEX_REPOS` or on demand via `POST /api/atproto/backfill` (see below).

---

## Lexicon Schema

The authoritative definition is [`src/lexicons/com-linkedclaims-claim.json`](./src/lexicons/com-linkedclaims-claim.json). Records use a **`tid`** key.

### Required fields (`main.record`)

Per the lexicon `required` array, every `com.linkedclaims.claim` record must include:

| Field | Type | Notes |
|-------|------|--------|
| `subject` | string (URI) | What the claim is about (HTTPS URL, DID, AT-URI, IPFS CID, another claim’s `claimUri`, etc.). |
| `claimType` | string | Open vocabulary (e.g. skill, credential, impact, endorsement, dispute, rating). |
| `createdAt` | string (datetime) | When this record was created. |

### Optional fields (`main.record`)

| Field | Purpose |
|-------|---------|
| `claimUri` | Persistent URI identity of this claim (AT-URI after publish, or HTTPS / other if the claim originated elsewhere). |
| `object` | Optional object of the claim (e.g. skill name, credential type). |
| `statement` | Human-readable explanation (max length 10000 in lexicon). |
| `source` | Provenance object (`#claimSource`): where the information came from—not the same as evidence. |
| `evidence` | Array of `#evidenceItem` (URI, optional digest, media type, description). |
| `effectiveDate` | When the claim became or becomes true. |
| `respondAt` | URI where responses (endorsements, disputes, etc.) may be sent. |
| `embeddedProof` | External cryptographic proof (`#embeddedProof`). |
| `confidence` | Number 0–1. |
| `stars` | Integer 1–5. |
| `aspect` | Aspect being rated or assessed. |

### `claimSource` (object under `source`)

In the lexicon, properties are described but not listed in a `required` array for this object: `uri`, `digestMultibase`, `howKnown` (known values include `FIRST_HAND`, `SECOND_HAND`, `WEB_DOCUMENT`, `VERIFIED_LOGIN`, `SIGNED_DOCUMENT`, `BLOCKCHAIN`, `RESEARCH`, `OPINION`, `OTHER`), `dateObserved`, `author`, `curator`.

### `evidenceItem`

Properties include `uri`, `digestMultibase`, `mediaType`, `description` (the lexicon does not mark a subset as required on this object).

- **`ClaimClient`** - Publish and manage claims on ATProto
  - `.publish(claim)` - Publish to your repository
  - `.publishTo(did, claim)` - Publish to another repository
  - `.get(uri)` - Fetch a claim by AT-URI
  - `.list({ repo, limit?, cursor?, reverse? })` - List claims from a repository
  - `.delete(uri)` - Delete a claim

When **`embeddedProof` is present**, that object must include:

- **`createEndorsement(uri, statement, options)`** - Create an endorsement
- **`createDispute(uri, statement, options)`** - Create a dispute
- **`createSuperseding(uri, statement)`** - Create an update/replacement
- **`createRevocation(uri, reason)`** - Create a revocation
- **`computeDigestMultibase(content)`** - Hash content for integrity
- **`fetchAndHash(uri)`** - Fetch and hash remote content
- **`mapDatabaseClaim(dbClaim, options?)`** - Map a flat DB row to an ATProto claim record

Optional: `proofPurpose` (lexicon default described as `assertionMethod`).

---

## Reading Claims from ATProto

**Per-record reads:** Use `com.atproto.repo.getRecord` or `listRecords` with `collection=com.linkedclaims.claim` and the repo DID. This package’s `ClaimClient.get(atUri)` wraps `getRecord` for a single claim (see [Publishing Claims](#publishing-claims)).

**Jetstream (firehose):** Connect to Jetstream and restrict the stream to this collection using the query parameter:

`wantedCollections=com.linkedclaims.claim`

(Use URL encoding in the full WebSocket URL, e.g. `?wantedCollections=com.linkedclaims.claim`.)

LinkedTrust’s indexer defaults to:

`wss://jetstream2.us-west.bsky.network/subscribe?wantedCollections=com.linkedclaims.claim`

Parse each message as JSON. Handle **`kind === 'commit'`** events where **`commit.collection === 'com.linkedclaims.claim'`**. On **`create`** or **`update`**, use `commit.rkey`, `commit.cid`, and `commit.record` (and `event.did` for the repo). The stable AT address for a record is:

`at://${event.did}/com.linkedclaims.claim/${commit.rkey}`

---

## Using the LinkedTrust API

These routes are implemented in **trust_claim_backend** (`src/api/atproto.ts`). The host depends on deployment (dev/production `BASE_URL`); paths below are relative to that API root.

### `GET /api/atproto/claims`

Returns claims that have been **indexed from ATProto**: rows where `claimAddress` starts with `at://`.

**Query parameters:**

- `subject` — filter by claim subject; trailing slashes are normalized. If `subject` is omitted or `*`, no subject filter is applied; otherwise the value is matched after stripping trailing `/`.
- `issuer` — filter by `issuerId` (DID).
- `limit` — page size as integer, capped at **200** (default **50** if not provided).

**Response:** `{ claims, count }` — `claims` is an array of claim objects including related `edges` and `images`; each claim in this response includes `_source: 'atproto'`.

### `GET /api/atproto/check?claimAddress=...`

### Listing Claims

List all claims from a repository with pagination:

```typescript
// List claims from a repo
const result = await client.list({ repo: 'did:plc:alice' })
for (const claim of result.claims) {
  console.log(claim.subject, claim.claimType, claim.uri)
}

// Paginate through all claims
let cursor: string | undefined
do {
  const page = await client.list({ repo: 'did:plc:alice', limit: 25, cursor })
  for (const claim of page.claims) {
    console.log(claim.uri)
  }
  cursor = page.cursor
} while (cursor)

// Client-side filtering (ATProto doesn't support server-side subject filtering)
const result2 = await client.list({ repo: 'did:plc:alice' })
const skillClaims = result2.claims.filter(c => c.claimType === 'skill')
```

### Database Mapper

Convert flat database rows (Prisma/SQL) to ATProto claim records:

```typescript
import { mapDatabaseClaim, ClaimClient } from '@cooperation/claim-atproto'

// Map a Prisma row to an ATProto claim
const dbRow = await prisma.claim.findFirst({ where: { id: 123 } })
const claim = mapDatabaseClaim(dbRow, { baseUrl: 'https://myapp.com' })
await client.publish(claim)

// Field mapping:
//   dbRow.claim       → claim.claimType
//   dbRow.sourceURI   → claim.source.uri
//   dbRow.howKnown    → claim.source.howKnown
//   dbRow.claimAddress → claim.claimUri
//   dbRow.proof (JSON) + issuerId → claim.embeddedProof
```

## TypeScript Types

**Response:** `{ exists: boolean, claim: object | null }` — when `exists` is true, `claim` includes `id`, `claimAddress`, `subject`, and `claim`.

```typescript
import type {
  Claim,
  ClaimSource,
  EmbeddedProof,
  PublishedClaim,
  HowKnown,
  ClaimClientConfig,
  ListClaimsOptions,
  ListClaimsResult,
  DatabaseClaim,
  MapDatabaseClaimOptions,
} from '@cooperation/claim-atproto'
```

**Body:** JSON `{ repo: "<did>" }` — the ATProto repo (DID) to backfill. If `repo` is missing, **400** with `{ error: 'repo (DID) required in body' }`.

**Response:** `{ success: true, repo, imported }` — `imported` is the number of records the backfill routine processed (subject to indexer rules, e.g. skips records without `subject`).

---

## Publishing Claims

### OAuth (LinkedTrust backend)

LinkedTrust uses **`@atproto/oauth-client-node`** (`NodeOAuthClient`) for OAuth **2.1** with **DPoP** and **PKCE**. Client metadata is served at `{BASE_URL}/oauth/atproto/client-metadata.json`; redirect URI is `{BASE_URL}/auth/atproto/callback`. State and sessions are stored in Postgres (`atproto_oauth_state`, `atproto_oauth_session`).

**Scopes used by LinkedTrust:**

- `atproto` — identity (DID + handle).
- **`com.linkedclaims.authFull`** — allows the backend to publish `com.linkedclaims.claim` records **into the user’s repo** when a stored session is present and `session.getTokenInfo().scope` **includes** the substring `com.linkedclaims.authFull`.
- `transition:email` — optional; the server’s `authorize` helper can omit it when `skipEmail` is set.

Typical server flow:

1. **`authorize(handle, { scope })`** — returns a URL to redirect the user to the PDS.
2. **`callback(URLSearchParams)`** — completes the code exchange; returns DID, handle, profile fields from the public Bluesky API where available, and `scope` from token info.
3. **`getSession(did)`** / `restore(did)` — used when publishing so an `@atproto/api` **`Agent`** can call `com.atproto.repo.createRecord` on the user’s repo.

Third-party apps need their own OAuth client registration and equivalent scopes if they follow the same pattern.

### Server fallback (app password)

If there is no suitable user OAuth session, LinkedTrust can publish with a **server Bluesky identity**:

- **`ATPROTO_HANDLE`** and **`ATPROTO_APP_PASSWORD`** (app password, not the main account password).
- Optional **`ATPROTO_SERVICE`** (default `https://bsky.social`).

The backend uses `AtpAgent.login` and `com.atproto.repo.createRecord` into **that** repo. If those env vars are unset, that path is disabled. The publisher **skips** claims whose `claimAddress` already starts with `at://` (already AT-native). After a successful publish, it updates the claim’s `claimAddress` to the returned record URI.

### Using this SDK: `ClaimClient`, builders, and examples

`ClaimClient` accepts an authenticated `AtpAgent` and, by default, validates claims before publishing.

- **`publish(claim)`** — requires `agent.session`; publishes to `repo: agent.session.did`.
- **`publishTo(repo, claim)`** — publishes to a given repo DID (typical for server-side publishing).

If `claim.claimUri` is omitted, the published result sets **`claimUri`** to the new **`uri`** returned by the PDS.

**Basic claim** (from [`examples/node/basic-claim.ts`](./examples/node/basic-claim.ts)):

```typescript
import { AtpAgent } from '@atproto/api'
import { ClaimClient, createClaim } from '@cooperation/claim-atproto'

const agent = new AtpAgent({ service: 'https://bsky.social' })

await agent.login({
  identifier: 'your-handle.bsky.social',
  password: 'your-app-password',
})

const client = new ClaimClient({ agent })

const claim = createClaim()
  .subject('did:plc:your-did-here')
  .type('skill')
  .object('TypeScript')
  .statement('5 years of production experience with TypeScript')
  .confidence(0.9)
  .build()

const published = await client.publish(claim)
console.log(published.uri, published.cid)
```

**Endorsement (claim-about-claim)** (from [`examples/node/endorsement.ts`](./examples/node/endorsement.ts)):

```typescript
import { AtpAgent } from '@atproto/api'
import { ClaimClient, createEndorsement } from '@cooperation/claim-atproto'

const agent = new AtpAgent({ service: 'https://bsky.social' })
await agent.login({
  identifier: 'your-handle.bsky.social',
  password: 'your-app-password',
})

const client = new ClaimClient({ agent })

const claimToEndorse = 'at://did:plc:alice/com.linkedclaims.claim/3kfxyz'

const endorsement = createEndorsement(
  claimToEndorse,
  'I can personally confirm Alice has excellent React skills. We worked together for 2 years.',
  {
    confidence: 1.0,
    howKnown: 'FIRST_HAND',
  }
).build()

const published = await client.publish(endorsement)
console.log(published.uri, published.subject)
```

**Source and digest** (from [`examples/node/with-evidence.ts`](./examples/node/with-evidence.ts)):

```typescript
import { AtpAgent } from '@atproto/api'
import {
  ClaimClient,
  createClaim,
  createSource,
  computeDigestMultibase,
} from '@cooperation/claim-atproto'

const agent = new AtpAgent({ service: 'https://bsky.social' })
await agent.login({
  identifier: 'your-handle.bsky.social',
  password: 'your-app-password',
})

const client = new ClaimClient({ agent })

const evidenceHash = await computeDigestMultibase('This is the evidence document content')

const claim = createClaim()
  .subject('https://example.org/ngo-project/water-filters')
  .type('impact')
  .statement('Distributed 500 water filters to families in Kibera, Nairobi')
  .withSource(
    createSource()
      .uri('https://evidence.example.org/distribution-report.pdf')
      .digest(evidenceHash)
      .howKnown('FIRST_HAND')
      .dateObserved(new Date('2024-12-15'))
  )
  .effectiveDate(new Date('2024-12-15'))
  .build()

const published = await client.publish(claim)
```

**Explicit repo:**

```typescript
const published = await client.publishTo('did:plc:example', claim)
```

Additional exports include `createDispute`, `createSuperseding`, `createRevocation`, `createProof()`, `fetchAndHash`, `validateClaim`, and `ClaimClient` methods `get` and `delete`. See [`examples/node/README.md`](./examples/node/README.md) for how to run the examples.

---

## SDK reference (short)

- **Builders:** `createClaim()`, `createSource()`, `createProof()`, `createEndorsement`, `createDispute`, `createSuperseding`, `createRevocation`
- **Client:** `ClaimClient` — `publish`, `publishTo`, `get`, `delete`; option `validate: false` for testing
- **Types:** `Claim`, `ClaimSource`, `EmbeddedProof`, `PublishedClaim`, `HowKnown`, `ClaimClientConfig`

---

## Examples and development

```bash
npm install
npm run build
npx tsx examples/node/basic-claim.ts
npx tsx examples/node/with-evidence.ts
npx tsx examples/node/endorsement.ts
```

```bash
npm test
npm run type-check
```

---

## Namespace

`com.linkedclaims.claim` is associated with `linkedclaims.com` (DNS / `_atproto` verification as documented for that domain).

---

## Related links

- [@atproto/api](https://www.npmjs.com/package/@atproto/api)
- [ATProto](https://atproto.com)

---

## License

MIT

## Contributing

Contributions welcome; please open an issue or PR.
