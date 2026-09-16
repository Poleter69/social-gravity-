/**
 * Social Gravity - Multi-Modal Processing Tests (Milestone M12)
 * 
 * Verifies 64-bit dHash perceptual hashing, local OCR extraction, audio
 * cadence tracking, video timeline velocity, and meme-driven transmission.
 */

import { MultiModalProcessor } from '../../src/multimodal/multimodalEngine';
import { MultiModalSignalPayload } from '../../src/multimodal/types';
import { RumorEngine } from '../../src/simulation/rumorEngine';
import { societyGenerator } from '../../src/society/generators/societyGenerator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testMultiModalIntelligence() {
  console.log('\n--- Testing Milestone M12: Multi-Modal Intelligence Engine ---');

  // 1. Difference Hash (dHash) & Perceptual Distance
  const matrixA = Array.from({ length: 8 }, (_, r) => 
    Array.from({ length: 9 }, (_, c) => (r * 10 + c * 15) % 256)
  );
  // Matrix B is a subtle visual derivative (small noise)
  const matrixB = Array.from({ length: 8 }, (_, r) => 
    Array.from({ length: 9 }, (_, c) => (r * 10 + c * 15 + 2) % 256)
  );

  const hashA = MultiModalProcessor.computeDifferenceHash(matrixA);
  const hashB = MultiModalProcessor.computeDifferenceHash(matrixB);
  const distance = MultiModalProcessor.computePerceptualDistance(hashA, hashB);

  assert(hashA.length === 16, 'Hex dHash length must be 16 characters (64 bits)');
  assert(distance <= 4, 'Visual derivative must have small Hamming distance (<= 4)');
  console.log(`  ✓ 64-bit dHash Verified: hashA=${hashA}, hashB=${hashB}, Hamming distance=${distance}`);

  // 2. OCR Local Text Extraction
  const ocr = MultiModalProcessor.extractOCR(
    'BREAKING LEAK\nCONFIDENTIAL FINANCIAL MEMO\nLIQUIDITY FROZEN'
  );
  assert(ocr.boundingBlocks.length === 3, 'Must extract 3 text lines');
  assert(ocr.extractedText.includes('CONFIDENTIAL FINANCIAL MEMO'), 'Must retain critical text');
  console.log(`  ✓ Local OCR Extraction Verified: "${ocr.extractedText}" (${ocr.boundingBlocks.length} blocks)`);

  // 3. Audio Cadence & Speech Rate
  const audio = MultiModalProcessor.analyzeAudio(
    'Attention all personnel emergency procedures are now activated do not panic evacuate the building immediately',
    5.0,
    65.0
  );
  assert(audio.speechRateWordsPerMinute >= 150, 'Fast speech rate must be calculated');
  assert(audio.emotionalCadence === 'agitated' || audio.emotionalCadence === 'urgent', 'High pitch + fast rate = agitated/urgent');
  console.log(`  ✓ Audio Cadence Analysis Verified: ${audio.speechRateWordsPerMinute} WPM, Cadence: ${audio.emotionalCadence}`);

  // 4. Video Virality Velocity
  const video = MultiModalProcessor.analyzeVideo(12, [
    'Dramatic title intro with red siren',
    'Crowd gathering at local exchange',
    'Police cordoning the main street',
  ]);
  assert(video.keyframeTimeline.length === 3, 'Must track 3 keyframes');
  assert(video.viralityVelocityScore > 0.5, 'Fast paced video must score high virality');
  console.log(`  ✓ Video Virality Velocity Verified: Score=${video.viralityVelocityScore}`);

  // 5. Meme Propagation & Multiplier
  const meme = MultiModalProcessor.classifyMeme(
    'Distracted Boyfriend',
    'Regulators inspecting audited banks',
    'Crypto influencer claiming 1000% safe yield'
  );
  assert(meme.memeticAmplificationMultiplier > 1.2, 'Memetic multiplier must boost propagation');
  console.log(`  ✓ Meme Classification Verified: Template=${meme.templateName}, Multiplier=${meme.memeticAmplificationMultiplier}x`);

  // 6. End-to-End Injection into Simulation Core
  const society = societyGenerator.generate({
    name: 'MultiModal Test Network',
    archetype: 'online_community',
    populationSize: 50,
    seed: 99,
  });

  const payload: MultiModalSignalPayload = {
    id: 'meme_contagion_1',
    title: 'Viral Bank Meme',
    mediaType: 'meme',
    meme,
  };

  const unifiedSignal = MultiModalProcessor.toUnifiedSignal(payload, society.agents[0].id, 0);
  assert(unifiedSignal.multimodalMultiplier > 1.0, 'Unified signal must inherit multimodal multiplier');

  const engine = new RumorEngine(society, { maxRounds: 10, seed: 42 });
  engine.start(unifiedSignal, [society.agents[0].id]);
  const stepResult = engine.step();

  assert(stepResult.currentRound === 1, 'Simulation must step forward cleanly with multimodal signal');
  console.log(`  ✓ Multi-Modal Simulation Ingestion Verified: Round 1 Believers=${stepResult.agentStates.size}`);

  console.log('✓ Multi-Modal Intelligence Engine validated successfully.');
}
