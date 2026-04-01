/**
 * Runtime Integration (Kernel-Aligned)
 *
 * Implements integration laws I1-I5 from lawbook 014.
 * Evaluates observed facts against workspace and produces admissibility verdict.
 *
 * KERNEL ALIGNMENT: Core satisfaction now flows through kernel.
 * Runtime layer handles runtime-specific concerns (unknown entities, format validation).
 */
import type { IntegrationVerdict, RuntimeInput } from "../types/runtime-integration.js";
/**
 * Evaluate facts against workspace.
 *
 * Law I1: Role satisfaction (via kernel)
 * Law I2: Fact matching
 * Law I3: Relation correctness
 * Law I4: Unknown fact detection
 * Law I5: Admissibility
 *
 * KERNEL ALIGNMENT: Core satisfaction delegated to kernel.satisfiedWorkspace
 */
export declare function integrate(input: RuntimeInput): IntegrationVerdict;
//# sourceMappingURL=integration.d.ts.map