-- RPC function to get subscription data for superadmins
-- Uses SECURITY DEFINER to bypass RLS on club_subscriptions and admin_clubs
CREATE OR REPLACE FUNCTION get_superadmin_subscription()
RETURNS SETOF club_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  -- Get the current authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Verify the user is a superadmin
  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  IF v_role != 'superadmin' THEN
    RETURN;
  END IF;

  -- Return the most recent active subscription from any of the superadmin's clubs
  RETURN QUERY
  SELECT cs.*
  FROM club_subscriptions cs
  INNER JOIN admin_clubs ac ON ac.club_id = cs.club_id
  WHERE ac.admin_profile_id = v_user_id
    AND cs.status = 'active'
  ORDER BY cs.created_at DESC
  LIMIT 1;

  -- If no active subscription found, return the most recent subscription of any status
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT cs.*
    FROM club_subscriptions cs
    INNER JOIN admin_clubs ac ON ac.club_id = cs.club_id
    WHERE ac.admin_profile_id = v_user_id
    ORDER BY cs.created_at DESC
    LIMIT 1;
  END IF;

  RETURN;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_superadmin_subscription() TO authenticated;
