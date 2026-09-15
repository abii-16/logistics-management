-- Add order_id to bids table for order-level bidding
ALTER TABLE bids
ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES orders(id) ON DELETE CASCADE;

-- Create index for order-based queries
CREATE INDEX IF NOT EXISTS idx_bids_order_id ON bids(order_id);

-- Create unique constraint: one bid per driver per order
CREATE UNIQUE INDEX IF NOT EXISTS idx_bids_driver_order_unique 
ON bids(driver_name, order_id) 
WHERE order_id IS NOT NULL AND bid_type = 'order';

COMMENT ON COLUMN bids.order_id IS 'For order-level bids: the specific order being bid on';
