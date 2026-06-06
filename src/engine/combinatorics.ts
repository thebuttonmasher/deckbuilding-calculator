/** Exact binomial coefficient C(n, k) using BigInt. */
export function comb(n: bigint, k: bigint): bigint {
  if (k < 0n || k > n) return 0n
  if (k === 0n || k === n) return 1n
  if (k > n - k) k = n - k
  let result = 1n
  for (let i = 0n; i < k; i++) {
    result = (result * (n - i)) / (i + 1n)
  }
  return result
}
