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

// ── Image sharing (result cards) ──────────────────────────────────────────────

/** True when the browser can hand a PNG to the native share sheet (mostly mobile). */
export function canShareImage(blob: Blob, filename: string): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false
  try {
    return navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] })
  } catch {
    return false
  }
}

export async function shareImage(blob: Blob, filename: string, text?: string): Promise<'shared' | 'failed'> {
  try {
    await navigator.share({ files: [new File([blob], filename, { type: blob.type })], text })
    return 'shared'
  } catch {
    return 'failed'
  }
}

/** Copies a PNG to the clipboard. Returns false where ClipboardItem is unsupported. */
export async function copyImage(blob: Blob): Promise<boolean> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) return false
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    return true
  } catch {
    return false
  }
}
