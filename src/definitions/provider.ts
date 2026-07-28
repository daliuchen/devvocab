export type DefinitionLookupInput = {
  text: string
  sentence?: string
  pageTitle?: string
  domain?: string
}

export type DefinitionLookupResult = {
  definition: string
  source: 'manual' | 'dictionary' | 'ai'
}

export type DefinitionProvider = {
  lookup(input: DefinitionLookupInput): Promise<DefinitionLookupResult | null>
}

export class ManualDefinitionProvider implements DefinitionProvider {
  async lookup(): Promise<DefinitionLookupResult | null> {
    return null
  }
}
