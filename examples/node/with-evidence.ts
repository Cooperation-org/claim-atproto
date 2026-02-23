/**
 * Example: Create a claim with evidence and content hash
 *
 * This example demonstrates:
 * - Adding structured evidence to a claim
 * - Computing content hashes for evidence integrity
 * - Using ClaimSource for provenance
 */

import { AtpAgent } from '@atproto/api'
import {
  ClaimClient,
  createClaim,
  createSource,
  computeDigestMultibase,
} from '../../src'

async function main() {
  // Setup agent
  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({
    identifier: 'your-handle.bsky.social',
    password: 'your-app-password',
  })

  const client = new ClaimClient({ agent })

  // Compute hash of evidence content
  const evidenceContent = 'This is the evidence document content'
  const evidenceHash = await computeDigestMultibase(evidenceContent)

  console.log(`Evidence hash: ${evidenceHash}`)

  // Create a claim with structured evidence
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

  console.log('Claim with evidence:', JSON.stringify(claim, null, 2))

  // Publish
  const published = await client.publish(claim)

  console.log(`\n✅ Claim with evidence published!`)
  console.log(`URI: ${published.uri}`)
  console.log(`Evidence URI: ${claim.source?.uri}`)
  console.log(`Evidence hash: ${claim.source?.digestMultibase}`)
}

main().catch(console.error)
