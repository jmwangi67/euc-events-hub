\set ON_ERROR_STOP on
BEGIN;
-- @test-helpers@
-- @synthetic-fixtures@

-- Every root's IDs are generated independently of public identifiers in normal
-- use; the deterministic fixture overrides UUIDs only for repeatable probes.
SELECT pg_temp.check_true((SELECT count(*)=9 AND bool_and(a.attnotnull)
  FROM pg_attribute a WHERE a.attrelid IN ('euc.majors'::regclass,'euc.organizations'::regclass,
    'euc.organization_clusters'::regclass) AND a.attname IN ('id','is_synthetic','created_at')),
  'required root metadata');
SELECT pg_temp.check_true((SELECT count(*)=3 AND bool_and(NOT a.atthasdef AND a.atttypid='boolean'::regtype)
  FROM pg_attribute a WHERE a.attrelid IN ('euc.majors'::regclass,'euc.organizations'::regclass,
    'euc.organization_clusters'::regclass) AND a.attname='is_synthetic'), 'synthetic flag must be explicit');
SELECT pg_temp.check_true((SELECT count(*)=6 AND bool_and(confdeltype='r' AND confupdtype='r' AND convalidated)
  FROM pg_constraint WHERE connamespace='euc'::regnamespace AND contype='f'), 'restrictive validated foreign keys');
SELECT pg_temp.check_true((SELECT attgenerated='s' AND attnotnull FROM pg_attribute
  WHERE attrelid='euc.organization_cluster_memberships'::regclass AND attname='organization_host_type'),
  'student membership discriminator must be generated and nonnull');
INSERT INTO euc.majors (public_id,name,abbreviation,display_order,is_synthetic)
VALUES ('generated-id-probe','Invented UUID Probe','IUP',99,true);
SELECT pg_temp.check_true((SELECT id IS NOT NULL AND created_at IS NOT NULL
  FROM euc.majors WHERE public_id='generated-id-probe'), 'generated UUID/timestamptz defaults');
UPDATE euc.majors SET public_id='renamed-id-probe' WHERE public_id='generated-id-probe';
DELETE FROM euc.majors WHERE public_id='renamed-id-probe';

-- Domain-shaped JSON round-trip through actual normalized tables, preserving
-- identity provenance, optional fields and all relationship/display ordering.
CREATE FUNCTION pg_temp.check_round_trip() RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual jsonb;
BEGIN
  SELECT jsonb_build_object(
    'majors',(SELECT jsonb_agg(jsonb_build_object('id',public_id,'name',name,
      'abbreviation',abbreviation) ORDER BY display_order) FROM euc.majors),
    'clusters',(SELECT jsonb_agg(jsonb_build_object('id',public_id,'name',name,
      'description',description) ORDER BY display_order) FROM euc.organization_clusters),
    'organizations',(SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',o.public_id,'name',o.name,'description',o.description,'classification',o.classification,
      'hostType',o.host_type,'institutionId',o.institution_key,'unitType',o.unit_type,
      'shortName',o.short_name,'compactName',o.compact_name,'networkIds','[]'::jsonb,
      'defaultMajorIds',coalesce((SELECT jsonb_agg(m.public_id ORDER BY r.position)
        FROM euc.organization_default_majors r JOIN euc.majors m ON m.id=r.major_id
        WHERE r.organization_id=o.id),'[]'::jsonb),
      'clusterIds',coalesce((SELECT jsonb_agg(c.public_id ORDER BY r.position)
        FROM euc.organization_cluster_memberships r JOIN euc.organization_clusters c ON c.id=r.cluster_id
        WHERE r.organization_id=o.id),'[]'::jsonb),
      'parentUnitIds',coalesce((SELECT jsonb_agg(p.public_id ORDER BY r.position)
        FROM euc.organization_parents r JOIN euc.organizations p ON p.id=r.parent_organization_id
        WHERE r.organization_id=o.id),'[]'::jsonb),
      'source',CASE WHEN o.identity_source_label IS NULL THEN NULL ELSE jsonb_build_object(
        'label',o.identity_source_label,'url',o.identity_source_url,'verification',o.identity_source_verification) END
    )) ORDER BY o.display_order) FROM euc.organizations o)
  ) INTO actual;
  PERFORM pg_temp.check_true(actual=current_setting('euc.synthetic_reference')::jsonb,
    'normalized reference/domain round-trip mismatch');
