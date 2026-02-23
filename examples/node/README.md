# Node.js Examples

These examples demonstrate how to use `@cooperation/claim-atproto` in Node.js applications.

## Prerequisites

1. A Bluesky account
2. An app password (Settings → App Passwords in Bluesky)
3. Node.js 18+ installed

## Setup

Before running the examples, install dependencies:

```bash
cd /path/to/claim-atproto-lib
npm install
npm run build
```

## Running Examples

### Basic Claim

Create and publish a simple skill claim:

```bash
npx tsx examples/node/basic-claim.ts
```

**What it does:**
- Authenticates with Bluesky
- Creates a skill claim
- Publishes to your repository

### Endorsement

Create an endorsement of another claim:

```bash
npx tsx examples/node/endorsement.ts
```

**What it does:**
- Creates a claim-about-claim (endorsement)
- Uses the `createEndorsement` helper
- Demonstrates the claims-about-claims pattern

### With Evidence

Create a claim with structured evidence and content hash:

```bash
npx tsx examples/node/with-evidence.ts
```

**What it does:**
- Computes a content hash for evidence
- Attaches structured provenance to a claim
- Demonstrates the ClaimSource pattern

## Configuration

Before running, edit the examples to:

1. Replace `'your-handle.bsky.social'` with your Bluesky handle
2. Replace `'your-app-password'` with your app password
3. Update DID and URI references as needed

## Notes

- **App Passwords**: Never use your main Bluesky password in code. Always create an app password.
- **DIDs**: You can find your DID by visiting `https://plc.directory/[your-handle]`
- **Validation**: Claims are validated against the lexicon before publishing by default
