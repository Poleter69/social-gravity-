/**
 * Social Gravity - Psychology Engine Types & Cognitive Abstractions
 * Defines dimensional emotional vectors, incoming signals, decision actions, and explainable audit trails.
 */

export type DecisionAction = 'ignore' | 'scrutinize' | 'adopt' | 'amplify' | 'debunk';

export interface EmotionalVector {
  /** Baseline equilibrium / tranquility [0, 1] */
  calm: number;
  /** Epistemic ambiguity / doubt [0, 1] */
  uncertainty: number;
  /** Threat salience / panic [0, 1] */
  fear: number;
  /** Subjective certainty and agency [0, 1] */
  confidence: number;
}

export interface InformationSignal {
  id: string;
  topic: string;
  content: string;
  /** Intrinsic credibility / ground truth indicator */
  veracity: 'true' | 'false' | 'unverified';
  /** Emotional provocation / shock value [0, 1] */
  emotionalSalience: number;
  /** Persuasive complexity / intellectual sophistication [0, 1] */
  complexity: number;
  /** ID of the originating or transmitting agent */
  senderId: string;
  round: number;
}

export interface DecisionFactors {
  senderTrust: number;
  neighborAgreementRatio: number;
  socialProofPressure: number;
  fearLevel: number;
  uncertaintyLevel: number;
  confidenceLevel: number;
  riskTolerance: number;
  effectiveCredibility: number;
}

export interface DecisionLog {
  id: string;
  round: number;
  agentId: string;
  senderId: string;
  signalId: string;
  action: DecisionAction;
  decisionConfidence: number;
  factors: DecisionFactors;
  /** Human-readable explanation steps detailing the cognitive decision path */
  reasoningSteps: string[];
  /** Concise synthesis sentence for display and AI discovery */
  narrativeSummary: string;
  timestamp: string;
}

export interface PsychologicalState {
  emotions: EmotionalVector;
  skepticism: number; // accumulated epistemic resistance [0, 1]
  resilience: number; // psychological buffer against fear amplification [0, 1]
  decisionLogs: DecisionLog[];
  verificationsEncountered: number;
  misinformationEncountered: number;
}
