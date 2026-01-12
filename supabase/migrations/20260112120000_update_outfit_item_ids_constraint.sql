-- Update the outfits table check constraint to allow flexible item counts (2-7)
-- This supports the new "fashion stylist" mode that chooses optimal outfit size

-- Drop the existing constraint
ALTER TABLE outfits DROP CONSTRAINT IF EXISTS outfits_item_ids_check;

-- Add the new flexible constraint (2-7 items instead of exactly 3)
ALTER TABLE outfits ADD CONSTRAINT outfits_item_ids_check
  CHECK (array_length(item_ids, 1) >= 2 AND array_length(item_ids, 1) <= 7);

-- Verification query (run to check):
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'outfits'::regclass;
