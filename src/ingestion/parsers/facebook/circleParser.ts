/**
 * Social Gravity V2 - Facebook Social Circles Parser
 *
 * Reverse-engineers SNAP Facebook .circles files.
 * Extracts user-curated social circles (overlapping community memberships).
 */

export interface ParsedCircles {
  circleCount: number;
  circles: Map<string, string[]>; // circleName -> member node IDs
  nodeMemberships: Map<string, string[]>; // nodeId -> circleNames
}

export class FacebookCircleParser {
  /**
   * Parses .circles file contents.
   * Format: <circleName>\t<node1>\t<node2>\t<node3>...
   */
  public static parseCircles(content: string): ParsedCircles {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const circles = new Map<string, string[]>();
    const nodeMemberships = new Map<string, string[]>();

    for (let rowIdx = 0; rowIdx < lines.length; rowIdx++) {
      const line = lines[rowIdx];
      const tokens = line.split(/\s+/);
      if (tokens.length === 0 || tokens[0] === '') continue;

      const circleName = tokens[0];
      const memberNodeIds = tokens.slice(1);

      circles.set(circleName, memberNodeIds);

      for (const nodeId of memberNodeIds) {
        let mems = nodeMemberships.get(nodeId);
        if (!mems) {
          mems = [];
          nodeMemberships.set(nodeId, mems);
        }
        if (!mems.includes(circleName)) {
          mems.push(circleName);
        }
      }
    }

    return {
      circleCount: circles.size,
      circles,
      nodeMemberships,
    };
  }
}
