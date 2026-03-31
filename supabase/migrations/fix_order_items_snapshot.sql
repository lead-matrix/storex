-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: fix_order_items_snapshot
-- Adds product_name and variant_name snapshot columns to order_items.
--
-- WHY: If a product is renamed or deleted after purchase, the admin portal and
-- customer order history would show wrong (or broken) product names because they
-- were resolving names via the FK join at query time. Snapshotting names at the
-- moment of purchase preserves accurate order history forever.
--
-- Safe to run against a live DB — all changes are additive (ADD COLUMN IF NOT EXISTS).
-- Existing rows will have NULL for the new columns; that is fine and expected.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add snapshot columns (idempotent)
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS variant_name text;

-- 2. Back-fill existing rows from the joined product/variant tables so historical
--    orders aren't left with NULLs where the product still exists.
UPDATE public.order_items oi
SET
  product_name = COALESCE(oi.product_name, p.title),
  variant_name = COALESCE(oi.variant_name, pv.name)
FROM
  public.products p
  LEFT JOIN public.product_variants pv ON pv.id = oi.variant_id
WHERE
  p.id = oi.product_id
  AND (oi.product_name IS NULL OR oi.variant_name IS NULL);

-- 3. Add index on order_id if missing (speeds up order detail page queries)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON public.order_items (order_id);

-- Done. No destructive changes.
