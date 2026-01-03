-- Create admins table to store admin user emails
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Add RLS policies
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view admins table" ON admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admins" ON admins;

-- Allow authenticated users to check if they are admin (using auth.email())
CREATE POLICY "Allow users to check admin status"
  ON admins
  FOR SELECT
  TO authenticated
  USING (
    email = auth.email() AND is_active = true
  );

-- Only existing admins can insert new admins
CREATE POLICY "Admins can insert new admins"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.email() 
      AND is_active = true
    )
  );

-- Only existing admins can update admins
CREATE POLICY "Admins can update admins"
  ON admins
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.email() 
      AND is_active = true
    )
  );

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- Insert your first admin (REPLACE WITH YOUR EMAIL)
INSERT INTO admins (email, is_active) VALUES
  ('your-admin-email@example.com', true)
ON CONFLICT (email) DO NOTHING;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE email = user_email 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE admins IS 'Stores admin user emails for role-based access control';
COMMENT ON FUNCTION is_admin IS 'Checks if a user email is in the admins table';
