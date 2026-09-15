/**
 * Social Gravity - Hierarchical Topology Generator
 * Generates organizational structures: vertical manager-report chains, departmental teams, and cross-functional ties.
 */

import { PRNG } from '../math/random';
import { SocialEdge } from '../types/network';

export interface HierarchicalParams {
  nodeIds: string[];
  departmentIds: string[];
  nodeCommunityMap: Map<string, string>;
  rng: PRNG;
}

export function generateHierarchicalNetwork(params: HierarchicalParams): {
  edges: SocialEdge[];
  roles: Map<string, string>;
} {
  const { nodeIds, departmentIds, nodeCommunityMap, rng } = params;
  const edges: SocialEdge[] = [];
  const edgeSet = new Set<string>();
  const roles = new Map<string, string>();

  const makeEdgeKey = (u: string, v: string): string => {
    return u < v ? `${u}--${v}` : `${v}--${u}`;
  };

  const addEdge = (source: string, target: string, type: 'hierarchical' | 'peer' | 'bridge', weight?: number) => {
    if (source === target) return;
    const key = makeEdgeKey(source, target);
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({
        id: `edge-${edges.length + 1}`,
        source,
        target,
        weight: weight ?? Number((0.5 + rng.nextFloat() * 0.5).toFixed(3)),
        type,
      });
    }
  };

  if (nodeIds.length === 0) return { edges, roles };

  // 1. Assign top executive / CEO
  const ceoId = nodeIds[0];
  roles.set(ceoId, 'Executive Leadership');

  // Group nodes by department
  const deptMembers = new Map<string, string[]>();
  for (const dept of departmentIds) {
    deptMembers.set(dept, []);
  }

  for (let i = 1; i < nodeIds.length; i++) {
    const id = nodeIds[i];
    const dept = nodeCommunityMap.get(id) || departmentIds[0];
    const list = deptMembers.get(dept) || [];
    list.push(id);
    deptMembers.set(dept, list);
  }

  // 2. Assign Department Heads and link to CEO
  const deptHeads: string[] = [];
  for (const [dept, members] of deptMembers.entries()) {
    if (members.length === 0) continue;
    const headId = members[0];
    deptHeads.push(headId);
    roles.set(headId, `Director of ${dept}`);
    addEdge(ceoId, headId, 'hierarchical', 0.95);

    // If there are more members, assign team leads and ICs
    const remaining = members.slice(1);
    const teamSize = 5;
    const teamCount = Math.max(1, Math.ceil(remaining.length / teamSize));
    const teamLeads: string[] = [];

    for (let t = 0; t < teamCount; t++) {
      const leadIdx = t * teamSize;
      if (leadIdx < remaining.length) {
        const leadId = remaining[leadIdx];
        teamLeads.push(leadId);
        roles.set(leadId, `Team Lead (${dept})`);
        addEdge(headId, leadId, 'hierarchical', 0.85);
      }
    }

    // Connect ICs to their respective Team Lead and to fellow team peers
    for (let idx = 0; idx < remaining.length; idx++) {
      const memberId = remaining[idx];
      const assignedLead = teamLeads[Math.floor(idx / teamSize)] || headId;

      if (memberId !== assignedLead) {
        roles.set(memberId, `Staff (${dept})`);
        addEdge(assignedLead, memberId, 'hierarchical', 0.75);
      }

      // Horizontal peer connections within department
      const peerCount = Math.min(3, remaining.length - 1);
      for (let p = 0; p < peerCount; p++) {
        const otherIdx = rng.nextInt(0, remaining.length - 1);
        const otherId = remaining[otherIdx];
        if (otherId !== memberId) {
          addEdge(memberId, otherId, 'peer', 0.65);
        }
      }
    }
  }

  // 3. Cross-functional bridge connections between departments (watercooler / syncs)
  for (let i = 0; i < deptHeads.length; i++) {
    for (let j = i + 1; j < deptHeads.length; j++) {
      addEdge(deptHeads[i], deptHeads[j], 'bridge', 0.8);
    }
  }

  const crossLinks = Math.floor(nodeIds.length * 0.08);
  for (let c = 0; c < crossLinks; c++) {
    const a = rng.choice(nodeIds);
    const b = rng.choice(nodeIds);
    if (a !== b && nodeCommunityMap.get(a) !== nodeCommunityMap.get(b)) {
      addEdge(a, b, 'bridge', 0.45);
    }
  }

  return { edges, roles };
}
