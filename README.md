# Kitchen406 prototype

This is the functional prototype for the Kitchen406 ordering and product management platform described in Chapters 1–4.

## Start locally

1. Start PostgreSQL in a separate Terminal:

   ```bash
   cd '/Users/miguelestavillo/Documents/Codex/2026-09-13/i-have-provided-chapters-1-4/outputs/kitchen406'
   npm run db:start
   ```

2. In a second Terminal, apply the schema (the database is created automatically if needed) and seed test data:

   ```bash
   cd '/Users/miguelestavillo/Documents/Codex/2026-09-13/i-have-provided-chapters-1-4/outputs/kitchen406'
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

3. Open `http://localhost:3406`.

The database contains two owners, one staff account, two customers, catalog products, recipes, ingredient stock, schedules, and a paid sample order. Seeded passwords are `Kitchen406!Demo`. Staff must change the temporary password on first access.

Use `npm run worker` in another Terminal to run expiry, reservation, reminders, notification outbox, and marketing trigger jobs every 30 seconds. The owner’s Prototype Lab screen can run jobs immediately and simulate notification or AI failures.

## Validation

- `npm run typecheck`
- `npm run build`
- `npm run db:migrate`
- `npm run db:seed`

The migration is generated from the final 43-entity table in the proposal. Read [DECISIONS.md](docs/DECISIONS.md) for all assistant-selected assumptions and [SCHEMA-CHANGES.md](docs/SCHEMA-CHANGES.md) for every approved addition and constraint.

External services are functional local adapters: QR payment outcomes, courier quotes/bookings/tracking, location distance checks, notification outboxes, local image storage, and deterministic AI drafts.
