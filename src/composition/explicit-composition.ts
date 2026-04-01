/**
 * Explicit Composition
 * 
 * Implements composition laws E1-E5 from lawbook 036.
 * Controlled relaxation through explicit declarations.
 */

import type { Workspace, RoleBlock, RelationBlock, ContextEntry } from "../types/ast.js";
import type { Module, CompositionConflict } from "../types/composition.js";
import type {
  ExplicitCompositionPolicy,
  ExplicitCompositionVerdict,
  RoleAliasDecl,
} from "../types/explicit-composition.js";

function createConflict(
  type: string,
  message: string,
  moduleIds?: string[],
  details?: Record<string, unknown>
): CompositionConflict {
  return { type, message, moduleIds, details };
}

/**
 * Compute lifted role id according to E2.2 lifting rule.
 */
function computeLiftedRoleId(
  moduleId: string,
  localRoleId: string,
  namespace: string | undefined,
  aliases: RoleAliasDecl[]
): string {
  // E2.2 rule 1: Check for exact alias
  const alias = aliases.find(
    a => a.moduleId === moduleId && a.localRoleId === localRoleId
  );
  if (alias) {
    return alias.composedRoleId;
  }

  // E2.2 rule 2: Use namespace if declared
  if (namespace) {
    return `${namespace}::${localRoleId}`;
  }

  // E2.2 rule 3: Use raw local role id
  return localRoleId;
}

/**
 * Explicit composition with policy-driven relaxation.
 * 
 * Law E1: Namespace laws
 * Law E2: Alias laws
 * Law E3: Shared-identity laws
 * Law E4: Relation resolution laws
 * Law E5: Strictness preservation
 */
