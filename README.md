# Social Gravity

> **Computational Social Psychology & Network Information Dynamics Simulator**  
> *A local-first, zero-API research environment for modeling epistemic trust, conformity cascades, influence structures, and rumor vectors across synthetic societies.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing%20(100%25)-emerald.svg)]()
[![Architecture](https://img.shields.io/badge/Architecture-Offline--First%20%7C%20Zero--API-amber.svg)]()
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)]()

---

## 1. Research Abstract

**Social Gravity** is a computational social science simulator designed to study how information, misinformation, and cognitive consensus propagate through heterogeneous human social topologies. 

Unlike black-box agent simulations that rely on non-deterministic external LLM API calls for every micro-interaction, Social Gravity implements a **dual-layer architecture**:
1. **Deterministic Mathematical Core**: Computes micro-level agent trait sampling, topological edge generation, triadic closure, and belief diffusion using verified probabilistic models (Watts-Strogatz, Barabási-Albert, Stochastic Block Models, and Asch conformity equations).
2. **Local AI Interpretability Layer**: Integrates with local, open-source small language models (e.g., Ollama Llama 3.2 3B) strictly for post-simulation macro analysis, narrative synthesis, and policy intervention auditing.

The entire environment runs locally on consumer hardware without sending telemetry or data over the network.

---

## 2. Mathematical & Topological Framework

### Agent Trait Parametrization
Each autonomous agent $i \in \{1, \dots, N\}$ is initialized with four orthogonal psychological traits:

$$\mathbf{\Theta}_i = \langle T_i, I_i, C_i, R_i \rangle$$

* **Epistemic Trust ($T_i \in [0, 1]$)**: The agent's baseline Bayesian prior to accept claims transmitted by peers. Sampled via truncated Gaussian $\mathcal{N}(\mu_T, \sigma_T^2)_{[0, 1]}$.
* **Social Influence ($I_i \in [0, 1]$)**: Gravitational persuasiveness. Generated via bounded Pareto distribution $P(I) \propto I^{-\alpha}$ ($\alpha \approx 2.4 - 2.8$), reflecting empirical power-law visibility in human social networks.
* **Normative Conformity ($C_i \in [0, 1]$)**: Susceptibility to majority consensus and peer pressure, formalized from Solomon Asch's conformity paradigm.
* **Risk Tolerance ($R_i \in [0, 1]$)**: Propensity to forward unverified assertions under uncertainty, grounded in Kahneman & Tversky's Prospect Theory.

### Network Topologies & Graph Science
* **Watts-Strogatz Small-World Model**: Generates high local clustering coefficients $\langle C \rangle$ while maintaining short average path length $\ell$ through rewiring probability $\beta$:
  $$C(0) = \frac{3(k - 2)}{4(k - 1)}, \quad \beta \in (0, 1)$$
* **Barabási-Albert Preferential Attachment**: Generates scale-free networks with power-law degree distributions $P(k) \sim k^{-3}$, creating natural hub nodes (e.g., influencers, journalists):
  $$\Pi(i) = \frac{k_i}{\sum_j k_j}$$
* **Stochastic Block Model (SBM)**: Partitions population into $M$ sub-communities with high intra-community connection density $p_{\text{in}}$ and sparse inter-community bridges $p_{\text{out}}$ (Granovetter weak ties).

---

## 3. Supported Society Archetypes

| Archetype | Topological Basis | Community Partitions | Psychological Profile |
| :--- | :--- | :--- | :--- |
| **School** | High-clustering Stochastic Block Model + Cohort Bridges | Grades 9–12, Homerooms, Faculty | High peer conformity, moderate trust, high adolescent risk variance |
| **Workplace** | Hierarchical Tree + Cross-Functional Taskforces | Executive, Engineering, Product, Sales, Ops | Structured reporting lines, high institutional trust, low risk tolerance |
| **City** | Small-World Spatial Clusters + Civic Hubs | Downtown, Suburbs, Research District, Historic Core | Heterogeneous trust, Granovetter weak-tie transit shortcuts, local media hubs |
| **Online Community** | Barabási-Albert Scale-Free + Algorithmic Echo Chambers | Sub-channels, Topic Rooms, Memetic Hubs | Heavy-tailed Pareto influence, low baseline trust, extreme virality tolerance |

---

## 4. Repository Structure