END $$;
SELECT pg_temp.check_round_trip();
SELECT pg_temp.check_true((SELECT count(*)=2 FROM euc.majors WHERE abbreviation='IFE'),
  'major names and abbreviations need not be unique');

-- Real-identity metadata shape is tested using invented names only. This is
-- validation of metadata combinations, never a real institutional claim.
SAVEPOINT metadata;
UPDATE euc.organizations SET is_synthetic=false, identity_source_verification='verified'
  WHERE public_id='invented-guild';
UPDATE euc.organizations SET identity_source_verification='unverified'
  WHERE public_id='invented-guild';
ROLLBACK TO metadata;
DO $$ DECLARE value text; BEGIN
  FOREACH value IN ARRAY ARRAY['college','department','school','administrative-unit','official-faculty-staff'] LOOP
    UPDATE euc.organizations SET unit_type=value WHERE public_id='invented-department';
  END LOOP;
END $$;
ROLLBACK TO metadata;

SELECT pg_temp.expect_error($q$INSERT INTO euc.majors(public_id,name,abbreviation,display_order)
  VALUES ('missing-synthetic','Invented','I',0)$q$,'23502','is_synthetic');
SELECT pg_temp.expect_error($q$INSERT INTO euc.organizations(public_id,name,display_order)
  VALUES ('missing-synthetic','Invented',0)$q$,'23502','is_synthetic');
SELECT pg_temp.expect_error($q$INSERT INTO euc.organization_clusters(public_id,name,description,display_order)
  VALUES ('missing-synthetic','Invented','Invented',0)$q$,'23502','is_synthetic');
DO $$ DECLARE value text; BEGIN
  FOREACH value IN ARRAY ARRAY['',' ',' padded','padded ',E'\tidentifier',repeat('x',201)] LOOP
    PERFORM pg_temp.expect_error(format('UPDATE euc.majors SET public_id=%L WHERE public_id=''invented-flux''',value),
      '23514','public_id');
    PERFORM pg_temp.expect_error(format('UPDATE euc.organizations SET public_id=%L WHERE public_id=''invented-guild''',value),
      '23514','public_id');
    PERFORM pg_temp.expect_error(format('UPDATE euc.organization_clusters SET public_id=%L WHERE public_id=''invented-builders''',value),
      '23514','public_id');
  END LOOP;
END $$;
SELECT pg_temp.expect_error($q$UPDATE euc.majors SET name=' ' WHERE public_id='invented-flux'$q$,'23514','name');
SELECT pg_temp.expect_error($q$UPDATE euc.majors SET abbreviation=' ' WHERE public_id='invented-flux'$q$,'23514','abbreviation');
SELECT pg_temp.expect_error($q$UPDATE euc.organizations SET name=' ' WHERE public_id='invented-guild'$q$,'23514','name');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_clusters SET description=' ' WHERE public_id='invented-builders'$q$,'23514','description');
SELECT pg_temp.expect_error($q$UPDATE euc.organizations SET host_type='department' WHERE public_id='invented-unclassified'$q$,'23514','host_type');
SELECT pg_temp.expect_error($q$UPDATE euc.organizations SET unit_type='invented' WHERE public_id='invented-department'$q$,'23514','unit_type');
SELECT pg_temp.expect_error($q$UPDATE euc.organizations SET institution_key=' ' WHERE public_id='invented-department'$q$,'23514','institution_key');
DO $$ DECLARE relation text; BEGIN
  FOREACH relation IN ARRAY ARRAY['majors','organizations','organization_clusters'] LOOP
    PERFORM pg_temp.expect_error(format('UPDATE euc.%I SET display_order=-1',relation),'23514','display_order');
    PERFORM pg_temp.expect_error(format('UPDATE euc.%I SET public_id=(SELECT public_id FROM euc.%I ORDER BY display_order LIMIT 1)',relation,relation),
      '23505','public_id');
  END LOOP;
  FOREACH relation IN ARRAY ARRAY['organization_default_majors','organization_cluster_memberships','organization_parents'] LOOP
    PERFORM pg_temp.expect_error(format('UPDATE euc.%I SET position=-1',relation),'23514','position');
    PERFORM pg_temp.expect_error(format('INSERT INTO euc.%I SELECT * FROM euc.%I',relation,relation),
      CASE WHEN relation='organization_cluster_memberships' THEN '428C9' ELSE '23505' END,
      CASE WHEN relation='organization_cluster_memberships' THEN 'organization_host_type' ELSE 'pkey' END);
  END LOOP;
