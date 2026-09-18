/**
 * Cloudflare Pages Function: /api/social/github
 * Edge proxy for GitHub public event stream with intelligent 304 ETag caching.
 */

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const perPage = url.searchParams.get('per_page') || '30';

  try {
    const targetUrl = `https://api.github.com/events?per_page=${perPage}`;
    const clientEtag = context.request.headers.get('if-none-match');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'SocialGravity-ZeroCost-Edge',
    };
    if (clientEtag) headers['If-None-Match'] = clientEtag;

    const res = await fetch(targetUrl, { headers });

    if (res.status === 304) {
      return new Response(null, { status: 304 });
    }

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `GitHub API error ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const etag = res.headers.get('etag');

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, s-maxage=30',
    };
    if (etag) responseHeaders['ETag'] = etag;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'GitHub edge fetch failed', details: err?.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
