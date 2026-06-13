export async function shareResult(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator === 'undefined') return 'failed'
  if (navigator.share) {
    try { await navigator.share({ text }); return 'shared' } catch { return 'failed' }
  }
  if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); return 'copied' } catch {}
  }
  return 'failed'
}
