# SNAP Facebook Dataset Specification & Reverse-Engineering Architecture

> **Social Gravity V2 Technical Reference**  
> *Structural decoding of Stanford SNAP Facebook social circles, feature matrices, and ego network integration.*

---

## 1. Provenance & Source
* **Origin**: Stanford Network Analysis Platform (SNAP).
* **Reference**: J. McAuley and J. Leskovec. *Learning to Discover Social Circles in Ego Networks*. NIPS, 2012.
* **Corpus Scope**: 10 ego networks containing 4,039 total unique nodes and 88,234 unique undirected friendship ties.

---

## 2. File Format Breakdown

For any ego node $i \in \{0, 107, 348, 414, 686, 698, 1684, 1912, 3437, 3980\}$:

### 2.1 `<i>.edges` (Dyadic Alter Ties)
* **Format**: Space-separated ASCII pairs: `node_u node_v`.
* **Semantics**: An undirected friendship edge between two alters in ego $i$'s network.
* **Note**: The ego node itself is omitted from `<i>.edges` because the ego is by definition connected to every alter in the ego network.
* **Ingestion Rule**:
  1. Parse each pair $(u, v)$.
  2. Validate non-empty, non-identical tokens (reject self-loops).
  3. Form canonical edge $u \leftrightarrow v$ with weight $w = 0.80$.
  4. Automatically create ego-alter edges $i \leftrightarrow u$ for all alters with weight $w = 0.95$ and relationship type `'ego_tie'`.

### 2.2 `<i>.circles` (Social Circles / Communities)
* **Format**: Tab-separated string: `<circle_name>\t<node_1>\t<node_2>...\t<node_k>`.
* **Semantics**: User-curated social circles (e.g., college friends, high school classmates, co-workers, family).
* **Properties**: Circles are **overlapping**; an alter can belong to zero, one, or multiple circles.
* **Ingestion Rule**:
  1. Tokenize line by whitespace. Token 0 is `circle_name`; tokens $1 \dots k$ are member IDs.
  2. Map each alter to its list of circles (`communities: string[]`).
  3. If alter has no circles, assign to `'general'` community.

### 2.3 `<i>.featnames` (Feature Dictionary)
* **Format**: `<feature_index> <category;property;id;anonymized_feature_value>`.
* **Examples**:
  * `0 birthday;anonymized feature 0`
  * `8 education;classes;id;anonymized feature 8`
  * `20 education;degree;id;anonymized feature 20`
  * `24 education;school;id;anonymized feature 24`
  * `77 gender;anonymized feature 77`
  * `144 work;employer;id;anonymized feature 144`
* **Ingestion Rule**:
  1. Parse semicolon-delimited taxonomy into `{ category, property, value }`.
  2. Construct a lookup table mapping column index $j \to \text{feature definition}$.

### 2.4 `<i>.feat` (Alter Node Feature Matrix)
* **Format**: Space-delimited row: `<node_id> <b_0> <b_1> ... <b_k>`.
* **Semantics**: Each row contains the alter node ID followed by a $K$-dimensional binary vector where $b_j = 1$ denotes possession of feature $j$.
* **Ingestion Rule**:
  1. Token 0 is `node_id`.
  2. For every bit $b_j = 1$, resolve feature metadata from `featnames` and populate the node's `features` dictionary.
  3. Store raw binary vector in `rawFeatureVector` for mathematical similarity and embedding calculations.

### 2.5 `<i>.egofeat` (Ego Feature Vector)
* **Format**: Single space-delimited row: `<b_0> <b_1> ... <b_k>`.
* **Semantics**: The $K$-dimensional binary feature vector belonging to the ego user $i$.
* **Ingestion Rule**:
  1. Associate directly with the generated ego node `Ego_<i>`.

---

## 3. Global Master Graph Reconstruction

Individual ego networks overlap significantly in real life (friends of ego 0 are also friends of ego 107). The `MasterFacebookMerger` merges all 10 ego networks:

```
[ Ego 0 ] ──┐
[ Ego 107] ──┼──► [ MasterFacebookMerger ] ──► [ Global Canonical Graph ]
[ Ego 348] ──┤    - Shared alter deduplication    - 4,039 Nodes
  ...        │    - Multi-network feature union   - 88,234 Edges
[ Ego 3980] ─┘    - Inter-ego bridge detection    - Global Modularity Q = 0.918
```

### Bridge Nodes
Nodes appearing across multiple ego networks are classified with `isBridge = true` and annotated with `metadata.sharedEgos: ['0', '107']`. These represent critical structural vectors for cross-network cascade propagation.

---

## 4. Extension Guide for New Datasets

To introduce a new network dataset:
1. Implement parser in `src/ingestion/parsers/<dataset>Parser.ts`.
2. Validate raw entries using `DatasetValidator`.
3. Normalize identities via `Anonymizer.anonymize(rawId)`.
4. Assemble into `CanonicalGraph` via `CanonicalGraphBuilder`.
5. Call `CanonicalGraphBuilder.toDynamicGraph(graph)` or `CanonicalGraphBuilder.toSociety(graph)` to immediately run simulations.
