# Contributing to Social Gravity

Welcome! We are thrilled that you are interested in contributing to **Social Gravity: A Computational Social Psychology Engine**.

Our mission is to build the world's most accessible, scientifically rigorous simulation platform for understanding information cascades, echo chambers, and emotional contagion—engineered to run **entirely on free, open infrastructure ($0.00/month)**.

---

## The Zero-Cost Invariant

Before opening an issue or PR, please remember our primary engineering invariant:

> **Every architectural decision must prioritize free, production-usable infrastructure.**
> We never require paid APIs, paid tokens, or paid hosting. If a feature requires computation or inference, it must run on the client (Transformers.js), on a local model (Ollama), via public unauthenticated feeds (Bluesky, Mastodon, Reddit, RSS, GitHub), or within free serverless tiers (Cloudflare Pages, Supabase, Neon).

---

## Getting Started

### 1. Prerequisites
- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- *(Optional)* **Ollama**: For local LLM analysis (`llama3.2:3b`)

### 2. One-Command Setup
Clone the repository and run:
```bash
git clone https://github.com/your-org/social-gravity.git
cd social-gravity
npm run setup
```
Or manually:
```bash
npm install
npm test
npm run dev
```

The application will be live at `http://localhost:5173`.

---

## Development Workflow

### Branch Naming Conventions
- `feat/<feature-name>`: New feature or capability
- `fix/<bug-description>`: Bug fix
- `perf/<optimization>`: Performance optimization
- `docs/<topic>`: Documentation updates
- `test/<test-suite>`: New test coverage

### Code Quality Standards
1. **Strict TypeScript**: Do not use `any` unless strictly interfacing with dynamic external JSON.
2. **Deterministic Simulations**: All agent behavior and network generation must use the seeded PRNG (`mulberry32`) to guarantee reproducible science.
3. **No Paid Dependencies**: Never add dependencies or SDKs that necessitate a credit card or paid billing tier.
4. **Offline Parity**: Features must degrade gracefully into local offline mode when network calls fail.

---

## Testing Protocol

All pull requests must pass the Master System Test Suite:
```bash
npm test
```
To verify production bundle compilation:
```bash
npm run build
```

---

## Submitting a Pull Request

1. Fork the repository and create your branch from `main`.
2. Commit your changes with clear, descriptive commit messages.
3. Ensure all tests pass (`npm test`) and type-checks succeed (`npx tsc --noEmit`).
4. Push to your fork and submit a Pull Request.
5. Fill out the Pull Request template and verify the Zero-Cost compliance checklist.

Thank you for helping us advance computational social science for everyone!
