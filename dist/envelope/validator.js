/**
 * Deployment Envelope Validator
 *
 * Implements envelope laws D1-D5 from lawbook 032.
 * Validates repository structure and pipeline boundaries.
 */
function createViolation(type, message, path, details) {
    return { type, message, path, details };
}
/**
 * Directory classification rules.
 * Law D1: Authority classification
 * KERNEL ALIGNMENT: Kernel source is explicitly authoritative
 */
const DIRECTORY_RULES = {
    "/policy/src": { authority: "authoritative", rule: "must-not-be-generated" },
    "/policy/spec": { authority: "authoritative", rule: "must-not-be-generated" },
    "/src/kernel": { authority: "authoritative", rule: "must-not-be-generated" },
    "/policy/generated": { authority: "non-authoritative", rule: "must-be-reproducible" },
    "/policy/dist": { authority: "non-authoritative", rule: "must-be-reproducible" },
    "/policy/state": { authority: "non-authoritative", rule: "runtime-only" },
    "/policy/cache": { authority: "non-authoritative", rule: "disposable" },
};
/**
 * Pipeline stage read/write rules.
 * Law D2: Pipeline correctness
 */
const PIPELINE_RULES = {
    parse: { reads: ["/policy/src", "/policy/spec"], writes: [] },
    lower: { reads: ["/policy/src", "/policy/spec"], writes: [] },
    validate: { reads: ["/policy/src", "/policy/spec"], writes: [] },
    normalize: { reads: ["/policy/src", "/policy/spec"], writes: [] },
    render: { reads: [], writes: ["/policy/generated"] },
    integrate: { reads: [], writes: [] },
    journal: { reads: [], writes: ["/policy/state"] },
};
/**
 * Check if a path is under a directory.
 */
function isUnder(path, dir) {
    return path.startsWith(dir);
}
/**
 * Classify a path by directory authority.
 */
function classifyPath(path) {
    for (const [dir, rules] of Object.entries(DIRECTORY_RULES)) {
        if (isUnder(path, dir)) {
            return rules;
        }
    }
    return undefined;
}
/**
 * Validate repository structure.
 *
 * Law D1-D5: Envelope validation
 */
export function validateRepo(operations) {
    const violations = [];
    for (const op of operations) {
        const classification = classifyPath(op.path);
        if (!classification) {
            // Path outside policy structure - skip or flag based on strictness
            continue;
        }
        if (op.type === "write") {
            // D1.2: Check for illegal writes to source (includes kernel)
            if (isUnder(op.path, "/policy/src") || isUnder(op.path, "/policy/spec") || isUnder(op.path, "/src/kernel")) {
                violations.push(createViolation("IllegalWriteToSource", `Write to authoritative source path: ${op.path}`, op.path, { stage: op.stage, path: op.path }));
            }
            // D2.2: Check stage-specific write rules
            if (op.stage) {
                const rules = PIPELINE_RULES[op.stage];
                const allowedWrites = rules.writes;
                const isAllowed = allowedWrites.some(dir => isUnder(op.path, dir));
                if (!isAllowed && rules.writes.length > 0) {
                    violations.push(createViolation("IllegalStageWrite", `Stage "${op.stage}" may not write to ${op.path}`, op.path, { stage: op.stage, path: op.path, allowedWrites }));
                }
            }
        }
        if (op.type === "read") {
            // D2.3: Check for state used as source
            if (isUnder(op.path, "/policy/state")) {
                // State should only be read by journal stage
                if (op.stage && op.stage !== "journal") {
                    violations.push(createViolation("StateUsedAsSource", `Stage "${op.stage}" illegally reads from state: ${op.path}`, op.path, { stage: op.stage, path: op.path }));
                }
            }
        }
    }
    return {
        valid: violations.length === 0,
        violations,
    };
}
/**
 * Check if a stage operation is valid.
 */
export function validateStageOperation(stage, operations) {
    const rules = PIPELINE_RULES[stage];
    const violations = [];
    for (const op of operations) {
        if (op.type === "read") {
            // Check if read is allowed
            const allowedReads = rules.reads;
            const isAllowed = allowedReads.length > 0 && // Empty means no file reads (in-memory only)
                allowedReads.some(dir => isUnder(op.path, dir));
            if (!isAllowed) {
                violations.push(createViolation("IllegalStageRead", `Stage "${stage}" may not read from ${op.path}`, op.path, { stage, path: op.path, allowedReads }));
            }
        }
        if (op.type === "write") {
            // Check if write is allowed
            const allowedWrites = rules.writes;
            const isAllowed = allowedWrites.length === 0 || // Empty means in-memory only
                allowedWrites.some(dir => isUnder(op.path, dir));
            if (!isAllowed) {
                violations.push(createViolation("IllegalStageWrite", `Stage "${stage}" may not write to ${op.path}`, op.path, { stage, path: op.path, allowedWrites }));
            }
            // D1.2: Never allow writes to source (includes kernel)
            if (isUnder(op.path, "/policy/src") || isUnder(op.path, "/policy/spec") || isUnder(op.path, "/src/kernel")) {
                violations.push(createViolation("IllegalWriteToSource", `Stage "${stage}" attempted write to source: ${op.path}`, op.path, { stage, path: op.path }));
            }
        }
    }
    return {
        valid: violations.length === 0,
        violations,
    };
}
/**
 * Get authority classification for a directory.
 */
export function getDirectoryAuthority(path) {
    return classifyPath(path);
}
/**
 * Check if path is authoritative source.
 */
export function isAuthoritativeSource(path) {
    const classification = classifyPath(path);
    return classification?.authority === "authoritative";
}
/**
 * Check if path is non-authoritative generated.
 */
export function isGeneratedArtifact(path) {
    const classification = classifyPath(path);
    return classification?.rule === "must-be-reproducible";
}
/**
 * Check if path is runtime state.
 */
export function isRuntimeState(path) {
    const classification = classifyPath(path);
    return classification?.rule === "runtime-only";
}
/**
 * Check if path is cache.
 */
export function isCache(path) {
    const classification = classifyPath(path);
    return classification?.rule === "disposable";
}
//# sourceMappingURL=validator.js.map