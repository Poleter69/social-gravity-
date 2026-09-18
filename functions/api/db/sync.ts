/**
 * Cloudflare Pages Function: /api/db/sync
 * Edge sync endpoint for batch telemetry and simulation logs.
 */

export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string>;
}): Promise<Response> {
  const { request, env } = context;

  try {
    const payload = await request.json();
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Forward batch telemetry to Supabase free PostgreSQL
      const forwardRes = await fetch(`${supabaseUrl}/rest/v1/telemetry_frames`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });

      if (forwardRes.ok) {
        return new Response(JSON.stringify({ status: 'synced_to_supabase', count: Array.isArray(payload) ? payload.length : 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Edge acknowledgment if no cloud DB configured (client holds IndexedDB vault)
    return new Response(
      JSON.stringify({
        status: 'acknowledged_at_edge',
        provider: 'client_vault',
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Sync processing error', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
