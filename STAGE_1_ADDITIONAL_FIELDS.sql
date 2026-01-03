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

-- Add ai_prompt column for AI evaluation prompts
ALTER TABLE form_fields
ADD COLUMN IF NOT EXISTS ai_prompt TEXT;

-- Insert new fields for Stage 1
INSERT INTO form_fields (stage, field_name, label, placeholder, tooltip, field_type, validation_rules, display_order, is_required, options, weight, is_ai_calculated, full_width, question_title, ai_prompt) VALUES
  -- Question 14: Previous entrepreneurial or volunteer experience
  (1, 'has_previous_experience', 'هل لديك تجارب سابقة في العمل الريادي أو التطوعي؟', NULL, 'أرنا شغفك الريادي والتطوعي', 'select', '{"required": true}', 14, true, '{"options": [{"value": "yes", "label": "نعم", "weight": 1}, {"value": "no", "label": "لا", "weight": 1}]}', 1, false, false, 'سؤال الخبرة الريادية والتطوعية', NULL),
  
  -- Question 15: Description of previous experience (conditional)
  (1, 'experience_description', 'صف إحدى هذه التجارب', 'اكتب وصفاً موجزاً لإحدى تجاربك الريادية أو التطوعية', 'أجب في 100 كلمة كحد أقصى', 'textarea', '{"required": false, "maxWords": 100, "conditional": {"field": "has_previous_experience", "operator": "equals", "value": "yes"}}', 15, false, NULL, NULL, true, true, 'وصف التجربة الريادية', 'قيّم جودة وعمق التجربة الريادية أو التطوعية التي وصفها المتقدم. ركز على: الوضوح في الشرح، التأثير الذي أحدثته التجربة، المهارات المكتسبة، والدروس المستفادة. أعط درجة من 1 إلى 10.'),
  
  -- Question 16: Motivation for joining the program
  (1, 'motivation', 'ما الذي يحفزك للانضمام إلى هذا البرنامج، وما الأهداف التي تطمح لتحقيقها من خلاله؟', 'شارك دوافعك وأهدافك من الانضمام لبرنامج Growth Plus', 'أجب في 150 كلمة أو أقل', 'textarea', '{"required": true, "maxWords": 150}', 16, true, NULL, NULL, true, true, 'سؤال الدافعية', 'قيّم مستوى الدافعية والوضوح في الأهداف. ابحث عن: صدق الدوافع، واقعية الأهداف، توافق الأهداف مع أهداف البرنامج، ومدى جدية المتقدم. أعط درجة من 1 إلى 10.'),
  
  -- Question 17: Social challenge/problem
  (1, 'social_interest', 'صف بإيجاز مشكلة مجتمعية أو تحدياً اجتماعياً يهمك وتسعى للمساهمة في حله', 'اكتب عن مشكلة مجتمعية تهتم بحلها', 'أجب في 150 كلمة أو أقل', 'textarea', '{"required": true, "maxWords": 150}', 17, true, NULL, NULL, true, true, 'سؤال الاهتمام الاجتماعي', 'قيّم عمق الفهم للمشكلة المجتمعية وجدية الاهتمام بحلها. ركز على: وضوح تحديد المشكلة، فهم أسبابها وتأثيراتها، واقعية الحلول المقترحة أو الرغبة في المساهمة، والحس الاجتماعي. أعط درجة من 1 إلى 10.'),
  
  -- Question 18: Leadership/Initiative example
  (1, 'leadership_example', 'اذكر مثالاً على مبادرة قمت بها أو موقف توليت فيه قيادة فريق أو مشروع (إن وُجد)', 'بغض النظر عن طبيعة العمل (تجاري، اجتماعي، تعليمي، تطوعي، خيري... الخ)', 'أجب في 150 كلمة أو أقل', 'textarea', '{"required": true, "maxWords": 150}', 18, true, NULL, NULL, true, true, 'سؤال حول القيادة/المبادرة', 'قيّم المهارات القيادية ومستوى المبادرة. ابحث عن: وضوح الدور القيادي، التحديات التي واجهها والحلول، النتائج المحققة، المهارات القيادية المستخدمة (التواصل، اتخاذ القرار، إدارة الأزمات). أعط درجة من 1 إلى 10.')

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
  question_title = EXCLUDED.question_title,
  ai_prompt = EXCLUDED.ai_prompt;
