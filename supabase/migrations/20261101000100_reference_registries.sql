-- Reference persistence only. No application grants, policies or read adapter.
SET LOCAL ROLE euc_owner;

CREATE TABLE euc.majors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE CHECK (length(public_id) BETWEEN 1 AND 200
    AND public_id = btrim(public_id) AND public_id !~ '^[[:space:]]|[[:space:]]$'
    AND public_id !~ '[[:cntrl:]]'),
  name text NOT NULL CHECK (name ~ '[^[:space:]]'),
  abbreviation text NOT NULL CHECK (abbreviation ~ '[^[:space:]]'),
  display_order integer NOT NULL CHECK (display_order >= 0),
  is_synthetic boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE euc.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE CHECK (length(public_id) BETWEEN 1 AND 200
    AND public_id = btrim(public_id) AND public_id !~ '^[[:space:]]|[[:space:]]$'
    AND public_id !~ '[[:cntrl:]]'),
  name text NOT NULL CHECK (name ~ '[^[:space:]]'),
  display_order integer NOT NULL CHECK (display_order >= 0),
  is_synthetic boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  description text,
  classification text,
  -- NULL preserves the domain's absent hostType; explicit unknown stays distinct.
  host_type text CHECK (host_type IN ('student-organization', 'university-unit', 'unknown')),
  institution_key text CHECK (length(institution_key) BETWEEN 1 AND 200
    AND institution_key = btrim(institution_key)
    AND institution_key !~ '^[[:space:]]|[[:space:]]$|[[:cntrl:]]'),
  unit_type text CHECK (unit_type IN ('college', 'department', 'school',
    'administrative-unit', 'official-faculty-staff')),
  short_name text CHECK (short_name ~ '[^[:space:]]'),
  compact_name text CHECK (compact_name ~ '[^[:space:]]'),
  identity_source_label text,
  identity_source_url text,
  identity_source_verification text CHECK (identity_source_verification IN
    ('synthetic', 'unverified', 'verified')),
  CONSTRAINT organizations_identity_source_complete CHECK (
    (identity_source_label IS NULL AND identity_source_url IS NULL
      AND identity_source_verification IS NULL)
    OR (identity_source_label IS NOT NULL AND identity_source_label ~ '[^[:space:]]'
      AND identity_source_verification IS NOT NULL
      AND ((is_synthetic AND identity_source_verification = 'synthetic')
        OR (NOT is_synthetic AND identity_source_verification IN ('unverified', 'verified'))))
  ),
  -- A bounded HTTP(S) authority, optional port and whitespace-free path/query.
  -- User-info is deliberately unsupported for public identity provenance URLs.
  CONSTRAINT organizations_identity_source_url_valid CHECK (identity_source_url IS NULL OR (
    identity_source_url ~* '^https?://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*|\[[0-9a-f:.]+\])(:[0-9]{1,5})?([/?#][^[:space:][:cntrl:]]*)?$'
    AND coalesce(substring(identity_source_url FROM '(?i)^https?://(?:\[[^]]+\]|[^/:?#]+):([0-9]+)')::integer <= 65535, true)
    AND position('%' IN regexp_replace(identity_source_url, '%[0-9a-fA-F]{2}', '', 'g')) = 0
    AND CASE
      WHEN substring(identity_source_url FROM '(?i)^https?://(\[[^]]+\]|[^/:?#]+)') LIKE '[%'
        THEN family(btrim(substring(identity_source_url FROM '(?i)^https?://(\[[^]]+\])'), '[]')::inet) = 6
      WHEN substring(identity_source_url FROM '(?i)^https?://([^/:?#]+)') ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
        THEN family(substring(identity_source_url FROM '(?i)^https?://([^/:?#]+)')::inet) = 4
      ELSE true
    END
  )),
  CONSTRAINT organizations_id_host_type_key UNIQUE (id, host_type)
);

CREATE TABLE euc.organization_default_majors (
  organization_id uuid NOT NULL REFERENCES euc.organizations(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  major_id uuid NOT NULL REFERENCES euc.majors(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  position integer NOT NULL CHECK (position >= 0),
  PRIMARY KEY (organization_id, major_id),
  CONSTRAINT organization_default_majors_position_key UNIQUE (organization_id, position)
);
CREATE INDEX organization_default_majors_reverse_idx
  ON euc.organization_default_majors (major_id, organization_id);

CREATE TABLE euc.organization_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE CHECK (length(public_id) BETWEEN 1 AND 200
    AND public_id = btrim(public_id) AND public_id !~ '^[[:space:]]|[[:space:]]$'
    AND public_id !~ '[[:cntrl:]]'),
  name text NOT NULL CHECK (name ~ '[^[:space:]]'),
  description text NOT NULL CHECK (description ~ '[^[:space:]]'),
  display_order integer NOT NULL CHECK (display_order >= 0),
  is_synthetic boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE euc.organization_cluster_memberships (
  organization_id uuid NOT NULL,
  cluster_id uuid NOT NULL REFERENCES euc.organization_clusters(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  position integer NOT NULL CHECK (position >= 0),
  organization_host_type text GENERATED ALWAYS AS ('student-organization'::text) STORED NOT NULL,
  PRIMARY KEY (organization_id, cluster_id),
  CONSTRAINT organization_cluster_memberships_position_key UNIQUE (organization_id, position),
  CONSTRAINT organization_cluster_memberships_student_fk
    FOREIGN KEY (organization_id, organization_host_type)
    REFERENCES euc.organizations(id, host_type) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX organization_cluster_memberships_reverse_idx
  ON euc.organization_cluster_memberships (cluster_id, organization_id);

CREATE TABLE euc.organization_parents (
  organization_id uuid NOT NULL REFERENCES euc.organizations(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  parent_organization_id uuid NOT NULL REFERENCES euc.organizations(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  position integer NOT NULL CHECK (position >= 0),
  PRIMARY KEY (organization_id, parent_organization_id),
  CONSTRAINT organization_parents_position_key UNIQUE (organization_id, position),
  CONSTRAINT organization_parents_not_self CHECK (organization_id <> parent_organization_id)
);
CREATE INDEX organization_parents_reverse_idx
  ON euc.organization_parents (parent_organization_id, organization_id);

ALTER TABLE euc.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE euc.majors FORCE ROW LEVEL SECURITY;
ALTER TABLE euc.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE euc.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE euc.organization_default_majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE euc.organization_default_majors FORCE ROW LEVEL SECURITY;
ALTER TABLE euc.organization_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE euc.organization_clusters FORCE ROW LEVEL SECURITY;
ALTER TABLE euc.organization_cluster_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE euc.organization_cluster_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE euc.organization_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE euc.organization_parents FORCE ROW LEVEL SECURITY;
RESET ROLE;
