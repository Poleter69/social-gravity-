# Social Gravity — Reddit Network Intelligence Report
**Subreddit**: `r/technology`  
**Report ID**: `sg_rep_technology_1788760181025`  
**Timestamp**: 2026-09-07T05:49:41.025Z  

---

## 1. Dataset Volume & Temporal Horizon

| Metric | Measured Value | Description |
| :--- | :--- | :--- |
| **Subreddit Target** | **r/technology** | Observed discussion community |
| **Total Submissions** | **1** | Seed root discussion threads |
| **Total Comments** | **6** | Reconstructed child replies |
| **Unique Active Authors** | **5** | Non-deleted participant accounts |
| **Temporal Span** | **7 hrs** | 2026-09-06T17:49:41.000Z $\to$ 2026-09-07T00:49:41.000Z |
| **Average Item Score** | **35** | Mean community upvote approval |
| **Max Score** | **142** | Peak viral submission / comment |

---

## 2. Network Topology & Community Structure

| Metric | Measured Value | Mathematical Interpretation |
| :--- | :--- | :--- |
| **Total Nodes ($|V|$)** | **5** | Unique active participants in interaction network |
| **Total Edges ($|E|$)** | **6** | Direct conversational reply / citation ties |
| **Graph Density ($\rho$)** | **0.6** | Ratio of actual edges to possible edges |
| **Average Degree ($\langle k \rangle$)** | **1.2** | Mean interactions per individual |
| **Global Clustering ($C$)** | **0** | Watts-Strogatz triadic closure probability |
| **Newman Modularity ($Q$)** | **0.75** | Strength of community division ($Q > 0.3$ = modular) |
| **Identified Clusters** | **1** | Distinct conversational subgroups |
| **Boundary Bridges** | **0** | Inter-community information brokers |
| **Max $k$-Core ($k_{\max}$)** | **2** | Deepest mutually connected core subgraph |

---

## 3. Conversation Dynamics & Cascade Morphology

* **Largest Discussion Thread**:
  - *ID*: `benchmark_technology`
  - *Title*: "State of r/technology Consensus & Information Cascades"
  - *Volume*: **6** comments
* **Deepest Discussion Branch**:
  - *ID*: `benchmark_technology`
  - *Max Depth*: **3** nested levels
* **Fastest Growing Thread**:
  - *Velocity*: **0.86** comments/hour
* **Mean Branching Factor**: **1** replies per active parent
* **Mean Response Latency**: **7800s** (~130 min)
* **Participation Gini Inequality**: **0.1714**  
  *(Values $\to 1.0$ indicate conversation monopolization by a tiny elite; values $\to 0.0$ indicate egalitarian dialogue)*

---

## 4. Key Influence Vectors & Centrality Hierarchy

### Top PageRank Gravitational Hubs
1. **Redditor_1**: PageRank `0.250071` (Degree: 1)
2. **Redditor_3**: PageRank `0.24256` (Degree: 1)
3. **Redditor_2**: PageRank `0.236176` (Degree: 2)
4. **Redditor_4**: PageRank `0.140819` (Degree: 1)
5. **Redditor_5**: PageRank `0.130375` (Degree: 1)

### Top Betweenness Bottlenecks (Information Brokers)
1. **Redditor_2**: Betweenness Centrality `0.5`
2. **Redditor_1**: Betweenness Centrality `0.5`
3. **Redditor_3**: Betweenness Centrality `0.5`
4. **Redditor_4**: Betweenness Centrality `0.25`
5. **Redditor_5**: Betweenness Centrality `0.25`

---

## 5. Operational Cascade & Intervention Readiness

1. **Information Vector Containment**: Quarantine or fact-check early claims targeting top betweenness brokers to halt cross-community transmission.
2. **Polarization Choke Points**: High participation Gini (0.1714) combined with high modularity ($Q = 0.75$) suggests that interventions targeting the top 5 PageRank nodes will reach $> 60\%$ of the active conversational volume.
