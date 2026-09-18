/**
 * Social Gravity — Zero-Cost Unified Storage Layer
 * 
 * Manages simulation artifacts, intelligence dossiers, and user-uploaded datasets
 * across three zero-cost tiers:
 * 1. Supabase Storage (1 GB Free Tier)
 * 2. Cloudflare R2 (10 GB Free Tier per month via Edge Worker)
 * 3. Client IndexedDB Storage + Direct Local File Downloads (100% Offline & $0.00)
 */

export interface StorageUploadResult {
  url: string;
  storageProvider: 'supabase_storage' | 'cloudflare_r2' | 'client_vault';
  sizeBytes: number;
  key: string;
}

export class ZeroCostStorage {
  private static instance: ZeroCostStorage | null = null;
  private supabaseUrl: string | null = null;
  private supabaseAnonKey: string | null = null;

  private constructor() {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      this.supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || null;
      this.supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || null;
    }
  }

  public static getInstance(): ZeroCostStorage {
    if (!ZeroCostStorage.instance) {
      ZeroCostStorage.instance = new ZeroCostStorage();
    }
    return ZeroCostStorage.instance;
  }

  /**
   * Uploads an artifact (dossier HTML, JSON replay snapshot, or dataset).
   * Automatically attempts Supabase Storage if configured; falls back to local client vault.
   */
  public async uploadArtifact(
    bucket: 'dossiers' | 'snapshots' | 'datasets',
    path: string,
    data: string | Blob,
    mimeType: string = 'text/plain'
  ): Promise<StorageUploadResult> {
    const size = typeof data === 'string' ? new Blob([data]).size : data.size;

    // Try Supabase free tier storage bucket
    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        const body = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data;
        const res = await fetch(
          `${this.supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`,
          {
            method: 'POST',
            headers: {
              apikey: this.supabaseAnonKey,
              Authorization: `Bearer ${this.supabaseAnonKey}`,
              'Content-Type': mimeType,
              'x-upsert': 'true',
            },
            body,
          }
        );

        if (res.ok) {
          const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
          return {
            url: publicUrl,
            storageProvider: 'supabase_storage',
            sizeBytes: size,
            key: path,
          };
        }
      } catch (e) {
        console.warn('[ZeroCostStorage] Supabase storage upload deferred, using local client vault:', e);
      }
    }

    // Local in-memory / blob URL fallback
    const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data;
    const localUrl = URL.createObjectURL(blob);

    return {
      url: localUrl,
      storageProvider: 'client_vault',
      sizeBytes: size,
      key: path,
    };
  }

  /**
   * Triggers an immediate zero-cost browser download of an artifact.
   */
  public downloadLocally(filename: string, content: string | Blob, mimeType: string = 'text/plain'): void {
    if (typeof window === 'undefined') return;

    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Parses user-uploaded JSON or CSV dataset in-browser with zero cloud processing.
   */
  public async parseUploadedFile(file: File): Promise<{
    filename: string;
    type: 'json' | 'csv' | 'unknown';
    data: unknown;
    sizeBytes: number;
  }> {
    const text = await file.text();
    const isJson = file.name.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[');

    if (isJson) {
      try {
        const parsed = JSON.parse(text);
        return {
          filename: file.name,
          type: 'json',
          data: parsed,
          sizeBytes: file.size,
        };
      } catch (e) {
        // Fall back to plain text
      }
    }

    // Simple CSV parser
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const headers = lines[0]?.split(',').map((h) => h.trim().replace(/^"|"$/g, '')) || [];
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] || '';
      });
      return obj;
    });

    return {
      filename: file.name,
      type: 'csv',
      data: rows,
      sizeBytes: file.size,
    };
  }
}

export const getZeroCostStorage = (): ZeroCostStorage => ZeroCostStorage.getInstance();
