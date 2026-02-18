-- ============================================================================
-- RPC: accept_friend_request
-- Atomically accepts a friend request and creates the friendship record.
-- Uses SECURITY DEFINER to bypass RLS for the friendship insert.
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  id1 UUID;
  id2 UUID;
BEGIN
  -- Get the request and verify the current user is the receiver
  SELECT * INTO req FROM friend_requests
    WHERE id = request_id
      AND receiver_id = auth.uid()
      AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or unauthorized';
  END IF;

  -- Order IDs for friendships table constraint (user1_id < user2_id)
  IF req.sender_id < req.receiver_id THEN
    id1 := req.sender_id;
    id2 := req.receiver_id;
  ELSE
    id1 := req.receiver_id;
    id2 := req.sender_id;
  END IF;

  -- Update request status
  UPDATE friend_requests
    SET status = 'accepted', resolved_at = NOW()
    WHERE id = request_id;

  -- Create friendship (ON CONFLICT for idempotency)
  INSERT INTO friendships (user1_id, user2_id)
    VALUES (id1, id2)
    ON CONFLICT DO NOTHING;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION accept_friend_request(UUID) TO authenticated;
