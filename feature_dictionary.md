# SNAP Facebook & Social Circles Feature Dictionary

> **Semantic Categorization of Anonymized Profile Attributes**  
> *Interpreting multi-modal user features for psychological trait initialization, homophily estimation, and community echo-chamber modeling.*

---

## 1. Overview

In the Stanford SNAP Facebook dataset, profile attributes are encoded as binary vectors across hundreds of columns in `<ego>.feat` and `<ego>.egofeat`. The feature names in `<ego>.featnames` reveal a rich taxonomy of demographic, educational, professional, and cultural attributes.

Social Gravity parses these semi-structured strings (`category;property;id;value`) into strongly typed semantic categories.

---

## 2. Discovered Semantic Taxonomies

### 2.1 Education (`education`)
* **Properties**:
  * `classes`: Coursework enrollment IDs (e.g. `education;classes;id;anonymized feature 8`)
  * `concentration`: Academic majors, minors, and departmental specializations
  * `degree`: Degree designations (B.S., B.A., M.S., Ph.D.)
  * `school`: University or secondary school institutional IDs
  * `type`: Educational tier classification (high school, undergraduate, graduate)
  * `year`: Graduation year cohort markers
* **Sociological Utility**: Defines strong intra-community academic homophily and cohort trust clustering.

### 2.2 Workplace & Career (`work`)
* **Properties**:
  * `employer`: Corporate, government, or academic employer organization IDs
  * `position`: Job title and role category
  * `location`: Office or regional facility location
  * `start_date` / `end_date`: Professional tenure temporal bounds
* **Sociological Utility**: Establishes workplace hierarchies, institutional trust anchors, and cross-functional information vectors.

### 2.3 Geography & Origins (`location`, `hometown`)
* **Properties**:
  * `location`: Current residential geography ID
  * `hometown`: Historical place of origin ID
* **Sociological Utility**: Models spatial clustering, local rumor diffusion speed, and diaspora bridge ties.

### 2.4 Cultural & Demographic Markers
* **`languages`**: Language proficiencies (influences linguistic barrier boundaries)
* **`birthday`**: Age cohort groupings (affects baseline risk tolerance and conformity)
* **`political`** & **`religion`**: Civic and normative affiliations (crucial for polarization modeling and echo chamber formation)

---

## 3. Integration with Downstream Psychology Engines

These semantic features automatically enrich agent trait initialization:
1. **Homophily Calculation**: When agents $i$ and $j$ share multiple features (e.g. same school and same employer), their baseline dyadic trust $T_{ij}$ is initialized significantly higher:
   $$\text{Homophily}(i, j) = \frac{|\mathcal{F}_i \cap \mathcal{F}_j|}{|\mathcal{F}_i \cup \mathcal{F}_j|}$$
2. **Community Identification**: Features serve as supplementary clustering dimensions alongside topological connectivity in modularity optimization.