```text
social-gravity/
├── Databases/               # Real-World Datasets (SNAP Facebook, Twitter, WikiTalk, Reddit)
├── src/
│   ├── ingestion/           # Social Gravity V2 - Real Data Ingestion Subsystem
│   │   ├── reddit/          # Reddit Intelligence Adapter (API client, trees, replay, graphs, reports)
│   │   ├── anonymization/   # Deterministic Salted SHA-256 PII Anonymizer & Codebook
│   │   ├── validators/      # DatasetValidator (Integrity audit, malformed line rejection)
│   │   ├── transformers/    # EdgeWeightEngine, CommunityDetector (LPA + Modularity Q), CanonicalGraphBuilder
│   │   ├── parsers/         # Facebook, Reddit, Discord, Slack, WikiTalk parsers
│   │   ├── loaders/         # FileDatasetLoader (Local discovery & batch ingestion)
│   │   ├── reports/         # GraphIntelligenceReport (JSON & Research Markdown)
│   │   ├── schemas/         # Universal Canonical Interaction & Graph Types
│   │   └── cli.ts           # Ingestion CLI Tool
│   ├── graph/               # Social Gravity V2 - Dynamic Graph Subsystem
│   │   ├── engine/          # DynamicGraph, TickEngine, EdgeDynamics, DeterministicGenerator
│   │   ├── events/          # Monotonic EventLog, Priority EventScheduler
│   │   ├── storage/         # SnapshotStore (Checkpoints & Base States)
│   │   ├── metrics/         # DynamicMetricsEngine (Watts-Strogatz clustering, bridges, density)
│   │   ├── replay/          # ReplayEngine (O(Δt) time travel & counterfactual branches)
│   │   ├── types/           # DynamicNode, DynamicEdge, GraphEvent, DynamicGraphMetrics
│   │   └── README.md        # Detailed scientific & mathematical documentation
│   ├── society/             # Society Generator Subsystem (Archetypes & Topologies)
│   ├── psychology/          # Behavioral Decision & Trait Evolution Engines
│   ├── simulation/          # Rumor Diffusion, Cascade Tracking, Interventions
│   ├── datasets/            # Legacy Ingestion Adapters
│   ├── discovery/           # Local AI Discovery Engine (Ollama / Local Reasoning)
│   ├── App.tsx              # Interactive Mission Control Lab UI
│   ├── main.tsx             # React DOM mount point
│   └── index.css            # Palantir dark theme & cyber grid styling
├── tests/
│   ├── ingestion/           # V2 Ingestion, validation, anonymization & master merger test suites
│   ├── graph/               # V2 Dynamic Graph unit, replay & benchmark test suites
│   ├── society/             # Synthetic topology & archetype test suites
│   ├── psychology/          # Cognitive decision & evolution test suites
│   ├── simulation/          # Diffusion & debunking test suites
│   └── runAll.ts            # Master CLI test runner
```

---

## 5. Verification & Testing

The test suite validates mathematical bounds, seed determinism, degree distributions, and graph integrity across all components:

```bash
# 1. Execute the entire test suite via tsx
npm test

# 2. Run TypeScript strict compiler check and build production bundle
npm run build

# 3. Launch local interactive research dashboard
npm run dev
```

### Verified Test Suite Output
```text
========================================================
  SOCIAL GRAVITY - MASTER SYSTEM TEST SUITE
========================================================

--- Testing PRNG (Mulberry32) ---
✓ PRNG tests passed successfully.
--- Testing Statistical Distribution Samplers ---
✓ Distribution sampler tests passed successfully.
--- Testing Network Topology Generators ---
✓ Topology generator tests passed successfully.
--- Testing Society Archetypes ---
  ✓ School, Workplace, City, Online Community archetypes validated
✓ All 4 society archetypes passed validation.
--- Testing Society Generator (End-to-End) ---
✓ End-to-End Society Generator tests passed successfully.
--- Testing Behavioral Decision Engine ---
✓ Behavioral Decision Engine tests passed successfully.
--- Testing Psychological Evolution & Homeostasis ---
✓ Psychological State Evolution tests passed successfully.
--- Testing Dataset Ingestion Adapters ---
  ✓ SNAP Facebook dataset parsed & validated (60 nodes, 154 edges)
  ✓ Wikipedia Hoax adapter verified
✓ Dataset ingestion tests passed successfully.
--- Testing Rumor Engine & Debunking Counter-Intervention ---
✓ All Rumor Engine & Diffusion tests passed successfully.
--- Testing Local AI Discovery Engine ---
✓ All Local AI Discovery Engine tests passed successfully.

--- SOCIAL GRAVITY V2: DYNAMIC GRAPH FOUNDATION ---
--- Testing Relationship Weight Dynamics & Decay ---
✓ Edge dynamics and decay lifecycle validated.
--- Testing Event Log & Deterministic Scheduler ---
✓ Event log and scheduler validated.
--- Testing Dynamic Network Metrics Engine ---
✓ Dynamic network metrics engine validated against analytical topologies.
--- Testing Deterministic Graph Generation, Tick Engine & Replay ---
✓ Deterministic generation, tick engine, and exact time-travel replay validated.
--- Benchmarking Dynamic Graph Subsystem Performance ---
  [1,000 Nodes] 10 Ticks: 12.15ms/tick (Real-time target achieved)
  [5,000 Nodes] 5 Ticks: 37.61ms/tick (Interactive target achieved)
✓ Performance benchmarks passed successfully.

========================================================
  ALL SOCIETY, PSYCHOLOGY, SIMULATION, AI, V2 GRAPH & INGESTION TESTS PASSED (100%)
========================================================
```

---

## 6. Real Data Ingestion & Unified Graph Construction (V2)

The **Ingestion Subsystem** transforms Social Gravity from a synthetic society generator into a platform capable of ingesting heterogeneous real-world interaction datasets and converting them into canonical graphs ready for simulation:

