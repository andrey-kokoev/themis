/**
 * Corpus Closure Audit
 *
 * Implements lawbook 056 (Task 026).
 * Comprehensive audit of Themis corpus for closure assessment.
 */
/**
 * Audit result structure.
 */
export type CorpusAuditResult = {
    /** Overall closure status */
    status: "closed" | "partial" | "open";
    /** Terminality assessment */
    terminal: boolean;
    /** Audit sections */
    sections: {
        todoTests: TodoTestAudit;
        lawbookCoverage: LawbookCoverageAudit;
        implementationCoverage: ImplementationCoverageAudit;
        determinism: DeterminismAudit;
    };
    /** Timestamp */
    timestamp: string;
    /** Summary message */
    summary: string;
};
/**
 * TODO test audit.
 */
export type TodoTestAudit = {
    totalTestFiles: number;
    totalTests: number;
    todoTests: number;
    todoPercentage: number;
    status: "acceptable" | "warning" | "critical";
};
/**
 * Lawbook coverage audit.
 */
export type LawbookCoverageAudit = {
    totalLawbooks: number;
    lawbooksWithTests: number;
    coveragePercentage: number;
    status: "acceptable" | "warning" | "critical";
};
/**
 * Implementation coverage audit.
 */
export type ImplementationCoverageAudit = {
    implementedModules: string[];
    totalModules: number;
    implementationPercentage: number;
    status: "acceptable" | "warning" | "critical";
};
/**
 * Determinism audit.
 */
export type DeterminismAudit = {
    deterministicOperations: string[];
    status: "verified" | "partial" | "unverified";
};
/**
 * Count TODO tests in the corpus.
 */
export declare function countTodoTests(): TodoTestAudit;
/**
 * Check lawbook coverage.
 */
export declare function checkLawbookCoverage(): LawbookCoverageAudit;
/**
 * Check implementation coverage.
 */
export declare function checkImplementationCoverage(): ImplementationCoverageAudit;
/**
 * Check determinism of operations.
 */
export declare function checkDeterminism(): DeterminismAudit;
/**
 * Run full corpus audit.
 */
export declare function runCorpusAudit(): CorpusAuditResult;
/**
 * Format audit result as report string.
 */
export declare function formatAuditReport(result: CorpusAuditResult): string;
/**
 * Generate closure report.
 */
export declare function generateClosureReport(): string;
//# sourceMappingURL=corpus-audit.d.ts.map