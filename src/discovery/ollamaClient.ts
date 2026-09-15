/**
 * Social Gravity - Local Ollama LLM Client & Deterministic Fallback
 * Provides optional local-first LLM enrichment using Ollama (Llama 3.2 3B / Llama 3)
 * with robust, zero-downtime fallback to deterministic research report synthesis.
 */

import { ExperimentTelemetry, ResilienceScore, InterventionRecommendation } from './types';

export class OllamaClient {
  private static endpoint: string = 'http://localhost:11434';
  private static defaultModel: string = 'llama3.2:3b';

  /**
   * Probes whether a local Ollama daemon is currently running on the host.
   */
  public static async isAvailable(timeoutMs: number = 1000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generates an executive research dispatch.
   * Uses local Ollama if available; seamlessly falls back to deterministic synthesis otherwise.
   */
  public static async generateExecutiveSummary(
    telemetry: ExperimentTelemetry,
    resilience: ResilienceScore,
    topDiscovery: string,
    intervention: InterventionRecommendation,
    preferOllama: boolean = true
  ): Promise<{ summary: string; source: 'deterministic_engine' | 'ollama_llama3' }> {
    if (preferOllama) {
      const available = await this.isAvailable(800);
      if (available) {
        try {
          const prompt = this.buildPrompt(telemetry, resilience, topDiscovery, intervention);
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(`${this.endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: this.defaultModel,
              prompt,
              stream: false,
              options: {
                temperature: 0.3,
                top_p: 0.9,
              },
            }),
            signal: controller.signal,
          });
          clearTimeout(id);

          if (response.ok) {
            const data = await response.json();
            if (data && data.response && data.response.trim().length > 50) {
              return {
                summary: data.response.trim(),
                source: 'ollama_llama3',
              };
            }
          }
        } catch {
          // Graceful silent fallback to deterministic report
        }
      }
    }

    // 100% Offline Deterministic Generation
    return {
      summary: this.generateDeterministicSummary(telemetry, resilience, topDiscovery, intervention),
      source: 'deterministic_engine',
    };
  }

  /**
   * Deterministic computational social science synthesis engine.
   */
  public static generateDeterministicSummary(
    telemetry: ExperimentTelemetry,
    resilience: ResilienceScore,
    topDiscovery: string,
    intervention: InterventionRecommendation
  ): string {
    const adoptionPct = (telemetry.adoptionRate * 100).toFixed(1);
    const resistPct = (telemetry.resistanceRate * 100).toFixed(1);
    const debunkPct = (telemetry.debunkRate * 100).toFixed(1);
    const trustPct = (telemetry.averageTrust * 100).toFixed(0);
    const fearPct = (telemetry.rumorFearSalience * 100).toFixed(0);

    const paragraph1 = `In this simulation of ${telemetry.populationSize} autonomous agents across ${telemetry.communityCount} communities, the propagation of "${telemetry.rumorTopic}" reached a final adoption rate of ${adoptionPct}% with a peak reproduction number R₀ of ${telemetry.peakR0}. The society achieved an overall Resilience Score of ${resilience.overall}/100 (${resilience.rating}). Epistemic defense held resistance at ${resistPct}%, while maximum cascade depth reached ${telemetry.maxCascadeDepth} hops from patient zero.`;

    const paragraph2 = `Primary topological and behavioral analysis indicates: ${topDiscovery}. Baseline epistemic trust calibrated at ${trustPct}% combined with a rumor threat salience of ${fearPct}% dictated the cascade trajectory. In particular, ${(telemetry.bridgeInfectionRatio * 100).toFixed(0)}% of structural bridge nodes became transmitters, driving an echo-chamber polarization index of ${telemetry.echoChamberPolarization}. Where local peer consensus formed, normative social proof accelerated cliquish adoption.`;

    const paragraph3 = telemetry.hasIntervention
      ? `A verified debunking counter-narrative deployed at round t=${telemetry.interventionRound} converted ${debunkPct}% of agents into active debunkers, resulting in an R₀ drop of ${telemetry.postInterventionR0Drop}. For subsequent trials, the optimal recommended intervention is to ${intervention.title.toLowerCase()}: ${intervention.rationale}`
      : `No counter-narrative intervention was deployed during this baseline run. Strategic modeling indicates the highest-leverage defensive intervention is to ${intervention.title.toLowerCase()}: ${intervention.rationale} Expected impact: ${intervention.expectedImpact}`;

    return `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;
  }

  private static buildPrompt(
    telemetry: ExperimentTelemetry,
    resilience: ResilienceScore,
    topDiscovery: string,
    intervention: InterventionRecommendation
  ): string {
    return `You are a Principal Computational Social Scientist at an advanced research laboratory.
Write an executive scientific post-mortem (3 paragraphs, objective, rigorous tone) analyzing the following social simulation telemetry:
- Society: ${telemetry.populationSize} agents, ${telemetry.communityCount} communities, baseline trust: ${(telemetry.averageTrust * 100).toFixed(0)}%, baseline conformity: ${(telemetry.averageConformity * 100).toFixed(0)}%.
- Misinformation Signal: "${telemetry.rumorTopic}", fear salience: ${(telemetry.rumorFearSalience * 100).toFixed(0)}%.
- Outcomes: Final adoption: ${(telemetry.adoptionRate * 100).toFixed(1)}%, Skeptics: ${(telemetry.resistanceRate * 100).toFixed(1)}%, Debunkers: ${(telemetry.debunkRate * 100).toFixed(1)}%, Peak R0: ${telemetry.peakR0}, Final R0: ${telemetry.finalR0}.
- Structural: Bridge infection ratio: ${(telemetry.bridgeInfectionRatio * 100).toFixed(1)}%, Influencer infection ratio: ${(telemetry.influencerInfectionRatio * 100).toFixed(1)}%, Polarization index: ${telemetry.echoChamberPolarization}.
- Resilience Score: ${resilience.overall}/100 (${resilience.rating}).
- Top Discovery: ${topDiscovery}.
- Recommended Intervention: ${intervention.title} (${intervention.rationale}).

Explain causal mechanisms (Granovetter weak ties, Asch conformity, Prospect theory fear salience, Bayesian trust updating). Do not use bullet points or markdown headings. Write 3 cohesive academic paragraphs.`;
  }
}
