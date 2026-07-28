import 'fake-indexeddb/auto'

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: (() => {
      let counter = 0

      return () => {
        counter += 1
        return `00000000-0000-4000-8000-${counter.toString().padStart(12, '0')}`
      }
    })(),
  },
})
