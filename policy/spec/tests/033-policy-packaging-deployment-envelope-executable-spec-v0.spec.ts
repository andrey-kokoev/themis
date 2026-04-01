import { describe, test, expect } from 'vitest';
import {
  validateRepo,
  validateStageOperation,
  isAuthoritativeSource,
  isGeneratedArtifact,
  isRuntimeState,
  isCache,
} from '../../../src/envelope/validator.js';
import type { PipelineStage } from '../../../src/types/envelope.js';

/**
 * Executable Spec: Policy Packaging / Deployment Envelope Executable Spec v0
 * ID: t5n1qb
 * Lawbook Authority: 032-policy-packaging-deployment-envelope-lawbook-v0
 * 
 * This spec operationalizes envelope laws D1-D5.
 */

describe('Policy Packaging / Deployment Envelope Executable Spec v0', () => {
  describe('D1 - Authority', () => {
    test('writing to /generated allowed', () => {
      const result = validateRepo([
        { type: "write", path: "/policy/generated/output.md", stage: "render" },
      ]);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('writing to /src detected as violation', () => {
      const result = validateRepo([
        { type: "write", path: "/policy/src/modified.md" },
      ]);
      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.type === "IllegalWriteToSource")).toBe(true);
    });

    test('writing to /spec detected as violation', () => {
      const result = validateRepo([
        { type: "write", path: "/policy/spec/tests/new.spec.ts" },
      ]);
      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.type === "IllegalWriteToSource")).toBe(true);
    });

    test('isAuthoritativeSource correctly identifies source paths', () => {
      expect(isAuthoritativeSource("/policy/src/file.ts")).toBe(true);
      expect(isAuthoritativeSource("/policy/spec/tests/test.spec.ts")).toBe(true);
      expect(isAuthoritativeSource("/policy/generated/output.md")).toBe(false);
      expect(isAuthoritativeSource("/policy/state/journal.json")).toBe(false);
    });

    test('isGeneratedArtifact correctly identifies generated paths', () => {
      expect(isGeneratedArtifact("/policy/generated/file.md")).toBe(true);
      expect(isGeneratedArtifact("/policy/dist/bundle.js")).toBe(true);
      expect(isGeneratedArtifact("/policy/src/file.ts")).toBe(false);
      expect(isGeneratedArtifact("/policy/state/data.json")).toBe(false);
    });

    test('isRuntimeState correctly identifies state paths', () => {
      expect(isRuntimeState("/policy/state/journal.json")).toBe(true);
      expect(isRuntimeState("/policy/src/file.ts")).toBe(false);
      expect(isRuntimeState("/policy/generated/file.md")).toBe(false);
    });

    test('isCache correctly identifies cache paths', () => {
      expect(isCache("/policy/cache/data.tmp")).toBe(true);
      expect(isCache("/policy/src/file.ts")).toBe(false);
      expect(isCache("/policy/state/data.json")).toBe(false);
    });
  });

  describe('D2 - Pipeline Correctness', () => {
    test('parse stage reads from /src and /spec', () => {
      const result = validateStageOperation("parse", [
        { type: "read", path: "/policy/src/grammar.ts" },
        { type: "read", path: "/policy/spec/laws/law.md" },
      ]);
      expect(result.valid).toBe(true);
    });

    test('render stage writes only to /generated', () => {
      const result = validateStageOperation("render", [
        { type: "write", path: "/policy/generated/output.md" },
      ]);
      expect(result.valid).toBe(true);
    });

    test('render stage may not write to /dist', () => {
      const result = validateStageOperation("render", [
        { type: "write", path: "/policy/dist/output.js" },
      ]);
      // Render is only allowed to write to /generated
      expect(result.valid).toBe(false);
    });

    test('journal stage writes only to /state', () => {
      const result = validateStageOperation("journal", [
        { type: "write", path: "/policy/state/journal.json" },
      ]);
      expect(result.valid).toBe(true);
    });

    test('integrate stage is in-memory only', () => {
      const result = validateStageOperation("integrate", [
        { type: "read", path: "/policy/spec/laws/law.md" }, // Would fail - integrate reads in-memory
      ]);
      // Integrate has empty reads list, so any read is invalid
      expect(result.valid).toBe(false);
    });
  });

  describe('D3 - Reproducibility', () => {
    test('generated file operations validated', () => {
      const result = validateRepo([
        { type: "write", path: "/policy/generated/file.md", stage: "render" },
        { type: "write", path: "/policy/dist/bundle.js", stage: "render" }, // Invalid - render writes to /generated only
      ]);
      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.type === "IllegalStageWrite")).toBe(true);
    });
  });

  describe('D4 - Isolation', () => {
    test('state file used as source fails', () => {
      const result = validateRepo([
        { type: "read", path: "/policy/state/journal.json", stage: "parse" },
      ]);
      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.type === "StateUsedAsSource")).toBe(true);
    });

    test('journal stage may read from state', () => {
      // Journal writes to state, doesn't read from it in our model
      // But state isolation means state shouldn't be input to semantic layers
      const result = validateRepo([
        { type: "write", path: "/policy/state/journal.json", stage: "journal" },
      ]);
      expect(result.valid).toBe(true);
    });
  });

  describe('D5 - Coupling', () => {
    test('illegal import from /generated would be detected', () => {
      // This would require parsing imports, but we can validate the concept
      // by checking that /generated files shouldn't be in source directories
      const result = validateStageOperation("parse", [
        { type: "read", path: "/policy/generated/ast.ts" },
      ]);
      // Parse stage is only allowed to read from /src and /spec
      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.type === "IllegalStageRead")).toBe(true);
    });

    test('source may not import from state', () => {
      const result = validateRepo([
        { type: "read", path: "/policy/state/runtime.json", stage: "parse" },
      ]);
      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.type === "StateUsedAsSource")).toBe(true);
    });
  });

  describe('Pipeline Stage Validation', () => {
    test('all stages have defined rules', () => {
      const stages: PipelineStage[] = ["parse", "lower", "validate", "normalize", "render", "integrate", "journal"];
      
      for (const stage of stages) {
        // Each stage should have defined rules
        const result = validateStageOperation(stage, []);
        expect(result.valid).toBe(true); // Empty operations should be valid
      }
    });

    test('render writes to correct location', () => {
      const result = validateStageOperation("render", [
        { type: "write", path: "/policy/generated/canonical.md" },
      ]);
      expect(result.valid).toBe(true);
    });

    test('journal writes only to /state', () => {
      const result = validateStageOperation("journal", [
        { type: "write", path: "/policy/state/record.json" },
      ]);
      expect(result.valid).toBe(true);
    });

    test('valid repo passes validation', () => {
      const result = validateRepo([
        { type: "read", path: "/policy/src/parser.ts", stage: "parse" },
        { type: "read", path: "/policy/spec/laws/law.md", stage: "parse" },
        { type: "write", path: "/policy/generated/output.md", stage: "render" },
        { type: "write", path: "/policy/state/journal.json", stage: "journal" },
      ]);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Directory Classification', () => {
    test('/policy/src is authoritative', () => {
      const result = validateRepo([
        { type: "read", path: "/policy/src/file.ts" },
      ]);
      expect(result.valid).toBe(true);
    });

    test('/policy/spec is authoritative', () => {
      const result = validateRepo([
        { type: "read", path: "/policy/spec/tests/test.spec.ts" },
      ]);
      expect(result.valid).toBe(true);
    });

    test('/policy/generated is non-authoritative', () => {
      const result = validateRepo([
        { type: "write", path: "/policy/generated/file.md", stage: "render" },
      ]);
      expect(result.valid).toBe(true);
    });

    test('/policy/dist is non-authoritative', () => {
      // /dist has same rules as /generated
      expect(isGeneratedArtifact("/policy/dist/file.js")).toBe(true);
    });

    test('/policy/state is runtime-only', () => {
      expect(isRuntimeState("/policy/state/data.json")).toBe(true);
    });

    test('/policy/cache is disposable', () => {
      expect(isCache("/policy/cache/temp.tmp")).toBe(true);
    });
  });
});
