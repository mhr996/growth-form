-- Add weight column to form_fields table
ALTER TABLE form_fields 
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 10);

-- Update existing fields to have default weight of 1
UPDATE form_fields SET weight = 1 WHERE weight IS NULL;

-- Add comment for the weight column
COMMENT ON COLUMN form_fields.weight IS 'Weight/importance of the field from 1-10, used for scoring or prioritization';
