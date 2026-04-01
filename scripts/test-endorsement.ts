/**
 * Smoke test: Publish a base claim and an endorsement to ATProto/Bluesky
 *
 * Usage:
 *   ATPROTO_HANDLE=your.bsky.social ATPROTO_APP_PASSWORD=xxxx npx tsx scripts/test-endorsement.ts
 */

import { AtpAgent } from '@atproto/api'
import { ClaimClient } from '../src/client/ClaimClient'
import { createClaim } from '../src/builders'
import { createEndorsement } from '../src/helpers/claims-about-claims'

async function main() {
  const handle = process.env.ATPROTO_HANDLE
  const password = process.env.ATPROTO_APP_PASSWORD
  const service = process.env.ATPROTO_SERVICE || 'https://bsky.social'

  if (!handle || !password) {
    console.error('Set ATPROTO_HANDLE and ATPROTO_APP_PASSWORD env vars')
    process.exit(1)
  }

  // 1. Login
  console.log(`Logging in as ${handle}...`)
  const agent = new AtpAgent({ service })
  await agent.login({ identifier: handle, password })
  console.log(`Authenticated as ${agent.session!.did}\n`)

  const client = new ClaimClient({ agent, validate: false })

  // 2. Publish a base claim (something to endorse)
  const baseClaim = createClaim()
    .subject('https://linkedtrust.us')
    .type('impact')
    .statement('LinkedTrust helps communities build verifiable trust networks')
    .object('trust infrastructure')
    .build()

  console.log('Publishing base claim...')
  const publishedBase = await client.publish(baseClaim)
  console.log(`Base claim published!`)
  console.log(`  URI: ${publishedBase.uri}`)
  console.log(`  CID: ${publishedBase.cid}\n`)

  // 3. Publish an endorsement of the base claim
  const endorsement = createEndorsement(
    publishedBase.uri,
    'I endorse this claim. LinkedTrust is building important trust infrastructure for open communities.',
    { howKnown: 'FIRST_HAND' }
  ).build()

  console.log('Publishing endorsement...')
  const publishedEndorsement = await client.publish(endorsement)
  console.log(`Endorsement published!`)
  console.log(`  URI: ${publishedEndorsement.uri}`)
  console.log(`  CID: ${publishedEndorsement.cid}`)
  console.log(`  Endorses: ${publishedEndorsement.subject}\n`)

  // 4. Verify by reading both back
  console.log('Verifying — reading claims back from ATProto...')
  const readBase = await client.get(publishedBase.uri)
  const readEndorsement = await client.get(publishedEndorsement.uri)

  console.log(`\nBase claim read back:`, JSON.stringify(readBase, null, 2))
  console.log(`\nEndorsement read back:`, JSON.stringify(readEndorsement, null, 2))

  // 5. Print verification links
  const did = agent.session!.did
  console.log(`\n--- Verification ---`)
  console.log(`Base claim:       ${publishedBase.uri}`)
  console.log(`Endorsement:      ${publishedEndorsement.uri}`)
  console.log(`PDS viewer:       https://pdsls.dev/at/${did}/com.linkedclaims.claim`)
  console.log(`Bluesky profile:  https://bsky.app/profile/${handle}`)
}

main().catch((err) => {
  console.error('Failed:', err.message || err)
  process.exit(1)
})
