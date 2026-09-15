-- Add columns for winner assignment
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS assigned_driver TEXT,
ADD COLUMN IF NOT EXISTS final_cost INTEGER;

COMMENT ON COLUMN orders.assigned_driver IS 'Name of the winning driver assigned to this order';
COMMENT ON COLUMN orders.final_cost IS 'Final cost agreed upon (winning bid amount)';
