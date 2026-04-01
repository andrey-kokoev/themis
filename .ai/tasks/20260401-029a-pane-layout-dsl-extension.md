# Task 029A: Pane Layout DSL Extension

**Status:** PENDING  
**Parent:** Task 029 (Pane Layout and Session Persistence)

---

## Objective

Extend Themis surface syntax to support pane definitions and layout specifications.

---

## Grammar Extension

```ebnf
TabBlock ::= "tab" String "in" TargetRef LayoutClause? "{" PaneBlock+ "}"

LayoutClause ::= "layout" LayoutKind

LayoutKind ::= "horizontal" | "vertical"

PaneBlock ::= "pane" PaneLayout? "{" CommandClause? "}"

PaneLayout ::= "horizontal" | "vertical"

CommandClause ::= "command" String
```

---

## Example Syntax

```themis
module "dev" {
  workspace "main" {
    tab "kimi-work" in local {
      pane horizontal {
        command "kimi"
      }
      pane horizontal {
        command "bash"
      }
    }
    tab "editor" in local layout vertical {
      pane { command "vim" }
      pane { command "npm run dev" }
    }
  }
}
```

---

## Deliverables

1. **Lawbook 064A:** Surface Syntax for Pane Layouts ✅
2. **Parser extension:** `src/parser/tabs-parser.ts` ✅
3. **AST types:** `src/types/tabs.ts` (PaneBlock, TabBlock, etc.) ✅
4. **Executable spec:** `tests/tabs-parser.spec.ts` (16 tests) ✅

---

## Acceptance Criteria

- [x] `pane` keyword parsed within `tab` blocks
- [x] `layout horizontal|vertical` parsed
- [x] Multiple panes in single tab accepted
- [x] Default layout (horizontal) when unspecified
- [x] Commands optional in panes
