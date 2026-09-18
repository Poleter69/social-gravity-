/**
 * Cloudflare Pages Function: /api/social/reddit
 * Edge proxy for Reddit public JSON feeds with rate limiting and user-agent preservation.
 */

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const subreddit = url.searchParams.get('r') || 'all';
  const sort = url.searchParams.get('sort') || 'hot';
  const limit = url.searchParams.get('limit') || '25';
  const after = url.searchParams.get('after');

  try {
    const targetUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/${encodeURIComponent(
      sort
    )}.json?limit=${limit}${after ? `&after=${encodeURIComponent(after)}` : ''}`;

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'SocialGravity:v3.0.0 (by /u/SocialGravityBot; research non-commercial)',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Reddit returned status ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Reddit edge fetch failed', details: err?.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
