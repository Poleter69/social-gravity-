/**
 * Social Gravity - Central AI Discovery Engine
 * Master pipeline orchestrating telemetry ingestion, pattern detection,
 * hypothesis card synthesis, resilience scoring, and intervention recommendation.
 */

import { Society } from '../society/types/society';
import { SimulationState } from '../simulation/types';
import { TelemetryCollector } from './telemetryCollector';
import { ResilienceScorer } from './resilienceScorer';
import { PatternDetector } from './patternDetector';
import { InterventionAdvisor } from './interventionAdvisor';
import { OllamaClient } from './ollamaClient';
import { DiscoveryReport } from './types';

export class DiscoveryEngine {
  /**
   * Generates a comprehensive research discovery report for a completed or in-progress simulation.
   */
  public static async analyze(
    society: Society,
    simState: SimulationState,
    options: { preferOllama?: boolean } = {}
  ): Promise<DiscoveryReport> {
    // 1. Gather Telemetry
    const telemetry = TelemetryCollector.collect(society, simState);

    // 2. Score Society Resilience
    const resilienceScore = ResilienceScorer.calculate(telemetry);

    // 3. Detect Empirical Patterns & Formulate Hypothesis Cards
    const {
      hypothesisCards,
      topDiscovery,
      measuredFacts,
      inferredObservations,
      futureHypotheses,
    } = PatternDetector.detectPatterns(telemetry);

    // 4. Synthesize Strategic Intervention Recommendation
    const intervention = InterventionAdvisor.recommend(telemetry);

    // 5. Generate Executive Summary (Local Ollama LLM or Deterministic Engine)
    const { summary: executiveSummary, source: generatorSource } =
      await OllamaClient.generateExecutiveSummary(
        telemetry,
        resilienceScore,
        topDiscovery,
        intervention,
        options.preferOllama ?? true
      );

    const report: DiscoveryReport = {
      id: `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      experimentId: telemetry.id,
      generatedAt: new Date().toISOString(),
      generatorSource,
      resilienceScore,
      topDiscovery,
      intervention,
      hypothesisCards,
      measuredFacts,
      inferredObservations,
      futureHypotheses,
      executiveSummary,
      telemetry,
    };

    return report;
  }
}
