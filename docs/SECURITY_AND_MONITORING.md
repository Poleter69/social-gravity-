# Social Gravity — Security Hardening & Zero-Cost Monitoring Architecture

Social Gravity implements defense-in-depth security standards and automated observability while incurring **$0.00/month** in operational overhead.

---

## 1. Security Architecture

### Content Security Policy (CSP)
Configured at the edge in [`public/_headers`](../public/_headers) and the HTML entry point:
- `default-src 'self'`: Prevents unauthorized script execution from untrusted third-party hosts.
- `script-src 'self' 'unsafe-eval'`: Allows WebAssembly/ONNX runtime execution required by Transformers.js while prohibiting arbitrary cross-site injection.
- `connect-src 'self' https: wss://jetstream*.bsky.network http://localhost:11434`: Restricts outbound network sockets strictly to the Bluesky AT Protocol firehose, user-configured Supabase/Neon APIs, and local Ollama daemon.
- `frame-ancestors 'none'`: Mitigates clickjacking attacks.

### Edge Rate Limiting
Enforced by Cloudflare Pages Function middleware ([`functions/api/_middleware.ts`](../functions/api/_middleware.ts)):
- **Threshold**: 120 requests / 60 seconds per client IP.
- **Action**: Returns HTTP 429 `Too Many Requests` with `Retry-After` header when exceeded.
- **Memory Footprint**: Self-cleaning sliding window in edge isolate memory with zero external Redis costs.

### Secret Protection & Environment Isolation
- All `.env` files with credentials are strictly blacklisted in `.gitignore`.
- CI automated scanner in [`.github/workflows/security-scan.yml`](../.github/workflows/security-scan.yml) checks commits for accidental API key patterns before merging.
- CodeQL static analysis runs weekly to detect injection vulnerabilities and memory leaks.

---

## 2. Zero-Cost Monitoring Stack

| Component | Service | Free Tier Configuration | Alerting Mechanism | Cost |
|---|---|---|---|---|
| **Health Probe** | UptimeRobot | Pings `/api/health` every 5 minutes | Email & Webhook alert on HTTP != 200 | **$0.00** |
| **Web Analytics** | Cloudflare Web Analytics | 100% Free, privacy-preserving, zero cookies | Cloudflare Dashboard (Traffic, Edge Latency) | **$0.00** |
| **CI/CD Health** | GitHub Actions Logs | Automatic build & test status badges | Email notifications on pipeline failure | **$0.00** |
| **Client Diagnostics** | In-Engine Telemetry | Real-time connector latency & queue monitoring | Settings Modal -> System Invariant Vault | **$0.00** |

---

## 3. Deploying the UptimeRobot Health Check

1. Login to [UptimeRobot](https://uptimerobot.com) (free tier includes 50 monitors).
2. Add a new `HTTP(s)` monitor targeting: `https://<your-deployment-url>/api/health`
3. Expected JSON response:
```json
{
  "status": "healthy",
  "engine": "Social Gravity — Computational Social Psychology Engine",
  "version": "3.0.0-production",
  "monthlyInfrastructureCost": "$0.00"
}
```
If the status changes from `healthy`, UptimeRobot alerts your team immediately without requiring PagerDuty.
