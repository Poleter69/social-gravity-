/**
 * Social Gravity - Behavioral Decision Engine
 * Orchestrates multi-factor cognitive evaluation, emotional dynamics, social proof,
 * and explainable audit logging for individual agents.
 */

import { Agent } from '../society/types/agent';
import { Society } from '../society/types/society';
import { InformationSignal, DecisionAction, DecisionLog, DecisionFactors } from './types';
import { evaluateSenderCredibility } from './rules/trustReinforcement';
import { evaluateSocialProof } from './rules/socialProof';
import { evaluateFearAmplification } from './rules/fearAmplification';
import { analyzeNeighborhoodContext } from './neighborhood';
import { EmotionEngine } from '../nlp/emotionEngine';

export class BehavioralDecisionEngine {
  /**
   * Evaluates an incoming information signal for an agent within a society context.
   * Synthesizes an explainable behavioral action and evolves the agent's psychological state.
   */
  public static evaluate(
    agent: Agent,
    signal: InformationSignal,
    society: Society
  ): DecisionLog {
    const reasoningSteps: string[] = [];

    // Resolve multi-dimensional emotion profile from signal
    const signalEmotion = signal.emotionProfile || EmotionEngine.getInstance().predictSync(signal.content || signal.topic);
    signal.emotionProfile = signalEmotion;

    // Step 1: Evaluate Sender Credibility with GoEmotions Modulation
    const { senderTrust, reasoningStep: senderStep } = evaluateSenderCredibility(
      agent,
      signal.senderId,
      signalEmotion
    );
    reasoningSteps.push(`[Sender Credibility] ${senderStep}`);

    // Step 2: Evaluate Neighborhood & Topological Context
    const neighborhood = analyzeNeighborhoodContext(agent, society);
    reasoningSteps.push(`[Neighborhood Context] ${neighborhood.reasoningStep}`);

    // Step 3: Evaluate Social Proof & Normative Conformity with Emotional Intensity
    const socialProof = evaluateSocialProof(
      agent,
      neighborhood.neighborAgents,
      'believer',
      signalEmotion
    );
    reasoningSteps.push(`[Social Proof] ${socialProof.reasoningStep}`);

    // Step 4: Evaluate Threat Salience & Fear/Anger Amplification
    const fearResult = evaluateFearAmplification(agent, signal);
    reasoningSteps.push(`[Emotional Reaction] ${fearResult.reasoningStep}`);

    // Update agent's internal emotional vector and affective profile
    agent.psychology.emotions = fearResult.emotionalShift;
    agent.psychology.emotionProfile = signalEmotion;

    // Dampen confidence and elevate uncertainty if bridge node experiences cross-community conflict
    if (neighborhood.hasConflictingSignals) {
      agent.psychology.emotions.uncertainty = Math.min(1.0, agent.psychology.emotions.uncertainty + 0.25);
      agent.psychology.emotions.confidence = Math.max(0.05, agent.psychology.emotions.confidence - 0.20);
      reasoningSteps.push('[Cross-Community Conflict] Disagreeing neighbor communities elevated epistemic uncertainty.');
    }

    // Step 5: Multi-Factor Decision Synthesis
    // Effective Credibility combines dyadic trust, social proof, and skepticism resistance
    const rawCredibility =
      0.35 * senderTrust +
      0.35 * socialProof.consensusRatio +
      0.30 * (1.0 - agent.psychology.skepticism);

    const bridgeDamping = neighborhood.hasConflictingSignals ? 0.75 : 1.0;
    const effectiveCredibility = Number(Math.max(0, Math.min(1.0, rawCredibility * bridgeDamping)).toFixed(3));

    // Decision Logic
    let action: DecisionAction;
    let narrativeSummary: string;
    const emotions = agent.psychology.emotions;

    const angerLevel = emotions.anger ?? (signalEmotion.emotionVector?.anger || 0);

    // Condition A: Active Debunking
    if (
      agent.psychology.skepticism >= 0.65 &&
      effectiveCredibility <= 0.32 &&
      emotions.confidence >= 0.50
    ) {
      action = 'debunk';
      agent.state.beliefStatus = 'debunker';
      narrativeSummary = `High skepticism (${(agent.psychology.skepticism * 100).toFixed(0)}%) and weak credibility (${(effectiveCredibility * 100).toFixed(0)}%) prompted active refutation/debunking.`;
      reasoningSteps.push(`[Synthesis: DEBUNK] Agent possessed high confidence and sufficient skepticism to challenge the claim.`);
    }
    // Condition B: Amplification (Share outward) - Accelerated by anger and fear
    else if (
      (effectiveCredibility >= 0.52 || socialProof.isConsensusCompelling || angerLevel >= 0.45) &&
      (emotions.fear >= 0.40 || angerLevel >= 0.40 || agent.traits.riskTolerance >= 0.55 || agent.traits.influence >= 0.70)
    ) {
      action = 'amplify';
      agent.state.beliefStatus = 'believer';
      agent.state.shareCount += 1;
      narrativeSummary = `High credibility (${(effectiveCredibility * 100).toFixed(0)}%) and emotional intensity (${signalEmotion.primaryEmotion}) triggered immediate amplification.`;
      reasoningSteps.push(`[Synthesis: AMPLIFY] Emotional salience (${signalEmotion.primaryEmotion} intensity ${(signalEmotion.intensity * 100).toFixed(0)}%) and consensus triggered broadcast.`);
    }
    // Condition C: Quiet Adoption
    else if (effectiveCredibility >= 0.48 || socialProof.isConsensusCompelling) {
      action = 'adopt';
      agent.state.beliefStatus = 'believer';
      narrativeSummary = `Credibility and social proof met threshold; agent accepted the premise quietly without broadcasting.`;
      reasoningSteps.push(`[Synthesis: ADOPT] Believed the claim internally, but lacked risk tolerance or influence to broadcast.`);
    }
    // Condition D: Active Scrutiny
    else if (
      emotions.uncertainty >= 0.40 ||
      (effectiveCredibility >= 0.30 && effectiveCredibility < 0.48)
    ) {
      action = 'scrutinize';
      agent.state.beliefStatus = 'skeptical';
      narrativeSummary = `Ambiguous credibility (${(effectiveCredibility * 100).toFixed(0)}%) and high uncertainty (${(emotions.uncertainty * 100).toFixed(0)}%) led agent to pause for verification.`;
      reasoningSteps.push(`[Synthesis: SCRUTINIZE] Insufficient consensus to accept; flagged message for epistemic verification.`);
    }
    // Condition E: Disregard / Ignore
    else {
      action = 'ignore';
      narrativeSummary = `Low credibility (${(effectiveCredibility * 100).toFixed(0)}%) and low emotional urgency; signal was filtered out.`;
      reasoningSteps.push(`[Synthesis: IGNORE] Message failed to surpass cognitive attention threshold.`);
    }

    // Map continuous emotion vector to legacy categorical emotionalState for UI compatibility
    if (angerLevel >= 0.45) {
      agent.state.emotionalState = 'indignant';
    } else if (emotions.fear >= 0.50) {
      agent.state.emotionalState = 'anxious';
    } else if (action === 'debunk') {
      agent.state.emotionalState = 'indignant';
    } else if (emotions.calm >= 0.55 || signalEmotion.category === 'positive') {
      agent.state.emotionalState = 'optimistic';
    } else {
      agent.state.emotionalState = 'neutral';
    }

    if (!agent.state.exposureTick) {
      agent.state.exposureTick = signal.round;
    }

    const factors: DecisionFactors = {
      senderTrust,
      neighborAgreementRatio: socialProof.consensusRatio,
      socialProofPressure: socialProof.conformityPressure,
      fearLevel: emotions.fear,
      uncertaintyLevel: emotions.uncertainty,
      confidenceLevel: emotions.confidence,
      riskTolerance: agent.traits.riskTolerance,
      effectiveCredibility,
      emotionIntensity: signalEmotion.intensity,
      primaryEmotion: signalEmotion.primaryEmotion,
    };

    const decisionConfidence = Number(
      Math.max(0.1, Math.min(0.99, emotions.confidence * 0.6 + effectiveCredibility * 0.4)).toFixed(3)
    );

    const log: DecisionLog = {
      id: `dec-${agent.id}-${signal.id}-${Date.now() % 100000}`,
      round: signal.round,
      agentId: agent.id,
      senderId: signal.senderId,
      signalId: signal.id,
      action,
      decisionConfidence,
      factors,
      reasoningSteps,
      narrativeSummary,
      timestamp: new Date().toISOString(),
    };

    // Prepend to agent's psychological decision logs (capped to 20 for memory efficiency)
    agent.psychology.decisionLogs.unshift(log);
    if (agent.psychology.decisionLogs.length > 20) {
      agent.psychology.decisionLogs.pop();
    }

    return log;
  }
}
