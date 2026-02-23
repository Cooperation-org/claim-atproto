/**
 * Basic example: Create and publish a simple skill claim
 *
 * This example demonstrates:
 * - Creating an ATProto agent
 * - Authenticating with Bluesky
 * - Building a basic claim with ClaimBuilder
 * - Publishing the claim to your repository
 */

import { AtpAgent } from '@atproto/api'
import { ClaimClient, createClaim } from '../../src'

async function main() {
  // Create and authenticate agent
  const agent = new AtpAgent({ service: 'https://bsky.social' })

  // Login with your Bluesky credentials
  // IMPORTANT: Use an app password, not your main password
  await agent.login({
    identifier: 'your-handle.bsky.social',
    password: 'your-app-password',
  })

  console.log(`Authenticated as: ${agent.session?.handle}`)

  // Create a claim client
  const client = new ClaimClient({ agent })

  // Build a simple skill claim
  const claim = createClaim()
    .subject('did:plc:your-did-here')
    .type('skill')
    .object('TypeScript')
    .statement('5 years of production experience with TypeScript')
    .confidence(0.9)
    .build()

  console.log('Claim to publish:', JSON.stringify(claim, null, 2))

  // Publish the claim
  const published = await client.publish(claim)

  console.log(`\n✅ Claim published!`)
  console.log(`URI: ${published.uri}`)
  console.log(`CID: ${published.cid}`)
}

// Run the example
main().catch(console.error)
