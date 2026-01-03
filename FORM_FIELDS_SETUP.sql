-- Form Fields Configuration Table
-- This table stores the configuration for each field in the multi-step form

CREATE TABLE IF NOT EXISTS form_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stage INTEGER NOT NULL CHECK (stage IN (1, 2, 3)),
  field_name VARCHAR(100) NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  tooltip TEXT,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'email', 'tel', 'number', 'select', 'radio', 'textarea', 'date')),
  options JSONB, -- For select/radio options: [{"value": "value1", "label": "Label 1"}, ...]
  validation_rules JSONB, -- Store validation rules: {"required": true, "min": 3, "max": 100, "pattern": "regex"}
  display_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(stage, field_name)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_form_fields_stage ON form_fields(stage);
CREATE INDEX IF NOT EXISTS idx_form_fields_order ON form_fields(stage, display_order);

-- Insert default fields for Stage 1
INSERT INTO form_fields (stage, field_name, label, placeholder, tooltip, field_type, validation_rules, display_order, is_required, options) VALUES
  (1, 'city', 'المدينة', NULL, 'البرنامج يتطلب التزام حضوري طوال مدة البرنامج ]..[ من الساعة ]..[ إلى الساعة ]..[ في مدينة الرياض، حي النخيل.', 'select', '{"required": true, "disabled": true, "default": "riyadh"}', 1, true, '{"options": [{"value": "riyadh", "label": "الرياض"}]}'),
  
  (1, 'attendance_commitment', 'الالتزام الحضوري', NULL, 'البرنامج يتطلب التزام حضوري طوال مدة البرنامج ]..[ من الساعة ]..[ إلى الساعة ]..[ في مدينة الرياض، حي النخيل.', 'select', '{"required": true}', 2, true, '{"options": [{"value": "yes", "label": "أستطيع وأتعهد بالحضور طوال مدة البرنامج."}, {"value": "no", "label": "لا أستطيع"}]}'),
  
  (1, 'fullName', 'الاسم الكامل', 'أدخل اسمك الكامل', NULL, 'text', '{"required": true, "minLength": 3}', 3, true, NULL),
  
  (1, 'gender', 'الجنس', NULL, NULL, 'radio', '{"required": true}', 4, true, '{"options": [{"value": "male", "label": "ذكر"}, {"value": "female", "label": "أنثى"}]}'),
  
  (1, 'age', 'العمر', NULL, NULL, 'select', '{"required": true}', 5, true, '{"options": [{"value": "18", "label": "18"}, {"value": "19", "label": "19"}, {"value": "20", "label": "20"}, {"value": "21", "label": "21"}, {"value": "22", "label": "22"}, {"value": "23", "label": "23"}, {"value": "24", "label": "24"}, {"value": "25", "label": "25"}, {"value": "26", "label": "26"}, {"value": "27", "label": "27"}, {"value": "28", "label": "28"}, {"value": "29", "label": "29"}, {"value": "30", "label": "30"}]}'),
  
  (1, 'email', 'البريد الإلكتروني', NULL, 'تم التحقق من البريد الإلكتروني تلقائياً', 'email', '{"required": true, "disabled": true, "autoFilled": true}', 6, true, NULL),
  
  (1, 'phoneNumber', 'رقم الجوال', '05XXXXXXXX', 'قد يحتاج فريق العمل رقم الجوال للتواصل مع المتدرب خلال فترة الترشيح في حال ترشح المتقدم. عدم استجابة رقم الجوال قد تؤدي إلى الاستبعاد الفوري أثناء التصفية التلقائية للمرشحين', 'tel', '{"required": true, "pattern": "^05[0-9]{8}$"}', 7, true, NULL),
  
  (1, 'education_level', 'المؤهل الدراسي', NULL, NULL, 'select', '{"required": true}', 8, true, '{"options": [{"value": "high_school", "label": "ثانوي"}, {"value": "diploma", "label": "دبلوم"}, {"value": "bachelor", "label": "جامعي"}, {"value": "masters", "label": "دراسات عليا"}, {"value": "phd", "label": "دكتوراه"}]}'),
  
  (1, 'major', 'التخصص الدراسي', 'أدخل تخصصك الدراسي', 'يظهر في حال: مؤهل دبلوم وأعلى', 'text', '{"required": false, "conditional": {"field": "education_level", "operator": "in", "values": ["diploma", "bachelor", "masters", "phd"]}}', 9, false, NULL),
  
  (1, 'field_of_work', 'المجال', 'أدخل مجال عملك أو اهتمامك', 'المجال ليس بالضرورة مطابقا للتخصص الدراسي. عادة يكون أقرب للموهبة أو لواقع العمل الفعلي. إذا كان مطابقا للتخصص، فأعد كتابة التخصص', 'text', '{"required": true}', 10, true, NULL),
  
  (1, 'employment_status', 'الحالة الوظيفية', NULL, NULL, 'select', '{"required": true}', 11, true, '{"options": [{"value": "unemployed", "label": "لا أعمل حالياً"}, {"value": "govt", "label": "موظف (قطاع حكومي)"}, {"value": "private", "label": "موظف (قطاع خاص)"}, {"value": "nonprofit", "label": "موظف (قطاع غير ربحي)"}, {"value": "freelance_individual", "label": "عمل حر (فرد)"}, {"value": "freelance_company", "label": "عمل حر (مؤسسة/شركة)"}, {"value": "student_diploma", "label": "طالب دبلوم"}, {"value": "student_bachelor", "label": "طالب جامعي"}, {"value": "student_graduate", "label": "طالب دراسات عليا"}]}'),
  
  (1, 'job_title', 'المسمى الوظيفي', 'مثل: مؤسس، مدير تنفيذي، مطور منتجات', 'مؤسس، مالك، مدير تنفيذي، مدير مشاريع، مطور منتجات، موظف استقبال.. الخ. يسمح بإدخال المسمى بالعربية أو الانجليزية.', 'text', '{"required": false, "conditional": {"field": "employment_status", "operator": "in", "values": ["govt", "private", "nonprofit", "freelance_individual", "freelance_company"]}}', 12, false, NULL),
  
  (1, 'years_of_experience', 'عدد سنوات الخبرة', NULL, NULL, 'select', '{"required": true}', 13, true, '{"options": [{"value": "0-1", "label": "0-1"}, {"value": "1-3", "label": "1-3"}, {"value": "3-5", "label": "3-5"}, {"value": "5-7", "label": "5-7"}, {"value": "7+", "label": "أكثر من 7"}]}')
ON CONFLICT (stage, field_name) DO UPDATE SET
  label = EXCLUDED.label,
  placeholder = EXCLUDED.placeholder,
  tooltip = EXCLUDED.tooltip,
  field_type = EXCLUDED.field_type,
  validation_rules = EXCLUDED.validation_rules,
  display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required,
  options = EXCLUDED.options;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_form_fields_updated_at ON form_fields;

CREATE TRIGGER update_form_fields_updated_at
  BEFORE UPDATE ON form_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read form_fields" ON form_fields;
DROP POLICY IF EXISTS "Allow authenticated users to update form_fields" ON form_fields;
DROP POLICY IF EXISTS "Allow authenticated users to insert form_fields" ON form_fields;
DROP POLICY IF EXISTS "Allow public to read active form_fields" ON form_fields;

-- Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read form_fields"
  ON form_fields FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update form_fields"
  ON form_fields FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert form_fields"
  ON form_fields FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow public users to read active fields (for the form)
CREATE POLICY "Allow public to read active form_fields"
  ON form_fields FOR SELECT
  TO anon
  USING (is_active = true);
