-- Assignment settings: section + roll number rules on schools
ALTER TABLE "schools"
  ADD COLUMN IF NOT EXISTS "section_assignment_rule" TEXT NOT NULL DEFAULT 'RANDOM',
  ADD COLUMN IF NOT EXISTS "roll_number_assignment_rule" TEXT NOT NULL DEFAULT 'ALPHABETICAL';
