-- ============================================================================
-- Migration: Enable REPLICA IDENTITY FULL and add friendships to realtime
-- Purpose:
--   1. Ensure DELETE/UPDATE events include full row data in payload.old
--   2. Add friendships table to realtime publication for friend acceptance
-- ============================================================================

-- REPLICA IDENTITY FULL: postgres_changes DELETE and UPDATE events include
-- the complete old row in payload.old (not just the primary key).
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE direct_messages REPLICA IDENTITY FULL;
ALTER TABLE friend_requests REPLICA IDENTITY FULL;
ALTER TABLE friendships REPLICA IDENTITY FULL;

-- Add friendships to supabase_realtime publication so INSERT/DELETE events
-- are broadcast to subscribers (needed for real-time friend acceptance).
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
