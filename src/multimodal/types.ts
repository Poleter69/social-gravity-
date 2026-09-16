/**
 * Social Gravity - Multi-Modal Intelligence Types (M12)
 * Local-first processing contracts for image perceptual hashing, OCR text,
 * video frame timelines, audio transcript cadences, and meme propagation.
 */

import { InformationSignal } from '../psychology/types';

export type MultiModalMediaType = 'image' | 'video' | 'audio' | 'meme' | 'text';

export interface ImageAnalysis {
  perceptualHash: string;          // 64-bit dHash string for visual lineage tracking
  visualArousalScore: number;      // [0, 1] Color saturation & contrast intensity
  dominantColors: string[];        // Hex colors
  aspectRatio: string;
}

export interface OCRBoundingBox {
  text: string;
  confidence: number;
  box: [number, number, number, number]; // [x, y, width, height]
}

export interface OCRAnalysis {
  extractedText: string;
  detectedLanguage: string;
  overlayTextPercentage: number;  // Visual coverage
  boundingBlocks: OCRBoundingBox[];
}

export interface VideoKeyframe {
  timestampSeconds: number;
  visualSalience: number;
  caption: string;
}

export interface VideoMetadataAnalysis {
  durationSeconds: number;
  frameRate: number;
  keyframeTimeline: VideoKeyframe[];
  viralityVelocityScore: number;  // Heuristic virality based on motion & pacing
}

export interface AudioTranscriptAnalysis {
  transcript: string;
  durationSeconds: number;
  pitchVariance: number;          // Arousal indicator
  emotionalCadence: 'urgent' | 'calm' | 'agitated' | 'monotone';
  speechRateWordsPerMinute: number;
}

export interface MemePropagationAnalysis {
  templateId: string;
  templateName: string;
  macroHeadline: string;
  punchline: string;
  subversionScore: number;        // Irony / sarcasm index
  memeticAmplificationMultiplier: number; // Boost to transmission probability (1.1x to 2.5x)
}

export interface MultiModalSignalPayload {
  id: string;
  title: string;
  mediaType: MultiModalMediaType;
  image?: ImageAnalysis;
  ocr?: OCRAnalysis;
  video?: VideoMetadataAnalysis;
  audio?: AudioTranscriptAnalysis;
  meme?: MemePropagationAnalysis;
  rawText?: string;
}

export interface MultiModalInformationSignal extends InformationSignal {
  mediaType: MultiModalMediaType;
  perceptualHash?: string;
  multimodalMultiplier: number; // Virality multiplier applied to base psychological transmission
  multimodalSummary: string;
}
