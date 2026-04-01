/**
 * Deployment Envelope Validator
 *
 * Implements envelope laws D1-D5 from lawbook 032.
 * Validates repository structure and pipeline boundaries.
 */
import type { EnvelopeVerdict, PipelineStage } from "../types/envelope.js";
/**
 * Validate repository structure.
 *
 * Law D1-D5: Envelope validation
 */
export declare function validateRepo(operations: Array<{
    type: "read" | "write";
    path: string;
    stage?: PipelineStage;
}>): EnvelopeVerdict;
/**
 * Check if a stage operation is valid.
 */
export declare function validateStageOperation(stage: PipelineStage, operations: Array<{
    type: "read" | "write";
    path: string;
}>): EnvelopeVerdict;
/**
 * Get authority classification for a directory.
 */
export declare function getDirectoryAuthority(path: string): {
    authority: string;
    rule: string;
} | undefined;
/**
 * Check if path is authoritative source.
 */
export declare function isAuthoritativeSource(path: string): boolean;
/**
 * Check if path is non-authoritative generated.
 */
export declare function isGeneratedArtifact(path: string): boolean;
/**
 * Check if path is runtime state.
 */
export declare function isRuntimeState(path: string): boolean;
/**
 * Check if path is cache.
 */
export declare function isCache(path: string): boolean;
//# sourceMappingURL=validator.d.ts.map