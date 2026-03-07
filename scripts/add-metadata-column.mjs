import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://lceaknusuelbrevzvkno.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZWFrbnVzdWVsYnJldnp2a25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxNTAxMSwiZXhwIjoyMDg4MzkxMDExfQ.uR77hnkaOf3rgaaAyzFnUP9zPaaagvVwuPwJO76mJB4'
)

// Try inserting with metadata field to see if it exists
const { error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE digests ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT null;'
}).catch(() => ({ error: { message: 'rpc not available' } }))

if (error) {
    // Fallback: try a dummy update to see if column exists
    const testInsert = await supabase
        .from('digests')
        .select('metadata')
        .limit(1)

    if (testInsert.error?.message?.includes('column') || testInsert.error?.message?.includes('metadata')) {
        console.log('❌ metadata column does not exist yet - needs manual migration')
        console.log('\nRun this SQL in the Supabase Dashboard SQL Editor:')
        console.log('ALTER TABLE digests ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT null;')
    } else {
        console.log('✅ metadata column already exists or was added!')
    }
} else {
    console.log('✅ metadata column added successfully!')
}
