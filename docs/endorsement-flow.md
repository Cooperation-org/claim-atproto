# Publishing an Endorsement to ATProto/Bluesky

End-to-end flow for publishing a LinkedClaim endorsement using the `@cooperation/claim-atproto` SDK.

## What is an endorsement?

An endorsement is a **claim about a claim**. It says "I agree with / vouch for this existing claim."

- The endorsement's `subject` is the AT-URI of the original claim
- The endorsement's `claimType` is `endorsement`
- The endorsement's `statement` explains why you endorse it

## Prerequisites

- A Bluesky account
- An [app password](https://bsky.app/settings/app-passwords) (not your main password)
- Node.js 18+

## Step-by-step

### 1. Install and authenticate

```typescript
import { AtpAgent } from '@atproto/api'
import { ClaimClient, createClaim, createEndorsement } from '@cooperation/claim-atproto'

const agent = new AtpAgent({ service: 'https://bsky.social' })
await agent.login({
  identifier: 'yourhandle.bsky.social',
  password: 'your-app-password',
})

const client = new ClaimClient({ agent })
```

### 2. Publish a base claim

```typescript
const baseClaim = createClaim()
  .subject('https://linkedtrust.us')
  .type('impact')
  .statement('LinkedTrust helps communities build verifiable trust networks')
  .object('trust infrastructure')
  .build()

const publishedBase = await client.publish(baseClaim)
console.log('Base claim URI:', publishedBase.uri)
// at://did:plc:xyz/com.linkedclaims.claim/tid123
```

### 3. Publish an endorsement of the base claim

```typescript
const endorsement = createEndorsement(
  publishedBase.uri,
  'I endorse this claim. LinkedTrust is building important trust infrastructure for open communities.',
  { howKnown: 'FIRST_HAND' }
).build()

const publishedEndorsement = await client.publish(endorsement)
console.log('Endorsement URI:', publishedEndorsement.uri)
```

The endorsement record published to ATProto looks like:

```json
{
  "$type": "com.linkedclaims.claim",
  "subject": "at://did:plc:xyz/com.linkedclaims.claim/tid123",
  "claimType": "endorsement",
  "statement": "I endorse this claim. LinkedTrust is building important trust infrastructure for open communities.",
  "source": {
    "howKnown": "FIRST_HAND"
  },
  "createdAt": "2026-03-31T14:45:09.416Z"
}
```

### 4. Read claims back

```typescript
const claim = await client.get(publishedEndorsement.uri)
console.log(claim)
```

### 5. Verify on AT Protocol tooling

- **PDS viewer**: `https://pdsls.dev/at/{your-did}/com.linkedclaims.claim`
- **Bluesky profile**: `https://bsky.app/profile/{your-handle}`

## Verified example

Published on 2026-03-31 from `chefkene.bsky.social` (`did:plc:z3hwpi5wyjld2ehnjasyoe3k`):

| Record | AT-URI |
|--------|--------|
| Base claim | `at://did:plc:z3hwpi5wyjld2ehnjasyoe3k/com.linkedclaims.claim/3mieg3t3qh62a` |
| Endorsement | `at://did:plc:z3hwpi5wyjld2ehnjasyoe3k/com.linkedclaims.claim/3mieg3tdpk22a` |

Verify at: https://pdsls.dev/at/did:plc:z3hwpi5wyjld2ehnjasyoe3k/com.linkedclaims.claim

## Script

A runnable smoke test is at [`scripts/test-endorsement.ts`](../scripts/test-endorsement.ts):

```bash
ATPROTO_HANDLE=your.bsky.social ATPROTO_APP_PASSWORD=xxxx npx tsx scripts/test-endorsement.ts
```
