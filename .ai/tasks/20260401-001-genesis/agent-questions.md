# Agent Questions for Task 20260401-001-genesis

## Q1: INDEX.md filename mismatch
The INDEX.md in pda-packet-4.md lists simplified filenames like `001-kernel-lawbook.md`, but the actual files are named `001-minimal-concrete-grammar-lawbook-v0.md`. Should I:
- **A)** Use the provided INDEX.md content exactly as-is (preserving the simplified filenames)?
- **B)** Generate INDEX.md from the actual files with their real filenames?
- **C)** Something else?

## Q2: /policy/README.md and /policy/.gitignore
pda-packet-4.md provides content for `/policy/README.md` and `/policy/.gitignore`. However, there's already a `/policy/` folder at the task root with its own README.md and MANIFEST.json. Should I:
- **A)** Copy the task-root `/policy/README.md` to the output (it exists and differs from pda-packet-4.md content)?
- **B)** Use the pda-packet-4.md README.md content instead?
- **C)** Merge both somehow?

## Q3: Output repository location
The working directory `/home/andrey/src/themis/` already has a `.git/` folder. The instructions say `git init themis`. Should I:
- **A)** Use the existing repo at `/home/andrey/src/themis/` and create `/policy/` directly there?
- **B)** Create a new subfolder `/home/andrey/src/themis/themis/`?

## Q4: Front matter normalization
Existing files have front matter with `source: regenerated-from-chat`. Per instructions, should I:
- **A)** Keep all front matter exactly as-is (preserve `source` field)?
- **B)** Normalize to only id, title, kind, order (remove `source`)?

## Q5: Kind value normalization
Existing files use `kind: exec` for executable specs. Instructions map to `executable-spec`. Should I:
- **A)** Keep `exec` as-is (preserve existing)?
- **B)** Normalize to `executable-spec` per instructions?
