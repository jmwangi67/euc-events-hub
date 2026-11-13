-- Only the deterministic invented JSON fixture is supplied by the test wrapper.
-- Run as supabase_admin: FORCE RLS stays enabled with zero policies throughout.
DO $$ BEGIN
  IF EXISTS (SELECT FROM jsonb_array_elements(current_setting('euc.synthetic_reference')::jsonb->'organizations') org
    WHERE jsonb_array_length(coalesce(org->'networkIds','[]'::jsonb)) > 0) THEN
    RAISE EXCEPTION 'Nonempty networkIds are deferred and cannot be silently discarded';
  END IF;
END $$;
INSERT INTO euc.majors (id,public_id,name,abbreviation,display_order,is_synthetic)
SELECT ('10000000-0000-4000-8000-' || lpad(ordinality::text,12,'0'))::uuid,
  value->>'id',value->>'name',value->>'abbreviation',ordinality-1,true
FROM jsonb_array_elements(current_setting('euc.synthetic_reference')::jsonb->'majors') WITH ORDINALITY;
INSERT INTO euc.organizations (id,public_id,name,display_order,is_synthetic,
  description,classification,host_type,institution_key,unit_type,short_name,compact_name,
  identity_source_label,identity_source_url,identity_source_verification)
SELECT ('20000000-0000-4000-8000-' || lpad(ordinality::text,12,'0'))::uuid,
  value->>'id',value->>'name',ordinality-1,true,
  value->>'description',value->>'classification',value->>'hostType',value->>'institutionId',
  value->>'unitType',value->>'shortName',value->>'compactName',
  value#>>'{source,label}',value#>>'{source,url}',value#>>'{source,verification}'
FROM jsonb_array_elements(current_setting('euc.synthetic_reference')::jsonb->'organizations') WITH ORDINALITY;
INSERT INTO euc.organization_clusters (id,public_id,name,description,display_order,is_synthetic)
SELECT ('30000000-0000-4000-8000-' || lpad(ordinality::text,12,'0'))::uuid,
  value->>'id',value->>'name',value->>'description',ordinality-1,true
FROM jsonb_array_elements(current_setting('euc.synthetic_reference')::jsonb->'clusters') WITH ORDINALITY;
INSERT INTO euc.organization_default_majors (organization_id,major_id,position)
SELECT org.id,major.id,item.ordinality-1
FROM jsonb_array_elements(current_setting('euc.synthetic_reference')::jsonb->'organizations') input
JOIN euc.organizations org ON org.public_id=input->>'id',
LATERAL jsonb_array_elements_text(input->'defaultMajorIds') WITH ORDINALITY item(value,ordinality)
JOIN euc.majors major ON major.public_id=item.value;
INSERT INTO euc.organization_cluster_memberships (organization_id,cluster_id,position)
SELECT org.id,cluster.id,item.ordinality-1
FROM jsonb_array_elements(current_setting('euc.synthetic_reference')::jsonb->'organizations') input
JOIN euc.organizations org ON org.public_id=input->>'id',
LATERAL jsonb_array_elements_text(input->'clusterIds') WITH ORDINALITY item(value,ordinality)
JOIN euc.organization_clusters cluster ON cluster.public_id=item.value;
INSERT INTO euc.organization_parents (organization_id,parent_organization_id,position)
SELECT org.id,parent.id,item.ordinality-1
FROM jsonb_array_elements(current_setting('euc.synthetic_reference')::jsonb->'organizations') input
JOIN euc.organizations org ON org.public_id=input->>'id',
LATERAL jsonb_array_elements_text(input->'parentUnitIds') WITH ORDINALITY item(value,ordinality)
JOIN euc.organizations parent ON parent.public_id=item.value;
