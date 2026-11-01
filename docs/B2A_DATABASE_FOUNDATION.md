# B2a: closed local PostgreSQL foundation

The application still uses the B1 fixture provider. PostgreSQL is optional for
running the student calendar, planner, public endpoints and private exam preview.
B2a creates no application tables, public functions, views, access policies or
application credentials. The six reference tables remain B2b work.

## Runtime and local commands

Use the locked npm installation (`npm ci`), Docker Linux containers and
Supabase CLI **2.122.0**. The stable Docker workflow uses PostgreSQL 17; the tested
image reports **17.11**. Do not use a global CLI, experimental stack mode,
`supabase link`, hosted credentials, remote URLs or direct reset commands.

```sh
npm run db:preflight -- --local
npm run db:start -- --local
npm run db:test -- --local
npm run db:migrate -- --local
npm run db:api-start -- --local
npm run db:api-test -- --local
npm run db:stop -- --local

# Destructive: only an empty, disposable B2a foundation is accepted.
npm run db:reset -- --local --disposable
npm run db:verify -- --local --disposable
```

`verify` performs a fresh reset/bootstrap/migration, security tests, two more
consecutive resets with repeated tests, incremental migration replay, and API
denial tests. It stops task services in a `finally` path, retaining the named data
volume. Failures also stop task-owned services. A reset requires the exact
project-labeled volume and zero application relations in `public` and `euc`.
Inspect and preserve any later application data separately; this B2a reset
restriction must be revisited deliberately when B2b adds tables.

The wrapper fixes the Docker endpoint to the local Windows named pipe or Linux
Unix socket. It accepts only enumerated operations and explicit local flags. It
rejects linked project markers and dotenv files, strips inherited credentials,
proxies and executable overrides, and uses isolated home/Docker configuration
directories under ignored `work/`. SQL runs through `docker exec` and a Unix
socket inside the verified container. No database URL is accepted. API requests
use a fixed loopback URL, timeouts and refused redirects.

Before image downloads, the wrapper requires Linux containers, at least 20 GiB
free host filesystem space and 4 GiB Docker memory capacity. These checks cannot
guarantee space inside every Docker VM configuration; image extraction failures
are fatal. Nothing prunes unrelated Docker resources.

## Networking is a prerequisite

The bridge `euc-b2a-local` must carry the project label and
`com.docker.network.bridge.host_binding_ipv4=127.0.0.1`. Windows Docker Desktop
must use strict **Localhost only** port binding. The weaker default and the
bridge option alone previously produced wildcard mappings on this machine.

After startup, recreation and reset, the wrapper checks container identity,
running state, effective published mappings, live IPv4/IPv6 host listeners and
health. Only `127.0.0.1` and `::1` are accepted. Missing mappings, wildcard/LAN
bindings, Docker/host disagreement and unhealthy services fail closed. Windows
uses `Get-NetTCPConnection`; Linux uses `ss -H -ltn`. Linux CI uses the project
bridge default and verifies its actual effect; it does not edit the global
daemon or substitute firewall rules for binding restrictions. A Linux host
without observable matching listeners is unsupported until investigated.

Only PostgreSQL (54322), Kong (54321) and internal PostgREST run. PostgREST has no
published port. Auth, Realtime, Studio, Storage, mail, analytics and edge runtime
remain disabled. API positive controls verify PostgREST readiness in addition to
Docker's database and gateway health checks. API-enabled resets repeat API tests.

## Ownership and bootstrap order

The pinned CLI executes `supabase/roles.sql` before versioned migrations on a
fresh database/reset. The migration deliberately fails if `euc_owner` is absent.
The bootstrap rejects existing role/membership drift instead of repairing it
silently.

`euc_owner` is NOLOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE,
NOREPLICATION and NOBYPASSRLS. Only trusted infrastructure `postgres` is a member.
PostgreSQL 17 records two grants to that same member: the creator's automatic
ADMIN grant from `supabase_admin` (INHERIT false, SET false), and the explicit SET
grant from `postgres` (ADMIN false, INHERIT false). Tests assert both records and
reject any additional membership or role inherited by `euc_owner`.

