\set ON_ERROR_STOP on
BEGIN;

-- Test helpers live only in this connection and transaction. No SECURITY DEFINER.
CREATE FUNCTION pg_temp.check_true(ok boolean, message text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%', message; END IF;
END $$;

CREATE FUNCTION pg_temp.expect_error(statement text, code text, message text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual_code text; actual_message text;
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS actual_code = RETURNED_SQLSTATE, actual_message = MESSAGE_TEXT;
    IF actual_code <> code OR position(message in actual_message) = 0 THEN
      RAISE EXCEPTION 'Wrong error: % %', actual_code, actual_message;
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'Expected denial but statement succeeded: %', statement;
END $$;

CREATE FUNCTION pg_temp.check_foundation() RETURNS void LANGUAGE plpgsql AS $$
DECLARE actor text;
BEGIN
  PERFORM pg_temp.check_true(EXISTS (SELECT FROM pg_roles WHERE rolname = 'euc_owner'
    AND NOT (rolcanlogin OR rolinherit OR rolsuper OR rolcreatedb OR rolcreaterole
      OR rolreplication OR rolbypassrls)), 'owner role drift');
  PERFORM pg_temp.check_true((SELECT count(*) = 2 FROM pg_auth_members
    WHERE roleid = 'euc_owner'::regrole) AND EXISTS (
    SELECT FROM pg_auth_members WHERE roleid = 'euc_owner'::regrole
      AND member = 'postgres'::regrole AND grantor = 'supabase_admin'::regrole
      AND admin_option AND NOT inherit_option AND NOT set_option)
    AND EXISTS (SELECT FROM pg_auth_members WHERE roleid = 'euc_owner'::regrole
      AND member = 'postgres'::regrole AND grantor = 'postgres'::regrole
      AND NOT admin_option AND NOT inherit_option AND set_option)
    AND NOT EXISTS (SELECT FROM pg_auth_members WHERE member = 'euc_owner'::regrole),
    'owner membership drift');
  PERFORM pg_temp.check_true((SELECT nspowner = 'euc_owner'::regrole FROM pg_namespace
    WHERE nspname = 'euc'), 'schema owner drift');
  PERFORM pg_temp.check_true(NOT EXISTS (SELECT FROM pg_class c JOIN pg_namespace n
    ON n.oid = c.relnamespace WHERE n.nspname = 'euc' AND c.relowner <> 'euc_owner'::regrole),
    'object owner drift');
  PERFORM pg_temp.check_true(NOT EXISTS (SELECT FROM pg_proc p JOIN pg_namespace n
    ON n.oid = p.pronamespace WHERE n.nspname = 'euc' AND
    (p.proowner <> 'euc_owner'::regrole OR p.prosecdef)), 'function owner or definer drift');
  PERFORM pg_temp.check_true(NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n
    ON n.oid = t.typnamespace WHERE n.nspname = 'euc' AND t.typowner <> 'euc_owner'::regrole),
    'type owner drift');
  PERFORM pg_temp.check_true(NOT EXISTS (SELECT FROM pg_policy p JOIN pg_class c
    ON c.oid = p.polrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'euc'),
    'unexpected application policy');
  PERFORM pg_temp.check_true(NOT EXISTS (SELECT FROM pg_publication WHERE puballtables)
    AND NOT EXISTS (SELECT FROM pg_publication_tables WHERE schemaname = 'euc')
    AND NOT EXISTS (SELECT FROM pg_publication_namespace WHERE pnnspid = 'euc'::regnamespace),
    'private schema included in publication');
  PERFORM pg_temp.check_true(NOT EXISTS (SELECT FROM pg_default_acl d,
    LATERAL aclexplode(d.defaclacl) a WHERE d.defaclrole = 'euc_owner'::regrole
    AND a.grantee <> 'euc_owner'::regrole), 'default privilege drift');
  -- Explicitly require overrides for PostgreSQL's otherwise PUBLIC defaults.
  PERFORM pg_temp.check_true((SELECT count(*) = 2 FROM pg_default_acl
    WHERE defaclrole = 'euc_owner'::regrole AND defaclnamespace = 0
      AND defaclobjtype IN ('f', 'T')), 'missing closed function/type defaults');
  FOREACH actor IN ARRAY ARRAY['anon','authenticated','service_role','authenticator'] LOOP
    PERFORM pg_temp.check_true(NOT has_schema_privilege(actor, 'euc', 'USAGE')
      AND NOT has_schema_privilege(actor, 'euc', 'CREATE')
      AND NOT pg_has_role(actor, 'euc_owner', 'MEMBER')
      AND NOT pg_has_role(actor, 'euc_owner', 'USAGE')
      AND NOT pg_has_role(actor, 'euc_owner', 'SET'), 'application privilege drift: ' || actor);
    PERFORM pg_temp.check_true(NOT EXISTS (SELECT FROM pg_roles WHERE rolname = actor
      AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication)), 'application role drift');
  END LOOP;
  PERFORM pg_temp.check_true(NOT EXISTS (SELECT FROM pg_auth_members
    WHERE member IN ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole)),
    'unexpected inherited application membership');
