---
name: kysely-migration-generator
description: >-
  Translates Mermaid Entity-Relationship Diagrams (erDiagram) into type-safe Kysely database migration scripts. Use this skill whenever requested to generate a Kysely migration from docs/architecture/schema.mmd, translate ERDs or database diagrams into TypeScript migrations, create new database schema migrations in src/db/migrations/, or ensure correct foreign key relationships, table dependencies, and rollback (down) order.
---

# Kysely Migration Generator Skill

Translates Mermaid Entity-Relationship Diagrams (`erDiagram`) into robust, type-safe Kysely database migrations inside `src/db/migrations/`.

## Execution Workflow

1. **Inspect Existing Schemas & Migrations:**
   * Read the input Mermaid ERD from `docs/architecture/schema.mmd`.
   * Check existing migrations in `src/db/migrations/` (e.g., `001_initial_schema.ts`) to identify tables and columns that already exist (such as `users`) so you do not attempt to recreate them or cause table collision.

2. **Determine Table Dependency Order:**
   * Analyze parent $\rightarrow$ child entity relationships.
   * Order table creation in `up()` so referenced parent tables are created *before* child tables referencing them.
   * Order table teardown in `down()` in **strict reverse dependency order** (drop child tables before parent tables).

3. **Generate the Migration File:**
   * Write the migration to `src/db/migrations/<timestamp>_<migration_name>.ts` (e.g. `002_library_schema.ts` or `<timestamp>_<name>.ts`).
   * Follow the canonical baseline in `src/db/migrations/001_initial_schema.ts`.

4. **Compile & Validate:**
   * Run `npm run build` (`tsc --noEmit`) to confirm type safety and fix any compilation issues.
   * Run `npm run migrate:up` to verify that the migration executes cleanly against PostgreSQL.

---

## Translation & Mapping Rules

### 1. Entities $\rightarrow$ Tables
* Convert entity names into `snake_case`, pluralized table names:
  * `USERS` $\rightarrow$ `users`
  * `BOOK` / `BOOKS` $\rightarrow$ `books`
  * `GENRE` / `GENRES` $\rightarrow$ `genres`
  * `AUTHOR` / `AUTHORS` $\rightarrow$ `authors`
  * `BORROWER` / `BORROWERS` $\rightarrow$ `borrowers`
  * `LOAN` / `LOANS` $\rightarrow$ `loans`

### 2. Data Types Mapping
Map Mermaid attribute types to PostgreSQL column types in Kysely DDL:

Mermaid Type | PostgreSQL / Kysely Column DDL | Notes
:--- | :--- | :---
`uuid` | `'uuid'` | e.g. `.addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql\`gen_random_uuid()\`))`
`serial` / `int PK` | `'serial'` | e.g. `.addColumn('id', 'serial', (col) => col.primaryKey())`
`int` / `integer` | `'integer'` | Standard integer
`varchar` / `string` | `'varchar(255)'` or `'text'` | String values
`text` | `'text'` | Long form text
`boolean` / `bool` | `'boolean'` | Boolean flag
`timestamp` / `date` | `'timestamp'` | Defaults: `.defaultTo(sql\`NOW()\`)`
`numeric` / `decimal`| `'numeric(10, 2)'` | Financial / decimal numbers

### 3. Primary & Foreign Keys
* **Primary Keys (`PK`):**
  * Use `.primaryKey()` on the ID column.
  * For auto-incrementing integer IDs: `.addColumn('id', 'serial', (col) => col.primaryKey())`.
  * For UUID IDs: `.addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql\`gen_random_uuid()\`))`.
* **Foreign Keys (`FK`):**
  * Identify the referenced parent table and column.
  * Add `.references('<parent_table>.<parent_column>').onDelete('cascade')`.
  * Use `.notNull()` unless the relation is optional.

### 4. Cardinalities
* **One-to-Many (`||--o{`):**
  * Place the FK column in the child table referencing the parent table's PK.
* **One-to-One (`||--o|` or `||--||`):**
  * Place the FK column in the child table, add `.references().onDelete('cascade')`, and add `.unique()`.
* **Many-to-Many (`}|--|{` or `}|--o{`):**
  * Create an explicit junction table containing FK columns to both entities, with a composite primary key or unique constraint.

---

## Required Code Template

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Create independent / parent tables first
  await db.schema
    .createTable('genres')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull().unique())
    .execute();

  // 2. Create dependent / child tables referencing parent tables
  await db.schema
    .createTable('books')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('genre_id', 'integer', (col) =>
      col.references('genres.id').onDelete('cascade').notNull()
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse dependency order (children before parents)
  await db.schema.dropTable('books').ifExists().execute();
  await db.schema.dropTable('genres').ifExists().execute();
}
```
