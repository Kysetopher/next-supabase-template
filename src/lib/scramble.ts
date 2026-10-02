/**
 * Character pool used by the scramble/typing effects. Weighted on purpose —
 * repeated glyphs (1, 0, _, /, -) show up more often, which reads as a
 * "terminal glitch" rather than uniform random noise.
 */
export const SCRAMBLE_CHARACTERS =
  "1111000_________///////\\\\\\-------|||[][]}{+=:L7()<>";

export function getRandomScrambleChar(pool: string = SCRAMBLE_CHARACTERS): string {
  return pool[Math.floor(Math.random() * pool.length)];
}
