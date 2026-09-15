/**
 * Social Gravity V2 - Reddit Discussion Thread Reconstructor
 *
 * Reconstructs hierarchical conversation trees from flat comment collections.
 * Handles arbitrary nesting depth, chronological sibling ordering, orphan detection,
 * and conversation timeline and branching velocity metrics.
 */

import {
  ParsedRedditComment,
  ParsedRedditSubmission,
  RedditThreadNode,
  ReconstructedThread,
} from '../parsers/redditTypes';

export class ThreadReconstructor {
  /**
   * Reconstructs a full conversation tree for a submission and its associated comments.
   */
  public static reconstruct(
    submission: ParsedRedditSubmission,
    comments: ParsedRedditComment[]
  ): ReconstructedThread {
    const allComments = new Map<string, ParsedRedditComment>();
    const nodeMap = new Map<string, RedditThreadNode>();

    for (const c of comments) {
      allComments.set(c.id, c);
      nodeMap.set(c.id, {
        comment: c,
        children: [],
        depth: 1, // default top-level depth
      });
    }

    const roots: RedditThreadNode[] = [];
    const orphans: ParsedRedditComment[] = [];

    // Link parents and children
    for (const c of comments) {
      const node = nodeMap.get(c.id)!;

      if (c.parentType === 'submission' || c.parentId === submission.id) {
        // Direct reply to the submission
        node.depth = 1;
        roots.push(node);
      } else {
        // Reply to another comment
        const parentNode = nodeMap.get(c.parentId);
        if (parentNode) {
          node.parent = parentNode;
          parentNode.children.push(node);
        } else {
          // Parent comment missing from collection -> orphan
          orphans.push(c);
          // Attach to root level with orphan flag in metadata
          node.depth = 1;
          roots.push(node);
        }
      }
    }

    // Sort siblings chronologically and calculate actual depths recursively
    const setDepthsAndSort = (nodes: RedditThreadNode[], currentDepth: number) => {
      nodes.sort((a, b) => a.comment.createdUtc - b.comment.createdUtc);
      for (const n of nodes) {
        n.depth = currentDepth;
        if (n.children.length > 0) {
          setDepthsAndSort(n.children, currentDepth + 1);
        }
      }
    };

    setDepthsAndSort(roots, 1);

    // Compute tree metrics
    const metrics = this.calculateMetrics(submission, roots, comments);

    return {
      submission,
      roots,
      allComments,
      orphans,
      metrics,
    };
  }

  /**
   * Calculates comprehensive structural and temporal conversation metrics.
   */
  private static calculateMetrics(
    submission: ParsedRedditSubmission,
    roots: RedditThreadNode[],
    comments: ParsedRedditComment[]
  ): ReconstructedThread['metrics'] {
    if (comments.length === 0) {
      return {
        totalComments: 0,
        maxDepth: 0,
        averageDepth: 0,
        branchingFactor: 0,
        averageResponseTimeSeconds: 0,
        fastestResponseTimeSeconds: 0,
        slowestResponseTimeSeconds: 0,
        uniqueParticipants: submission.author && submission.author !== '[deleted]' ? 1 : 0,
        durationSeconds: 0,
      };
    }

    let maxDepth = 0;
    let depthSum = 0;
    let branchingSum = 0;
    let branchingParents = 0;
    const responseTimes: number[] = [];
    const participants = new Set<string>();

    if (submission.author && submission.author !== '[deleted]') {
      participants.add(submission.author);
    }

    let latestTimestamp = submission.createdUtc;

    // Traverse tree nodes
    const traverse = (node: RedditThreadNode) => {
      if (node.depth > maxDepth) maxDepth = node.depth;
      depthSum += node.depth;

      if (node.comment.author && node.comment.author !== '[deleted]') {
        participants.add(node.comment.author);
      }

      if (node.comment.createdUtc > latestTimestamp) {
        latestTimestamp = node.comment.createdUtc;
      }

      // Response time calculation
      if (node.parent) {
        const delta = Math.max(0, node.comment.createdUtc - node.parent.comment.createdUtc);
        responseTimes.push(delta);
      } else {
        const delta = Math.max(0, node.comment.createdUtc - submission.createdUtc);
        responseTimes.push(delta);
      }

      if (node.children.length > 0) {
        branchingSum += node.children.length;
        branchingParents++;
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    for (const root of roots) {
      traverse(root);
    }

    const totalComments = comments.length;
    const averageDepth = totalComments > 0 ? depthSum / totalComments : 0;
    const branchingFactor = branchingParents > 0 ? branchingSum / branchingParents : 0;

    let avgResponseTime = 0;
    let fastest = 0;
    let slowest = 0;

    if (responseTimes.length > 0) {
      avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      fastest = Math.min(...responseTimes);
      slowest = Math.max(...responseTimes);
    }

    const durationSeconds = Math.max(0, latestTimestamp - submission.createdUtc);

    return {
      totalComments,
      maxDepth,
      averageDepth: Number(averageDepth.toFixed(2)),
      branchingFactor: Number(branchingFactor.toFixed(2)),
      averageResponseTimeSeconds: Math.round(avgResponseTime),
      fastestResponseTimeSeconds: fastest,
      slowestResponseTimeSeconds: slowest,
      uniqueParticipants: participants.size,
      durationSeconds,
    };
  }

  /**
   * Flattens a reconstructed tree back into a depth-first or breadth-first array.
   */
  public static flattenTree(roots: RedditThreadNode[]): ParsedRedditComment[] {
    const result: ParsedRedditComment[] = [];
    const walk = (node: RedditThreadNode) => {
      result.push(node.comment);
      for (const child of node.children) {
        walk(child);
      }
    };
    for (const root of roots) {
      walk(root);
    }
    return result;
  }
}
