-- Read-only catalog/data assertions shared by reset safety and security tests.
-- The wrapper supplies the version-controlled manifest and expected stage.
DO $baseline$
DECLARE
  spec jsonb := current_setting('euc.reference_manifest')::jsonb;
  expected text[];
  actual text[];
  relation text;
  actor text;
  populated boolean;
  infrastructure jsonb;
  other_relation record;
BEGIN
  IF current_user <> 'supabase_admin' THEN
    RAISE EXCEPTION 'Baseline checks require the local infrastructure principal';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='euc_owner'
    AND NOT (rolcanlogin OR rolinherit OR rolsuper OR rolcreatedb OR rolcreaterole
      OR rolreplication OR rolbypassrls))
    OR NOT EXISTS (SELECT FROM pg_namespace WHERE nspname='euc' AND nspowner='euc_owner'::regrole)
  THEN RAISE EXCEPTION 'Owner role or schema ownership drift'; END IF;
  IF (SELECT count(*) FROM pg_auth_members WHERE roleid='euc_owner'::regrole) <> 2
    OR NOT EXISTS (SELECT FROM pg_auth_members WHERE roleid='euc_owner'::regrole
      AND member='postgres'::regrole AND grantor='supabase_admin'::regrole
      AND admin_option AND NOT inherit_option AND NOT set_option)
    OR NOT EXISTS (SELECT FROM pg_auth_members WHERE roleid='euc_owner'::regrole
      AND member='postgres'::regrole AND grantor='postgres'::regrole
      AND NOT admin_option AND NOT inherit_option AND set_option)
    OR EXISTS (SELECT FROM pg_auth_members WHERE member='euc_owner'::regrole)
  THEN RAISE EXCEPTION 'Owner membership drift'; END IF;
  FOREACH actor IN ARRAY ARRAY['anon','authenticated','service_role','authenticator'] LOOP
    IF has_schema_privilege(actor,'euc','USAGE,CREATE')
      OR pg_has_role(actor,'euc_owner','MEMBER')
    THEN RAISE EXCEPTION 'Private schema or owner escalation drift: %',actor; END IF;
  END LOOP;
  IF EXISTS (SELECT FROM pg_default_acl d, LATERAL aclexplode(d.defaclacl) a
    WHERE d.defaclrole='euc_owner'::regrole AND a.grantee<>'euc_owner'::regrole)
    OR (SELECT count(*) FROM pg_default_acl WHERE defaclrole='euc_owner'::regrole
      AND defaclnamespace=0 AND defaclobjtype IN ('f','T')) <> 2
  THEN RAISE EXCEPTION 'Closed default privilege drift'; END IF;

  SELECT coalesce(array_agg(value ORDER BY value), ARRAY[]::text[]) INTO expected
    FROM jsonb_array_elements_text(spec->'tables');
  SELECT coalesce(array_agg(relname::text ORDER BY relname), ARRAY[]::text[]) INTO actual
    FROM pg_class WHERE relnamespace='euc'::regnamespace AND relkind IN ('r','p');
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'Unexpected reference tables: expected %, actual %', expected, actual;
  END IF;
  IF EXISTS (SELECT FROM pg_class WHERE relnamespace='euc'::regnamespace AND relkind NOT IN ('r','i'))
    OR EXISTS (SELECT FROM pg_proc WHERE pronamespace='euc'::regnamespace)
    OR EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f'))
    OR EXISTS (SELECT FROM pg_proc p WHERE p.pronamespace='public'::regnamespace)
  THEN RAISE EXCEPTION 'Unexpected application views, functions or public relations'; END IF;
  EXECUTE current_setting('euc.infrastructure_query') INTO infrastructure;
  IF infrastructure IS DISTINCT FROM spec->'infrastructure' THEN
    RAISE EXCEPTION 'Unexpected infrastructure schema objects, roles or migration metadata; refusing destructive operations';
  END IF;
  IF current_setting('euc.require_empty')::boolean THEN
    FOR other_relation IN SELECT n.nspname,c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE c.relkind IN ('r','p') AND n.nspname NOT LIKE 'pg_%'
        AND n.nspname NOT IN ('information_schema','euc')
        AND (n.nspname,c.relname) NOT IN (('auth','schema_migrations'),
          ('supabase_functions','migrations'),('supabase_migrations','schema_migrations'))
    LOOP
      EXECUTE format('SELECT EXISTS (SELECT FROM %I.%I)',other_relation.nspname,other_relation.relname) INTO populated;
      IF populated THEN
        RAISE EXCEPTION 'Reset refused: infrastructure table %.% contains stored user data',other_relation.nspname,other_relation.relname;
      END IF;
    END LOOP;
  END IF;
  IF EXISTS (SELECT FROM pg_class c WHERE c.relnamespace='euc'::regnamespace
      AND (c.relowner <> 'euc_owner'::regrole OR c.relkind='r'
        AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity)))
    OR EXISTS (SELECT FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
      WHERE c.relnamespace='euc'::regnamespace)
    OR EXISTS (SELECT FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
      WHERE c.relnamespace='euc'::regnamespace AND NOT t.tgisinternal)
  THEN RAISE EXCEPTION 'Reference ownership, forced RLS, policy or trigger drift'; END IF;

  SELECT coalesce(array_agg(value ORDER BY value), ARRAY[]::text[]) INTO expected
    FROM jsonb_array_elements_text(spec->'indexes');
  SELECT coalesce(array_agg(relname::text ORDER BY relname), ARRAY[]::text[]) INTO actual
    FROM pg_class WHERE relnamespace='euc'::regnamespace AND relkind='i';
  IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Unexpected reference indexes'; END IF;
  IF EXISTS (SELECT FROM pg_type t WHERE t.typnamespace='euc'::regnamespace
    AND NOT EXISTS (SELECT FROM pg_class c JOIN pg_type rowtype ON rowtype.oid=c.reltype
      WHERE c.relnamespace='euc'::regnamespace AND t.oid IN (rowtype.oid,rowtype.typarray)))
  THEN RAISE EXCEPTION 'Unexpected application types'; END IF;

  FOREACH relation IN ARRAY ARRAY(SELECT jsonb_array_elements_text(spec->'tables')) LOOP
    SELECT array_agg(value ORDER BY value) INTO expected
      FROM jsonb_array_elements_text(spec->'columns'->relation);
    SELECT array_agg(attname::text ORDER BY attname) INTO actual FROM pg_attribute
      WHERE attrelid=format('euc.%I',relation)::regclass AND attnum>0 AND NOT attisdropped;
    IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Unexpected columns on %', relation; END IF;
    FOREACH actor IN ARRAY ARRAY['anon','authenticated','service_role','authenticator'] LOOP
      IF has_table_privilege(actor, format('euc.%I',relation),
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
        OR has_any_column_privilege(actor,format('euc.%I',relation),'SELECT,INSERT,UPDATE,REFERENCES')
      THEN RAISE EXCEPTION 'Unauthorized reference privilege: % on %', actor, relation; END IF;
    END LOOP;
    IF current_setting('euc.require_empty')::boolean THEN
      EXECUTE format('SELECT EXISTS (SELECT FROM euc.%I)',relation) INTO populated;
      IF populated THEN
        RAISE EXCEPTION 'Reset refused: reference table % contains stored rows, including possibly synthetic/user data', relation;
      END IF;
    END IF;
  END LOOP;
  SELECT array_agg(value ORDER BY value) INTO expected
    FROM jsonb_array_elements_text(spec->'versions');
  SELECT array_agg(version ORDER BY version) INTO actual FROM supabase_migrations.schema_migrations;
  IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Unexpected migration history: %',actual; END IF;
END
$baseline$;
