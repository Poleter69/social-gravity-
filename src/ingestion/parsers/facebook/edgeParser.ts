/**
 * Social Gravity V2 - Facebook Edge List Parser
 *
 * Reverse-engineers SNAP Facebook .edges files.
 * Validates integrity, catches malformed rows, self-loops, and duplicates,
 * and produces clean normalized dyadic friendship edges.
 */

import { DatasetValidator } from '../../validators/datasetValidator';

export interface ParsedEdgesResult {
  edges: Array<{ source: string; target: string }>;
  uniqueNodes: Set<string>;
  validator: DatasetValidator;
}

export class FacebookEdgeParser {
  /**
   * Parses raw .edges text content into validated dyadic relationships.
   * Format: <sourceNodeId> <targetNodeId>
   */
  public static parseEdges(
    content: string,
    validator?: DatasetValidator
  ): ParsedEdgesResult {
    const val = validator || new DatasetValidator();
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const edges: Array<{ source: string; target: string }> = [];
    const uniqueNodes = new Set<string>();

    for (let rowIdx = 0; rowIdx < lines.length; rowIdx++) {
      const line = lines[rowIdx];
      if (line.startsWith('#')) continue;

      const parts = line.split(/\s+/);
      const source = parts[0];
      const target = parts[1];

      const isValid = val.validateEdgeRow(rowIdx + 1, source, target, line);
      if (isValid && source && target) {
        edges.push({ source: source.trim(), target: target.trim() });
        uniqueNodes.add(source.trim());
        uniqueNodes.add(target.trim());
      }
    }

    return {
      edges,
      uniqueNodes,
      validator: val,
    };
  }
}
