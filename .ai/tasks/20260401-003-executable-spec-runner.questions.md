# Questions for Task 20260401-002

## Q1: Executable Spec Content
The executable specs in `/policy/spec/tests/*.md` are skeletal descriptions without actual test implementations. They describe what *should* be tested but don't contain test code. Should I:

- **A)** Create placeholder `.spec.ts` files with `test.skip()` or `test.todo()` for each spec, acknowledging the tests exist but implementations are pending?
- **B)** Derive actual test cases from the corresponding lawbooks and implement them?
- **C)** Create a harness that parses the markdown and treats the descriptions as "documentation tests" that always pass?

## Q2: Test Implementation Scope
The task says "Do not rewrite executable spec content" but the specs don't have executable content. Should I:

- **A)** Only create the runner infrastructure (Vitest setup + discovery) and leave test implementations for a future task?
- **B)** Implement minimal placeholder tests that verify the spec files exist and have correct structure?
- **C)** Implement full tests based on interpreting the lawbook semantics?

## Q3: File Organization
Should the `.spec.ts` files be:

- **A)** Co-located with the `.md` files in `/policy/spec/tests/`?
- **B)** In a separate directory like `/src/tests/` or `/tests/`?
- **C)** Generated on-the-fly (not committed) from the markdown?

## Q4: Test Granularity
Each executable spec file should become:

- **A)** One test suite per file (describe block) with placeholder test cases?
- **B)** Multiple test cases derived from the lawbook "must-close" rules?
- **C)** A single test that verifies the spec file parses correctly?

## Q5: Zero Tests = Failure
The task says "zero tests = failure". The current specs don't have test implementations. Should:

- **A)** The runner fail initially (forcing us to add at least one test per spec)?
- **B)** We create structural tests ("file exists", "has front matter") to satisfy the non-zero requirement?
- **C)** We treat each spec file as implicitly containing one "placeholder" test that passes?
