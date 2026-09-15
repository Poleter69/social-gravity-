/**
 * Social Gravity - Society Generator Orchestrator
 * Main entry point implementing ISocietyGenerator with validation and JSON export.
 */

import { Society, SocietyConfig } from '../types/society';
import { SocietyPipeline } from './societyPipeline';

export interface ISocietyGenerator {
  generate(config: SocietyConfig): Society;
  exportJSON(society: Society): string;
}

export class SocietyGenerator implements ISocietyGenerator {
  public generate(config: SocietyConfig): Society {
    if (!config.populationSize || config.populationSize < 5) {
      throw new Error(
        `Invalid population size: ${config.populationSize}. Minimum viable society requires at least 5 agents.`
      );
    }

    if (config.populationSize > 50000) {
      throw new Error(
        `Population size ${config.populationSize} exceeds local single-threaded allocation limit of 50,000 agents.`
      );
    }

    if (config.baselineTrust !== undefined && (config.baselineTrust < 0 || config.baselineTrust > 1)) {
      throw new Error(`baselineTrust must be in range [0, 1], received ${config.baselineTrust}`);
    }

    if (config.baselineConformity !== undefined && (config.baselineConformity < 0 || config.baselineConformity > 1)) {
      throw new Error(`baselineConformity must be in range [0, 1], received ${config.baselineConformity}`);
    }

    if (config.baselineRiskTolerance !== undefined && (config.baselineRiskTolerance < 0 || config.baselineRiskTolerance > 1)) {
      throw new Error(`baselineRiskTolerance must be in range [0, 1], received ${config.baselineRiskTolerance}`);
    }

    return SocietyPipeline.execute(config);
  }

  public exportJSON(society: Society): string {
    return JSON.stringify(society, null, 2);
  }
}

/**
 * Singleton factory instance for standard usage across the application.
 */
export const societyGenerator = new SocietyGenerator();
