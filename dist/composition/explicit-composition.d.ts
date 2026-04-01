/**
 * Explicit Composition (Kernel-Aligned)
 *
 * Implements composition laws E1-E5 from lawbook 036.
 * Controlled relaxation through explicit declarations.
 *
 * KERNEL ALIGNMENT: Composed workspace validated against kernel well-formedness.
 */
import type { Module } from "../types/composition.js";
import type { ExplicitCompositionPolicy, ExplicitCompositionVerdict } from "../types/explicit-composition.js";
/**
 * Explicit composition with policy-driven relaxation.
 *
 * Law E1: Namespace laws
 * Law E2: Alias laws
 * Law E3: Shared-identity laws
 * Law E4: Relation resolution laws
 * Law E5: Strictness preservation
 *
 * KERNEL ALIGNMENT: Successful composition validated by kernel.wellFormed
 */
export declare function composeExplicit(modules: Module[], policy: ExplicitCompositionPolicy): ExplicitCompositionVerdict;
//# sourceMappingURL=explicit-composition.d.ts.map