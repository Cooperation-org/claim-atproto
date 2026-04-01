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
 * Options for listing claims from a repository
 */
export interface ListClaimsOptions {
  /** DID of the repository to list claims from */
  repo: string
  /** Maximum number of claims to return (default: 50, max: 100) */
  limit?: number
  /** Cursor for pagination (from a previous list result) */
  cursor?: string
  /** Reverse the order of results */
  reverse?: boolean
}

/**
 * Result of listing claims from a repository
 */
export interface ListClaimsResult {
  /** The claims found in the repository */
  claims: PublishedClaim[]
  /** Cursor for fetching the next page, undefined if no more results */
  cursor?: string
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

    return published
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

  /**
   * List claims from a repository.
   *
   * Note: ATProto's listRecords API does not support server-side filtering by subject.
   * To filter by subject, filter the returned claims array client-side.
   *
   * @param options - Repository and pagination options
   * @returns List of published claims and an optional cursor for the next page
   *
   * @example
   * ```typescript
   * const result = await client.list({ repo: 'did:plc:alice' })
   * for (const claim of result.claims) {
   *   console.log(claim.subject, claim.claimType)
   * }
   *
   * // Paginate
   * if (result.cursor) {
   *   const next = await client.list({ repo: 'did:plc:alice', cursor: result.cursor })
   * }
   * ```
   */
  async list(options: ListClaimsOptions): Promise<ListClaimsResult> {
    const { repo, limit = 50, cursor, reverse } = options

    const result = await this.agent.com.atproto.repo.listRecords({
      repo,
      collection: 'com.linkedclaims.claim',
      limit,
      cursor,
      reverse,
    })

    const claims: PublishedClaim[] = result.data.records.map((record: any) => ({
      ...(record.value as Claim),
      uri: record.uri,
      cid: record.cid,
    }))

    return {
      claims,
      cursor: result.data.cursor,
    }
  }
}
