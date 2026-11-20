export function nextRng(seed: number): { seed: number; value: number } {
  let a = seed >>> 0
  a = (a + 0x6d2b79f5) >>> 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { seed: a || 1, value }
}

export function makeRng(box: { rngSeed: number }) {
  return () => {
    const n = nextRng(box.rngSeed || 1)
    box.rngSeed = n.seed || 1
    return n.value
  }
}

export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function makeRoomCode(seed: number): { code: string; seed: number } {
  let s = seed || 1
  let code = ''
  for (let i = 0; i < 6; i++) {
    const n = nextRng(s)
    s = n.seed
    code += ALPHABET[Math.floor(n.value * ALPHABET.length)]
  }
  return { code, seed: s }
}

export function token(rng: () => number, length: number) {
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(rng() * ALPHABET.length)]
  return out
}
