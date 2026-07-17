import { Buffer } from 'buffer'

// officecrypto-tool (used to decrypt password-protected Excel files) relies on
// the Node `Buffer` global, which browsers don't provide. Expose it globally.
const g = globalThis as unknown as { Buffer?: typeof Buffer }
if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer
}
