/**
 * Example: Create and publish an endorsement (claim-about-claim)
 *
 * This example demonstrates:
 * - Creating an endorsement of another claim
 * - Using the createEndorsement helper
 * - Publishing claims-about-claims
 */

import { AtpAgent } from '@atproto/api'
import { ClaimClient, createEndorsement } from '../../src'

async function main() {
  // Setup agent
  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({
    identifier: 'your-handle.bsky.social',
    password: 'your-app-password',
  })

  const client = new ClaimClient({ agent })

  // The URI of the claim you want to endorse
  // Replace with an actual claim URI
  const claimToEndorse = 'at://did:plc:alice/com.linkedclaims.claim/3kfxyz'

  // Create an endorsement
  const endorsement = createEndorsement(
    claimToEndorse,
    'I can personally confirm Alice has excellent React skills. We worked together for 2 years.',
    {
      confidence: 1.0,
      howKnown: 'FIRST_HAND',
    }
  ).build()

  console.log('Endorsement:', JSON.stringify(endorsement, null, 2))

  // Publish the endorsement
  const published = await client.publish(endorsement)

  console.log(`\n✅ Endorsement published!`)
  console.log(`URI: ${published.uri}`)
  console.log(`Subject (claim being endorsed): ${published.subject}`)
}

main().catch(console.error)
