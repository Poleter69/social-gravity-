# Social Gravity — AI Models & Zero-Cost Neural Inference Guide

Social Gravity enforces an explicit invariant: **No mandatory paid LLM APIs or token costs.**

The platform uses a layered local-first inference hierarchy:
1. **Tier 1 (Client In-Browser)**: Transformers.js via ONNX Runtime WebAssembly & WebGPU.
2. **Tier 2 (Host Local LLM)**: Ollama (`llama3.2:3b`, `mistral`, `gemma2`) running locally on `localhost:11434`.
3. **Tier 3 (Free Serverless)**: Hugging Face Serverless Free Inference API.
4. **Tier 4 (Deterministic Fallback)**: Empirical psychological prior heuristics (100% reproducible, zero tokens, zero network).

---

## Tier 1: Transformers.js (In-Browser ONNX)

Social Gravity includes `@xenova/transformers` in its bundle to perform neural NLP directly inside the user's browser:
- **Model**: `SamLowe/roberta-base-go_emotions` (ONNX quantized)
- **Taxonomy**: 28 psychological emotion categories (e.g. *admiration, anger, fear, curiosity, skepticism, panic*).
- **Execution**: Runs in a background Web Worker utilizing WebGPU if available, with graceful CPU fallback.
- **Cost**: **$0.00** (runs entirely on the client's device).

### How it works:
```typescript
import { pipeline } from '@xenova/transformers';

const classifier = await pipeline('text-classification', 'SamLowe/roberta-base-go_emotions', {
  quantized: true,
});
const output = await classifier('Critical failure in banking liquidity reported by analysts');
// [{ label: 'fear', score: 0.84 }, { label: 'nervousness', score: 0.72 }]
```

---

## Tier 2: Ollama Local LLM Integration

When you want in-depth qualitative intelligence dispatches, Social Gravity connects directly to your local Ollama daemon.

### Setup (100% Free):
1. Download Ollama from [ollama.ai](https://ollama.ai).
2. Pull the recommended lightweight model:
   ```bash
   ollama run llama3.2:3b
   ```
3. Social Gravity's `OllamaClient` (`src/discovery/ollamaClient.ts`) automatically probes `http://localhost:11434/api/tags`.
4. If detected, executive summaries and counter-intervention dispatches are enriched with deep psychological analysis synthesized on your local GPU/CPU.

---

## Tier 3: Hugging Face Free Serverless Inference

If Ollama is not installed and you want cloud inference without running local models, you can configure a free Hugging Face API token:
1. Generate a free token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
2. Set `VITE_HUGGINGFACE_TOKEN=hf_...` in your `.env`.
3. The Cloudflare Edge Proxy (`/api/ai/hf-inference`) routes requests to Hugging Face's free community inference endpoints with zero cold start.

---

## Tier 4: Deterministic Empirical Synthesis (Zero-Downtime Guarantee)

If no neural models are installed and you are completely offline on an airplane, Social Gravity never crashes or blocks.
The system falls back to its **Deterministic Psychological Synthesis Engine**:
- Computes empirical Bayes estimates from the simulation's telemetry (Peak $R_0$, Echo-Chamber Polarization Index, Network Entropy).
- Generates structured, academically rigorous intelligence reports with exact numerical parity.
