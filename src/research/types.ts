/**
 * Social Gravity - V2.0 Research Publication Pipeline Types
 * Reproducibility manifests, LaTeX table exporters, and academic citation formats.
 */

export interface ReproducibilityManifest {
  manifestId: string;
  generatedAt: string;
  engineVersion: string;
  runtimeEnvironment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    v8Version: string;
  };
  prngSpecification: {
    algorithm: 'SplitMix32';
    period: string;
    deterministicSeeds: number[];
  };
  datasetChecksums: Record<string, string>;
  modelArtifacts: {
    goEmotionsOntology: string;
    classifierArchitecture: string;
    quantization: string;
  };
  experimentVerificationExitCode: number;
}

export interface LatexTable {
  caption: string;
  label: string;
  latexCode: string;
}
