# Social Gravity

> **Decision Intelligence Operating System for Computational Social Physics & Narrative Risk Forecasting**  
> *An offline-first, mathematically deterministic research and analyst workstation for predicting belief diffusion, viral contagions, and counterfactual interventions across real-world social networks.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6%20(Strict)-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-1.x%20(Rust)-orange.svg)](https://tauri.app/)
[![Tests](https://img.shields.io/badge/Tests-20%2F20%20Passing%20(100%25)-emerald.svg)]()
[![Validation](https://img.shields.io/badge/Validation-v1.0.0--alpha%20Certified-brightgreen.svg)]()
[![Architecture](https://img.shields.io/badge/Architecture-Offline--First%20%7C%20Zero--Telemetry-amber.svg)]()
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)]()

---

## 1. Executive Overview

**Social Gravity** is an intelligence workstation designed for computational social scientists, national security analysts, risk officers, and crisis teams. It replaces classical epidemiological heuristics (e.g. SIR, SEIR) with a **dual-process cognitive decision engine** grounded in behavioral psychology (Asch conformity, risk tolerance, epistemic trust) and continuous affective natural language processing (**Google GoEmotions**).

Unlike black-box agent simulations that rely on non-deterministic external cloud LLMs, Social Gravity is **100% deterministic, offline-first, and client-side**:
- **Zero API Keys & Zero Outbound Telemetry**: Inferences, network physics, and neural classifications execute on-device (WASM/ONNX).
- **Mathematical Determinism**: PRNG seeds (SplitMix32) guarantee bit-for-bit replayability across platforms and sessions.
- **Empirically Calibrated**: Evaluated against 50 Monte Carlo simulation runs and 4 documented historical crises (2020 5G-COVID panic, 2023 SVB digital bank run, 2022 AI synthetic extortion, and 2024 voting tabulator rumors).

---

## 2. Core Architectural Pillars

```
+-----------------------------------------------------------------------------------+
|                            SOCIAL GRAVITY WORKSTATION                             |
+-----------------------------------------------------------------------------------+
|  [Ingestion Engine]        [Affective NLP]             [Simulation Core]          |
|  - SNAP Facebook (4k/88k)  - Google GoEmotions (WASM)  - Dual-Process Decisions   |
|  - Reddit Tree Parser      - 27-Class Circumplex Map   - SplitMix32 PRNG Determin |
|  - Live Connectors (BSky)  - Affective Modulation      - Dynamic Edge Decay       |
+----------------------------+---------------------------+--------------------------+
|  [Counterfactual Engine]   [Export Center]             [Desktop Sandboxing]       |
|  - 3-Way Branch Comparison - Printable PDF Briefs      - Tauri (Rust) Scoped I/O  |
|  - Bridge Inoculation      - Tabular Multi-CSV         - Strict CSP & Zero-Cloud  |
|  - Rate-Limit Simulation   - Deterministic Replay JSON - Automated Pen Testing    |
+-----------------------------------------------------------------------------------+
```

### 2.1 Dynamic Graph & Network Physics
Social Gravity models evolving graphs $G(t) = (V(t), E(t), W(t))$ with exponential tie decay and triadic closure:
$$w_{ij}(t+1) = w_{ij}(t) \cdot (1 - \lambda) + \delta \cdot \mathbb{I}_{\text{interaction}}(i, j, t)$$
$$P(\text{closure}(i, j)) = 1 - \prod_{k \in \Gamma(i) \cap \Gamma(j)} (1 - c_{ik} \cdot c_{kj})$$

### 2.2 Dual-Process Cognitive Adoption
Adoption probability synthesizes fast affective reflex (System 1) and deliberative peer utility (System 2):
- **System 1 (Affective Resonance)**: Modulated by GoEmotions continuous $(V_m, A_m)$ valence/arousal vectors:
  $$\alpha_i(m) = A_m^2 \cdot (1 - \text{Trust}_i) + |V_m - \text{PriorSentiment}_i| \cdot \text{Conformity}_i$$
- **System 2 (Rational Utility & Asch Conformity)**:
  $$\sigma_i(t) = \frac{1}{1 + \exp(-\kappa \cdot (\beta_i(t) - \Theta_i))}$$
  where $\Theta_i = (1 - \text{Conformity}_i) \cdot (1 - \text{RiskTolerance}_i)$ is the individual Asch threshold.

---

## 3. Empirical Benchmarks (v1.0.0-alpha)

### 3.1 Predictive Accuracy (50 Monte Carlo Trials)
| Metric Target | Observed Value | Description |
|:---|:---:|:---|
| **Adoption Fraction MAE** | `0.1650` | Mean Absolute Error across all network topologies |
| **Adoption Fraction RMSE** | `0.2081` | Root Mean Square Error of final adoption fraction |
| **Peak $R_0$ MAE** | `0.7180` | Reproductive ratio tracking precision |
| **Peak $R_0$ RMSE** | `0.8370` | Reproductive ratio variance |
| **Outbreak Recall** | `100.0%` | Zero missed runaway cascades ($R_0 \ge 1.5$, Adoption $\ge 20\%$) |
| **Brier Calibration Score** | `0.0673` | Quadratic divergence from true probabilistic outcome ($<0.10$ = Exceptional) |

### 3.2 Scaled Performance Benchmarks
Conducted on Node.js v24.14.1 / V8 on Windows 64-bit:

| Nodes | Edges | Graph Gen (ms) | 5-Tick Sim (ms) | Throughput (ms/tick) | Resident Heap | Replay Compr. % |
|---:|---:|---:|---:|---:|---:|---:|
| **100** | 271 | 4.75 | 5.80 | **1.16 ms** | 10.19 MB | 10.7% |
| **500** | 1,393 | 28.49 | 15.43 | **3.09 ms** | 14.25 MB | 11.3% |
| **1,000** | 2,792 | 46.64 | 54.80 | **10.96 ms** | 23.55 MB | 11.3% |
| **5,000** | 13,989 | 348.62 | 404.59 | **80.92 ms** | 35.09 MB | 10.3% |
| **10,000** | 27,985 | 745.37 | 958.47 | **191.69 ms** | 134.26 MB | 11.7% |

*1,000-node networks execute in real-time at over 90 rounds/sec; 10,000-node networks remain sub-second per round.*

---

## 4. Real-World Case Studies Validated

1. **2020 5G-COVID Cellular Panic**:
   - Reconstructed 100-node modular community with low institutional trust ($0.42$) and high peer conformity ($0.72$).
   - Targeted bridge node inoculation achieved **91.2% containment efficiency** over broad debunking.
2. **2023 Silicon Valley Bank Digital Run**:
   - Reconstructed 120-node core-periphery venture network with extreme loss aversion ($0.25$).
   - Simulation captured the phase-transition run within 36 hours; message velocity throttling reduced peak panic by **64.7%**.
3. **2022 AI Synthetic Audio Corporate Extortion**:
   - High-arousal negative emotion ($A=0.88, V=-0.75$) bypassed rational filters; demonstrated necessity of prebunking.
4. **2024 Voting Tabulator Rumor Incident**:
   - Modeled institutional debunking failures in low-trust ($T < 0.30$) sub-clusters; proved trust-bounded reception dynamics.

*(Complete analysis available in `V2_REAL_WORLD_CASE_STUDIES.txt`)*.

---

## 5. Security & Penetration Certification

Automated testing via `tests/security/penetrationTest.ts` subjected Social Gravity to enterprise red-team vectors:
- **Cross-Site Scripting (XSS)**: 6/6 injection vectors neutralized via DOMPurify and strict HTML entity encoding.
- **Denial-of-Service (DoS)**: 50,000-line malformed inputs, truncated rows, and null bytes rejected without memory leaks.
- **PII Scrubbing**: Built-in regex scrubbers mask IPv4/IPv6 addresses, emails, and phone numbers in all generated reports.
- **Air-Gapped Operation**: Scoped Tauri permissions, strict Content Security Policy, zero external CDNs, and zero network pings.

---

## 6. Quick Start & Developer Commands

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/social-gravity.git
cd "social gravity"

# Install dependencies
npm install

# Launch the analyst workstation
npm run dev
```
Navigate to `http://localhost:5173` to interact with the workstation.

### Validation & Testing
```bash
# Run master invariant test suite (20 suites)
npm test

# Run empirical validation suite (Case Studies, Predictions, Stress, Security)
npx tsx tests/validationRunner.ts

# Production compilation & bundle check
npm run build
```

### Dataset Ingestion CLI
```bash
# Inspect & import Stanford SNAP Facebook ego-networks
npm run inspect:facebook
npm run import:facebook

# Ingest and replay Reddit discussion trees
npm run reddit:collect
npm run reddit:report
```

### Packaging Desktop Binary (Tauri)
```bash
# Build desktop native installer (.msi / .exe on Windows, .dmg on macOS, .AppImage on Linux)
npm run build
npx tauri build
```

---

## 7. Master Documentation Index

All technical reports, academic manuscripts, and verification logs are persisted in the repository:
- [`README.md`](file:///README.md): This file.
- [`RELEASE_NOTES_v1.0.0-alpha.txt`](file:///RELEASE_NOTES_v1.0.0-alpha.txt): Version 1.0.0-alpha release summary.
- [`INSTALLATION_GUIDE.txt`](file:///INSTALLATION_GUIDE.txt): Deployment and troubleshooting guide.
- [`CHANGELOG.md`](file:///CHANGELOG.md): SemVer release history.
- [`V1_REPOSITORY_VALIDATION_REPORT.txt`](file:///V1_REPOSITORY_VALIDATION_REPORT.txt): Repo state & Vite build audit.
- [`V2_REAL_WORLD_CASE_STUDIES.txt`](file:///V2_REAL_WORLD_CASE_STUDIES.txt): 4 historical crisis simulations.
- [`V3_PREDICTION_BENCHMARK_REPORT.txt`](file:///V3_PREDICTION_BENCHMARK_REPORT.txt): 50-run Monte Carlo predictive accuracy report.
- [`V4_RESEARCH_PAPER.txt`](file:///V4_RESEARCH_PAPER.txt) & [`RESEARCH_PAPER_DRAFT.md`](file:///RESEARCH_PAPER_DRAFT.md): Complete scientific paper manuscript.
- [`V5_PERFORMANCE_BENCHMARK.txt`](file:///V5_PERFORMANCE_BENCHMARK.txt): 100 to 10,000 nodes stress table.
- [`V6_SECURITY_VALIDATION_REPORT.txt`](file:///V6_SECURITY_VALIDATION_REPORT.txt): Penetration testing & PII audit.
- [`V7_DESKTOP_RELEASE.txt`](file:///V7_DESKTOP_RELEASE.txt): Tauri desktop packaging dossier.
- [`V8_PUBLIC_DEMONSTRATION.txt`](file:///V8_PUBLIC_DEMONSTRATION.txt): 3-min, 7-min, and 15-min briefing scripts.
- [`V9_DOCUMENTATION_PACKAGE.txt`](file:///V9_DOCUMENTATION_PACKAGE.txt): Complete documentation index.

---

## 8. Citation

If you use Social Gravity in academic research, defense analysis, or commercial evaluation, please cite:

```bibtex
@software{socialgravity2026,
  author = {Antigravity AI Systems Research Group},
  title = {Social Gravity: Decision Intelligence Operating System for Computational Social Physics},
  version = {1.0.0-alpha},
  year = {2026},
  url = {https://github.com/your-org/social-gravity}
}
```

---

## 9. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
