import { describe, test, expect } from 'vitest';
import { readdirSync } from 'fs';
import { join } from 'path';

describe('Executable Spec Guard', () => {
  test('at least one executable spec wrapper is present', () => {
    const specDir = join(process.cwd(), 'policy', 'spec', 'tests');
    const files = readdirSync(specDir);
    const specFiles = files.filter(f => f.endsWith('.spec.ts'));
    
    expect(specFiles.length).toBeGreaterThan(0);
    console.log(`Discovered ${specFiles.length} executable spec wrappers`);
  });

  test('all markdown specs have corresponding .spec.ts wrappers', () => {
    const specDir = join(process.cwd(), 'policy', 'spec', 'tests');
    const files = readdirSync(specDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    const specFiles = files.filter(f => f.endsWith('.spec.ts'));
    
    const expectedSpecs = mdFiles.map(f => f.replace('.md', '.spec.ts'));
    const missing = expectedSpecs.filter(spec => !specFiles.includes(spec));
    
    expect(missing).toEqual([]);
    if (missing.length > 0) {
      console.error('Missing spec wrappers:', missing);
    }
  });
});
