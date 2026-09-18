/**
 * Cloudflare Pages Function: /api/health
 * Public zero-cost health check endpoint for monitoring, UptimeRobot, and CI deployment verification.
 */

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const { request } = context;
  const cf = (request as any).cf || {};

  const healthPayload = {
    status: 'healthy',
    engine: 'Social Gravity — Computational Social Psychology Engine',
    version: '3.0.0-production',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(performance.now() / 1000),
    edgeLocation: cf.colo || 'LOCAL_EDGE',
    datacenterCountry: cf.country || 'GLOBAL',
    monthlyInfrastructureCost: '$0.00',
    freeTierCompliance: {
      hosting: 'Cloudflare Pages (Unlimited Free Bandwidth)',
      edgeCompute: 'Cloudflare Workers / Pages Functions (100k requests/day free)',
      database: 'Supabase / Neon / Local IndexedDB (Zero Cost)',
      aiInference: 'Local Transformers.js (In-Browser ONNX) / Local Ollama',
      socialIngestion: 'Bluesky Jetstream + Mastodon + Reddit JSON + RSS + GitHub Activity',
    },
  };

  return new Response(JSON.stringify(healthPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
