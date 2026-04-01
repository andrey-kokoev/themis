/**
 * Conservative Composition (Kernel-Aligned)
 *
 * Implements composition laws C1-C5 from lawbook 030.
 * Deterministic, collision-failing composition of workspace modules.
 *
 * KERNEL ALIGNMENT: Composed workspace validated against kernel well-formedness.
 */
import type { Module, CompositionVerdict } from "../types/composition.js";
/**
 * Conservative composition of multiple modules.
 *
 * Law C1: Canonical ordering
 * Law C2: Collision failure
 * Law C3: Agreement rules
 * Law C4: Relation resolution
 * Law C5: Success shape
 *
 * KERNEL ALIGNMENT: Successful composition validated by kernel.wellFormed
 */
export declare function compose(modules: Module[]): CompositionVerdict;
//# sourceMappingURL=conservative-composition.d.ts.map