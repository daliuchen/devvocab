const EDGE_PUNCTUATION =
  /^[\s"'`“”‘’()[\]{}.,;:!?]+|[\s"'`“”‘’()[\]{}.,;:!?]+$/g

export function normalizeWord(input: string): string {
  return input
    .replace(EDGE_PUNCTUATION, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
