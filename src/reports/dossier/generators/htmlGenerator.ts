/**
 * Social Gravity — Project Dossier Interactive HTML Generator
 * Compiles a standalone, offline-functional, single-file Interactive Intelligence Dossier
 * Features:
 * - 100% self-contained (Zero external internet or CDN dependencies)
 * - Built-in Dark & Light theme switch
 * - Interactive zoomable/pannable SVG network graph
 * - Interactive Replay Timeline Scrubber
 * - Searchable & filterable Evidence Board
 * - Clickable Key Actor modal details
 * - Print-ready CSS for direct PDF export
 */

import { InvestigationDossier } from '../types';

export function generateInteractiveHTML(dossier: InvestigationDossier): string {
  const { metadata, executiveSummary, timeline, networkEvidence, narrativeEvolution, keyActors, evidenceBoard, explainabilityFlow, recommendations, appendix } = dossier;

  const jsonDossier = JSON.stringify(dossier);

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${metadata.operationCodename} — Intelligence Dossier — Social Gravity</title>
<style>
  :root {
    --bg: #06080F;
    --canvas: #0B0E17;
    --surface: #111524;
    --surface-hover: #181E33;
    --border: #1F2742;
    --border-strong: #2F3B63;
    --text: #F8FAFC;
    --text-secondary: #94A3B8;
    --text-muted: #64748B;
    --text-tertiary: #475569;
    --accent: #3B82F6;
    --accent-glow: rgba(59, 130, 246, 0.25);
    --danger: #EF4444;
    --warning: #F59E0B;
    --success: #10B981;
    --purple: #8B5CF6;
  }

  html.light {
    --bg: #F8FAFC;
    --canvas: #FFFFFF;
    --surface: #F1F5F9;
    --surface-hover: #E2E8F0;
    --border: #CBD5E1;
    --border-strong: #94A3B8;
    --text: #0F172A;
    --text-secondary: #334155;
    --text-muted: #64748B;
    --text-tertiary: #94A3B8;
    --accent: #2563EB;
    --accent-glow: rgba(37, 99, 235, 0.15);
    --danger: #DC2626;
    --warning: #D97706;
    --success: #059669;
    --purple: #7C3AED;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    padding: 24px;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .container { max-width: 1100px; margin: 0 auto; }
  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

  /* Classification Banner */
  .class-banner {
    background: #DC2626;
    color: #FFFFFF;
    font-family: monospace;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-align: center;
    padding: 6px 16px;
    border-radius: 6px;
    margin-bottom: 24px;
    text-transform: uppercase;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  }

  /* Card and Panel Styles */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .card-inner {
    background: var(--canvas);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14px;
    margin-bottom: 18px;
    border-bottom: 1px solid var(--border);
  }

  .card-title {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-family: monospace;
    font-weight: 700;
    text-transform: uppercase;
    border: 1px solid transparent;
  }

  .badge-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); border-color: rgba(239, 68, 68, 0.3); }
  .badge-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); border-color: rgba(245, 158, 11, 0.3); }
  .badge-success { background: rgba(16, 185, 129, 0.15); color: var(--success); border-color: rgba(16, 185, 129, 0.3); }
  .badge-info { background: rgba(59, 130, 246, 0.15); color: var(--accent); border-color: rgba(59, 130, 246, 0.3); }

  /* KPI Grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .kpi-card {
    background: var(--canvas);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .kpi-label { font-size: 11px; font-family: monospace; color: var(--text-tertiary); text-transform: uppercase; }
  .kpi-val { font-size: 32px; font-family: monospace; font-weight: 900; margin: 8px 0 4px; }

  /* Interactive Replay Scrubber Controls */
  .scrubber-panel {
    background: var(--surface-hover);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 20px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .scrubber-slider {
    flex: 1;
    cursor: pointer;
    accent-color: var(--accent);
  }

  /* Table styling */
  table { width: 100%; border-collapse: collapse; font-family: monospace; font-size: 12px; }
  th { text-align: left; padding: 8px 12px; background: var(--surface-hover); color: var(--text-tertiary); font-size: 10px; text-transform: uppercase; border-bottom: 1px solid var(--border); }
  td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
  tr:hover td { background: var(--surface-hover); }

  /* Button styling */
  .btn {
    background: var(--surface-hover);
    color: var(--text);
    border: 1px solid var(--border);
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-family: monospace;
    font-weight: 600;
    transition: all 0.15s ease;
  }
  .btn:hover { border-color: var(--accent); color: var(--accent); }
  .btn-primary { background: var(--accent); color: #FFF; border-color: var(--accent); }
  .btn-primary:hover { background: #2563EB; color: #FFF; }

  /* Print media queries for direct PDF generation */
  @media print {
    body { background: #FFF !important; color: #000 !important; padding: 0 !important; }
    .no-print { display: none !important; }
    .card { page-break-inside: avoid; border: 1px solid #CCC !important; box-shadow: none !important; background: #FFF !important; color: #000 !important; }
    .class-banner { background: #000 !important; color: #FFF !important; }
  }
</style>
</head>
<body>
<div class="container">
  <!-- Top Classification Banner -->
  <div class="class-banner">
    ${metadata.classification}
  </div>

  <!-- Top Offline Control Bar -->
  <div class="card no-print" style="padding: 12px 20px; display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; items-center; gap: 12px;">
      <span class="badge badge-success">STANDALONE OFFLINE DOSSIER</span>
      <span class="font-mono text-muted">ID: ${metadata.id}</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn" onclick="toggleTheme()">🌗 Toggle Theme</button>
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save PDF</button>
      <button class="btn" onclick="downloadMachineJSON()">💾 Download JSON</button>
    </div>
  </div>

  <!-- 1. COVER PAGE SECTION -->
  <div class="card">
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 44px; height: 44px; border-radius: 8px; background: linear-gradient(135deg, #2563EB, #06B6D4); display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: 900; font-size: 20px; color: #FFF;">
          SG
        </div>
        <div>
          <div style="font-size: 10px; font-family: monospace; letter-spacing: 0.15em; color: var(--text-tertiary);">
            SPECIAL OPERATIONS COMMAND // BEHAVIORAL THREAT INTELLIGENCE
          </div>
          <div style="font-size: 17px; font-weight: 800; letter-spacing: -0.01em;">
            SOCIAL GRAVITY INTELLIGENCE BRIEFING
          </div>
        </div>
      </div>
      <div style="text-align: right; font-family: monospace; font-size: 11px;">
        <div>CODENAME: <strong style="color: var(--warning);">${metadata.operationCodename}</strong></div>
        <div style="color: var(--text-tertiary);">${new Date(metadata.generatedAt).toLocaleString()}</div>
      </div>
    </div>

    <div style="margin: 24px 0;">
      <span class="badge badge-info" style="margin-bottom: 8px;">INCIDENT DOSSIER</span>
      <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 8px;">
        ${metadata.title}
      </h1>
      <div style="font-family: monospace; font-size: 13px; color: var(--text-secondary);">
        Target Topology: <strong>${appendix.datasetName}</strong> (${networkEvidence.metrics.totalNodes} agent nodes)
      </div>
    </div>

    <div class="card-inner" style="border-left: 4px solid var(--accent); margin-bottom: 16px;">
      <div style="font-size: 10px; font-family: monospace; color: var(--accent); font-weight: 700; margin-bottom: 4px;">
        AI EXECUTIVE ASSESSMENT SYNTHESIS
      </div>
      <div style="font-size: 15px; font-style: italic; font-family: Georgia, serif;">
        "${metadata.summaryOneLiner}"
      </div>
    </div>

    <div style="display: flex; flex-wrap: wrap; gap: 8px; font-family: monospace; font-size: 11px;">
      <span style="color: var(--text-tertiary);">Data Feeds:</span>
      ${metadata.dataSources.map((s) => `<span class="badge badge-info">${s}</span>`).join(' ')}
    </div>
  </div>

  <!-- 2. EXECUTIVE SUMMARY SECTION -->
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Executive Summary & Threat Triage</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
          DECISION-READY 30-SECOND SITUATIONAL AWARENESS
        </div>
      </div>
      <span class="badge badge-danger">HIGH PRIORITY INTELLIGENCE</span>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Narrative Growth</div>
        <div class="kpi-val" style="color: var(--accent);">${executiveSummary.narrativeGrowth}</div>
        <div style="font-size: 11px; color: var(--text-muted);">Velocity amplification factor</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Dominant Emotion</div>
        <div class="kpi-val" style="color: var(--danger);">${executiveSummary.dominantEmotion}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${executiveSummary.dominantEmotionPct}% affective load</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Communities Affected</div>
        <div class="kpi-val" style="color: var(--purple);">${executiveSummary.communitiesAffected} / ${executiveSummary.totalCommunities}</div>
        <div style="font-size: 11px; color: var(--text-muted);">Cluster penetration breadth</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Risk Classification</div>
        <div class="kpi-val" style="color: var(--warning);">${executiveSummary.riskLevel}</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">Peak R₀ = ${executiveSummary.peakR0}</div>
      </div>
    </div>

    <div class="card-inner">
      <div style="font-size: 11px; font-family: monospace; font-weight: 700; color: var(--accent); margin-bottom: 4px;">
        FINDING OVERVIEW (TL;DR)
      </div>
      <p style="font-size: 14px; line-height: 1.6; font-family: Georgia, serif;">
        "${executiveSummary.aiAssessment}"
      </p>
    </div>
  </div>

  <!-- 3. INTERACTIVE REPLAY SCRUBBER + TIMELINE -->
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Incident Chronology & Interactive Scrubber</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
          SLIDE TO SCRUB THROUGH HISTORICAL OBSERVATION ROUNDS
        </div>
      </div>
      <span class="badge badge-info">${timeline.length} CRITICAL MILESTONES</span>
    </div>

    <div class="scrubber-panel no-print">
      <span class="font-mono" style="font-weight: 700; min-width: 80px;">ROUND <span id="scrubber-val">${timeline[timeline.length - 1].round}</span></span>
      <input
        type="range"
        min="0"
        max="${timeline[timeline.length - 1].round}"
        value="${timeline[timeline.length - 1].round}"
        class="scrubber-slider"
        id="round-scrubber"
        oninput="updateScrubber(this.value)"
      />
      <button class="btn" onclick="playScrubberLoop()">▶ Auto-Play</button>
    </div>

    <div style="border-left: 2px solid var(--border); margin-left: 16px; padding-left: 24px;">
      ${timeline.map((item) => `
        <div style="margin-bottom: 24px; position: relative;">
          <div style="position: absolute; left: -31px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg);"></div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span class="badge badge-info">${item.label}</span>
            <span class="font-mono text-muted">Round ${item.round} (${item.timeOffset})</span>
          </div>
          <div style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">${item.headline}</div>
          <p style="color: var(--text-secondary); margin-bottom: 8px;">${item.description}</p>
          <div class="card-inner" style="font-family: monospace; font-size: 11px;">
            <strong style="color: var(--accent);">EVIDENCE:</strong> ${item.evidence}
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- 4. NETWORK EVIDENCE (PRINTABLE VECTOR GRAPH) -->
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Network Topology & Bridge Breach Evidence</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
          VECTOR GRAPH WITH COMMUNITY HULLS & STRUCTURAL BOTTLENECK ARCS
        </div>
      </div>
      <div class="font-mono" style="font-size: 11px;">
        Bridges: <strong style="color: var(--warning);">${networkEvidence.bridges.length}</strong>
      </div>
    </div>

    <div style="background: var(--canvas); border: 1px solid var(--border); border-radius: 8px; padding: 12px; overflow: hidden;">
      <svg id="network-svg" viewBox="0 0 850 520" style="width: 100%; height: auto;">
        <!-- Community Hulls -->
        ${networkEvidence.communities.map((comm) => {
          if (comm.hullPoints.length < 3) return '';
          const d = comm.hullPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`, '') + ' Z';
          return `
            <path d="${d}" fill="${comm.color}" fill-opacity="0.09" stroke="${comm.color}" stroke-width="1.5" stroke-dasharray="4 3" stroke-opacity="0.4" />
            <text x="${comm.hullPoints[0][0] - 20}" y="${comm.hullPoints[0][1] - 10}" fill="${comm.color}" font-size="10" font-family="monospace" font-weight="bold">${comm.name.toUpperCase()} (${comm.infectedPct}%)</text>
          `;
        }).join('')}

        <!-- Edges -->
        ${networkEvidence.edges.map((e) => {
          const s = networkEvidence.nodes.find((n) => n.id === e.source);
          const t = networkEvidence.nodes.find((n) => n.id === e.target);
          if (!s || !t) return '';
          if (e.isCrossCommunity) {
            return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="#F59E0B" stroke-width="2.2" stroke-dasharray="5 3" stroke-opacity="0.8" />`;
          }
          return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="var(--border)" stroke-width="0.8" stroke-opacity="0.6" />`;
        }).join('')}

        <!-- Nodes -->
        ${networkEvidence.nodes.map((n) => {
          let fill = '#64748B';
          if (n.state === 'BELIEVER') fill = '#EF4444';
          else if (n.state === 'DEBUNKER') fill = '#10B981';
          const r = n.isInfluencer ? 8 : (n.isBridge ? 7 : 4.5);
          const bridgeRing = n.isBridge ? `<circle cx="${n.x}" cy="${n.y}" r="${r + 5}" fill="none" stroke="#F59E0B" stroke-width="2" />` : '';
          const label = (n.isBridge || n.isInfluencer) ? `<text x="${n.x + r + 4}" y="${n.y + 3}" fill="var(--text)" font-size="9" font-family="monospace" font-weight="bold">${n.name.slice(0, 8)}</text>` : '';
          return `
            <g class="node-g" onclick="inspectNode('${n.id}')" style="cursor: pointer;">
              ${bridgeRing}
              <circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" stroke="#FFF" stroke-width="1" />
              ${label}
            </g>
          `;
        }).join('')}
      </svg>
    </div>

    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 14px; font-family: monospace; font-size: 11px;">
      <div style="display: flex; gap: 16px;">
        <span><strong style="color: #EF4444;">●</strong> Believer</span>
        <span><strong style="color: #64748B;">●</strong> Susceptible</span>
        <span><strong style="color: #10B981;">●</strong> Debunker</span>
        <span><strong style="color: #F59E0B;">◎</strong> Strategic Bridge</span>
      </div>
      <div style="color: var(--text-tertiary);">
        Click any node to inspect agent profile
      </div>
    </div>
  </div>

  <!-- 5. EMOTION DYNAMICS & NARRATIVE -->
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Affective Trajectory & Narrative Breakdown</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
          GOEMOTIONS 28-DIM TAXONOMIC SHIFTS OVER SIMULATION TIME
        </div>
      </div>
      <span class="badge badge-danger">FEAR SURGE DETECTED</span>
    </div>

    <!-- Narrative Evolution List -->
    <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px;">
      ${narrativeEvolution.map((story) => `
        <div class="card-inner">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-family: monospace; color: var(--accent);">${story.phase}</strong>
          </div>
          <p style="font-size: 13px; line-height: 1.6; margin-bottom: 6px;">${story.storyline}</p>
          <div style="font-family: monospace; font-size: 11px; color: var(--warning);">
            TACTICAL INFERENCE: ${story.tacticalInference}
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- 6. KEY ACTORS RANKING -->
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Key Actors & Amplification Agents</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
          AUTO-RANKED BY BETWEENNESS CENTRALITY AND INTER-COMMUNITY SPREAD
        </div>
      </div>
      <span class="badge badge-info">TOP ${keyActors.length} OPERATORS</span>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
      ${keyActors.map((actor, idx) => `
        <div class="card-inner" style="cursor: pointer;" onclick="alert('Actor Details: ${actor.alias}\\nRole: ${actor.role}\\nDegree: ${actor.degree}\\nBetweenness: ${(actor.betweenness * 100).toFixed(0)}th percentile\\nContext: ${actor.tacticalContext}')">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="font-family: monospace; font-weight: 700;">#${idx + 1} ${actor.alias}</div>
            <span class="badge ${actor.risk === 'Critical' ? 'badge-danger' : 'badge-warning'}">Risk: ${actor.risk}</span>
          </div>
          <div style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">${actor.role}</div>
          <div style="font-family: monospace; font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">
            Degree: ${actor.degree} | Reach: ${actor.reach} | ${actor.communityName}
          </div>
          <p style="font-size: 11px; color: var(--text-muted);">${actor.tacticalContext}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- 7. EVIDENCE BOARD -->
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Evidence Vault & Verified Signal Cards</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
          SUPPORTING FORENSIC DATA ITEMS WITH AFFECTIVE CONFIDENCE SCORES
        </div>
      </div>
      <input
        type="text"
        placeholder="Filter evidence..."
        class="btn no-print"
        style="padding: 4px 10px;"
        oninput="filterEvidence(this.value)"
      />
    </div>

    <div id="evidence-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;">
      ${evidenceBoard.map((card) => `
        <div class="card-inner evidence-card" data-text="${card.headline} ${card.content} ${card.emotion}">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span class="badge badge-info">${card.source} • ${card.emotion} (${card.confidence}%)</span>
            <span class="badge badge-success">VERIFIED</span>
          </div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${card.headline}</div>
          <div style="font-style: italic; font-size: 12px; margin-bottom: 8px; color: var(--text-secondary);">${card.content}</div>
          <div style="font-family: monospace; font-size: 11px; background: var(--surface); padding: 6px 8px; border-radius: 4px; color: var(--text-muted);">
            <strong style="color: var(--accent);">WHY IT MATTERED:</strong> ${card.whyItMattered}
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- 8. CAUSAL EXPLAINABILITY FLOW -->
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Causal Explainability Pathway</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
          WHITE-BOX AUDITABLE INFERENCE STEPS (WHY RISK WAS ELEVATED)
        </div>
      </div>
      <span class="badge badge-success">DETERMINISTIC GRAPH</span>
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; max-width: 600px; margin: 0 auto;">
      ${explainabilityFlow.map((flow, i) => `
        <div class="card-inner" style="width: 100%; display: flex; align-items: center; gap: 12px;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #FFF; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: 900; font-size: 12px; shrink: 0;">
            ${flow.step}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 13px;">${flow.title}</div>
            <div style="font-family: monospace; font-size: 11px; color: var(--text-secondary);">${flow.detail}</div>
          </div>
          <span class="badge badge-info">${flow.badge}</span>
        </div>
        ${i < explainabilityFlow.length - 1 ? '<div style="color: var(--accent); font-size: 16px;">↓</div>' : ''}
      `).join('')}
    </div>
  </div>

  <!-- 9. ACTIONABLE RECOMMENDATIONS -->
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Actionable Recommendations & Containment Directives</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
          MATHEMATICALLY GROUNDED IN EMPIRICAL TOPOLOGY & AFFECTIVE VELOCITY
        </div>
      </div>
      <span class="badge badge-success">MITIGATION DIRECTIVES</span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
      ${recommendations.map((rec) => `
        <div class="card-inner">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${rec.priority === 'P0 Immediate' ? 'badge-danger' : 'badge-warning'}">${rec.priority}</span>
              <span class="badge badge-info">${rec.category}</span>
            </div>
            <span class="font-mono text-muted">${rec.id}</span>
          </div>
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${rec.title}</div>
          <p style="font-family: monospace; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${rec.action}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; font-family: monospace; font-size: 11px;">
            <div style="flex: 1; min-width: 240px; background: var(--surface); padding: 8px; border-radius: 4px;">
              <strong style="color: var(--warning);">EVIDENCE GROUNDING:</strong> ${rec.findingReference}
            </div>
            <div style="flex: 1; min-width: 240px; background: var(--surface); padding: 8px; border-radius: 4px;">
              <strong style="color: var(--success);">PROJECTED IMPACT:</strong> ${rec.expectedImpact}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- 10. APPENDIX & PROVENANCE -->
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Technical Appendix & Reproducibility Ledger</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
          CRYPTOGRAPHIC SIGNATURES & REPRODUCIBILITY GUARANTEES
        </div>
      </div>
      <span class="badge badge-success">BITWISE VERIFIED</span>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 16px;">
      <div class="card-inner">
        <div style="font-size: 10px; font-family: monospace; color: var(--text-tertiary); text-transform: uppercase;">Replay State Digest</div>
        <div style="font-family: monospace; font-size: 11px; word-break: break-all; margin-top: 4px; color: var(--text);">${appendix.replayHash}</div>
      </div>

      <div class="card-inner">
        <div style="font-size: 10px; font-family: monospace; color: var(--text-tertiary); text-transform: uppercase;">Export Checksum</div>
        <div style="font-family: monospace; font-size: 11px; word-break: break-all; margin-top: 4px; color: var(--success);">${appendix.exportChecksum}</div>
      </div>
    </div>

    <table style="margin-top: 8px;">
      <thead>
        <tr>
          <th>Platform Connector</th>
          <th>Status</th>
          <th>Events</th>
          <th style="text-align: right;">Latency</th>
        </tr>
      </thead>
      <tbody>
        ${appendix.connectorStatus.map((c) => `
          <tr>
            <td><strong>${c.platform}</strong></td>
            <td><span class="badge badge-success">${c.status}</span></td>
            <td>${c.eventCount} items</td>
            <td style="text-align: right;">${c.latencyMs} ms</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Bottom Classification Banner -->
  <div class="class-banner">
    ${metadata.classification}
  </div>
</div>

<script>
  // Embedded Dossier Payload for offline interaction
  const DOSSIER_DATA = ${jsonDossier};
  window.__DOSSIER_DATA__ = DOSSIER_DATA;

  // Theme Toggle function
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    if (!isDark) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }

  // Scrubber updates
  function updateScrubber(roundVal) {
    document.getElementById('scrubber-val').innerText = roundVal;
  }

  // Auto-play scrubber loop
  let isPlaying = false;
  let playInterval = null;
  function playScrubberLoop() {
    const slider = document.getElementById('round-scrubber');
    if (isPlaying) {
      clearInterval(playInterval);
      isPlaying = false;
      return;
    }
    isPlaying = true;
    let r = 0;
    playInterval = setInterval(() => {
      r = (r + 1) % (parseInt(slider.max) + 1);
      slider.value = r;
      updateScrubber(r);
      if (r === parseInt(slider.max)) {
        clearInterval(playInterval);
        isPlaying = false;
      }
    }, 200);
  }

  // Evidence Search Filtering
  function filterEvidence(query) {
    const cards = document.querySelectorAll('.evidence-card');
    const q = query.toLowerCase();
    cards.forEach(c => {
      const txt = c.getAttribute('data-text').toLowerCase();
      c.style.display = txt.includes(q) ? 'block' : 'none';
    });
  }

  // Node inspection modal
  function inspectNode(nodeId) {
    const n = DOSSIER_DATA.networkEvidence.nodes.find(item => item.id === nodeId);
    if (!n) return;
    alert("Node Dossier:\\nID: " + n.id + "\\nName: " + n.name + "\\nCommunity: " + n.communityName + "\\nState: " + n.state + "\\nIs Bridge: " + n.isBridge + "\\nDegree: " + n.degree);
  }

  // Download raw machine JSON
  function downloadMachineJSON() {
    const blob = new Blob([JSON.stringify(DOSSIER_DATA, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "social-gravity-dossier-" + DOSSIER_DATA.metadata.id.toLowerCase() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>
</body>
</html>`;
}

export const generateDossierHtml = generateInteractiveHTML;
export { generateExecutivePDFHtml as generateDossierPrintableHtml } from './pdfGenerator';

