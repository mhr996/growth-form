-- Add additional fields to Stage 1 (Experience, Motivation, Social Interest, Leadership questions)

-- Add is_ai_calculated column to track fields that are scored by AI
ALTER TABLE form_fields
ADD COLUMN IF NOT EXISTS is_ai_calculated BOOLEAN DEFAULT false;

-- Add full_width column to control field width in the form (for textarea fields)
ALTER TABLE form_fields
ADD COLUMN IF NOT EXISTS full_width BOOLEAN DEFAULT false;

-- Add question_title column for admin-only question titles
ALTER TABLE form_fields
ADD COLUMN IF NOT EXISTS question_title TEXT;

-- Insert new fields for Stage 1
INSERT INTO form_fields (stage, field_name, label, placeholder, tooltip, field_type, validation_rules, display_order, is_required, options, weight, is_ai_calculated, full_width, question_title) VALUES
  -- Question 14: Previous entrepreneurial or volunteer experience
  (1, 'has_previous_experience', 'هل لديك تجارب سابقة في العمل الريادي أو التطوعي؟', NULL, 'أرنا شغفك الريادي والتطوعي', 'select', '{"required": true}', 14, true, '{"options": [{"value": "yes", "label": "نعم", "weight": 1}, {"value": "no", "label": "لا", "weight": 1}]}', 1, false, false, 'سؤال الخبرة الريادية والتطوعية'),
  
  -- Question 15: Description of previous experience (conditional)
  (1, 'experience_description', 'صف إحدى هذه التجارب', 'اكتب وصفاً موجزاً لإحدى تجاربك الريادية أو التطوعية', 'أجب في 100 كلمة كحد أقصى', 'textarea', '{"required": false, "maxWords": 100, "conditional": {"field": "has_previous_experience", "operator": "equals", "value": "yes"}}', 15, false, NULL, NULL, true, true, 'وصف التجربة الريادية'),
  
  -- Question 16: Motivation for joining the program
  (1, 'motivation', 'ما الذي يحفزك للانضمام إلى هذا البرنامج، وما الأهداف التي تطمح لتحقيقها من خلاله؟', 'شارك دوافعك وأهدافك من الانضمام لبرنامج Growth Plus', 'أجب في 150 كلمة أو أقل', 'textarea', '{"required": true, "maxWords": 150}', 16, true, NULL, NULL, true, true, 'سؤال الدافعية'),
  
  -- Question 17: Social challenge/problem
  (1, 'social_interest', 'صف بإيجاز مشكلة مجتمعية أو تحدياً اجتماعياً يهمك وتسعى للمساهمة في حله', 'اكتب عن مشكلة مجتمعية تهتم بحلها', 'أجب في 150 كلمة أو أقل', 'textarea', '{"required": true, "maxWords": 150}', 17, true, NULL, NULL, true, true, 'سؤال الاهتمام الاجتماعي'),
  
  -- Question 18: Leadership/Initiative example
  (1, 'leadership_example', 'اذكر مثالاً على مبادرة قمت بها أو موقف توليت فيه قيادة فريق أو مشروع (إن وُجد)', 'بغض النظر عن طبيعة العمل (تجاري، اجتماعي، تعليمي، تطوعي، خيري... الخ)', 'أجب في 150 كلمة أو أقل', 'textarea', '{"required": true, "maxWords": 150}', 18, true, NULL, NULL, true, true, 'سؤال حول القيادة/المبادرة')

ON CONFLICT (stage, field_name) DO UPDATE SET
  label = EXCLUDED.label,
  placeholder = EXCLUDED.placeholder,
  tooltip = EXCLUDED.tooltip,
  field_type = EXCLUDED.field_type,
  validation_rules = EXCLUDED.validation_rules,
  display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required,
  options = EXCLUDED.options,
  weight = EXCLUDED.weight,
  is_ai_calculated = EXCLUDED.is_ai_calculated,
  full_width = EXCLUDED.full_width,
  question_title = EXCLUDED.question_title;
