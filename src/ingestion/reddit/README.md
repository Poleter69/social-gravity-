# Social Gravity V2 — Reddit Intelligence Adapter

> **Production-Grade Reddit Computational Ingestion, Hierarchy Reconstruction & Temporal Graph Analytics**  
> *Transforms raw Reddit conversation trees and Pushshift payloads into deterministic, research-grade social graphs, temporal timelines, and cascade simulation topologies.*

---

## 1. Architectural Overview

The **Reddit Intelligence Adapter** is an offline-first, research-grade data pipeline designed to ingest, validate, sanitize, reconstruct, and analyze discussion networks from Reddit without leaking platform-specific abstractions to downstream simulators.

```
                  ┌────────────────────────────────────────┐
                  │ Pushshift API / Reddit JSON / Dumps    │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 1. Resilient Client & Rate Limiter     │
                  │    - Token-bucket rate limiting        │
                  │    - Checkpoint resume persistence     │
                  │    - Exponential backoff & jitter      │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 2. Raw Parser & Sanitizer              │
                  │    - HTML entity decoding              │
                  │    - Mention extraction (u/user)       │
                  │    - JSONL stream parsing              │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 3. Thread Hierarchy Reconstructor      │
                  │    - Arbitrary depth tree building     │
                  │    - Orphan comment detection          │
                  │    - Chronological sibling ordering    │
                  └───────────────────┬────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│ Privacy Layer    │        │ Emotional Layer  │        │ Graph Builders   │
│ - Salted SHA-256 │        │ - GoEmotions 27D │        │ - Reply Graph    │
│ - Codebook audit │        │ - Sentiment      │        │ - Mention Graph  │
│ - Mention redact │        │ - Cleaned text   │        │ - Co-presence    │
└─────────┬────────┘        └─────────┬────────┘        │ - Subreddit Net  │
          │                           │                 └─────────┬────────┘
          └───────────────────────────┼───────────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 4. Temporal Replay & Centrality Engine │
                  │    - PageRank & Betweenness (Brandes)  │
                  │    - k-Core & Gini inequality          │
                  │    - Time-slice tick state machine     │
                  └───────────────────┬────────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   │                                     │
                   ▼                                     ▼
        ┌──────────────────────┐              ┌──────────────────────┐
        │ Downstream Simulators│              │ Research Reporting   │
        │ - V2 DynamicGraph    │              │ - Research Markdown  │
        │ - V1 Society & Rumor │              │ - Local AI Analyst   │
        └──────────────────────┘              └──────────────────────┘
```

---

## 2. Supported Ingestion Formats & API Endpoints

The adapter supports multiple Reddit data sources seamlessly:
1. **Pushshift API** (Configurable base endpoint, defaults to `https://api.pushshift.io/reddit`):
   - `/submission/search/`: Queries submissions by subreddit, time window (`after`, `before`), score, and keywords.
   - `/comment/search/`: Queries comments with automatic pagination loops (`before` cursor stepping).
2. **Reddit Native JSON API**:
   - `https://www.reddit.com/r/{subreddit}/comments/{thread_id}.json`: Fetches the entire discussion tree for a submission in a single hierarchical response.
3. **Local JSON / JSONL Dumps**:
   - Line-delimited comment and submission exports from research archives.
   - Automatically tolerates malformed rows without terminating the batch.

---

## 3. Data Model & Transformation Pipeline

### Universal Transformation
The simulation core never knows an interaction originated from Reddit. Every comment, reply, and citation is transformed into a `CanonicalInteraction`:

$$\text{Interaction} = \langle \text{source}, \text{target}, \text{timestamp}, \text{type}, \text{weight}, \text{metadata} \rangle$$

* **Reply Ties**: $\text{Author}_{\text{child}} \to \text{Author}_{\text{parent}}$ with weight:
  $$w = \min\left(1.0, \, 0.5 + 0.1 \log_{10}(\text{score} + 1) + 0.05 \cdot (\text{depth} - 1)\right) \times (0.85 \text{ if controversial})$$
* **Mention Ties**: $\text{Author}_{\text{commenter}} \to \text{Author}_{\text{mentioned}}$ with base weight $0.45 - 0.50$.
* **Co-participation Ties**: Undirected edge between participants in the same thread:
  $$w_{\text{part}} = 1 - e^{-0.4 \times \text{sharedThreads}}$$

### Thread Hierarchy Reconstruction
`ThreadReconstructor` restores the tree structure:
* **Root**: Submission node ($t3\_...$)
* **Level 1**: Direct replies to submission ($parent\_id = t3\_...$)
* **Level $k$**: Arbitrary recursive nesting ($parent\_id = t1\_...$)
* **Orphan Handling**: Comments whose parent is missing from the dataset are captured in `thread.orphans` and attached to the root with orphan flags.
* **Telemetry**: Calculates conversation duration, maximum depth, branching factor, mean response latency, and unique authors.

---

## 4. Graph Topologies Generated

| Graph Topology | Node Type | Directed? | Edge Weight Interpretation |
| :--- | :--- | :--- | :--- |
| **Reply Graph** | Users | Directed ($A \to B$) | Conversational responsiveness and message volume |
| **Mention Graph** | Users | Directed ($A \to B$) | Direct citation, callouts, and referral ties |
| **Participation Graph** | Users | Undirected ($A \leftrightarrow B$) | Shared discussion space co-presence |
| **Subreddit Macro Graph** | Subreddits | Undirected ($S_1 \leftrightarrow S_2$) | Jaccard user mobility similarity across topics |

---

## 5. Analytics, Community Detection & Centrality

* **PageRank**: Power iteration with dangling node redistribution ($d = 0.85$, $\epsilon = 10^{-6}$).
* **Betweenness Centrality**: Exact Brandes $O(|V| \cdot |E|)$ shortest-path traversal.
* **Eigenvector Centrality**: Dominant eigenvector power iteration.
* **$k$-Core Decomposition**: Degree peeling identifying the densest cohesive conversational core.
* **Participation Gini**: Measures whether conversation is monopolized by a few accounts ($G \to 1.0$) or egalitarian ($G \to 0.0$).
* **Label Propagation Algorithm (LPA)**: Deterministic community discovery and Newman-Girvan Modularity $Q$.

---

## 6. CLI Usage & Research Toolkit

The toolkit provides dedicated NPM commands:

```bash
# 1. Inspect local Reddit storage, cache, and checkpoints
npm run reddit:inspect

# 2. Collect submissions and comments from a subreddit (with checkpoint resume)
npm run reddit:collect -- --subreddit technology --limit 500

# 3. Harvest and reconstruct a single discussion thread by ID
npm run reddit:thread -- --id abc123def

# 4. Generate research Markdown & JSON report with Local AI Analyst briefing
npm run reddit:report technology

# 5. Run step-by-step temporal timeline replay of interactions
npm run reddit:replay technology -- --ticks 10 --resolution 3600
```

---

## 7. Extension Guide for Custom Sources

To add a new Reddit-compatible data source (e.g. Hacker News, Mastodon, Lemmy, or Bluesky):
1. **Implement Parser**: Create an adapter in `src/ingestion/reddit/parsers/` that produces `ParsedRedditSubmission` and `ParsedRedditComment` records.
2. **Reconstruct Trees**: Pass parsed records to `ThreadReconstructor.reconstruct(sub, comments)`.
3. **Build Graphs**: Feed reconstructed threads to `RedditGraphBuilder.buildReplyGraph(threads)`.
4. **Simulate**: Convert directly using `RedditGraphBuilder.toDynamicGraph(graph)` or `RedditGraphBuilder.toSociety(graph)`.
