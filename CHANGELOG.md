# Changelog

All notable changes to Social Gravity are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha] - 2026-09-15

### Added
- **Milestone V1-V9 Release Protocol**: Full production validation, security audits, and benchmark verification suite.
- **Empirical Prediction Evaluator (`src/benchmarks/predictionEvaluator.ts`)**: Continuous accuracy tracking (MAE, RMSE, Brier calibration score) and outbreak early-warning classification.
- **Dynamic Graph Engine**: Temporal edge decay, triadic closure reinforcement, and dynamic community detection.
- **GoEmotions Affective Intelligence**: Local on-device NLP mapping 27 emotion labels to continuous Valence/Arousal circumplex vectors.
- **3-Way Counterfactual Simulation**: Parallel branch branching to compare bridge node inoculation, mass broadcast debunking, and algorithmic rate limiting.
- **Real-World Case Studies Suite**: Deterministic simulations of 2020 5G-COVID panic, 2023 SVB bank run, 2022 AI deepfake scandal, and 2024 election tabulator rumor.
- **Real Dataset Pipelines**: Stanford SNAP Facebook ego-networks and Reddit hierarchical conversation tree adapters.
- **Live Intelligence Connectors**: Ingestion connectors for Reddit JSON feeds, Bluesky Jetstream WebSockets, news RSS, and local JSON file stream drops.
- **Analyst Export Center**: Native PDF intelligence briefs with printable HTML CSS layout, tabular CSV multi-section exports, and JSON replay dumps.
- **Automated Penetration Test Suite (`tests/security/penetrationTest.ts`)**: 100% pass rate across XSS, DoS, PII scrubbing, and CSP isolation.

### Changed
- Refactored simulation state loop into a non-blocking, web-worker-compatible streaming architecture.
- Optimized bundle splitting with Vite: 61.2% reduction in main application bundle (transformers and charts code-split into lazy-loaded vendor chunks).
- Upgraded desktop packaging to Tauri v1.x with strict filesystem sandboxing and CSP lockdown.

### Security
- Neutralized all 6 XSS test vectors in agent metadata, post rendering, and export templates.
- Enforced CSV formula injection sanitization on spreadsheet exports.
- Implemented deterministic regex scrubbing for IP addresses, emails, and phone numbers in analyst intelligence briefs.
