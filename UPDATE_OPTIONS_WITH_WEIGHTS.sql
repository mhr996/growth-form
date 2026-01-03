-- Update existing options to include weight field
-- This script adds a default weight of 1 to all existing options in select/radio fields

-- Update all fields with options (select and radio types)
UPDATE form_fields
SET options = jsonb_set(
  options,
  '{options}',
  (
    SELECT jsonb_agg(
      option || jsonb_build_object('weight', 1)
    )
    FROM jsonb_array_elements(options->'options') AS option
    WHERE NOT option ? 'weight'
  )
)
WHERE field_type IN ('select', 'radio')
  AND options IS NOT NULL
  AND options->'options' IS NOT NULL;

-- Verify the update
SELECT 
  field_name,
  field_type,
  options->'options' as options_with_weights
FROM form_fields
WHERE field_type IN ('select', 'radio')
ORDER BY display_order;
