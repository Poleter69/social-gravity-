/**
 * Cloudflare Pages Function: /api/social/rss
 * Edge RSS/Atom feed fetcher with regex XML parser to return JSON articles.
 */

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const feedUrl = url.searchParams.get('url');

  if (!feedUrl) {
    return new Response(JSON.stringify({ error: 'Missing feed url query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(feedUrl, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'SocialGravity-FeedIngester/3.0',
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Feed source returned status ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const xml = await res.text();
    const items = parseXmlFeed(xml);

    return new Response(JSON.stringify({ feedUrl, itemsCount: items.length, items }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120, s-maxage=120',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to fetch RSS feed', details: err?.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function parseXmlFeed(xml: string): Array<{ title: string; link: string; pubDate?: string; description?: string }> {
  const items: Array<{ title: string; link: string; pubDate?: string; description?: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 30) {
    const itemContent = match[1];
    const titleMatch = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i.exec(itemContent);
    const linkMatch = /<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i.exec(itemContent);
    const pubDateMatch = /<pubDate>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/i.exec(itemContent);
    const descMatch = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i.exec(itemContent);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : undefined,
        description: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').slice(0, 300).trim() : undefined,
      });
    }
  }

  return items;
}
