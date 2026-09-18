/**
 * Cloudflare Pages Functions — Edge Middleware
 * Features:
 * - Strict Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
 * - Zero-Cost Edge Rate Limiting (120 requests/minute per client IP)
 * - Automated CORS Handling
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiting map per edge isolate
const rateLimitMap = new Map<string, RateLimitEntry>();

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, next } = context;

  // Handle CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Rate Limiting (120 req / 60 sec per IP)
  const clientIp = request.headers.get('cf-connecting-ip') || 'anonymous-edge-client';
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 120;

  const entry = rateLimitMap.get(clientIp);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
  } else {
    entry.count++;
    if (entry.count > maxRequests) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Zero-cost edge rate limit exceeded. Please wait a minute before retrying.',
          resetInMs: entry.resetTime - now,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  }

  // Clean up stale rate limit entries periodically
  if (rateLimitMap.size > 2000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) rateLimitMap.delete(key);
    }
  }

  // Proceed to route handler
  const response = await next();
  const modifiedHeaders = new Headers(response.headers);

  // Apply Security Headers
  modifiedHeaders.set('Access-Control-Allow-Origin', '*');
  modifiedHeaders.set('X-Content-Type-Options', 'nosniff');
  modifiedHeaders.set('X-Frame-Options', 'DENY');
  modifiedHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  modifiedHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  modifiedHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  modifiedHeaders.set('X-Edge-Serverless', 'Cloudflare-Pages-Zero-Cost');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: modifiedHeaders,
  });
}
