/**
 * Deployment Envelope Types
 * 
 * Types for repository structure validation.
 */

export type DirectoryAuthority =
  | { path: "/policy/src"; authority: "authoritative"; rule: "must-not-be-generated" }
  | { path: "/policy/spec"; authority: "authoritative"; rule: "must-not-be-generated" }
  | { path: "/policy/generated"; authority: "non-authoritative"; rule: "must-be-reproducible" }
  | { path: "/policy/dist"; authority: "non-authoritative"; rule: "must-be-reproducible" }
  | { path: "/policy/state"; authority: "non-authoritative"; rule: "runtime-only" }
  | { path: "/policy/cache"; authority: "non-authoritative"; rule: "disposable" };

export type EnvelopeViolation = {
  type: string;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
};

export type EnvelopeVerdict = {
  valid: boolean;
  violations: EnvelopeViolation[];
};

export type PipelineStage = 
  | "parse" 
  | "lower" 
  | "validate" 
  | "normalize" 
  | "render" 
  | "integrate" 
  | "journal";

export type StageOperation = {
  stage: PipelineStage;
  reads: string[];
  writes: string[];
};
