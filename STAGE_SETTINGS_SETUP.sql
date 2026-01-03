-- Create stage_settings table for storing welcome messages and user agreements

DROP TABLE IF EXISTS stage_settings CASCADE;

CREATE TABLE stage_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stage INTEGER NOT NULL UNIQUE CHECK (stage IN (1, 2, 3)),
  welcome_message TEXT,
  user_agreement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default settings for each stage
INSERT INTO stage_settings (stage, welcome_message, user_agreement) VALUES
  (1, 'نرحب بك في المرحلة الأولى من برنامج Growth Plus.

هذا البرنامج مصمم لدعم الشباب الطموح في تحقيق أهدافهم وتطوير مهاراتهم.

يرجى ملء النموذج بدقة واهتمام، حيث ستساعدنا إجاباتك في فهم اهتماماتك وأهدافك بشكل أفضل.', 
  'أتفهم وأوافق أن البرنامج يتطلب التزام حضوري طوال مدة البرنامج [..] من الساعة [..] إلى الساعة [..] في مدينة الرياض، حي النخيل.'),
  
  (2, 'أحسنت! لقد أكملت المرحلة الأولى بنجاح.

الآن ننتقل إلى المرحلة الثانية من التسجيل.', 
  'أتفهم وأوافق أن البرنامج يتطلب التزام حضوري طوال مدة البرنامج [..] من الساعة [..] إلى الساعة [..] في مدينة الرياض، حي النخيل.'),
  
  (3, 'هذه هي المرحلة الأخيرة من التسجيل.

نشكرك على صبرك والتزامك حتى الآن.', 
  'أتفهم وأوافق أن البرنامج يتطلب التزام حضوري طوال مدة البرنامج [..] من الساعة [..] إلى الساعة [..] في مدينة الرياض، حي النخيل.')
ON CONFLICT (stage) DO UPDATE SET
  welcome_message = EXCLUDED.welcome_message,
  user_agreement = EXCLUDED.user_agreement;

-- Enable Row Level Security
ALTER TABLE stage_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read stage_settings" ON stage_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update stage_settings" ON stage_settings;
DROP POLICY IF EXISTS "Allow public to read stage_settings" ON stage_settings;

-- Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read stage_settings"
  ON stage_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update stage_settings"
  ON stage_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow public users to read (for displaying welcome messages)
CREATE POLICY "Allow public to read stage_settings"
  ON stage_settings FOR SELECT
  TO anon
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stage_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_stage_settings_updated_at ON stage_settings;

CREATE TRIGGER update_stage_settings_updated_at
  BEFORE UPDATE ON stage_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_stage_settings_updated_at();
