/**
 * Minimal ULID implementation for edge runtime compatibility.
 * Generates lexicographically sortable unique IDs.
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function encodeTime(now: number, len: number): string {
  let str = '';
  let time = now;
  for (let i = len - 1; i >= 0; i--) {
    str = ENCODING[time % ENCODING_LEN]! + str;
    time = Math.floor(time / ENCODING_LEN);
  }
  return str;
}

function encodeRandom(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => ENCODING[b % ENCODING_LEN]!)
    .join('');
}

export function ulid(seedTime?: number): string {
  const ms = seedTime ?? Date.now();
  return encodeTime(ms, TIME_LEN) + encodeRandom(RANDOM_LEN);
}
