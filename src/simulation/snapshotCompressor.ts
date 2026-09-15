/**
 * Social Gravity - Snapshot Compression
 * LZ-based string compression for replay snapshot history using built-in CompressionStream API.
 * Falls back to raw JSON storage if CompressionStream is unavailable.
 */

function hasCompressionSupport(): boolean {
  return typeof CompressionStream !== 'undefined';
}

async function compressString(input: string): Promise<string> {
  if (!hasCompressionSupport()) return btoa(input);
  const encoder = new TextEncoder();
  const compressed = encoder.encode(input);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  await writer.write(compressed);
  await writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return btoa(String.fromCharCode(...result));
}

async function decompressString(input: string): Promise<string> {
  if (!hasCompressionSupport()) return atob(input);
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  await writer.write(bytes);
  await writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const decoder = new TextDecoder();
  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return decoder.decode(result);
}

export interface CompressedSnapshot {
  round: number;
  compressed: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

export class SnapshotCompressor {
  private cache = new Map<number, CompressedSnapshot>();

  async compress<T>(round: number, data: T): Promise<CompressedSnapshot> {
    const json = JSON.stringify(data);
    const compressed = await compressString(json);
    const snap: CompressedSnapshot = {
      round,
      compressed,
      originalSizeBytes: json.length,
      compressedSizeBytes: compressed.length,
    };
    this.cache.set(round, snap);
    return snap;
  }

  async decompress<T>(snap: CompressedSnapshot): Promise<T> {
    const json = await decompressString(snap.compressed);
    return JSON.parse(json) as T;
  }

  compressionRatio(): number {
    let orig = 0, comp = 0;
    for (const s of this.cache.values()) { orig += s.originalSizeBytes; comp += s.compressedSizeBytes; }
    return orig > 0 ? 1 - comp / orig : 0;
  }

  clear(): void { this.cache.clear(); }
  size(): number { return this.cache.size; }
}
