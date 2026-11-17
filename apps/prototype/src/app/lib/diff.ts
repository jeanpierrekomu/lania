export interface DiffPart {
  text: string
  type: 'same' | 'del' | 'add'
}

const tokenize = (s: string) => s.match(/\S+|\s+/g) ?? []

/** Word-level diff (LCS) between two drafts, preserving whitespace and line breaks. */
export function diffWords(a: string, b: string): DiffPart[] {
  const A = tokenize(a)
  const B = tokenize(b)
  const n = A.length
  const m = B.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out: DiffPart[] = []
  const push = (text: string, type: DiffPart['type']) => {
    const last = out[out.length - 1]
    if (last && last.type === type) last.text += text
    else out.push({ text, type })
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      push(A[i], 'same')
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) push(A[i++], 'del')
    else push(B[j++], 'add')
  }
  while (i < n) push(A[i++], 'del')
  while (j < m) push(B[j++], 'add')
  return out
}
