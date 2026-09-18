/**
 * Cloudflare Pages Function: /api/ai/hf-inference
 * Edge proxy for Hugging Face Free Serverless Inference API.
 * Never requires OpenAI or paid LLM tokens.
 */

export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string>;
}): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { model = 'SamLowe/roberta-base-go_emotions', inputs, parameters = {} } = body as any;

    // Use environment secret if configured, or caller token, or free public inference
    const token = env.HUGGINGFACE_TOKEN || request.headers.get('x-hf-token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const hfRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs, parameters }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      return new Response(
        JSON.stringify({
          error: `Hugging Face free inference returned ${hfRes.status}`,
          details: errText,
          fallbackNote: 'Client will automatically use local Transformers.js or deterministic priors.',
        }),
        { status: hfRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await hfRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Inference request failed', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
