-- Image/CLI infrastructure only; euc is checked separately against six tables.
-- No table contents or credentials are returned, apart from migration version IDs.
SELECT jsonb_build_object(
  'schema_signature',encode(sha256(convert_to(jsonb_build_object(
    'schemas',(SELECT jsonb_agg(jsonb_build_array(nspname,pg_get_userbyid(nspowner),nspacl::text) ORDER BY nspname)
      FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname NOT IN ('information_schema','euc')),
    'relations',(SELECT jsonb_agg(jsonb_build_array(n.nspname,c.relname,c.relkind,
      pg_get_userbyid(c.relowner),c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,
      CASE WHEN c.relkind IN ('v','m') THEN pg_get_viewdef(c.oid,true)
        WHEN c.relkind='i' THEN pg_get_indexdef(c.oid) ELSE NULL END,
      (SELECT jsonb_agg(jsonb_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attgenerated,
        pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
        FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
        WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped)) ORDER BY n.nspname,c.relname)
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN ('information_schema','euc')),
    'constraints',(SELECT jsonb_agg(jsonb_build_array(n.nspname,c.conname,
      c.conrelid::regclass::text,c.convalidated,pg_get_constraintdef(c.oid,true)) ORDER BY n.nspname,c.conname,c.conrelid::regclass::text)
      FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN ('information_schema','euc')),
    'functions',(SELECT jsonb_agg(jsonb_build_array(n.nspname,p.proname,
      pg_get_function_identity_arguments(p.oid),pg_get_userbyid(p.proowner),p.proacl::text,pg_get_functiondef(p.oid))
      ORDER BY n.nspname,p.proname,pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN ('information_schema','euc')),
    'types',(SELECT jsonb_agg(jsonb_build_array(n.nspname,t.typname,t.typtype,
      pg_get_userbyid(t.typowner),t.typacl::text,
      (SELECT jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid=t.oid)) ORDER BY n.nspname,t.typname)
      FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN ('information_schema','euc')),
    'policies',(SELECT jsonb_agg(jsonb_build_array(n.nspname,c.relname,p.polname,p.polcmd,p.polpermissive,
      pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid),
      (SELECT jsonb_agg(CASE WHEN role_id=0 THEN 'PUBLIC' ELSE pg_get_userbyid(role_id) END ORDER BY role_id)
        FROM unnest(p.polroles) role_id)) ORDER BY n.nspname,c.relname,p.polname)
      FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN ('information_schema','euc')),
    'event_triggers',(SELECT jsonb_agg(jsonb_build_array(evtname,evtevent,evtenabled,evtfoid::regprocedure::text,evttags)
      ORDER BY evtname) FROM pg_event_trigger),
    'roles',(SELECT jsonb_agg(jsonb_build_array(rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,
      rolcanlogin,rolreplication,rolbypassrls,rolconnlimit,rolconfig) ORDER BY rolname) FROM pg_roles),
    'memberships',(SELECT jsonb_agg(jsonb_build_array(pg_get_userbyid(roleid),pg_get_userbyid(member),
      pg_get_userbyid(grantor),admin_option,inherit_option,set_option)
      ORDER BY pg_get_userbyid(roleid),pg_get_userbyid(member),pg_get_userbyid(grantor)) FROM pg_auth_members),
    'triggers',(SELECT jsonb_agg(pg_get_triggerdef(t.oid,true) ORDER BY n.nspname,c.relname,t.tgname)
      FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE NOT t.tgisinternal AND n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN ('information_schema','euc'))
  )::text,'UTF8')),'hex'),
  'auth_migrations',(SELECT jsonb_agg(version ORDER BY version) FROM auth.schema_migrations),
  'function_migrations',(SELECT jsonb_agg(version ORDER BY version) FROM supabase_functions.migrations)
);
