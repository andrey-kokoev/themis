/**
 * Conservative Composition (Kernel-Aligned)
 * 
 * Implements composition laws C1-C5 from lawbook 030.
 * Deterministic, collision-failing composition of workspace modules.
 * 
 * KERNEL ALIGNMENT: Composed workspace validated against kernel well-formedness.
 */

import type { Workspace, RoleBlock, RelationBlock, ContextEntry } from "../types/ast.js";
import type {
  Module,
  CompositionVerdict,
  CompositionConflict,
  ConflictType,
} from "../types/composition.js";
import { wellFormed } from "../kernel/kernel.js";
import { toKernelWorkspace } from "../kernel/ast-to-kernel.js";

function createConflict(
  type: ConflictType,
  message: string,
  moduleIds?: string[],
  details?: Record<string, unknown>
): CompositionConflict {
  return { type, message, moduleIds, details };
}

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
export function compose(modules: Module[]): CompositionVerdict {
  const conflicts: CompositionConflict[] = [];
  const notes: string[] = [];

  // C1.1: Sort modules by moduleId for deterministic order
  const sortedModules = [...modules].sort((a, b) =>
    a.moduleId.localeCompare(b.moduleId)
  );

  if (sortedModules.length === 0) {
    return {
      admissible: false,
      conflicts: [createConflict("WorkspaceIdCollision", "No modules provided")],
    };
  }

  if (sortedModules.length === 1) {
    // Single module - still validate against kernel
    const kernelWs = toKernelWorkspace(sortedModules[0].workspace);
    const kernelVerdict = wellFormed(kernelWs);
    if (!kernelVerdict.ok) {
      return {
        admissible: false,
        conflicts: kernelVerdict.errors.map(e => ({
          type: "KernelWellFormednessFailure" as ConflictType,
          message: `Kernel well-formedness: ${e.type}`,
          details: { kernelError: e },
        })),
      };
    }
    return {
      composed: sortedModules[0].workspace,
      admissible: true,
      conflicts: [],
      notes: [`Single module ${sortedModules[0].moduleId}`],
    };
  }

  // C2.1: Check workspace id collisions
  const workspaceIds = new Set<string>();
  for (const mod of sortedModules) {
    if (workspaceIds.has(mod.workspace.name)) {
      conflicts.push(
        createConflict(
          "WorkspaceIdCollision",
          `Workspace id "${mod.workspace.name}" appears in multiple modules`,
          sortedModules.filter(m => m.workspace.name === mod.workspace.name).map(m => m.moduleId)
        )
      );
    }
    workspaceIds.add(mod.workspace.name);
  }

  // C3.1: Check persistence agreement
  const persistenceModes = new Set<string>();
  for (const mod of sortedModules) {
    const persistence = mod.workspace.items.find(i => i.tag === "PersistenceClause") as
      | { mode: string }
      | undefined;
    if (persistence) {
      persistenceModes.add(persistence.mode);
    }
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

  // C3.2: Check equivalence agreement
  const equivalenceModes = new Set<string>();
  for (const mod of sortedModules) {
    const equivalence = mod.workspace.items.find(i => i.tag === "EquivalenceClause") as
      | { name: string }
      | undefined;
    if (equivalence) {
      equivalenceModes.add(equivalence.name);
    }
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

  // Collect all roles
  const allRoles: Array<{ moduleId: string; role: RoleBlock }> = [];
  for (const mod of sortedModules) {
    const roles = mod.workspace.items.filter(i => i.tag === "RoleBlock") as RoleBlock[];
    for (const role of roles) {
      allRoles.push({ moduleId: mod.moduleId, role });
    }
  }

  // C2.2: Check role id collisions
  const roleIds = new Map<string, string[]>();
  for (const { moduleId, role } of allRoles) {
    if (!roleIds.has(role.roleId)) {
      roleIds.set(role.roleId, []);
    }
    roleIds.get(role.roleId)!.push(moduleId);
  }
  for (const [roleId, moduleIdList] of roleIds) {
    if (moduleIdList.length > 1) {
      conflicts.push(
        createConflict(
          "RoleIdCollision",
          `Role id "${roleId}" appears in multiple modules`,
          moduleIdList,
          { roleId }
        )
      );
    }
  }

  // C2.3: Check subject identity collisions
  const subjectIds = new Map<string, string[]>();
  for (const { moduleId, role } of allRoles) {
    const identity = role.subject.identity;
    if (!subjectIds.has(identity)) {
      subjectIds.set(identity, []);
    }
    subjectIds.get(identity)!.push(moduleId);
  }
  for (const [subjectId, moduleIdList] of subjectIds) {
    if (moduleIdList.length > 1) {
      conflicts.push(
        createConflict(
          "SubjectCollision",
          `Subject identity "${subjectId}" appears in multiple modules`,
          moduleIdList,
          { subjectId }
        )
      );
    }
  }

  // C2.4: Check context key value collisions
  const contextKeys = new Map<string, Map<string, string[]>>(); // key -> value -> moduleIds
  for (const mod of sortedModules) {
    const contexts = mod.workspace.items.filter(i => i.tag === "ContextBlock") as Array<{
      entries: ContextEntry[];
    }>;
    for (const ctx of contexts) {
      for (const entry of ctx.entries) {
        if (!contextKeys.has(entry.key)) {
          contextKeys.set(entry.key, new Map());
        }
        const valueMap = contextKeys.get(entry.key)!;
        if (!valueMap.has(entry.value)) {
          valueMap.set(entry.value, []);
        }
        valueMap.get(entry.value)!.push(mod.moduleId);
      }
    }
  }
  for (const [key, valueMap] of contextKeys) {
    if (valueMap.size > 1) {
      // Same key, different values
      const allModules = Array.from(valueMap.values()).flat();
      conflicts.push(
        createConflict(
          "ContextKeyCollision",
          `Context key "${key}" has different values in different modules`,
          allModules,
          { key, values: Array.from(valueMap.keys()) }
        )
      );
    }
  }

  // C4: Check relation endpoint resolution
  const validRoleIds = new Set(allRoles.map(r => r.role.roleId));
  for (const mod of sortedModules) {
    const relations = mod.workspace.items.filter(i => i.tag === "RelationBlock") as RelationBlock[];
    for (const rel of relations) {
      if (!validRoleIds.has(rel.source)) {
        conflicts.push(
          createConflict(
            "RelationEndpointMissing",
            `Relation source "${rel.source}" does not resolve to any role`,
            [mod.moduleId],
            { relation: rel, endpoint: "source", endpointId: rel.source }
          )
        );
      }
      if (!validRoleIds.has(rel.target)) {
        conflicts.push(
          createConflict(
            "RelationEndpointMissing",
            `Relation target "${rel.target}" does not resolve to any role`,
            [mod.moduleId],
            { relation: rel, endpoint: "target", endpointId: rel.target }
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
    };
  }

  // C5: Build composed workspace
  // Collect context entries (deduplicated)
  const composedContextEntries: ContextEntry[] = [];
  const seenContextKeys = new Set<string>();
  for (const [key, valueMap] of contextKeys) {
    const value = Array.from(valueMap.keys())[0];
    if (!seenContextKeys.has(key)) {
      composedContextEntries.push({ tag: "ContextEntry", key, value });
      seenContextKeys.add(key);
    }
  }
  // C1.4: Sort context by key
  composedContextEntries.sort((a, b) => a.key.localeCompare(b.key));

  // Get persistence and equivalence (they all agree)
  const persistenceMode = Array.from(persistenceModes)[0] || "session";
  const equivalenceMode = Array.from(equivalenceModes)[0] || "strict";

  // Collect all relations
  const allRelations: RelationBlock[] = [];
  for (const mod of sortedModules) {
    const relations = mod.workspace.items.filter(i => i.tag === "RelationBlock") as RelationBlock[];
    allRelations.push(...relations);
  }
  // C1.3: Sort relations
  allRelations.sort((a, b) => {
    const tupleA = `${a.kind}\t${a.source}\t${a.target}`;
    const tupleB = `${b.kind}\t${b.source}\t${b.target}`;
    return tupleA.localeCompare(tupleB);
  });

  // Collect all roles
  const composedRoles = allRoles.map(r => r.role);
  // C1.2: Sort roles by id
  composedRoles.sort((a, b) => a.roleId.localeCompare(b.roleId));

  // C5.1: Build composed workspace id
  const composedId = sortedModules.map(m => m.moduleId).join("+");

  // Build the composed workspace
  const composed: Workspace = {
    tag: "Workspace",
    name: composedId,
    items: [
      { tag: "ContextBlock", entries: composedContextEntries },
      { tag: "PersistenceClause", mode: persistenceMode },
      { tag: "EquivalenceClause", name: equivalenceMode },
      ...composedRoles,
      ...allRelations,
    ],
  };

  // KERNEL ALIGNMENT: Validate composed workspace against kernel
  const kernelWs = toKernelWorkspace(composed);
  const kernelVerdict = wellFormed(kernelWs);
  if (!kernelVerdict.ok) {
    return {
      admissible: false,
      conflicts: kernelVerdict.errors.map(e => ({
        type: "KernelWellFormednessFailure" as ConflictType,
        message: `Kernel well-formedness: ${e.type}`,
        details: { kernelError: e },
      })),
    };
  }

  notes.push(`Composed ${sortedModules.length} modules into "${composedId}"`);
  notes.push(`Total roles: ${composedRoles.length}`);
  notes.push(`Total relations: ${allRelations.length}`);
  notes.push(`Kernel well-formed: true`);

  return {
    composed,
    admissible: true,
    conflicts: [],
    notes,
  };
}
