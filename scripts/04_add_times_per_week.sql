-- Add times_per_week column to subject_levels table
ALTER TABLE subject_levels 
ADD COLUMN IF NOT EXISTS times_per_week INT DEFAULT 1;

-- Add comment to clarify the field
COMMENT ON COLUMN subject_levels.times_per_week IS 'Number of times per week the course takes place';