END $$;

SELECT pg_temp.check_foundation();
SELECT pg_temp.check_true(NOT EXISTS (SELECT FROM pg_class WHERE relnamespace = 'euc'::regnamespace)
  AND NOT EXISTS (SELECT FROM pg_proc WHERE pronamespace = 'euc'::regnamespace),
  'B2a must contain no permanent application objects');

-- Prove the drift checks actually fail, then restore the original state.
SAVEPOINT drift;
ALTER ROLE euc_owner BYPASSRLS;
SELECT pg_temp.expect_error('SELECT pg_temp.check_foundation()', 'P0001', 'owner role drift');
ROLLBACK TO drift;
ALTER SCHEMA euc OWNER TO postgres;
SELECT pg_temp.expect_error('SELECT pg_temp.check_foundation()', 'P0001', 'schema owner drift');
ROLLBACK TO drift;
GRANT euc_owner TO anon;
SELECT pg_temp.expect_error('SELECT pg_temp.check_foundation()', 'P0001', 'owner membership drift');
ROLLBACK TO drift;
CREATE TABLE euc.__wrong_owner (id integer);
SELECT pg_temp.expect_error('SELECT pg_temp.check_foundation()', 'P0001', 'object owner drift');
ROLLBACK TO drift;
ALTER DEFAULT PRIVILEGES FOR ROLE euc_owner GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
SELECT pg_temp.expect_error('SELECT pg_temp.check_foundation()', 'P0001', 'missing closed function/type defaults');
ROLLBACK TO drift;
SELECT pg_temp.check_foundation();

SET LOCAL ROLE euc_owner;
CREATE TABLE euc.__acl_probe (id integer);
INSERT INTO euc.__acl_probe VALUES (1);
CREATE SEQUENCE euc.__sequence_probe;
CREATE FUNCTION euc.__function_probe() RETURNS integer LANGUAGE sql AS 'SELECT 1';
CREATE TYPE euc.__type_probe AS ENUM ('synthetic');
RESET ROLE;
SELECT pg_temp.check_foundation();

-- Grant CREATE only inside this rolled-back test to exercise schema defaults.
GRANT CREATE ON DATABASE postgres TO euc_owner;
SET LOCAL ROLE euc_owner;
CREATE SCHEMA __euc_default_probe;
RESET ROLE;

DO $$ DECLARE actor text; BEGIN
  FOREACH actor IN ARRAY ARRAY['anon','authenticated','service_role','authenticator'] LOOP
    PERFORM pg_temp.check_true(NOT has_table_privilege(actor, 'euc.__acl_probe',
      'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN'), 'future table grant');
    PERFORM pg_temp.check_true(NOT has_sequence_privilege(actor, 'euc.__sequence_probe',
      'SELECT,UPDATE,USAGE'), 'future sequence grant');
    PERFORM pg_temp.check_true(NOT has_function_privilege(actor, 'euc.__function_probe()', 'EXECUTE'),
      'future function grant');
    PERFORM pg_temp.check_true(NOT has_type_privilege(actor, 'euc.__type_probe', 'USAGE'), 'future type grant');
    PERFORM pg_temp.check_true(NOT has_schema_privilege(actor, '__euc_default_probe', 'USAGE,CREATE'),
      'future schema grant');
  END LOOP;
END $$;

-- SESSION AUTHORIZATION matters: SET ROLE alone would keep the privileged
-- original session's ability to SET ROLE euc_owner, invalidating that probe.
SET SESSION AUTHORIZATION anon;
DO $$ BEGIN
  BEGIN EXECUTE 'SET ROLE euc_owner'; RAISE EXCEPTION 'owner escalation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM euc.__acl_probe; RAISE EXCEPTION 'table access succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'CREATE SCHEMA __forbidden'; RAISE EXCEPTION 'schema creation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'CREATE TABLE euc.__forbidden(id integer)'; RAISE EXCEPTION 'object creation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'GRANT euc_owner TO anon'; RAISE EXCEPTION 'membership escalation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION authenticated;
DO $$ BEGIN
  BEGIN EXECUTE 'SET ROLE euc_owner'; RAISE EXCEPTION 'owner escalation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM euc.__acl_probe; RAISE EXCEPTION 'table access succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'CREATE SCHEMA __forbidden'; RAISE EXCEPTION 'schema creation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'CREATE TABLE euc.__forbidden(id integer)'; RAISE EXCEPTION 'object creation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'GRANT euc_owner TO authenticated'; RAISE EXCEPTION 'membership escalation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION service_role;
DO $$ BEGIN
  BEGIN EXECUTE 'SET ROLE euc_owner'; RAISE EXCEPTION 'owner escalation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM euc.__acl_probe; RAISE EXCEPTION 'table access succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'CREATE SCHEMA __forbidden'; RAISE EXCEPTION 'schema creation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'CREATE TABLE euc.__forbidden(id integer)'; RAISE EXCEPTION 'object creation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN EXECUTE 'GRANT euc_owner TO service_role'; RAISE EXCEPTION 'membership escalation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET SESSION AUTHORIZATION;

