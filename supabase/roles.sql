-- The pinned CLI seeds globals before applying migrations, on every fresh reset.
-- postgres is trusted local infrastructure; application actors never join this role.
DO $bootstrap$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'euc_owner') THEN
    CREATE ROLE euc_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB
      NOCREATEROLE NOREPLICATION NOBYPASSRLS;
    -- PostgreSQL 17 already gives the creating role ADMIN. Regranting ADMIN
    -- to that same grantor is rejected; only set the remaining options here.
    GRANT euc_owner TO postgres WITH INHERIT FALSE, SET TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_roles WHERE rolname = 'euc_owner'
      AND NOT (rolcanlogin OR rolinherit OR rolsuper OR rolcreatedb
        OR rolcreaterole OR rolreplication OR rolbypassrls)
  ) OR (SELECT count(*) FROM pg_auth_members
    WHERE roleid = 'euc_owner'::regrole) <> 2
    OR NOT EXISTS (SELECT FROM pg_auth_members
      WHERE roleid = 'euc_owner'::regrole AND member = 'postgres'::regrole
        AND grantor = 'supabase_admin'::regrole
        AND admin_option AND NOT inherit_option AND NOT set_option)
    OR NOT EXISTS (SELECT FROM pg_auth_members
      WHERE roleid = 'euc_owner'::regrole AND member = 'postgres'::regrole
        AND grantor = 'postgres'::regrole
        AND NOT admin_option AND NOT inherit_option AND set_option)
    OR EXISTS (SELECT FROM pg_auth_members WHERE member = 'euc_owner'::regrole)
  THEN
    RAISE EXCEPTION 'Unexpected euc_owner attributes or membership; refusing to repair drift silently';
  END IF;
END
$bootstrap$;
