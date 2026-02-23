import { describe, it, expect } from 'vitest'
import { computeDigestMultibase } from '../../../src/helpers'

describe('content-hash', () => {
  describe('computeDigestMultibase', () => {
    it('should hash string content', async () => {
      const hash = await computeDigestMultibase('Hello, world!')
      expect(hash).toMatch(/^z/)
      expect(hash.length).toBeGreaterThan(10)
    })

    it('should hash Uint8Array content', async () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5])
      const hash = await computeDigestMultibase(bytes)
      expect(hash).toMatch(/^z/)
    })

    it('should produce consistent hashes', async () => {
      const content = 'Test content'
      const hash1 = await computeDigestMultibase(content)
      const hash2 = await computeDigestMultibase(content)
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different content', async () => {
      const hash1 = await computeDigestMultibase('Content A')
      const hash2 = await computeDigestMultibase('Content B')
      expect(hash1).not.toBe(hash2)
    })
  })
})
