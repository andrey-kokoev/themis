import { describe, test, expect } from 'vitest';
import { parse } from '../../../src/parser/minimal-parser.js';
import { integrate } from '../../../src/runtime/integration.js';
import type { Fact, RuntimeInput } from '../../../src/types/runtime-integration.js';

/**
 * Executable Spec: Runtime-to-Context Integration Executable Spec v0
 * ID: x6m1vp
 * Lawbook Authority: 014-runtime-to-context-integration-lawbook-v0
 * 
 * This spec operationalizes integration laws I1-I5.
 */

function createInput(source: string, facts: Fact[]): RuntimeInput {
  return {
    workspace: parse(source),
    facts,
  };
}

describe('Runtime-to-Context Integration Executable Spec v0', () => {
  describe('I1 - Role Satisfaction', () => {
    test('minimal valid workspace with matching facts is admissible', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "web-server" {
            kind "service"
            subject { identity "svc-web" reference "ref-web" }
            realizer "Docker" "nginx:latest"
            witness "HealthCheck" "http-localhost-health"
          }
        }
      `, [
        { tag: "SubjectObserved", subjectId: "svc-web" },
        { tag: "RoleRealized", roleId: "web-server", realizerClass: "Docker", payload: "nginx:latest" },
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(true);
      expect(result.satisfied).toContain("web-server");
      expect(result.unsatisfied).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });

    test('missing subject observation makes role unsatisfied', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "web-server" {
            kind "service"
            subject { identity "svc-web" reference "ref-web" }
            realizer "Docker" "nginx:latest"
            witness "HealthCheck" "http-localhost-health"
          }
        }
      `, [
        // Subject not observed
        { tag: "RoleRealized", roleId: "web-server", realizerClass: "Docker", payload: "nginx:latest" },
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(false);
      expect(result.unsatisfied).toContain("web-server");
      expect(result.conflicts.some(c => c.type === "MissingSubjectObservation")).toBe(true);
    });

    test('missing realizer makes role unsatisfied', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "web-server" {
            kind "service"
            subject { identity "svc-web" reference "ref-web" }
            realizer "Docker" "nginx:latest"
            witness "HealthCheck" "http-localhost-health"
          }
        }
      `, [
        { tag: "SubjectObserved", subjectId: "svc-web" },
        // Realizer not observed
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(false);
      expect(result.unsatisfied).toContain("web-server");
      expect(result.conflicts.some(c => c.type === "MissingRoleRealization")).toBe(true);
    });
  });

  describe('I2 - Fact Matching', () => {
    test('subject matching by identity', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "app" {
            kind "service"
            subject { identity "my-app" reference "ref-app" locator "https-example-com" }
            realizer "K8s" "deployment.yaml"
            witness "Metrics" "prometheus"
          }
        }
      `, [
        // Subject observed with different reference/locator (advisory only)
        { tag: "SubjectObserved", subjectId: "my-app", reference: "different-ref", locator: "different-loc" },
        { tag: "RoleRealized", roleId: "app", realizerClass: "K8s", payload: "deployment.yaml" },
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(true);
      // Matching is by subject identity only
      expect(result.satisfied).toContain("app");
    });

    test('realizer matching by role id and class', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "api" {
            kind "service"
            subject { identity "api-svc" reference "ref" }
            realizer "Docker" "api:1.0"
            realizer "K8s" "api-deployment.yaml"
            witness "Health" "ok"
          }
        }
      `, [
        { tag: "SubjectObserved", subjectId: "api-svc" },
        // Matches second realizer
        { tag: "RoleRealized", roleId: "api", realizerClass: "K8s", payload: "different-payload" },
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(true);
      // Matching is by role id and realizer class; payload not validated
      expect(result.satisfied).toContain("api");
    });
  });

  describe('I3 - Relation Correctness', () => {
    test('declared relation missing in facts produces conflict', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "frontend" {
            kind "service"
            subject { identity "fe" reference "ref-fe" }
            realizer "Docker" "fe:latest"
            witness "Health" "ok"
          }
          role "backend" {
            kind "service"
            subject { identity "be" reference "ref-be" }
            realizer "Docker" "be:latest"
            witness "Health" "ok"
          }
          relation "uses" "frontend" "backend"
        }
      `, [
        { tag: "SubjectObserved", subjectId: "fe" },
        { tag: "SubjectObserved", subjectId: "be" },
        { tag: "RoleRealized", roleId: "frontend", realizerClass: "Docker", payload: "" },
        { tag: "RoleRealized", roleId: "backend", realizerClass: "Docker", payload: "" },
        // Relation not observed
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === "MissingRelation")).toBe(true);
    });

    test('observed relation not declared produces conflict', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "a" {
            kind "service"
            subject { identity "id-a" reference "ref-a" }
            realizer "Docker" "a"
            witness "Health" "ok"
          }
          role "b" {
            kind "service"
            subject { identity "id-b" reference "ref-b" }
            realizer "Docker" "b"
            witness "Health" "ok"
          }
          
        }
      `, [
        { tag: "SubjectObserved", subjectId: "id-a" },
        { tag: "SubjectObserved", subjectId: "id-b" },
        { tag: "RoleRealized", roleId: "a", realizerClass: "Docker", payload: "" },
        { tag: "RoleRealized", roleId: "b", realizerClass: "Docker", payload: "" },
        // Unexpected relation
        { tag: "RelationObserved", kind: "uses", source: "a", target: "b" },
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === "UnexpectedRelation")).toBe(true);
    });
  });

  describe('I4 - Unknown Fact Detection', () => {
    test('unknown role in fact produces conflict', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "known-role" {
            kind "service"
            subject { identity "known-id" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `, [
        { tag: "SubjectObserved", subjectId: "known-id" },
        { tag: "RoleRealized", roleId: "known-role", realizerClass: "Docker", payload: "" },
        // Unknown role
        { tag: "RoleRealized", roleId: "unknown-role", realizerClass: "Docker", payload: "" },
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === "UnknownRole")).toBe(true);
    });

    test('unknown subject produces conflict', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "known-role" {
            kind "service"
            subject { identity "known-id" reference "ref" }
            realizer "Docker" "img"
            witness "Health" "ok"
          }
        }
      `, [
        { tag: "SubjectObserved", subjectId: "known-id" },
        { tag: "RoleRealized", roleId: "known-role", realizerClass: "Docker", payload: "" },
        // Unknown subject
        { tag: "SubjectObserved", subjectId: "unknown-id" },
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(false);
      expect(result.conflicts.some(c => c.type === "UnknownSubject")).toBe(true);
    });
  });

  describe('I5 - Admissibility', () => {
    test('all roles satisfied but relation missing → not admissible', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "a" {
            kind "service"
            subject { identity "id-a" reference "ref-a" }
            realizer "Docker" "a"
            witness "Health" "ok"
          }
          role "b" {
            kind "service"
            subject { identity "id-b" reference "ref-b" }
            realizer "Docker" "b"
            witness "Health" "ok"
          }
          relation "depends" "a" "b"
        }
      `, [
        // All subjects observed
        { tag: "SubjectObserved", subjectId: "id-a" },
        { tag: "SubjectObserved", subjectId: "id-b" },
        // All realizers observed
        { tag: "RoleRealized", roleId: "a", realizerClass: "Docker", payload: "" },
        { tag: "RoleRealized", roleId: "b", realizerClass: "Docker", payload: "" },
        // But relation missing
      ]);

      const result = integrate(input);
      expect(result.satisfied).toHaveLength(2); // Roles are satisfied
      expect(result.admissible).toBe(false); // But relation missing
      expect(result.conflicts.some(c => c.type === "MissingRelation")).toBe(true);
    });

    test('all constraints satisfied → admissible', () => {
      const input = createInput(`
        workspace "test" {
          context { "env" "prod" }
          persistence "durable"
          equivalence "strict"
          role "frontend" {
            kind "service"
            subject { identity "fe" reference "ref-fe" }
            realizer "Docker" "fe:latest"
            witness "Health" "ok"
          }
          role "backend" {
            kind "service"
            subject { identity "be" reference "ref-be" }
            realizer "Docker" "be:latest"
            witness "Health" "ok"
          }
          role "database" {
            kind "service"
            subject { identity "db" reference "ref-db" }
            realizer "RDS" "postgres"
            witness "Backup" "daily"
          }
          relation "uses" "frontend" "backend"
          relation "uses" "backend" "database"
        }
      `, [
        // All subjects
        { tag: "SubjectObserved", subjectId: "fe" },
        { tag: "SubjectObserved", subjectId: "be" },
        { tag: "SubjectObserved", subjectId: "db" },
        // All realizers
        { tag: "RoleRealized", roleId: "frontend", realizerClass: "Docker", payload: "" },
        { tag: "RoleRealized", roleId: "backend", realizerClass: "Docker", payload: "" },
        { tag: "RoleRealized", roleId: "database", realizerClass: "RDS", payload: "" },
        // All relations
        { tag: "RelationObserved", kind: "uses", source: "frontend", target: "backend" },
        { tag: "RelationObserved", kind: "uses", source: "backend", target: "database" },
      ]);

      const result = integrate(input);
      expect(result.admissible).toBe(true);
      expect(result.satisfied).toHaveLength(3);
      expect(result.conflicts).toHaveLength(0);
    });

    test('determinism with reordered facts', () => {
      const workspace = `workspace "test" {
        context { "env" "prod" }
        persistence "durable"
        equivalence "strict"
        role "a" {
          kind "service"
          subject { identity "id-a" reference "ref-a" }
          realizer "Docker" "a"
          witness "Health" "ok"
        }
        role "b" {
          kind "service"
          subject { identity "id-b" reference "ref-b" }
          realizer "Docker" "b"
          witness "Health" "ok"
        }
        relation "uses" "a" "b"
      }`;

      const factsA: Fact[] = [
        { tag: "SubjectObserved", subjectId: "id-a" },
        { tag: "SubjectObserved", subjectId: "id-b" },
        { tag: "RoleRealized", roleId: "a", realizerClass: "Docker", payload: "" },
        { tag: "RoleRealized", roleId: "b", realizerClass: "Docker", payload: "" },
        { tag: "RelationObserved", kind: "uses", source: "a", target: "b" },
      ];

      const factsB: Fact[] = [
        // Reordered
        { tag: "RelationObserved", kind: "uses", source: "a", target: "b" },
        { tag: "RoleRealized", roleId: "b", realizerClass: "Docker", payload: "" },
        { tag: "RoleRealized", roleId: "a", realizerClass: "Docker", payload: "" },
        { tag: "SubjectObserved", subjectId: "id-b" },
        { tag: "SubjectObserved", subjectId: "id-a" },
      ];

      const resultA = integrate(createInput(workspace, factsA));
      const resultB = integrate(createInput(workspace, factsB));

      // Both should be admissible
      expect(resultA.admissible).toBe(true);
      expect(resultB.admissible).toBe(true);

      // Same satisfied roles
      expect(resultA.satisfied.sort()).toEqual(resultB.satisfied.sort());

      // No conflicts
      expect(resultA.conflicts).toHaveLength(0);
      expect(resultB.conflicts).toHaveLength(0);
    });
  });
});
