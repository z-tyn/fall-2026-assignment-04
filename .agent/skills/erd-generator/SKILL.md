---
name: erd-generator
description: >-
  Generates, validates, and compiles Mermaid Entity-Relationship Diagrams (erDiagram) from domain descriptions, user specifications, or database schemas. Use this skill whenever requested to design an ERD, data model, database architecture, or entity relationship diagram; to draft schema.mmd in docs/architecture/; to render and validate SVG diagrams via render_erd.js; or to self-heal and resolve Mermaid compilation errors.
---

When designing or updating an Entity-Relationship Diagram (ERD), follow these steps:

1. **Parse Domain Requirements:** Identify all entities, primary keys (`PK`), foreign keys (`FK`), attributes with types, and relationship cardinalities (e.g., `||--o{`, `||--||`, `}|--o{`). Check existing schemas for existing tables.
2. **Draft Mermaid File:** Write the complete Mermaid `erDiagram` definition directly into `docs/architecture/schema.mmd`.
3. **Validate and Compile:** Execute `node scripts/render_erd.js docs/architecture/schema.mmd` to compile the visual asset to `docs/architecture/erd.svg`.
4. **Self-Correction Loop:** If execution fails with `SYNTAX_ERROR`, analyze the stderr trace, correct the Mermaid syntax in `docs/architecture/schema.mmd`, and re-run (up to 3 retries).
5. **Final Output:** Present the raw Mermaid code block to the user and provide a reference link to the compiled diagram asset at `docs/architecture/erd.svg`.