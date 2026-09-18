/**
 * Social Gravity — Project Dossier Executive PDF Generator
 * Compiles a print-optimized executive briefing and triggers browser print dialog / PDF export.
 * Formatted specifically for A4 / Letter with vector graphics and classified headers/footers.
 */

import { InvestigationDossier } from '../types';

export function generateExecutivePDFHtml(dossier: InvestigationDossier): string {
  const { metadata, executiveSummary, timeline, networkEvidence, keyActors, evidenceBoard, recommendations, appendix } = dossier;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${metadata.operationCodename} — Executive Intelligence Dossier</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 15mm 15mm 15mm;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print {
      display: none !important;
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #0F172A;
    background: #FFFFFF;
    font-size: 11pt;
    line-height: 1.45;
  }

  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

  /* Classification Header / Footer */
  .classified-bar {
    background: #DC2626;
    color: #FFFFFF;
    font-family: monospace;
    font-size: 9pt;
    font-weight: bold;
    letter-spacing: 0.25em;
    text-align: center;
    padding: 3px 0;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .classified-bar-bottom {
    background: #DC2626;
    color: #FFFFFF;
    font-family: monospace;
    font-size: 9pt;
    font-weight: bold;
    letter-spacing: 0.25em;
    text-align: center;
    padding: 3px 0;
    text-transform: uppercase;
    margin-top: 20px;
  }

  .page-break { page-break-after: always; }
  .avoid-break { page-break-inside: avoid; }

  /* Cover Page */
  .cover-container {
    height: 94vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px 0;
  }

  .cover-header {
    border-bottom: 2px solid #0F172A;
    padding-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cover-title {
    font-size: 32pt;
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-top: 40px;
    margin-bottom: 12px;
  }

  .cover-codename {
    font-size: 14pt;
    font-family: monospace;
    font-weight: bold;
    color: #D97706;
  }

  .executive-box {
    border-left: 4px solid #2563EB;
    background: #F8FAFC;
    padding: 16px 20px;
    margin: 40px 0;
    border-radius: 4px;
  }

  /* Section Title */
  .section-title {
    font-size: 14pt;
    font-weight: 800;
    border-bottom: 1.5px solid #0F172A;
    padding-bottom: 4px;
    margin-bottom: 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* KPI Grid */
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .kpi-card {
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    padding: 10px 14px;
    background: #F8FAFC;
  }

  .kpi-num {
    font-size: 20pt;
    font-family: monospace;
    font-weight: 900;
    color: #0F172A;
  }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 8px; font-family: monospace; }
  th { border-bottom: 1.5px solid #0F172A; text-align: left; padding: 6px 8px; font-size: 8.5pt; text-transform: uppercase; color: #475569; }
  td { border-bottom: 1px solid #E2E8F0; padding: 6px 8px; }

  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 8pt;
    font-family: monospace;
    font-weight: bold;
    border: 1px solid #CBD5E1;
  }
</style>
</head>
<body>

<!-- PAGE 1: COVER PAGE -->
<div class="cover-container page-break">
  <div>
    <div class="classified-bar">${metadata.classification}</div>
    <div class="cover-header">
      <div style="font-family: monospace; font-size: 10pt; font-weight: bold;">
        SOCIAL GRAVITY // NATIONAL THREAT INTELLIGENCE
      </div>
      <div style="font-family: monospace; font-size: 9pt;">
        DOC ID: ${metadata.id}
      </div>
    </div>

    <div class="cover-title">
      ${metadata.title}
    </div>
    <div class="cover-codename">
      CODENAME: ${metadata.operationCodename}
    </div>

    <div class="executive-box">
      <div style="font-family: monospace; font-size: 9pt; color: #2563EB; font-weight: bold; margin-bottom: 4px;">
        EXECUTIVE SUMMARY ONE-LINER
      </div>
      <div style="font-size: 13pt; font-style: italic; font-family: Georgia, serif;">
        "${metadata.summaryOneLiner}"
      </div>
    </div>
  </div>

  <div>
    <div style="border-top: 1px solid #CBD5E1; padding-top: 14px; font-family: monospace; font-size: 9pt; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
      <div><strong>DATE:</strong> ${new Date(metadata.generatedAt).toLocaleDateString()}</div>
      <div><strong>ANALYST:</strong> ${metadata.analystId}</div>
      <div><strong>INTEGRITY:</strong> SHA256-VERIFIED</div>
    </div>
    <div style="margin-top: 8px; font-family: monospace; font-size: 8.5pt; color: #64748B;">
      SOURCES: ${metadata.dataSources.join(' | ')}
    </div>
    <div class="classified-bar-bottom">${metadata.classification}</div>
  </div>
</div>

<!-- PAGE 2: EXECUTIVE SUMMARY & TIMELINE -->
<div class="page-break">
  <div class="classified-bar">${metadata.classification}</div>
  <div class="section-title">1. Executive Summary & Critical Indicators</div>

  <div class="kpi-row">
    <div class="kpi-card">
      <div style="font-size: 8pt; font-family: monospace; color: #64748B;">NARRATIVE GROWTH</div>
      <div class="kpi-num" style="color: #2563EB;">${executiveSummary.narrativeGrowth}</div>
    </div>
    <div class="kpi-card">
      <div style="font-size: 8pt; font-family: monospace; color: #64748B;">DOMINANT EMOTION</div>
      <div class="kpi-num" style="color: #DC2626;">${executiveSummary.dominantEmotion}</div>
    </div>
    <div class="kpi-card">
      <div style="font-size: 8pt; font-family: monospace; color: #64748B;">COMMUNITIES BREACHED</div>
      <div class="kpi-num" style="color: #7C3AED;">${executiveSummary.communitiesAffected} / ${executiveSummary.totalCommunities}</div>
    </div>
    <div class="kpi-card">
      <div style="font-size: 8pt; font-family: monospace; color: #64748B;">RISK LEVEL</div>
      <div class="kpi-num" style="color: #D97706;">${executiveSummary.riskLevel}</div>
    </div>
  </div>

  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 8.5pt; color: #2563EB; font-weight: bold; margin-bottom: 4px;">
      AI FORENSIC ASSESSMENT
    </div>
    <p style="font-size: 10pt; line-height: 1.5; font-family: Georgia, serif;">
      "${executiveSummary.aiAssessment}"
    </p>
  </div>

  <div class="section-title">2. Incident Chronology Timeline</div>
  <div style="border-left: 2px solid #CBD5E1; padding-left: 16px; margin-left: 8px;">
    ${timeline.map((item) => `
      <div style="margin-bottom: 14px; page-break-inside: avoid;">
        <div style="font-family: monospace; font-size: 9pt; font-weight: bold; color: #2563EB;">
          [Round ${item.round} • ${item.timeOffset}] ${item.label}
        </div>
        <div style="font-size: 10.5pt; font-weight: bold; margin-top: 2px;">${item.headline}</div>
        <div style="font-size: 9pt; color: #334155; margin-top: 2px;">${item.description}</div>
        <div style="font-family: monospace; font-size: 8.5pt; background: #F1F5F9; padding: 4px 6px; border-radius: 4px; margin-top: 4px;">
          <strong>EVIDENCE:</strong> ${item.evidence}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="classified-bar-bottom">${metadata.classification}</div>
</div>

<!-- PAGE 3: NETWORK EVIDENCE & ACTORS -->
<div class="page-break">
  <div class="classified-bar">${metadata.classification}</div>
  <div class="section-title">3. Network Topology & Key Actors</div>

  <!-- Printable Vector Graph -->
  <div style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px; margin-bottom: 16px; background: #FAFAFA;">
    <svg viewBox="0 0 850 480" style="width: 100%; height: auto;">
      ${networkEvidence.communities.map((comm) => {
        if (comm.hullPoints.length < 3) return '';
        const d = comm.hullPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`, '') + ' Z';
        return `
          <path d="${d}" fill="${comm.color}" fill-opacity="0.1" stroke="${comm.color}" stroke-width="1.5" stroke-dasharray="4 3" stroke-opacity="0.4" />
          <text x="${comm.hullPoints[0][0] - 20}" y="${comm.hullPoints[0][1] - 10}" fill="${comm.color}" font-size="10" font-family="monospace" font-weight="bold">${comm.name.toUpperCase()} (${comm.infectedPct}%)</text>
        `;
      }).join('')}

      ${networkEvidence.edges.map((e) => {
        const s = networkEvidence.nodes.find((n) => n.id === e.source);
        const t = networkEvidence.nodes.find((n) => n.id === e.target);
        if (!s || !t) return '';
        if (e.isCrossCommunity) {
          return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4 2" />`;
        }
        return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="#94A3B8" stroke-width="0.7" stroke-opacity="0.5" />`;
      }).join('')}

      ${networkEvidence.nodes.map((n) => {
        let fill = '#64748B';
        if (n.state === 'BELIEVER') fill = '#DC2626';
        else if (n.state === 'DEBUNKER') fill = '#059669';
        const r = n.isInfluencer ? 7 : (n.isBridge ? 6 : 4);
        const bridgeRing = n.isBridge ? `<circle cx="${n.x}" cy="${n.y}" r="${r + 4}" fill="none" stroke="#F59E0B" stroke-width="2" />` : '';
        return `
          <g>
            ${bridgeRing}
            <circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" stroke="#FFF" stroke-width="1" />
          </g>
        `;
      }).join('')}
    </svg>
    <div style="font-family: monospace; font-size: 8pt; color: #64748B; text-align: center; margin-top: 4px;">
      Graph Topology Evidence: Red = Believer | Gray = Susceptible | Green = Debunker | Gold Ring = Strategic Bridge Node
    </div>
  </div>

  <div class="section-title">4. Top Key Actors</div>
  <table>
    <thead>
      <tr>
        <th>Actor Alias</th>
        <th>Tactical Role</th>
        <th>Community</th>
        <th>Degree</th>
        <th>Betweenness</th>
        <th>Risk Level</th>
      </tr>
    </thead>
    <tbody>
      ${keyActors.map((a) => `
        <tr>
          <td><strong>${a.alias}</strong></td>
          <td>${a.role}</td>
          <td>${a.communityName}</td>
          <td>${a.degree}</td>
          <td>${(a.betweenness * 100).toFixed(0)}th pct</td>
          <td><span class="badge" style="color: ${a.risk === 'Critical' ? '#DC2626' : '#D97706'};">${a.risk}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="classified-bar-bottom">${metadata.classification}</div>
</div>

<!-- PAGE 4: EVIDENCE BOARD & RECOMMENDATIONS -->
<div>
  <div class="classified-bar">${metadata.classification}</div>
  <div class="section-title">5. Verified Evidence Cards</div>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
    ${evidenceBoard.map((c) => `
      <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 8px 10px; background: #F8FAFC; page-break-inside: avoid;">
        <div style="font-family: monospace; font-size: 8pt; font-weight: bold; color: #2563EB; margin-bottom: 2px;">
          ${c.source} • ${c.emotion} (${c.confidence}%)
        </div>
        <div style="font-weight: bold; font-size: 9.5pt;">${c.headline}</div>
        <div style="font-style: italic; font-size: 8.5pt; color: #334155; margin: 3px 0;">${c.content}</div>
        <div style="font-family: monospace; font-size: 8pt; color: #64748B;">
          <strong>CONTEXT:</strong> ${c.whyItMattered}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="section-title">6. Action Directives & Recommendations</div>
  <div style="margin-bottom: 16px;">
    ${recommendations.map((r) => `
      <div style="margin-bottom: 10px; border-left: 3px solid #059669; padding-left: 10px; page-break-inside: avoid;">
        <div style="font-family: monospace; font-size: 8.5pt; font-weight: bold; color: #059669;">
          [${r.priority}] ${r.title}
        </div>
        <div style="font-family: monospace; font-size: 8.5pt; color: #1E293B; margin-top: 2px;">${r.action}</div>
        <div style="font-family: monospace; font-size: 8pt; color: #64748B;">
          <strong>PROJECTED IMPACT:</strong> ${r.expectedImpact}
        </div>
      </div>
    `).join('')}
  </div>

  <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; font-family: monospace; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between;">
    <div>FINGERPRINT: ${appendix.replayHash.slice(0, 24)}...</div>
    <div>CHECKSUM: ${appendix.exportChecksum.slice(0, 24)}...</div>
  </div>
  <div class="classified-bar-bottom">${metadata.classification}</div>
</div>

<script>
  window.onload = function() {
    window.focus();
    window.print();
  };
</script>
</body>
</html>`;
}

export function generateExecutivePDF(dossier: InvestigationDossier): void {
  const html = generateExecutivePDFHtml(dossier);

  if (typeof window === 'undefined') {
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the Executive PDF.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

export const generatePrintableDossierPdf = generateExecutivePDF;

