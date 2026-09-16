/**
 * Social Gravity - Multi-Modal Processing Engine (M12)
 * 
 * Local-first multi-modal extraction engine for images (dHash), OCR text,
 * video timeline metadata, audio transcripts, and meme virality dynamics.
 */

import { 
  OCRAnalysis, 
  VideoMetadataAnalysis, 
  AudioTranscriptAnalysis, 
  MemePropagationAnalysis, 
  MultiModalSignalPayload, 
  MultiModalInformationSignal 
} from './types';

export class MultiModalProcessor {
  /**
   * Computes a 64-bit gradient Difference Hash (dHash) from an 8x9 grayscale matrix
   * Provides rapid, deterministic, visual image deduplication and mutation tracking.
   */
  public static computeDifferenceHash(grayscale8x9: number[][]): string {
    let hashBinary = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Compare current pixel to right adjacent pixel
        const left = grayscale8x9[row]?.[col] ?? 128;
        const right = grayscale8x9[row]?.[col + 1] ?? 128;
        hashBinary += left > right ? '1' : '0';
      }
    }
    // Convert 64-bit binary string to 16-character hexadecimal
    let hex = '';
    for (let i = 0; i < hashBinary.length; i += 4) {
      const nibble = hashBinary.slice(i, i + 4);
      hex += parseInt(nibble, 2).toString(16);
    }
    return hex.padStart(16, '0');
  }

  /**
   * Computes Hamming distance between two 16-character hex perceptual hashes.
   * Distance <= 10 indicates high visual similarity / visual derivative.
   */
  public static computePerceptualDistance(hashA: string, hashB: string): number {
    let distance = 0;
    const len = Math.min(hashA.length, hashB.length);
    for (let i = 0; i < len; i++) {
      const valA = parseInt(hashA[i], 16);
      const valB = parseInt(hashB[i], 16);
      let xor = valA ^ valB;
      while (xor > 0) {
        distance += xor & 1;
        xor >>= 1;
      }
    }
    return distance;
  }

  /**
   * Local heuristic OCR text extractor
   */
  public static extractOCR(rawTextCandidate: string): OCRAnalysis {
    const lines = rawTextCandidate.split('\n').filter(l => l.trim().length > 0);
    const boundingBlocks = lines.map((text, idx) => ({
      text: text.trim(),
      confidence: 0.92 - (idx * 0.02),
      box: [10, idx * 30, 400, 25] as [number, number, number, number],
    }));

    return {
      extractedText: lines.join(' '),
      detectedLanguage: 'en',
      overlayTextPercentage: Math.min(0.45, lines.length * 0.08),
      boundingBlocks,
    };
  }

  /**
   * Local audio cadence and pitch arousal analyzer
   */
  public static analyzeAudio(
    transcript: string,
    durationSeconds: number,
    pitchVarianceHz: number = 45.0
  ): AudioTranscriptAnalysis {
    const wordCount = transcript.split(/\s+/).length;
    const speechRateWordsPerMinute = Math.round((wordCount / Math.max(durationSeconds, 1)) * 60);

    let emotionalCadence: 'urgent' | 'calm' | 'agitated' | 'monotone' = 'calm';
    if (speechRateWordsPerMinute > 180 || pitchVarianceHz > 60) {
      emotionalCadence = 'agitated';
    } else if (speechRateWordsPerMinute > 150) {
      emotionalCadence = 'urgent';
    } else if (pitchVarianceHz < 20) {
      emotionalCadence = 'monotone';
    }

    return {
      transcript,
      durationSeconds,
      pitchVariance: pitchVarianceHz,
      emotionalCadence,
      speechRateWordsPerMinute,
    };
  }

  /**
   * Local video frame and virality velocity analyzer
   */
  public static analyzeVideo(durationSeconds: number, keyframeCaptions: string[]): VideoMetadataAnalysis {
    const keyframeTimeline = keyframeCaptions.map((caption, idx) => ({
      timestampSeconds: Number(((idx + 1) * (durationSeconds / (keyframeCaptions.length + 1))).toFixed(1)),
      visualSalience: 0.7 + (idx * 0.05),
      caption,
    }));

    // Fast-paced video with multiple keyframes boosts virality
    const viralityVelocityScore = Math.min(1.0, 0.5 + (keyframeCaptions.length * 0.08) - (durationSeconds * 0.002));

    return {
      durationSeconds,
      frameRate: 30,
      keyframeTimeline,
      viralityVelocityScore: Number(viralityVelocityScore.toFixed(2)),
    };
  }

  /**
   * Local meme template & virality amplifier classifier
   */
  public static classifyMeme(
    templateName: string,
    macroHeadline: string,
    punchline: string
  ): MemePropagationAnalysis {
    const isHighSarcasm = punchline.includes('?') || punchline.includes('!') || punchline.length < 25;
    const subversionScore = isHighSarcasm ? 0.85 : 0.45;

    // Memetic transmission multiplier: Memes bypass skepticism due to humor & visual framing
    const memeticAmplificationMultiplier = Number((1.25 + (subversionScore * 0.65)).toFixed(2));

    return {
      templateId: templateName.toLowerCase().replace(/\s+/g, '_'),
      templateName,
      macroHeadline,
      punchline,
      subversionScore,
      memeticAmplificationMultiplier,
    };
  }

  /**
   * Unifies any multi-modal payload into an enriched InformationSignal
   * ready for immediate injection into the RumorEngine simulation core.
   */
  public static toUnifiedSignal(
    payload: MultiModalSignalPayload,
    senderId: string,
    round: number = 0
  ): MultiModalInformationSignal {
    let content = payload.rawText || payload.title;
    let multiplier = 1.0;
    let fearSalience = 0.5;

    if (payload.mediaType === 'meme' && payload.meme) {
      content = `[MEME: ${payload.meme.templateName}] Top: "${payload.meme.macroHeadline}" | Bottom: "${payload.meme.punchline}"`;
      multiplier = payload.meme.memeticAmplificationMultiplier;
      fearSalience = 0.45 + (payload.meme.subversionScore * 0.3);
    } else if (payload.mediaType === 'image' && payload.image) {
      content = `[IMAGE: hash=${payload.image.perceptualHash}] ${payload.title}`;
      if (payload.ocr) {
        content += ` | OCR Text: "${payload.ocr.extractedText}"`;
      }
      multiplier = 1.25;
      fearSalience = payload.image.visualArousalScore;
    } else if (payload.mediaType === 'audio' && payload.audio) {
      content = `[AUDIO: cadence=${payload.audio.emotionalCadence}] "${payload.audio.transcript}"`;
      multiplier = payload.audio.emotionalCadence === 'agitated' ? 1.4 : 1.1;
      fearSalience = payload.audio.pitchVariance / 100;
    } else if (payload.mediaType === 'video' && payload.video) {
      content = `[VIDEO: ${payload.video.durationSeconds}s] ${payload.title} | Frames: ${payload.video.keyframeTimeline.map(k => k.caption).join(' -> ')}`;
      multiplier = 1.0 + (payload.video.viralityVelocityScore * 0.5);
      fearSalience = 0.65;
    }

    return {
      id: payload.id,
      topic: payload.title,
      content,
      veracity: 'false',
      emotionalSalience: Number(Math.min(1.0, Math.max(0.1, fearSalience)).toFixed(2)),
      complexity: 0.25,
      senderId,
      round,
      mediaType: payload.mediaType,
      perceptualHash: payload.image?.perceptualHash,
      multimodalMultiplier: Number(multiplier.toFixed(2)),
      multimodalSummary: `${payload.mediaType.toUpperCase()} signal with ${multiplier}x virality amplification factor.`,
    };
  }
}
