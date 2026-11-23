-- ================================================================
-- Who can see whose records (the manager - sales rep rule, enforced in the database)
--   client_admin : everyone in the company
--   manager      : themselves and the reps whose client_users.manager_id is them
--   sales_rep    : themselves
--   super_admin  : no business data at all (platform tables only)
-- An unassigned rep (manager_id NULL) is visible to the admin and to the rep, not to any manager.
-- SECURITY DEFINER so the lookup of "my reps" is not itself filtered by row level security.
-- ================================================================
CREATE FUNCTION app_can_access_owner(p_owner uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT CASE app_role()
    WHEN 'client_admin' THEN true
    WHEN 'sales_rep'    THEN p_owner = app_user_id()
    WHEN 'manager'      THEN p_owner = app_user_id() OR EXISTS (
         SELECT 1 FROM client_users u
         WHERE u.client_user_id = p_owner AND u.manager_id = app_user_id() AND u.client_id = app_client_id() AND u.deleted_at IS NULL)
    ELSE false
  END
$$;

-- True when the given client user works for the caller's company. Leads have no client_id of their own, so their policies use this.
CREATE FUNCTION app_in_my_client(p_user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM client_users u WHERE u.client_user_id = p_user AND u.client_id = app_client_id())
$$;
