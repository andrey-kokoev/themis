/**
 * Corpus Closure Audit Tests
 * 
 * Tests for Task 026: Corpus Closure Audit and Terminality Assessment
 * Covers law families A1-A4 from lawbook 056.
 */

import { describe, it, expect } from "vitest";
import {
  countTodoTests,
  checkLawbookCoverage,
  checkImplementationCoverage,
  checkDeterminism,
  runCorpusAudit,
  formatAuditReport,
  generateClosureReport,
} from "../src/audit/corpus-audit.js";

describe("Corpus Closure Audit (A1-A4)", () => {
  describe("A1: Semantic Closure", () => {
    it("audit detects current TODO test count", () => {
      const todoAudit = countTodoTests();

      expect(todoAudit.totalTests).toBeGreaterThan(0);
      expect(todoAudit.todoTests).toBeGreaterThanOrEqual(0);
      expect(todoAudit.todoPercentage).toBeGreaterThanOrEqual(0);
      expect(todoAudit.status).toMatch(/acceptable|warning|critical/);
    });

    it("implementation coverage lists all modules", () => {
      const implAudit = checkImplementationCoverage();

      expect(implAudit.implementedModules.length).toBeGreaterThan(0);
      expect(implAudit.totalModules).toBe(implAudit.implementedModules.length);
      expect(implAudit.implementationPercentage).toBe(100);
      expect(implAudit.status).toBe("acceptable");
    });
  });

  describe("A2: Lawbook Coverage", () => {
    it("lawbook coverage is calculated", () => {
      const lawbookAudit = checkLawbookCoverage();

      expect(lawbookAudit.totalLawbooks).toBeGreaterThan(0);
      expect(lawbookAudit.lawbooksWithTests).toBeGreaterThan(0);
      expect(lawbookAudit.coveragePercentage).toBeGreaterThan(0);
      expect(lawbookAudit.status).toMatch(/acceptable|warning|critical/);
    });

    it("most lawbooks have corresponding tests", () => {
      const lawbookAudit = checkLawbookCoverage();

      // Expect high coverage (>90% for closed corpus)
      expect(lawbookAudit.coveragePercentage).toBeGreaterThan(80);
    });
  });

  describe("A3: Test Coverage", () => {
    it("determinism is verified for all operations", () => {
      const determinismAudit = checkDeterminism();

      expect(determinismAudit.deterministicOperations.length).toBeGreaterThan(10);
      expect(determinismAudit.status).toBe("verified");
    });

    it("key operations are verified deterministic", () => {
      const determinismAudit = checkDeterminism();
      const ops = determinismAudit.deterministicOperations;

      expect(ops).toContain("parse");
      expect(ops).toContain("integrate");
      expect(ops).toContain("wellFormed");
      expect(ops).toContain("compose (conservative)");
      expect(ops).toContain("resolveModuleGraph");
    });
  });

  describe("A4: Terminality Assessment", () => {
    it("full audit produces result structure", () => {
      const audit = runCorpusAudit();

      expect(audit.status).toMatch(/closed|partial|open/);
      expect(typeof audit.terminal).toBe("boolean");
      expect(audit.timestamp).toBeDefined();
      expect(audit.summary).toBeDefined();
    });

    it("audit includes all sections", () => {
      const audit = runCorpusAudit();

      expect(audit.sections.todoTests).toBeDefined();
      expect(audit.sections.lawbookCoverage).toBeDefined();
      expect(audit.sections.implementationCoverage).toBeDefined();
      expect(audit.sections.determinism).toBeDefined();
    });

    it("terminality correlates with TODO percentage", () => {
      const audit = runCorpusAudit();

      // Terminal requires low TODO percentage
      if (audit.terminal) {
        expect(audit.sections.todoTests.todoPercentage).toBeLessThan(20);
      }
    });

    it("report formatting produces valid output", () => {
      const audit = runCorpusAudit();
      const report = formatAuditReport(audit);

      expect(report).toContain("THEMIS CORPUS CLOSURE AUDIT REPORT");
      expect(report).toContain(`Status: ${audit.status.toUpperCase()}`);
      expect(report).toContain(`Terminal: ${audit.terminal ? "YES" : "NO"}`);
      expect(report).toContain(audit.summary);
    });

    it("closure report generation works", () => {
      const report = generateClosureReport();

      expect(report).toContain("THEMIS CORPUS CLOSURE AUDIT REPORT");
      expect(report).toContain("TODO TEST AUDIT");
      expect(report).toContain("LAWBOOK COVERAGE AUDIT");
      expect(report).toContain("SUMMARY");
    });

    it("current corpus is at least partially closed", () => {
      const audit = runCorpusAudit();

      // After 25 tasks, corpus should be at least partial
      expect(audit.status).not.toBe("open");
      expect(audit.sections.implementationCoverage.status).toBe("acceptable");
      expect(audit.sections.determinism.status).toBe("verified");
    });

    it("audit shows substantial progress toward terminality", () => {
      const audit = runCorpusAudit();

      // Implementation complete
      expect(audit.sections.implementationCoverage.implementationPercentage).toBe(100);

      // Lawbook coverage high
      expect(audit.sections.lawbookCoverage.coveragePercentage).toBeGreaterThan(80);

      // Determinism verified
      expect(audit.sections.determinism.status).toBe("verified");
    });
  });
});
