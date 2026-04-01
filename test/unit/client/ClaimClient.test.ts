import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClaimClient } from '../../../src/client/ClaimClient'

function createMockAgent(records: any[] = [], cursor?: string) {
  return {
    session: { did: 'did:plc:testuser' },
    com: {
      atproto: {
        repo: {
          listRecords: vi.fn().mockResolvedValue({
            data: {
              records,
              cursor,
            },
          }),
          createRecord: vi.fn().mockResolvedValue({
            data: { uri: 'at://did:plc:testuser/com.linkedclaims.claim/abc', cid: 'bafytest' },
          }),
          getRecord: vi.fn(),
          deleteRecord: vi.fn(),
        },
      },
    },
  } as any
}

function makeRecord(overrides: any = {}) {
  return {
    uri: overrides.uri || 'at://did:plc:alice/com.linkedclaims.claim/tid1',
    cid: overrides.cid || 'bafyabc',
    value: {
      subject: 'did:plc:bob',
      claimType: 'skill',
      createdAt: '2025-01-15T00:00:00.000Z',
      ...overrides.value,
    },
  }
}

describe('ClaimClient.list()', () => {
  let client: ClaimClient

  beforeEach(() => {
    client = new ClaimClient({ agent: createMockAgent(), validate: false })
  })

  it('should list claims from a repository', async () => {
    const records = [
      makeRecord(),
      makeRecord({ uri: 'at://did:plc:alice/com.linkedclaims.claim/tid2', cid: 'bafydef' }),
    ]
    const agent = createMockAgent(records)
    client = new ClaimClient({ agent, validate: false })

    const result = await client.list({ repo: 'did:plc:alice' })

    expect(result.claims).toHaveLength(2)
    expect(result.claims[0].uri).toBe('at://did:plc:alice/com.linkedclaims.claim/tid1')
    expect(result.claims[0].subject).toBe('did:plc:bob')
    expect(result.claims[0].claimType).toBe('skill')
    expect(result.claims[0].cid).toBe('bafyabc')
    expect(agent.com.atproto.repo.listRecords).toHaveBeenCalledWith({
      repo: 'did:plc:alice',
      collection: 'com.linkedclaims.claim',
      limit: 50,
      cursor: undefined,
      reverse: undefined,
    })
  })

  it('should pass pagination cursor through', async () => {
    const agent = createMockAgent([makeRecord()], 'next-cursor-123')
    client = new ClaimClient({ agent, validate: false })

    const result = await client.list({ repo: 'did:plc:alice', cursor: 'prev-cursor' })

    expect(result.cursor).toBe('next-cursor-123')
    expect(agent.com.atproto.repo.listRecords).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: 'prev-cursor' })
    )
  })

  it('should return empty array and no cursor when no claims exist', async () => {
    const agent = createMockAgent([], undefined)
    client = new ClaimClient({ agent, validate: false })

    const result = await client.list({ repo: 'did:plc:empty' })

    expect(result.claims).toEqual([])
    expect(result.cursor).toBeUndefined()
  })

  it('should use default limit of 50', async () => {
    const agent = createMockAgent()
    client = new ClaimClient({ agent, validate: false })

    await client.list({ repo: 'did:plc:alice' })

    expect(agent.com.atproto.repo.listRecords).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    )
  })

  it('should support custom limit', async () => {
    const agent = createMockAgent()
    client = new ClaimClient({ agent, validate: false })

    await client.list({ repo: 'did:plc:alice', limit: 10 })

    expect(agent.com.atproto.repo.listRecords).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 })
    )
  })

  it('should pass reverse option', async () => {
    const agent = createMockAgent()
    client = new ClaimClient({ agent, validate: false })

    await client.list({ repo: 'did:plc:alice', reverse: true })

    expect(agent.com.atproto.repo.listRecords).toHaveBeenCalledWith(
      expect.objectContaining({ reverse: true })
    )
  })

  it('should map record shape to PublishedClaim correctly', async () => {
    const records = [
      makeRecord({
        uri: 'at://did:plc:alice/com.linkedclaims.claim/tid1',
        cid: 'bafyfull',
        value: {
          subject: 'https://example.org',
          claimType: 'impact',
          statement: 'Great project',
          createdAt: '2025-06-01T12:00:00.000Z',
          confidence: 0.95,
          source: { uri: 'https://evidence.org/doc.pdf', howKnown: 'WEB_DOCUMENT' },
        },
      }),
    ]
    const agent = createMockAgent(records)
    client = new ClaimClient({ agent, validate: false })

    const result = await client.list({ repo: 'did:plc:alice' })
    const claim = result.claims[0]

    expect(claim.uri).toBe('at://did:plc:alice/com.linkedclaims.claim/tid1')
    expect(claim.cid).toBe('bafyfull')
    expect(claim.subject).toBe('https://example.org')
    expect(claim.claimType).toBe('impact')
    expect(claim.statement).toBe('Great project')
    expect(claim.confidence).toBe(0.95)
    expect(claim.source?.uri).toBe('https://evidence.org/doc.pdf')
    expect(claim.source?.howKnown).toBe('WEB_DOCUMENT')
  })
})
