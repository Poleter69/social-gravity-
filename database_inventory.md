# Social Gravity — Database Archaeological Inventory

> **Comprehensive Dataset Discovery & Format Audit**  
> *Survey of all empirical network, conversational, emotional, and veracity datasets present in the `Databases/` directory.*

---

## 1. Directory Overview & High-Level Census

The `Databases/` repository contains primary empirical data sources spanning online social networks, communication graphs, crowdsourced emotion annotations, and verified information veracity corpora:

| Dataset / Directory | Format & File Count | Size | Domain & Semantic Value |
| :--- | :--- | :--- | :--- |
| **`Databases/facebook/`** | 50 files (.edges, .circles, .feat, .egofeat, .featnames) | ~3.8 MB | **10 Complete Facebook Ego Networks** (Stanford SNAP). Includes social circles, dyadic friendship ties, and anonymized feature vectors. |
| **`Databases/twitter/`** | 4,865 files (.edges, .circles, .feat, .egofeat, .featnames) | ~140 MB | **Stanford SNAP Twitter Social Circles**. Comprehensive follower/mention ego graphs with user hashtags and interest vectors. |
| **`Databases/WikiTalk.txt`** | Tab-separated edge list | 66.5 MB | **Wikipedia Talk Communication Network**. 2,394,385 nodes, 5,021,410 directed talk page edit interactions. |
| **`Databases/go_emotions_dataset.csv`** | Comma-separated tabular | 29.8 MB | **Reddit GoEmotions Corpus** (Google Research). 211,227 Reddit comments labeled across 27 discrete emotion taxonomies + neutral. |
| **`Databases/hoax_markup_cleaned/`** | 76 HTML / MediaWiki files | ~260 KB | **Wikipedia Hoaxes Corpus** (Kumar et al., WWW 2016). Raw markup of patrolled, long-lived fabrications. |
| **`Databases/nonhoax_markup_cleaned/`** | 64 HTML / MediaWiki files | ~240 KB | Matched control set of legitimate Wikipedia articles created on identical dates with comparable appearance. |
| **`Databases/convert_veracity_annotations.py`** | Python 3 script | 1.7 KB | Annotation veracity mapper converting ternary labels into {true, false, unverified}. |

---

## 2. In-Depth Subsystem Analysis

### 2.1 SNAP Facebook Ego Networks (`Databases/facebook/`)

The directory houses 10 complete ego networks indexed by ego identifier: `0`, `107`, `348`, `414`, `686`, `698`, `1684`, `1912`, `3437`, `3980`.

Each ego network $i$ consists of five inter-dependent files:
1. **`<i>.edges`**: Alter-to-alter undirected friendship ties within ego $i$'s personal sphere.
2. **`<i>.circles`**: Overlapping social circles curated by the ego user (friendship clusters).
3. **`<i>.featnames`**: Semantic dictionary indexing feature bit columns to real-world profile attributes (e.g. `education;school;id;24`, `work;employer;id;144`, `birthday;...`).
4. **`<i>.feat`**: Binary feature matrix for each alter node in the ego network.
5. **`<i>.egofeat`**: Binary feature vector representing the ego node itself.

#### Ego Network Inventory Summary
| Ego ID | Alter Node Count | Alter Edges | Social Circles | Feature Definitions |
| :--- | :--- | :--- | :--- | :--- |
| **0** | 347 | 2,519 | 24 | 224 |
| **107** | 1,045 | 26,749 | 9 | 576 |
| **348** | 227 | 3,192 | 14 | 161 |
| **414** | 159 | 1,693 | 7 | 105 |
| **686** | 170 | 1,656 | 14 | 63 |
| **698** | 66 | 270 | 13 | 48 |
| **1684** | 792 | 14,024 | 17 | 319 |
| **1912** | 755 | 30,025 | 46 | 480 |
| **3437** | 547 | 4,813 | 32 | 262 |
| **3980** | 59 | 146 | 17 | 42 |
| **Merged Master** | **4,039** | **88,234** | **10 Clusters** | **Integrated Taxonomy** |

---

### 2.2 SNAP Twitter Ego Networks (`Databases/twitter/`)
* **Scale**: 4,865 individual files representing hundreds of ego spheres.
* **Schema Parallelism**: Follows identical 5-file format (`.edges`, `.circles`, `.feat`, `.egofeat`, `.featnames`) as the Facebook dataset, where features correspond to parsed hashtag occurrences and public mention contexts.

---

### 2.3 Wikipedia Talk Communication Network (`Databases/WikiTalk.txt`)
* **Size**: 5,021,410 directed communication ties among 2,394,385 editors.
* **Interaction Semantics**: Directed edge $A \to B$ indicates editor $A$ posted or edited the user talk page of editor $B$.
* **Research Utility**: High-scale asymmetric organizational communication structure with power-law degree distribution.

---

### 2.4 Reddit GoEmotions Dataset (`Databases/go_emotions_dataset.csv`)
* **Scale**: 211,227 labeled comments from Reddit threads.
* **Taxonomy**: 27 fine-grained emotion classes (admiration, amusement, anger, annoyance, approval, caring, confusion, curiosity, desire, disappointment, disapproval, disgust, embarrassment, excitement, fear, gratitude, grief, joy, love, nervousness, optimism, pride, realization, relief, remorse, sadness, surprise) plus neutral.
* **Research Utility**: Serves as empirical ground-truth training weights for Phase 4 (Emotional Contagion Engine).

---

### 2.5 Wikipedia Hoax & Non-Hoax Corpus (`Databases/hoax_*`, `Databases/nonhoax_*`)
* **Reference**: Kumar, West, Leskovec (WWW 2016).
* **Contents**: 64 confirmed, patrolled hoaxes matched with 64 legitimate articles created on identical dates with comparable appearance.
* **Research Utility**: Real-world misinformation ground-truth corpus for benchmark diffusion and debunking simulations.