END $$;
SELECT pg_temp.expect_error($q$INSERT INTO euc.organization_cluster_memberships(organization_id,cluster_id,position)
  SELECT organization_id,cluster_id,position FROM euc.organization_cluster_memberships$q$,'23505','pkey');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_default_majors SET major_id='ffffffff-ffff-4fff-8fff-ffffffffffff' WHERE major_id='10000000-0000-4000-8000-000000000001'$q$,'23503','major_id');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_cluster_memberships SET cluster_id='ffffffff-ffff-4fff-8fff-ffffffffffff' WHERE position=0$q$,'23503','cluster_id');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_parents SET parent_organization_id='ffffffff-ffff-4fff-8fff-ffffffffffff' WHERE position=0$q$,'23503','parent_organization_id');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_default_majors SET organization_id='ffffffff-ffff-4fff-8fff-ffffffffffff' WHERE major_id='10000000-0000-4000-8000-000000000001'$q$,'23503','organization_id');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_cluster_memberships SET organization_id='ffffffff-ffff-4fff-8fff-ffffffffffff'$q$,'23503','student_fk');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_parents SET organization_id='ffffffff-ffff-4fff-8fff-ffffffffffff'$q$,'23503','organization_id');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_default_majors SET position=0$q$,'23505','position_key');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_cluster_memberships SET position=0$q$,'23505','position_key');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_parents SET position=0$q$,'23505','position_key');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_parents SET parent_organization_id=organization_id$q$,'23514','not_self');

SELECT pg_temp.expect_error($q$INSERT INTO euc.organization_cluster_memberships(organization_id,cluster_id,position)
  VALUES ('20000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000003',0)$q$,
  '23503','student_fk');
SELECT pg_temp.expect_error($q$INSERT INTO euc.organization_cluster_memberships(organization_id,cluster_id,position)
  VALUES ('20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000003',0)$q$,
  '23503','student_fk');
SELECT pg_temp.expect_error($q$INSERT INTO euc.organization_cluster_memberships(organization_id,cluster_id,position)
  VALUES ('20000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000003',0)$q$,
  '23503','student_fk');
DO $$ DECLARE value text; BEGIN
  FOREACH value IN ARRAY ARRAY['university-unit','unknown',NULL] LOOP
    PERFORM pg_temp.expect_error(format('UPDATE euc.organizations SET host_type=%L WHERE public_id=''invented-guild''',value),
      '23503','student_fk');
  END LOOP;
END $$;
SAVEPOINT reclassify;
DELETE FROM euc.organization_cluster_memberships WHERE organization_id='20000000-0000-4000-8000-000000000001';
UPDATE euc.organizations SET host_type='university-unit' WHERE public_id='invented-guild';
ROLLBACK TO reclassify;
SELECT pg_temp.expect_error($q$DELETE FROM euc.majors WHERE public_id='invented-flux'$q$,'23503','foreign key');
SELECT pg_temp.expect_error($q$DELETE FROM euc.organizations WHERE public_id='invented-school'$q$,'23503','foreign key');
SELECT pg_temp.expect_error($q$DELETE FROM euc.organization_clusters WHERE public_id='invented-builders'$q$,'23503','foreign key');
SELECT pg_temp.expect_error($q$UPDATE euc.organizations SET id=gen_random_uuid() WHERE public_id='invented-guild'$q$,'23503','foreign key');
SELECT pg_temp.expect_error($q$UPDATE euc.majors SET id=gen_random_uuid() WHERE public_id='invented-flux'$q$,'23503','foreign key');
SELECT pg_temp.expect_error($q$UPDATE euc.organization_clusters SET id=gen_random_uuid() WHERE public_id='invented-builders'$q$,'23503','foreign key');

