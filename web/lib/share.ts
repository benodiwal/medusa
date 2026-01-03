export interface SharedAnnotation {
  type: string
  originalText: string
  text?: string
}

export interface SharedPlan {
  content: string
  annotations: SharedAnnotation[]
  project?: string
  createdAt?: number
}

// Compress data using browser's CompressionStream API
export async function compressData(plan: SharedPlan): Promise<string> {
  const json = JSON.stringify(plan)
  const encoder = new TextEncoder()
  const data = encoder.encode(json)

  // Use CompressionStream if available, otherwise fall back to raw base64
  if (typeof CompressionStream !== 'undefined') {
    const cs = new CompressionStream('deflate')
    const writer = cs.writable.getWriter()
    writer.write(data)
    writer.close()

    const compressedChunks: Uint8Array[] = []
    const reader = cs.readable.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      compressedChunks.push(value)
    }

    const compressed = new Uint8Array(
      compressedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
    )
    let offset = 0
    for (const chunk of compressedChunks) {
      compressed.set(chunk, offset)
      offset += chunk.length
    }

    return btoa(String.fromCharCode(...compressed))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }

  // Fallback: just base64 encode
  return btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Decompress data from URL hash
export async function decompressData(encoded: string): Promise<SharedPlan> {
  // Restore base64 padding and characters
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  // Try to decompress, fall back to raw JSON
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate')
      const writer = ds.writable.getWriter()
      writer.write(bytes)
      writer.close()

      const decompressedChunks: Uint8Array[] = []
      const reader = ds.readable.getReader()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        decompressedChunks.push(value)
      }

      const decompressed = new Uint8Array(
        decompressedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
      )
      let offset = 0
      for (const chunk of decompressedChunks) {
        decompressed.set(chunk, offset)
        offset += chunk.length
      }

      const decoder = new TextDecoder()
      const json = decoder.decode(decompressed)
      return JSON.parse(json)
    } catch {
      // Fall through to try raw JSON
    }
  }

  // Fallback: try to parse as raw JSON
  const decoder = new TextDecoder()
  const json = decoder.decode(bytes)
  return JSON.parse(json)
}
