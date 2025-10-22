-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert waitlist entries" ON waitlist;
DROP POLICY IF EXISTS "Only authenticated users can read waitlist" ON waitlist;

-- Recreate with correct permissions
CREATE POLICY "Anyone can insert waitlist entries" ON waitlist
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select from waitlist" ON waitlist
    FOR SELECT USING (true);

-- Or if you want to completely disable RLS for now (easier for development)
-- ALTER TABLE waitlist DISABLE ROW LEVEL SECURITY;