-- Explicitly exercise the partial-source NULL combinations that CHECK alone
-- can accidentally accept when its expression evaluates to SQL NULL.
DO $$ DECLARE statement text; BEGIN
  FOREACH statement IN ARRAY ARRAY[
    'identity_source_label=NULL',
    'identity_source_verification=NULL',
    'identity_source_label=NULL,identity_source_verification=NULL',
    'identity_source_label='' ''',
    'identity_source_verification=''verified''',
    'identity_source_verification=''unverified''',
    'identity_source_verification=''other''',
    'is_synthetic=false'
  ] LOOP
    PERFORM pg_temp.expect_error('UPDATE euc.organizations SET '||statement||' WHERE public_id=''invented-guild''',
      '23514','identity_source');
  END LOOP;
END $$;
SELECT pg_temp.expect_error($q$UPDATE euc.organizations SET identity_source_url='https://example.invalid'
  WHERE public_id='invented-unclassified'$q$,'23514','identity_source');
DO $$ DECLARE value text; BEGIN
  FOREACH value IN ARRAY ARRAY['ftp://example.invalid','javascript:alert(1)','https://','https://bad host.invalid',
    'https://example.invalid:bad','https://example.invalid:65536','https://-bad.invalid','https://example.invalid/%zz',
    'https://user:password@example.invalid'] LOOP
    PERFORM pg_temp.expect_error(format('UPDATE euc.organizations SET identity_source_url=%L WHERE public_id=''invented-guild''',value),
      '23514','identity_source_url');
  END LOOP;
  FOREACH value IN ARRAY ARRAY['http://[::1]:8080/path','https://127.0.0.1:443/a%20b','https://example.invalid/path?q=1#fragment'] LOOP
    UPDATE euc.organizations SET identity_source_url=value WHERE public_id='invented-guild';
  END LOOP;
END $$;
ROLLBACK TO reclassify;
SELECT pg_temp.check_round_trip();
SELECT pg_temp.expect_error($q$UPDATE euc.organizations SET identity_source_url='https://999.999.999.999'
  WHERE public_id='invented-guild'$q$,'22P02','inet');
SELECT pg_temp.expect_error($q$UPDATE euc.organizations SET identity_source_url='https://[::::]'
  WHERE public_id='invented-guild'$q$,'22P02','inet');

-- Reset guard tests use the exact read-only SQL the wrapper runs before reset.
-- No actual reset occurs while any probe or stored data exists.
SET LOCAL euc.require_empty = true;
SAVEPOINT infrastructure_data;
INSERT INTO auth.users(id) VALUES('50000000-0000-4000-8000-000000000001');
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','auth.users contains stored user data');
ROLLBACK TO infrastructure_data;
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','contains stored rows');
SAVEPOINT nonsynthetic;
UPDATE euc.majors SET is_synthetic=false;
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','contains stored rows');
ROLLBACK TO nonsynthetic;
SET LOCAL euc.require_empty = false;
SAVEPOINT drift;
CREATE SCHEMA __unexpected;
CREATE TABLE __unexpected.user_data(id integer);
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unexpected infrastructure schema');
ROLLBACK TO drift;
CREATE ROLE euc_unexpected_probe NOLOGIN;
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unexpected infrastructure schema');
ROLLBACK TO drift;
INSERT INTO auth.schema_migrations(version) VALUES('99999999999999');
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unexpected infrastructure schema');
ROLLBACK TO drift;
CREATE TABLE euc.__unexpected(id integer);
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unexpected reference tables');
ROLLBACK TO drift;
CREATE VIEW euc.__unexpected AS SELECT 1 AS id;
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unexpected application views');
ROLLBACK TO drift;
CREATE FUNCTION euc.__unexpected() RETURNS integer LANGUAGE sql AS 'SELECT 1';
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unexpected application views');
ROLLBACK TO drift;
CREATE FUNCTION public.__unexpected() RETURNS integer LANGUAGE sql AS 'SELECT 1';
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unexpected application views');
ROLLBACK TO drift;
ALTER TABLE euc.majors ADD COLUMN __unexpected text;
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unexpected columns');
ROLLBACK TO drift;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('99999999999999');
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unexpected migration history');
ROLLBACK TO drift;
GRANT SELECT ON euc.majors TO service_role;
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','Unauthorized reference privilege');
ROLLBACK TO drift;
ALTER TABLE euc.majors NO FORCE ROW LEVEL SECURITY;
SELECT pg_temp.expect_error(current_setting('euc.baseline_assertion'),'P0001','forced RLS');
ROLLBACK TO drift;