The schema is owned by `euc_owner`. PUBLIC, anon, authenticated, service_role and
authenticator have no schema access. Creator-specific defaults close tables,
sequences, functions, types and schemas. Function EXECUTE and type USAGE defaults
are revoked globally for this creator because schema-specific revocations cannot
cancel PostgreSQL's built-in PUBLIC defaults. Supabase's unrelated infrastructure
defaults are not changed.

Future B2b migrations must explicitly `SET LOCAL ROLE euc_owner` before creating
application objects, enable and force RLS on each table, and add only separately
approved policies. Role membership does not inherit another creator's defaults.
Trusted `postgres` has CREATEROLE and BYPASSRLS; `supabase_admin` is a superuser.
These local infrastructure principals are outside the application security
boundary. `service_role` also has BYPASSRLS, making ordinary ACL denial essential.

## Executable evidence

`supabase/tests/security.sql` runs real SQL inside a transaction and rolls back:

- Role attributes, exact memberships, schema/object/type/function ownership,
  absence of SECURITY DEFINER functions and policies, and publication exclusion.
- Deliberate role, schema-owner, object-owner, membership and default-privilege
  drift, proving the assertions reject each mutation.
- Actual anon/authenticated/service-role schema and object access denials,
  forbidden schema/object creation, and owner-membership escalation rejection.
  SESSION AUTHORIZATION replaces the original actor; SET ROLE alone would leave
  the privileged session able to assume the owner and invalidate the test.
- Future table, sequence, function, type and schema defaults. Object operations
  are also denied after temporarily granting schema USAGE, isolating ACL denial.
- Independent forced RLS with zero policies: a nonowner, non-BYPASSRLS temporary
  actor has verified DML privileges; SELECT returns zero rows, INSERT fails with
  SQLSTATE 42501 and an RLS message, UPDATE/DELETE affect zero rows, and the
  protected synthetic row remains unchanged. All grants and the actor roll back.

API tests require a successful HTTP 200 control for anon, authenticated and
service_role, plus rejection of a corrupted bearer token (`401 / PGRST301`),
before accepting GET/POST private-schema rejections
(`406 / PGRST106`). `euc` is absent from both exposed schemas and extra search
paths. The CLI omits status credentials when Auth is disabled, so tests read
only the local gateway/verifier configuration in memory and mint a short-lived
synthetic authenticated token. No keys are logged, written to files or added to
application environment variables. These tests do not implement user login.

`npm run test:db:guard` checks rejected command modes, credential stripping,
stopped/unmapped/unhealthy containers, wildcard bindings and listener disagreement.
The dedicated `Database foundation` workflow runs these tests and the full real
database verification using pinned actions, Node and the npm lockfile, read-only
repository permissions and no production secrets. Required tests do not skip.

## Image reproducibility and limitations

The CLI version and npm integrity are pinned. Supabase selects versioned image
tags; the verification output records actual image IDs and repository digests.
This does **not** enforce immutable digests. A changed image or runtime can affect
bootstrap, networking or API behavior; rerun the full checks on upgrades. Public
image/package downloads are required, but hosted Supabase is not used.

The wrapper is a local operator guard, not a sandbox against someone with Docker
or administrator access. Development services must remain loopback-only even
though their data is synthetic. No production deployment is authorized by B2a.

## References

- [Pinned CLI bootstrap](https://github.com/supabase/cli/blob/v2.122.0/apps/cli-go/internal/db/start/start.go)
- [Pinned CLI local reset](https://github.com/supabase/cli/blob/v2.122.0/apps/cli-go/internal/db/reset/reset.go)
- [Pinned CLI status credential gating](https://github.com/supabase/cli/blob/v2.122.0/apps/cli-go/internal/status/status.go)
- [PostgreSQL 17 default privileges](https://www.postgresql.org/docs/17/sql-alterdefaultprivileges.html)
- [PostgreSQL 17 row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)
