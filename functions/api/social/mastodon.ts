/**
 * Cloudflare Pages Function: /api/social/mastodon
 * Edge proxy for federated Mastodon public timelines, solving browser CORS and edge caching.
 */

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const instance = url.searchParams.get('instance') || 'https://mastodon.social';
  const limit = url.searchParams.get('limit') || '25';
  const sinceId = url.searchParams.get('since_id');

  try {
    const targetUrl = `${instance}/api/v1/timelines/public?limit=${limit}${
      sinceId ? `&since_id=${sinceId}` : ''
    }`;

    const res = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SocialGravity-EdgeProxy/3.0 (+https://github.com)',
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Mastodon returned status ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15, s-maxage=15',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to fetch federated timeline', details: err?.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
