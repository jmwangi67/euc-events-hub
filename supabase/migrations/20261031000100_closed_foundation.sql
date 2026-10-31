-- Fails if roles.sql did not run first; this is intentionally not a role bootstrap.
DO $check$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'euc_owner') THEN
    RAISE EXCEPTION 'euc_owner missing: roles.sql must run before migrations';
  END IF;
END
$check$;

CREATE SCHEMA euc AUTHORIZATION euc_owner;
REVOKE ALL ON SCHEMA euc FROM PUBLIC, anon, authenticated, service_role, authenticator;

-- Defaults belong to the actual creator, not its memberships. Future B2b
-- migrations must explicitly SET LOCAL ROLE euc_owner before creating objects.
-- Global revocations are essential: schema defaults cannot remove PUBLIC's
-- built-in EXECUTE on functions or USAGE on types.
SET LOCAL ROLE euc_owner;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role, authenticator;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role, authenticator;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role, authenticator;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TYPES FROM PUBLIC, anon, authenticated, service_role, authenticator;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SCHEMAS FROM PUBLIC, anon, authenticated, service_role, authenticator;
RESET ROLE;

-- B2a deliberately creates no application tables, views, functions or policies.