export function composeExplicit(
  modules: Module[],
  policy: ExplicitCompositionPolicy
): ExplicitCompositionVerdict {
  const conflicts: CompositionConflict[] = [];
  const notes: string[] = [];
  const liftingMap: Record<string, string> = {};

  // E1.1: Build namespace map from explicit declarations
  const namespaceMap = new Map<string, string>(); // moduleId -> namespace
  for (const ns of policy.namespaces || []) {
    namespaceMap.set(ns.moduleId, ns.namespace);
  }

  // E1.2: Check namespace uniqueness
  const seenNamespaces = new Map<string, string>(); // namespace -> moduleId
  for (const [moduleId, namespace] of namespaceMap) {
    if (seenNamespaces.has(namespace)) {
      conflicts.push(
        createConflict(
          "NamespaceCollision",
          `Namespace "${namespace}" declared by both module "${seenNamespaces.get(namespace)}" and "${moduleId}"`,
          [seenNamespaces.get(namespace)!, moduleId],
          { namespace }
        )
      );
    }
    seenNamespaces.set(namespace, moduleId);
  }

  // Sort modules for determinism
  const sortedModules = [...modules].sort((a, b) =>
    a.moduleId.localeCompare(b.moduleId)
  );

  if (sortedModules.length === 0) {
    return {
      admissible: false,
      conflicts: [createConflict("NamespaceCollision", "No modules provided")],
      liftingMap,
    };
  }

  // E5: Check persistence and equivalence agreement
  const persistenceModes = new Set<string>();
  const equivalenceModes = new Set<string>();
  for (const mod of sortedModules) {
    const persistence = mod.workspace.items.find(i => i.tag === "PersistenceClause") as
      | { mode: string }
      | undefined;
    const equivalence = mod.workspace.items.find(i => i.tag === "EquivalenceClause") as
      | { name: string }
      | undefined;
    if (persistence) persistenceModes.add(persistence.mode);
    if (equivalence) equivalenceModes.add(equivalence.name);
  }
  if (persistenceModes.size > 1) {
    conflicts.push(
      createConflict(
        "PersistenceModeConflict",
        `Different persistence modes: ${Array.from(persistenceModes).join(", ")}`,
        sortedModules.map(m => m.moduleId),
        { modes: Array.from(persistenceModes) }
      )
    );
  }
  if (equivalenceModes.size > 1) {
    conflicts.push(
      createConflict(
        "EquivalenceConflict",
        `Different equivalence modes: ${Array.from(equivalenceModes).join(", ")}`,
        sortedModules.map(m => m.moduleId),
        { modes: Array.from(equivalenceModes) }
      )
    );
  }

  // E2.2: Compute lifted role ids
  const liftedRoles: Array<{
    moduleId: string;
    localRoleId: string;
    liftedId: string;
    role: RoleBlock;
    namespace: string | undefined;
  }> = [];

  for (const mod of sortedModules) {
    const namespace = namespaceMap.get(mod.moduleId);
    const roles = mod.workspace.items.filter(i => i.tag === "RoleBlock") as RoleBlock[];
    for (const role of roles) {
      const liftedId = computeLiftedRoleId(
        mod.moduleId,
        role.roleId,
        namespace,
        policy.aliases || []
      );
      liftedRoles.push({
        moduleId: mod.moduleId,
        localRoleId: role.roleId,
        liftedId,
        role,
        namespace,
      });
      liftingMap[`${mod.moduleId}.${role.roleId}`] = liftedId;
    }
  }

  // E2.3: Check for alias collisions (same lifted id from different sources)
  const liftedIdSources = new Map<string, Array<{ moduleId: string; localRoleId: string }>>();
  for (const lifted of liftedRoles) {
    if (!liftedIdSources.has(lifted.liftedId)) {
      liftedIdSources.set(lifted.liftedId, []);
    }
    liftedIdSources.get(lifted.liftedId)!.push({
      moduleId: lifted.moduleId,
      localRoleId: lifted.localRoleId,
    });
  }
  for (const [liftedId, sources] of liftedIdSources) {
    // Check if sources are from different modules
    const sourceModules = new Set(sources.map(s => s.moduleId));
    if (sourceModules.size > 1) {
      conflicts.push(
        createConflict(
          "AliasCollision",
          `Lifted role id "${liftedId}" comes from multiple sources`,
          Array.from(sourceModules),
          { liftedId, sources }
        )
      );
    }
  }

  // E3: Check shared subject identity
  const subjectIdModules = new Map<string, Set<string>>();
  for (const lifted of liftedRoles) {
    const subjectId = lifted.role.subject.identity;
    if (!subjectIdModules.has(subjectId)) {
      subjectIdModules.set(subjectId, new Set());
    }
    subjectIdModules.get(subjectId)!.add(lifted.moduleId);
  }

  for (const [subjectId, moduleSet] of subjectIdModules) {
    if (moduleSet.size > 1) {
      // E3.1: Shared identity illegal by default
      // E3.2: Check for explicit declaration
      const declaration = policy.sharedIdentities?.find(
        d => d.subjectId === subjectId
      );
      if (!declaration) {
        conflicts.push(
          createConflict(
            "UndeclaredSharedIdentity",
            `Subject identity "${subjectId}" appears in multiple modules without explicit declaration`,
            Array.from(moduleSet),
            { subjectId, modules: Array.from(moduleSet) }
          )
        );
      } else {
        // Check exact module set match
        const declaredModules = new Set(declaration.modules);
        const actualModules = moduleSet;
        const matches =
          declaredModules.size === actualModules.size &&
          Array.from(declaredModules).every(m => actualModules.has(m));
        if (!matches) {
          conflicts.push(
            createConflict(
              "InvalidSharedIdentityDecl",
              `Shared identity declaration for "${subjectId}" does not match actual modules`,
              Array.from(moduleSet),
              {
                subjectId,
                declaredModules: Array.from(declaredModules),
                actualModules: Array.from(actualModules),
              }
            )
          );
        }
      }
    }
  }

  // E4: Check relation endpoints after lifting
  const validLiftedIds = new Set(liftedRoles.map(l => l.liftedId));
  for (const mod of sortedModules) {
    const namespace = namespaceMap.get(mod.moduleId);
    const relations = mod.workspace.items.filter(i => i.tag === "RelationBlock") as RelationBlock[];
    for (const rel of relations) {
      // Compute lifted endpoint ids
      const liftedSource = computeLiftedRoleId(
        mod.moduleId,
        rel.source,
        namespace,
        policy.aliases || []
      );
      const liftedTarget = computeLiftedRoleId(
        mod.moduleId,
        rel.target,
        namespace,
        policy.aliases || []
      );

      // Check for ambiguity: if the local id could map to multiple lifted ids
      // This happens when the same local id in different modules lifts differently
      // but we're looking at it from this module's perspective
      const sourceCandidates = liftedRoles.filter(
        l => l.liftedId === liftedSource
      );
      const targetCandidates = liftedRoles.filter(
        l => l.liftedId === liftedTarget
      );

      if (!validLiftedIds.has(liftedSource)) {
        conflicts.push(
          createConflict(
            "RelationEndpointAmbiguousAfterAliasing",
            `Relation source "${rel.source}" (lifted: "${liftedSource}") does not resolve`,
            [mod.moduleId],
            { relation: rel, endpoint: "source", liftedId: liftedSource }
          )
        );
      }
      if (!validLiftedIds.has(liftedTarget)) {
        conflicts.push(
          createConflict(
            "RelationEndpointAmbiguousAfterAliasing",
            `Relation target "${rel.target}" (lifted: "${liftedTarget}") does not resolve`,
            [mod.moduleId],
            { relation: rel, endpoint: "target", liftedId: liftedTarget }
          )
        );
      }
    }
  }

  // If any conflicts, return failure
  if (conflicts.length > 0) {
    return {
      admissible: false,
      conflicts,
      notes: [`Composition failed with ${conflicts.length} conflict(s)`],
      liftingMap,
    };
  }

  // Build composed workspace
  // Collect context entries (with dedup)
  const contextEntries: ContextEntry[] = [];
  const seenContextKeys = new Map<string, string>(); // key -> value
  for (const mod of sortedModules) {
    const contexts = mod.workspace.items.filter(i => i.tag === "ContextBlock") as Array<{
      entries: ContextEntry[];
    }>;
    for (const ctx of contexts) {
      for (const entry of ctx.entries) {
        if (!seenContextKeys.has(entry.key)) {
          contextEntries.push(entry);
          seenContextKeys.set(entry.key, entry.value);
        }
      }
    }
  }
  contextEntries.sort((a, b) => a.key.localeCompare(b.key));

  // Build lifted roles for output
  const composedRoles: RoleBlock[] = liftedRoles.map(lr => ({
    ...lr.role,
    roleId: lr.liftedId,
  }));
  composedRoles.sort((a, b) => a.roleId.localeCompare(b.roleId));

  // Collect and lift relations
  const composedRelations: RelationBlock[] = [];
  for (const mod of sortedModules) {
    const namespace = namespaceMap.get(mod.moduleId);
    const relations = mod.workspace.items.filter(i => i.tag === "RelationBlock") as RelationBlock[];
    for (const rel of relations) {
      composedRelations.push({
        tag: "RelationBlock",
        kind: rel.kind,
        source: computeLiftedRoleId(mod.moduleId, rel.source, namespace, policy.aliases || []),
        target: computeLiftedRoleId(mod.moduleId, rel.target, namespace, policy.aliases || []),
      });
    }
  }
  composedRelations.sort((a, b) => {
    const tupleA = `${a.kind}\t${a.source}\t${a.target}`;
    const tupleB = `${b.kind}\t${b.source}\t${b.target}`;
    return tupleA.localeCompare(tupleB);
  });

  const persistenceMode = Array.from(persistenceModes)[0] || "session";
  const equivalenceMode = Array.from(equivalenceModes)[0] || "strict";

  const composedId = sortedModules.map(m => m.moduleId).join("+");

  const composed: Workspace = {
    tag: "Workspace",
    name: composedId,
    items: [
      { tag: "ContextBlock", entries: contextEntries },
      { tag: "PersistenceClause", mode: persistenceMode },
      { tag: "EquivalenceClause", name: equivalenceMode },
      ...composedRoles,
      ...composedRelations,
    ],
  };

  notes.push(`Explicit composition of ${sortedModules.length} modules`);
  notes.push(`Total lifted roles: ${composedRoles.length}`);
  notes.push(`Total relations: ${composedRelations.length}`);

  return {
    composed,
    admissible: true,
    conflicts: [],
    notes,
    liftingMap,
  };
}
