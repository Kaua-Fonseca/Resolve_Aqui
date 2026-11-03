export async function api(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const response = await fetch(url, { credentials: 'same-origin', ...init })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: { message: 'Não foi possível conectar ao servidor.' } } }
  }
}

export // Reduz a imagem no navegador antes do envio (rápido e economiza banco/banda).
async function compressImage(file: File, maxSize: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', 0.85),
  )
}

export async function uploadImage(file: File, kind: 'AVATAR' | 'WORK') {
  let blob: Blob = file
  try {
    blob = await compressImage(file, kind === 'AVATAR' ? 700 : 1600)
  } catch {
    if (file.size > 3 * 1024 * 1024)
      return { ok: false, message: 'Imagem muito grande. Use uma foto de até 3 MB.' }
  }
  const form = new FormData()
  form.append('file', blob, 'foto.jpg')
  form.append('kind', kind)
  const r = await api('/api/account/professional/images', { method: 'POST', body: form })
  return { ok: r.ok, message: r.ok ? '' : r.data?.error?.message || 'Não foi possível enviar a imagem.' }
}