### Multi-Platform Ingestion Capabilities
* **SNAP Facebook Ego Networks**: Ingests all 10 ego networks (4,039 nodes, 88,234 edges), decoding `.circles` (social groupings), `.edges` (alter ties), `.featnames`, `.feat`, and `.egofeat` into structured semantic taxonomies (education, workplace, locale, gender).
* **Master Facebook Merger**: Unifies all 10 distinct ego spheres into a single connected master graph, detecting inter-ego bridge nodes with $Q = 0.918$ modularity and $C = 0.617$ clustering.
* **SNAP Twitter Ego Networks**: Ingests directed followee/follower networks, extracting reciprocity ratios and mention networks.
* **Reddit Comment Trees**: Ingests nested hierarchical comment threads, computing conversation depth, upvote ratios, and GoEmotions sentiment.
* **Discord Chat Logs**: Ingests multi-channel logs, resolving `@mentions`, reply chains, and multi-party reaction graphs.
* **Slack Channel Exports**: Ingests organization channel archives, thread parent-child replies, and user mention structures.
* **Wikipedia Talk Networks**: Ingests edit/discussion communication graphs between Wikipedia editors.

### Privacy & Deterministic Anonymization
* **Salted HMAC-SHA-256**: All PII (usernames, email addresses, external handles) is deterministically hashed with a user-provided secret salt (`SG_ANONYMIZATION_SALT`).
* **Deterministic Codebook**: Produces human-readable pseudonyms (`User_A1B2`, `Redditor_7F3C`) with encrypted lookup dictionaries for authorized researchers.

### Reddit Intelligence Adapter
Transforms raw Reddit conversation trees and Pushshift payloads into 4 first-class graph representations:
* **Reply Graph**: Directed conversational ties ($A \to B$) with depth and score weighting.
* **Mention Graph**: Directed citation networks capturing `@` and `u/` user mentions.
* **Participation Graph**: Co-presence networks of users discussing in shared threads.
* **Subreddit Interaction Graph**: Macro cross-community network capturing user mobility and topic overlap.
* **Temporal Replay Engine**: Discretizes timestamps into simulation ticks with step, pause, seek, and historical state snapshots.
* **Emotional Readiness Layer**: Text cleaning and formal scaffolding for the 27 GoEmotions dimensions.
* **Local AI Analyst**: Mathematically-grounded briefings auditing bridge brokers, cascade bottlenecks, and Gini participation inequality.

### Ingestion CLI Commands
```bash
# Facebook Dataset Commands
npm run inspect:facebook          # Inspect 10 Facebook ego network files
npm run import:facebook 0         # Ingest and validate Facebook Ego #0
npm run report:facebook 0         # Generate research report for Ego #0
npm run merge:facebook            # Merge all 10 egos into 4,039-node master graph

# Reddit Dataset Commands
npm run reddit:inspect            # Inspect local Reddit storage, cache, & checkpoints
npm run reddit:collect -- --subreddit technology --limit 500  # Harvest subreddit
npm run reddit:thread -- --id <threadId>                      # Ingest & reconstruct thread
npm run reddit:report technology  # Generate Markdown report & AI Analyst briefing
npm run reddit:replay technology  # Run interactive temporal timeline replay
```

---

## 7. Offline Data Protocol & Export

Every generated society can be serialized into a self-contained, offline JSON artifact containing:
* Comprehensive node specifications ($\mathbf{\Theta}_i$, roles, community assignments).
* Complete adjacency edge lists with connection weights and structural classifications (`peer`, `hierarchical`, `bridge`, `weak_tie`).
* Pre-computed global and local topological metrics (clustering coefficient, node degree, graph density, bridge edge ratio).

This artifact is designed for downstream zero-latency consumption by:
1. **Rumor Engine**: Step-by-step epidemiological diffusion.
2. **Psychology Engine**: Dynamic opinion polarization and emotional valence shifts.
3. **Intervention Engine**: Simulating counter-messaging, bridge severing, and trust inoculations.
4. **Local AI Analyst**: Feeding structured summary metrics into Ollama (Llama 3.2 3B) for automated policy brief generation.

---

## 8. Scientific References

1. **Granovetter, M. S. (1973)**. *The Strength of Weak Ties*. American Journal of Sociology, 78(6), 1360–1380.
2. **Watts, D. J., & Strogatz, S. H. (1998)**. *Collective dynamics of 'small-world' networks*. Nature, 393(6684), 440–442.
3. **Barabási, A. L., & Albert, R. (1999)**. *Emergence of scaling in random networks*. Science, 286(5439), 509–512.
4. **Asch, S. E. (1951)**. *Effects of group pressure upon the modification and distortion of judgments*. Groups, Leadership, and Men, 222–236.
5. **Kahneman, D., & Tversky, A. (1979)**. *Prospect Theory: An Analysis of Decision under Risk*. Econometrica, 47(2), 263–291.
6. **Marsaglia, G., & Tsang, W. W. (2000)**. *A Simple Method for Generating Gamma Variables*. ACM Transactions on Mathematical Software, 26(3), 363–372.
