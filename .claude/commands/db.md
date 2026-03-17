Supabase database workflow for stalk.ai.

Given a description of the schema change or query needed, do the following:

1. **Read current schema context**: Check `supabase/migrations/` to understand existing tables and structure.
2. **For a new migration**:
   - Create a new file in `supabase/migrations/` with format `<timestamp>_<description>.sql` (timestamp = YYYYMMDDHHMMSS)
   - Write clean, idempotent SQL (use `IF NOT EXISTS`, `ON CONFLICT DO NOTHING` where appropriate)
   - Add RLS policies if creating a new table (follow the pattern in existing migrations: enable RLS, then add policies for `auth.uid()`)
   - Use the Supabase MCP tool `mcp__claude_ai_Supabase__apply_migration` to apply it
3. **For TypeScript types**:
   - Run `mcp__claude_ai_Supabase__generate_typescript_types` and save the output to `src/lib/supabase/database.types.ts`
4. **For a raw SQL query** (debugging/inspection):
   - Use `mcp__claude_ai_Supabase__execute_sql` directly

Always verify the migration applied correctly by running a quick `SELECT` query after applying.