-- Independent RLS against all six real tables, with ordinary DML grants present.
CREATE ROLE euc_reference_rls_probe NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB;
GRANT USAGE ON SCHEMA euc TO euc_reference_rls_probe;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA euc TO euc_reference_rls_probe;
SELECT pg_temp.check_true(NOT pg_has_role('euc_reference_rls_probe','euc_owner','MEMBER')
  AND (SELECT NOT rolsuper AND NOT rolbypassrls FROM pg_roles WHERE rolname='euc_reference_rls_probe'),
  'nonowner nonbypass actor');
DO $$ DECLARE relation text; privilege text; BEGIN
  FOREACH relation IN ARRAY ARRAY(SELECT jsonb_array_elements_text(current_setting('euc.reference_manifest')::jsonb->'tables')) LOOP
    FOREACH privilege IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
      PERFORM pg_temp.check_true(has_table_privilege('euc_reference_rls_probe',format('euc.%I',relation),privilege),
        'independent DML grant missing');
    END LOOP;
  END LOOP;
END $$;
SET SESSION AUTHORIZATION euc_reference_rls_probe;
DO $$ DECLARE relation text; affected bigint; statement text; detail text; BEGIN
  FOREACH relation IN ARRAY ARRAY(SELECT jsonb_array_elements_text(current_setting('euc.reference_manifest')::jsonb->'tables')) LOOP
    EXECUTE format('SELECT count(*) FROM euc.%I',relation) INTO affected;
    IF affected<>0 THEN RAISE EXCEPTION 'RLS SELECT leaked %',relation; END IF;
    EXECUTE format('UPDATE euc.%I SET %I=%I',relation,
      CASE WHEN relation IN ('majors','organizations','organization_clusters') THEN 'name' ELSE 'position' END,
      CASE WHEN relation IN ('majors','organizations','organization_clusters') THEN 'name' ELSE 'position' END);
    GET DIAGNOSTICS affected=ROW_COUNT;
    IF affected<>0 THEN RAISE EXCEPTION 'RLS UPDATE modified %',relation; END IF;
    EXECUTE format('DELETE FROM euc.%I',relation);
    GET DIAGNOSTICS affected=ROW_COUNT;
    IF affected<>0 THEN RAISE EXCEPTION 'RLS DELETE modified %',relation; END IF;
  END LOOP;
  FOREACH statement IN ARRAY ARRAY[
    $i$INSERT INTO euc.majors(public_id,name,abbreviation,display_order,is_synthetic) VALUES('forbidden','Invented','I',9,true)$i$,
    $i$INSERT INTO euc.organizations(public_id,name,display_order,is_synthetic) VALUES('forbidden','Invented',9,true)$i$,
    $i$INSERT INTO euc.organization_clusters(public_id,name,description,display_order,is_synthetic) VALUES('forbidden','Invented','Invented',9,true)$i$,
    $i$INSERT INTO euc.organization_default_majors VALUES('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003',9)$i$,
    $i$INSERT INTO euc.organization_cluster_memberships(organization_id,cluster_id,position) VALUES('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000003',9)$i$,
    $i$INSERT INTO euc.organization_parents VALUES('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003',9)$i$
  ] LOOP
    BEGIN
      EXECUTE statement;
      RAISE EXCEPTION 'RLS INSERT succeeded';
    EXCEPTION WHEN insufficient_privilege THEN
      GET STACKED DIAGNOSTICS detail=MESSAGE_TEXT;
      IF position('row-level security' IN detail)=0 THEN RAISE EXCEPTION 'Not an RLS denial: %',detail; END IF;
    END;
  END LOOP;
END $$;
RESET SESSION AUTHORIZATION;
SELECT pg_temp.check_round_trip();
ROLLBACK;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='euc_reference_rls_probe') THEN
    RAISE EXCEPTION 'Reference RLS actor was not rolled back';
  END IF;
END $$;
\echo PASS: normalized synthetic/domain round-trip, constraints, provenance, guarded reset refusals and independent six-table RLS; all fixtures/probes rolled back
