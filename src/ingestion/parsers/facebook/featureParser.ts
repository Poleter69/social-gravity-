/**
 * Social Gravity V2 - Facebook Feature & Taxonomy Parser
 *
 * Reverse-engineers SNAP Facebook .featnames, .feat, and .egofeat files.
 * Extracts binary vectors and maps them into semantic categorical taxonomies
 * (education, work, location, birthday, languages, gender).
 */

export interface ParsedFeatureDefinition {
  index: number;
  rawName: string;
  category: string;
  property: string;
  value: string;
}

export interface FeatureTaxonomy {
  totalFeatures: number;
  categories: Record<string, number>; // Category name -> feature count
  featureMap: Map<number, ParsedFeatureDefinition>;
}

export class FacebookFeatureParser {
  /**
   * Parses .featnames content into a structured feature taxonomy.
   *
   * Example lines:
   * 0 birthday;anonymized feature 0
   * 8 education;classes;id;anonymized feature 8
   * 20 education;degree;id;anonymized feature 20
   */
  public static parseFeatnames(content: string): FeatureTaxonomy {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const featureMap = new Map<number, ParsedFeatureDefinition>();
    const categories: Record<string, number> = {};

    for (const line of lines) {
      const spaceIdx = line.indexOf(' ');
      if (spaceIdx === -1) continue;

      const idxStr = line.substring(0, spaceIdx);
      const featureIdx = parseInt(idxStr, 10);
      if (isNaN(featureIdx)) continue;

      const rawName = line.substring(spaceIdx + 1).trim();
      const parts = rawName.split(';');

      let category = 'other';
      let property = 'general';
      let value = rawName;

      if (parts.length >= 1) {
        category = parts[0].trim().toLowerCase();
      }
      if (parts.length >= 2) {
        property = parts[1].trim();
      }
      if (parts.length >= 3) {
        value = parts.slice(2).join(';').trim();
      } else if (parts.length === 2) {
        value = parts[1].trim();
      }

      categories[category] = (categories[category] || 0) + 1;

      featureMap.set(featureIdx, {
        index: featureIdx,
        rawName,
        category,
        property,
        value,
      });
    }

    return {
      totalFeatures: featureMap.size,
      categories,
      featureMap,
    };
  }

  /**
   * Parses alter node feature matrix (.feat file).
   * Format: <nodeId> <b_0> <b_1> ... <b_k>
   *
   * Output: Map<nodeId, { rawVector: number[]; semanticFeatures: Record<string, string> }>
   */
  public static parseNodeFeatures(
    content: string,
    taxonomy: FeatureTaxonomy
  ): Map<string, { rawVector: number[]; semanticFeatures: Record<string, string> }> {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const result = new Map<string, { rawVector: number[]; semanticFeatures: Record<string, string> }>();

    for (const line of lines) {
      const tokens = line.split(/\s+/);
      if (tokens.length < 2) continue;

      const nodeId = tokens[0];
      const bitValues: number[] = [];
      const semanticFeatures: Record<string, string> = {};

      for (let i = 1; i < tokens.length; i++) {
        const bit = parseInt(tokens[i], 10);
        bitValues.push(bit);

        if (bit === 1) {
          const featDef = taxonomy.featureMap.get(i - 1);
          if (featDef) {
            const key = `${featDef.category}_${featDef.property}`;
            if (!semanticFeatures[key]) {
              semanticFeatures[key] = featDef.value;
            } else {
              semanticFeatures[key] += `, ${featDef.value}`;
            }
          }
        }
      }

      result.set(nodeId, {
        rawVector: bitValues,
        semanticFeatures,
      });
    }

    return result;
  }

  /**
   * Parses the ego node feature vector (.egofeat file).
   * Format: <b_0> <b_1> ... <b_k> (single line)
   */
  public static parseEgoFeatures(
    content: string,
    taxonomy: FeatureTaxonomy
  ): { rawVector: number[]; semanticFeatures: Record<string, string> } {
    const tokens = content.trim().split(/\s+/).filter(t => t.length > 0);
    const bitValues: number[] = [];
    const semanticFeatures: Record<string, string> = {};

    for (let i = 0; i < tokens.length; i++) {
      const bit = parseInt(tokens[i], 10);
      bitValues.push(bit);

      if (bit === 1) {
        const featDef = taxonomy.featureMap.get(i);
        if (featDef) {
          const key = `${featDef.category}_${featDef.property}`;
          if (!semanticFeatures[key]) {
            semanticFeatures[key] = featDef.value;
          } else {
            semanticFeatures[key] += `, ${featDef.value}`;
          }
        }
      }
    }

    return {
      rawVector: bitValues,
      semanticFeatures,
    };
  }
}