-- Ordinary object ACLs remain closed even if schema USAGE is temporarily
-- granted. This isolates object denial from the schema's earlier denial.
GRANT USAGE ON SCHEMA euc TO anon, authenticated, service_role;
DO $$ DECLARE actor text; statement text; BEGIN
  FOREACH actor IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    EXECUTE format('SET SESSION AUTHORIZATION %I', actor);
    FOREACH statement IN ARRAY ARRAY[
      'SELECT * FROM euc.__acl_probe',
      'INSERT INTO euc.__acl_probe VALUES (2)',
      'UPDATE euc.__acl_probe SET id=2',
      'DELETE FROM euc.__acl_probe',
      'TRUNCATE euc.__acl_probe',
      'SELECT nextval(''euc.__sequence_probe'')',
      'SELECT euc.__function_probe()'
    ] LOOP
      BEGIN
        EXECUTE statement;
        RAISE EXCEPTION 'ordinary privilege leaked: % %', actor, statement;
      EXCEPTION WHEN insufficient_privilege THEN NULL;
      END;
    END LOOP;
    RESET SESSION AUTHORIZATION;
  END LOOP;
END $$;
REVOKE USAGE ON SCHEMA euc FROM anon, authenticated, service_role;

-- Independent RLS proof: ordinary grants are deliberately present for this
-- actor, which has no owner membership or bypass attributes. Zero policies.
CREATE ROLE euc_rls_probe NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB;
SET LOCAL ROLE euc_owner;
CREATE TABLE euc.__rls_probe (id integer PRIMARY KEY, marker text NOT NULL);
INSERT INTO euc.__rls_probe VALUES (1, 'synthetic');
ALTER TABLE euc.__rls_probe ENABLE ROW LEVEL SECURITY;
ALTER TABLE euc.__rls_probe FORCE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA euc TO euc_rls_probe;
GRANT SELECT, INSERT, UPDATE, DELETE ON euc.__rls_probe TO euc_rls_probe;
RESET ROLE;
SELECT pg_temp.check_true((SELECT relrowsecurity AND relforcerowsecurity
  AND relowner = 'euc_owner'::regrole FROM pg_class WHERE oid = 'euc.__rls_probe'::regclass)
  AND NOT EXISTS (SELECT FROM pg_policy WHERE polrelid = 'euc.__rls_probe'::regclass), 'RLS configuration');
SELECT pg_temp.check_true(has_schema_privilege('euc_rls_probe','euc','USAGE')
  AND has_table_privilege('euc_rls_probe','euc.__rls_probe','SELECT')
  AND has_table_privilege('euc_rls_probe','euc.__rls_probe','INSERT')
  AND has_table_privilege('euc_rls_probe','euc.__rls_probe','UPDATE')
  AND has_table_privilege('euc_rls_probe','euc.__rls_probe','DELETE')
  AND NOT pg_has_role('euc_rls_probe','euc_owner','MEMBER')
  AND (SELECT NOT rolsuper AND NOT rolbypassrls FROM pg_roles WHERE rolname='euc_rls_probe'),
  'independent RLS actor prerequisites');
SET SESSION AUTHORIZATION euc_rls_probe;
DO $$ DECLARE affected bigint; detail text; BEGIN
  SELECT count(*) INTO affected FROM euc.__rls_probe;
  IF affected <> 0 THEN RAISE EXCEPTION 'RLS SELECT leaked rows'; END IF;
  BEGIN
    INSERT INTO euc.__rls_probe VALUES (2, 'forbidden');
    RAISE EXCEPTION 'RLS INSERT succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS detail = MESSAGE_TEXT;
    IF position('row-level security' in detail) = 0 THEN
      RAISE EXCEPTION 'INSERT failed for a reason other than RLS: %', detail;
    END IF;
  END;
  UPDATE euc.__rls_probe SET marker = 'forbidden';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'RLS UPDATE modified rows'; END IF;
  DELETE FROM euc.__rls_probe;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'RLS DELETE removed rows'; END IF;
END $$;
RESET SESSION AUTHORIZATION;
SELECT pg_temp.check_true((SELECT count(*) = 1 AND min(marker) = 'synthetic'
  FROM euc.__rls_probe), 'RLS changed protected data');
ROLLBACK;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='euc_rls_probe')
    OR EXISTS (SELECT FROM pg_class WHERE relnamespace='euc'::regnamespace)
    OR EXISTS (SELECT FROM pg_namespace WHERE nspname='__euc_default_probe') THEN
    RAISE EXCEPTION 'Security probe cleanup failed';
  END IF;
END $$;
\echo PASS: bootstrap, ownership, drift, ordinary grants, role escalation, future defaults, independent RLS and rollback
