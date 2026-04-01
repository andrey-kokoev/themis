import { describe, test, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Structural Integrity Tests for PDA Corpus
 * 
 * These tests validate corpus structure, not semantic behavior.
 * They ensure files are well-formed and consistent.
 */

describe('Structural Corpus Integrity', () => {
  const specDir = join(process.cwd(), 'policy', 'spec', 'tests');
  const lawsDir = join(process.cwd(), 'policy', 'spec', 'laws');
  const notesDir = join(process.cwd(), 'policy', 'spec', 'notes');

  describe('Executable Spec Files', () => {
    const mdFiles = readdirSync(specDir).filter(f => f.endsWith('.md'));

    test('all .md files have corresponding .spec.ts wrappers', () => {
      const specFiles = readdirSync(specDir).filter(f => f.endsWith('.spec.ts'));
      const expectedSpecs = mdFiles.map(f => f.replace('.md', '.spec.ts'));
      const missing = expectedSpecs.filter(spec => !specFiles.includes(spec));
      expect(missing).toEqual([]);
    });

    test('all executable spec .md files have required front matter', () => {
      for (const file of mdFiles) {
        const content = readFileSync(join(specDir, file), 'utf-8');
        expect(content).toMatch(/^---\s*$/m);
        expect(content).toMatch(/^id:\s*\S+/m);
        expect(content).toMatch(/^title:\s*".+"/m);
        expect(content).toMatch(/^kind:\s*\S+/m);
        expect(content).toMatch(/^order:\s*\d+/m);
      }
    });

    test('all executable specs have kind: exec', () => {
      for (const file of mdFiles) {
        const content = readFileSync(join(specDir, file), 'utf-8');
        const kindMatch = content.match(/^kind:\s*(\S+)$/m);
        expect(kindMatch?.[1]).toBe('exec');
      }
    });

    test('executable spec orders are unique', () => {
      const orders: number[] = [];
      for (const file of mdFiles) {
        const content = readFileSync(join(specDir, file), 'utf-8');
        const orderMatch = content.match(/^order:\s*(\d+)$/m);
        if (orderMatch) {
          orders.push(parseInt(orderMatch[1], 10));
        }
      }
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });
  });

  describe('Lawbook Files', () => {
    const lawFiles = readdirSync(lawsDir).filter(f => f.endsWith('.md'));

    test('all lawbooks have required front matter', () => {
      for (const file of lawFiles) {
        const content = readFileSync(join(lawsDir, file), 'utf-8');
        expect(content).toMatch(/^---\s*$/m);
        expect(content).toMatch(/^id:\s*\S+/m);
        expect(content).toMatch(/^title:\s*".+"/m);
        expect(content).toMatch(/^kind:\s*\S+/m);
        expect(content).toMatch(/^order:\s*\d+/m);
      }
    });

    test('all lawbooks have kind: lawbook', () => {
      for (const file of lawFiles) {
        const content = readFileSync(join(lawsDir, file), 'utf-8');
        const kindMatch = content.match(/^kind:\s*(\S+)$/m);
        expect(kindMatch?.[1]).toBe('lawbook');
      }
    });
  });

  describe('Notes Files', () => {
    const noteFiles = readdirSync(notesDir).filter(f => f.endsWith('.md'));

    test('all notes have required front matter', () => {
      for (const file of noteFiles) {
        const content = readFileSync(join(notesDir, file), 'utf-8');
        expect(content).toMatch(/^---\s*$/m);
        expect(content).toMatch(/^id:\s*\S+/m);
        expect(content).toMatch(/^title:\s*".+"/m);
        expect(content).toMatch(/^kind:\s*\S+/m);
        expect(content).toMatch(/^order:\s*\d+/m);
      }
    });

    test('INDEX.md exists', () => {
      expect(noteFiles).toContain('INDEX.md');
    });

    test('CLOSURE.md exists', () => {
      expect(noteFiles).toContain('CLOSURE.md');
    });

    test('GRAPH.md exists', () => {
      expect(noteFiles).toContain('GRAPH.md');
    });
  });

  describe('Cross-Reference Integrity', () => {
    test('all orders between 1-37 are assigned to exactly one file', () => {
      // Collect all orders from laws, specs, and notes
      const allFiles = [
        ...readdirSync(lawsDir).map(f => ({ dir: lawsDir, file: f })),
        ...readdirSync(specDir).map(f => ({ dir: specDir, file: f })),
        ...readdirSync(notesDir).map(f => ({ dir: notesDir, file: f })),
      ].filter(({ file }) => file.endsWith('.md'));
      
      const orderToFile: Record<number, string> = {};
      
      for (const { dir, file } of allFiles) {
        const content = readFileSync(join(dir, file), 'utf-8');
        const orderMatch = content.match(/^order:\s*(\d+)$/m);
        if (orderMatch) {
          const order = parseInt(orderMatch[1], 10);
          if (order >= 1 && order <= 37) {
            expect(orderToFile[order]).toBeUndefined();
            orderToFile[order] = file;
          }
        }
      }
      
      // Verify no gaps in 1-37
      for (let i = 1; i <= 37; i++) {
        expect(orderToFile[i]).toBeDefined();
      }
    });
  });
});
