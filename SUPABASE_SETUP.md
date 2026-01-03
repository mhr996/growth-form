# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

## 2. Update Environment Variables

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create form_submissions table
CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  phone_number TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read
CREATE POLICY "Allow authenticated users to read submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow anyone to insert (for form submission)
CREATE POLICY "Allow anyone to insert submissions"
  ON form_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete submissions"
  ON form_submissions
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at DESC);
CREATE INDEX idx_form_submissions_email ON form_submissions(email);
```

## 4. Create Admin User

In Supabase Dashboard > Authentication > Users, create a new user:

- Email: your_admin_email@example.com
- Password: your_secure_password
- Confirm the user's email

## 5. Test the Application

1. Visit `http://localhost:3000` to submit a form
2. Visit `http://localhost:3000/admin/login` to access the admin panel
3. Login with your admin credentials
4. View submissions at `http://localhost:3000/admin/submissions`

## Admin Features

- **Dashboard**: Overview of form submissions and statistics
- **Submissions**: View, search, and delete form submissions
- **Protected Routes**: All admin pages require authentication
- **Auto logout**: Session management with Supabase Auth

## Security Notes

- RLS policies are enabled for database security
- Admin routes are protected with authentication
- No public registration - admin users must be created in Supabase dashboard
- Form submissions are available to anonymous users (for public form)
