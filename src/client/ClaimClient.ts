import type { AtpAgent } from '@atproto/api'
import type { Claim, PublishedClaim } from '../types'
import { validateClaim } from './validation'

/**
 * Configuration options for ClaimClient
 */
export interface ClaimClientConfig {
  /** ATProto agent (must be authenticated) */
  agent: AtpAgent
  /** Whether to validate claims before publishing (default: true) */
  validate?: boolean
}

/**
 * Client for publishing and managing claims on ATProto.
 * Handles claim publishing, retrieval, and deletion using the authenticated agent.
 *
 * @example
 * ```typescript
 * import { AtpAgent } from '@atproto/api'
 * import { ClaimClient, createClaim } from '@cooperation/claim-atproto'
 *
 * const agent = new AtpAgent({ service: 'https://bsky.social' })
 * await agent.login({ identifier: 'alice.bsky.social', password: 'app-password' })
 *
 * const client = new ClaimClient({ agent })
 * const claim = createClaim().subject('did:plc:alice').type('skill').build()
 * const published = await client.publish(claim)
 * ```
 */
export class ClaimClient {
  private agent: AtpAgent
  private shouldValidate: boolean

  constructor(config: ClaimClientConfig) {
    this.agent = config.agent
    this.shouldValidate = config.validate ?? true
  }

  /**
   * Publish a claim to the authenticated user's repository.
   * The claim will be automatically signed by ATProto's repo signing mechanism.
   *
   * @param claim - The claim to publish
   * @returns The published claim with its URI and CID
   * @throws {Error} if not authenticated or if claim validation fails
   */
  async publish(claim: Claim): Promise<PublishedClaim> {
    if (!this.agent.session) {
      throw new Error('Agent must be authenticated to publish claims. Call agent.login() first.')
    }

    if (this.shouldValidate) {
      validateClaim(claim)
    }

    // If no claimUri set, it will be the AT-URI after publishing
    const recordToPublish = claim.claimUri ? claim : { ...claim }

    const result = await this.agent.com.atproto.repo.createRecord({
      repo: this.agent.session.did,
      collection: 'com.linkedclaims.claim',
      record: recordToPublish,
    })

    // If claimUri wasn't set, the AT-URI becomes the claimUri
    const published: PublishedClaim = {
      ...claim,
      claimUri: claim.claimUri || result.data.uri,
      uri: result.data.uri,
      cid: result.data.cid,
    }

    return published
  }

  /**
   * Publish a claim to a specific repository (for server-side publishing).
   * Useful when a server needs to publish claims on behalf of users.
   *
   * @param repo - The DID of the repository to publish to
   * @param claim - The claim to publish
   * @returns The published claim with its URI and CID
   * @throws {Error} if claim validation fails
   */
  async publishTo(repo: string, claim: Claim): Promise<PublishedClaim> {
    if (this.shouldValidate) {
      validateClaim(claim)
    }

    const recordToPublish = claim.claimUri ? claim : { ...claim }

    const result = await this.agent.com.atproto.repo.createRecord({
      repo,
      collection: 'com.linkedclaims.claim',
      record: recordToPublish,
    })

    const published: PublishedClaim = {
      ...claim,
      claimUri: claim.claimUri || result.data.uri,
      uri: result.data.uri,
      cid: result.data.cid,
    }
  }

  /**
   * Get a claim by its AT-URI
   *
   * @param uri - The AT-URI of the claim (e.g., at://did:plc:xxx/com.linkedclaims.claim/tid)
   * @returns The claim if found, null otherwise
   * @throws {Error} if URI is invalid or not a com.linkedclaims.claim URI
   */
  async get(uri: string): Promise<Claim | null> {
    // Parse AT-URI: at://did/collection/rkey
    const match = uri.match(/^at:\/\/([^/]+)\/([^/]+)\/(.+)$/)
    if (!match) {
      throw new Error('Invalid AT-URI format. Expected: at://did/collection/rkey')
    }

    const [, repo, collection, rkey] = match
    if (collection !== 'com.linkedclaims.claim') {
      throw new Error('Not a com.linkedclaims.claim URI. Expected collection: com.linkedclaims.claim')
    }

    try {
      const result = await this.agent.com.atproto.repo.getRecord({
        repo,
        collection,
        rkey,
      })
      return result.data.value as Claim
    } catch (error: any) {
      if (error?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Delete a claim from a repository.
   * Note: Claims are immutable. Deletion is typically used for revocation.
   * Consider publishing a revocation claim instead for better audit trails.
   *
   * @param uri - The AT-URI of the claim to delete
   * @throws {Error} if URI is invalid or deletion fails
   */
  async delete(uri: string): Promise<void> {
    const match = uri.match(/^at:\/\/([^/]+)\/([^/]+)\/(.+)$/)
    if (!match) {
      throw new Error('Invalid AT-URI format. Expected: at://did/collection/rkey')
    }

    const [, repo, collection, rkey] = match
    if (collection !== 'com.linkedclaims.claim') {
      throw new Error('Not a com.linkedclaims.claim URI. Expected collection: com.linkedclaims.claim')
    }

    await this.agent.com.atproto.repo.deleteRecord({
      repo,
      collection,
      rkey,
    })
  }
}
