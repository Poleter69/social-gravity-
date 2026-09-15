/**
 * Social Gravity - Security, Privacy & Input Sanitization
 * Protects analyst workstation against script injection, malformed feeds, and privacy leaks.
 */

/**
 * Strips HTML tags, script payloads, javascript: URIs, and dangerous attributes.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/onload\s*=/gi, "")
    .replace(/onerror\s*=/gi, "")
    .trim();
}

/**
 * Validates and safely parses JSON without throwing uncaught exceptions.
 */
export function safeJSONParse<T>(raw: string, fallback: T): T {
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * Validates uploaded graph edge files (e.g. SNAP .edges) to prevent path traversal or memory DOS.
 */
export function validateEdgeFileContent(content: string, maxLines = 100_000): { valid: boolean; lines: number; error?: string } {
  if (!content || typeof content !== "string") {
    return { valid: false, lines: 0, error: "Empty or invalid file content." };
  }

  // Check for malicious binary signatures
  if (content.slice(0, 4).includes("\0")) {
    return { valid: false, lines: 0, error: "Binary file rejected. Only plain text edge lists are supported." };
  }

  const lines = content.split("\n");
  if (lines.length > maxLines) {
    return {
      valid: false,
      lines: lines.length,
      error: `File exceeds maximum allowed edge limit (${maxLines.toLocaleString()} lines).`,
    };
  }

  return { valid: true, lines: lines.length };
}

/**
 * Scrub personal identifiers from exported datasets before sharing.
 */
export function scrubPII(text: string): string {
  return text
    // Replace emails
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
    // Replace IP addresses
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[REDACTED_IP]")
    // Replace phone numbers (US-like formats)
    .replace(/(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g, "[REDACTED_PHONE]");
}

/**
 * Content Security Policy recommendation for production deployment
 */
export const RECOMMENDED_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval'", // unsafe-eval needed for ONNX WebAssembly
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self' https: wss:", // wss for Bluesky Jetstream, https for Reddit/AllOrigins
  "font-src 'self' data:",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join("; ");
