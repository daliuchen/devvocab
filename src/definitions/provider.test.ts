import { describe, expect, it } from 'vitest'
import { ManualDefinitionProvider, type DefinitionProvider } from './provider'

describe('DefinitionProvider', () => {
  it('allows manual-only MVP usage without external services', async () => {
    const provider: DefinitionProvider = new ManualDefinitionProvider()

    await expect(provider.lookup({ text: 'trait' })).resolves.toBeNull()
  })
})
