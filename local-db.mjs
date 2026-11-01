import { spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statfsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const project = "euc-events-hub-b2a";
const network = "euc-b2a-local";
const database = `supabase_db_${project}`;
const serviceNames = [
  database,
  `supabase_rest_${project}`,
  `supabase_kong_${project}`,
];
const ports = [54320, 54321, 54322, 54323, 54324, 54329];
const host =
  process.platform === "win32"
    ? "npipe:////./pipe/dockerDesktopLinuxEngine"
    : "unix:///var/run/docker.sock";
const loopback = (address) => ["127.0.0.1", "::1"].includes(address);

export function parseOperation(args) {
  const [operation, mode, disposable, ...extra] = args;
  const destructive = ["reset", "verify"].includes(operation);
  if (
    mode !== "--local" ||
    extra.length ||
    (destructive ? disposable !== "--disposable" : disposable !== undefined) ||
    ![
      "preflight",
      "start",
      "reset",
      "test",
      "migrate",
      "api-start",
      "api-test",
      "verify",
      "stop",
    ].includes(operation)
  ) {
    throw new Error(
      "Use node local-db.mjs <operation> --local; reset/verify also require --disposable. URLs and other flags are forbidden.",
    );
  }
  return operation;
}

export function localEnvironment(source) {
  // No inherited PG*, DB URLs, Supabase credentials, Docker contexts, proxy
  // settings, NODE_OPTIONS, or CLI binary overrides reach child processes.
  const allowed =
    /^(PATH|SystemRoot|SystemDrive|WINDIR|TEMP|TMP|ProgramData|PATHEXT)$/i;
  return {
    ...Object.fromEntries(
      Object.entries(source).filter(([key]) => allowed.test(key)),
    ),
    SUPABASE_HOME: join(root, "work", "supabase-home"),
    HOME: join(root, "work", "supabase-home"),
    USERPROFILE: join(root, "work", "supabase-home"),
    APPDATA: join(root, "work", "supabase-home"),
    LOCALAPPDATA: join(root, "work", "supabase-home"),
    SUPABASE_TELEMETRY_DISABLED: "true",
    DOCKER_CONFIG: join(root, "work", "docker-config"),
    DOCKER_HOST: host,
  };
}
const env = localEnvironment(process.env);

export function validateBindings(container, requiredPort) {
  if (!container.State.Running)
    throw new Error("Service is stopped; networking is unverified.");
  const bindings = container.NetworkSettings.Ports;
  if (requiredPort && !bindings[requiredPort]?.length)
    throw new Error("Required published mapping missing.");
  for (const values of Object.values(bindings)) {
    for (const binding of values ?? []) {
      if (
        !loopback(binding.HostIp) ||
        !ports.includes(Number(binding.HostPort))
      ) {
        throw new Error(
          `Unsafe Docker binding: ${binding.HostIp}:${binding.HostPort}`,
        );
      }
    }
  }
  if (container.State.Health && container.State.Health.Status !== "healthy") {
    throw new Error(`Service health is ${container.State.Health.Status}.`);
  }
}

export function validateListeners(listeners, mappings) {
  for (const listener of listeners) {
    if (!loopback(listener.LocalAddress))
      throw new Error(
        `Unsafe host listener: ${listener.LocalAddress}:${listener.LocalPort}`,
      );
  }
  for (const binding of mappings) {
    if (
      !listeners.some(
        (entry) =>
          entry.LocalPort === Number(binding.HostPort) &&
          entry.LocalAddress === binding.HostIp,
      )
    ) {
      throw new Error(
        `Docker/host listener disagreement: ${binding.HostIp}:${binding.HostPort}`,
      );
    }
  }
}

function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd: root,
    env,
    encoding: "utf8",
    timeout: 600_000,
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `${executable} failed (${result.status}): ${result.stderr || result.stdout}`,
    );
  return result.stdout.trim();
}
const docker = (...args) => run("docker", ["--host", host, ...args]);
const cli = (...args) =>
  run(process.execPath, [
    join(root, "node_modules/supabase/dist/supabase.js"),
    ...args,
    "--workdir",
    root,
    "--network-id",
    network,
  ]);
const sql = (input, user = "supabase_admin") => dockerSql(input, user);
function dockerSql(input, user) {
  return run(
    "docker",
    [
      "--host",
      host,
      "exec",
      "-i",
      database,
      "psql",
      "-X",
      "-q",
      "-A",
      "-t",
      "-U",
      user,
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input },
  );
}

function ownedContainers() {
  const ids = docker(
    "ps",
    "-aq",
    "--filter",
    `label=com.supabase.cli.project=${project}`,
  )
    .split(/\s+/)
    .filter(Boolean);
  return ids.length ? JSON.parse(docker("inspect", ...ids)) : [];
}
function identity(container) {
  if (
    !serviceNames.includes(container.Name.slice(1)) ||
    container.Config.Labels?.["com.supabase.cli.project"] !== project ||
    Object.keys(container.NetworkSettings.Networks).join() !== network
  ) {
    throw new Error("Unexpected B2a service identity or network.");
  }
}
function stopOwned() {
  // Stop only our named AND labeled containers. Never remove volumes here.
  for (const container of ownedContainers()) {
    if (
      !container.Name.startsWith("/supabase_") ||
      !container.Name.endsWith(`_${project}`)
    )
      throw new Error(`Unknown project container: ${container.Name}`);
    if (container.State.Running) docker("stop", container.Id);
  }
}
function ensureNetwork(create) {
  const names = docker("network", "ls", "--format", "{{.Name}}").split("\n");
  if (!names.includes(network)) {
    if (!create) throw new Error("B2a local network is missing.");
    docker(
      "network",
      "create",
      "--driver",
      "bridge",
      "--label",
      `euc.local-project=${project}`,
      "--opt",
      "com.docker.network.bridge.host_binding_ipv4=127.0.0.1",
      network,
    );
  }
  const [details] = JSON.parse(docker("network", "inspect", network));
  if (
    details.Driver !== "bridge" ||
    details.Labels?.["euc.local-project"] !== project ||
    details.Options?.["com.docker.network.bridge.host_binding_ipv4"] !==
      "127.0.0.1"
  ) {
    throw new Error("Unexpected network identity or default port binding.");
  }
}
function hostListeners() {
  if (process.platform === "win32") {
    const systemRoot = Object.entries(env).find(
      ([key]) => key.toLowerCase() === "systemroot",
    )?.[1];
    const command = `$ports = @(${ports.join(",")}); $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $ports -contains $_.LocalPort } | Select-Object LocalAddress,LocalPort,OwningProcess); ConvertTo-Json -InputObject $listeners -Compress`;
    return JSON.parse(
      run(join(systemRoot, "System32/WindowsPowerShell/v1.0/powershell.exe"), [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        command,
      ]),
    );
  }
  if (process.platform !== "linux")
    throw new Error(
      "Host listener verification supports Windows and Linux only.",
    );
  return run("ss", ["-H", "-ltn"])
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const local = line.trim().split(/\s+/)[3];
      const split = local.lastIndexOf(":");
      return {
        LocalAddress: local.slice(0, split).replace(/^\[|\]$/g, ""),
        LocalPort: Number(local.slice(split + 1)),
      };
    })
    .filter((entry) => ports.includes(entry.LocalPort));
}
function checkServices(api = false) {
  ensureNetwork(false);
  const containers = ownedContainers();
  const required = api ? serviceNames : [database];
  for (const name of required) {
    if (!containers.some((item) => item.Name === `/${name}`))
      throw new Error(`Missing service: ${name}`);
  }
  const mappings = [];
  for (const container of containers) {
    identity(container);
    console.log(
      "Docker service:",
      JSON.stringify({
        name: container.Name,
        image: container.Config.Image,
        id: container.Image,
        state: container.State.Status,
        health: container.State.Health?.Status,
        ports: container.NetworkSettings.Ports,
      }),
    );
    validateBindings(
      container,
      container.Name === `/${database}`
        ? "5432/tcp"
        : container.Name.includes("_kong_")
          ? "8000/tcp"
          : undefined,
    );
    mappings.push(
      ...Object.values(container.NetworkSettings.Ports).flatMap(
        (values) => values ?? [],
      ),
    );
  }
  const listeners = hostListeners();
  console.log(`${process.platform} listeners:`, JSON.stringify(listeners));
  validateListeners(listeners, mappings);
  const version = sql("SELECT current_setting('server_version');");
  if (!version.startsWith("17."))
    throw new Error(`Unexpected PostgreSQL version: ${version}`);
  console.log(`PostgreSQL ${version}: socket query healthy`);
  return containers;
}
function preflight() {
  const info = JSON.parse(docker("info", "--format", "{{json .}}"));
  const disk = statfsSync(root);
  const free = disk.bavail * disk.bsize;
  if (
    info.OSType !== "linux" ||
    free < 20 * 1024 ** 3 ||
    info.MemTotal < 4 * 1024 ** 3
  ) {
    throw new Error(
      "Linux Docker, at least 20 GiB host free disk and 4 GiB Docker memory capacity required before image download.",
    );
  }
  console.log(
    JSON.stringify({
      docker: info.ServerVersion,
      driver: info.Driver,
      dockerMemoryGiB: info.MemTotal / 1024 ** 3,
      hostFreeGiB: free / 1024 ** 3,
    }),
  );
  console.log(docker("system", "df"));
}
function start() {
  preflight();
  ensureNetwork(true);
  for (const container of ownedContainers()) {
    identity(container);
    // db start returns early on stopped containers. Retain all named volumes.
    if (!container.State.Running) docker("rm", container.Id);
  }
  cli("db", "start");
  checkServices();
}
async function reset() {
  preflight();
  const containers = checkServices();
  const db = containers.find((item) => item.Name === `/${database}`);
  const mount = db.Mounts.find(
    (item) => item.Destination === "/var/lib/postgresql/data",
  );
  if (mount?.Type !== "volume" || mount.Name !== database)
    throw new Error("Unexpected reset data volume.");
  const [volume] = JSON.parse(docker("volume", "inspect", mount.Name));
  if (volume.Labels?.["com.supabase.cli.project"] !== project)
    throw new Error("Unexpected volume project label.");
  const count = sql(
    "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','euc') AND c.relkind IN ('r','p','v','m','S','f');",
  );
  if (count !== "0")
    throw new Error(
      "Reset refused: public/euc contains application objects. B2a resets are only for empty disposable foundations.",
    );
  console.log(
    `Verified disposable reset target: ${volume.Name}; application relations=0`,
  );
  cli("db", "reset", "--local", "--no-seed", "--yes");
  const hasApi = containers.some((item) => item.Name.includes("_kong_"));
  checkServices(hasApi);
  if (hasApi) await apiTest();
  console.log(
    "PASS: fresh local reset, roles.sql bootstrap and versioned migrations",
  );
}
function securityTest() {
  checkServices();
  console.log(
    sql(readFileSync(join(root, "supabase/tests/security.sql"), "utf8")),
  );
  sql(
    `BEGIN;\n${readFileSync(join(root, "supabase/roles.sql"), "utf8")}\nROLLBACK;`,
    "postgres",
  );
  console.log("PASS: bootstrap can be rerun without changing security state");
}
function migrate() {
  checkServices();
  const before = sql(
    "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;",
  );
  cli("migration", "up", "--local");
  checkServices();
  const after = sql(
    "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;",
  );
  console.log("Migration history:", JSON.stringify({ before, after }));
}
function startApi() {
  preflight();
  checkServices();
  // The CLI full-start path needs a fresh container set, reusing the same data.
  for (const container of ownedContainers()) {
    identity(container);
    if (container.State.Running) docker("stop", container.Id);
    docker("rm", container.Id);
  }
  cli(
    "start",
    "--exclude",
    "gotrue,realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor",
  );
  checkServices(true);
}
async function apiTest() {
  const containers = checkServices(true);
  // Keys stay in memory and are sent only to the fixed loopback gateway.
  // CLI 2.122.0 omits status credentials when Auth is disabled. Read only the
  // running local gateway/verifier configuration; do not enable Auth to test it.
  const rest = containers.find((item) => item.Name.includes("_rest_"));
  const secret = rest.Config.Env.find((entry) =>
    entry.startsWith("PGRST_JWT_SECRET="),
  )?.slice("PGRST_JWT_SECRET=".length);
  const kong = containers.find((item) => item.Name.includes("_kong_"));
  const configPath = kong.Config.Env.find((entry) =>
    entry.startsWith("KONG_DECLARATIVE_CONFIG="),
  )?.split("=")[1];
  if (!configPath?.startsWith("/home/kong/") || !secret)
    throw new Error(
      "Local API test credentials unavailable; required tests cannot run.",
    );
  const gatewayConfig = docker("exec", kong.Id, "cat", configPath);
  const tokens =
    gatewayConfig.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ??
    [];
  const tokenFor = (role) =>
    tokens.find(
      (token) =>
        JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
          .role === role,
    );
  const anon = tokenFor("anon");
  const service = tokenFor("service_role");
  const signingKey = JSON.parse(secret).keys.find(
    (key) => key.kty === "oct",
  )?.k;
  if (!anon || !service || !signingKey)
    throw new Error(
      "Expected local gateway tokens and HMAC verifier key are missing.",
    );
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ role: "authenticated", iss: "supabase", exp: Math.floor(Date.now() / 1000) + 300 })}`;
  const authenticated = `${unsigned}.${createHmac("sha256", Buffer.from(signingKey, "base64url")).update(unsigned).digest("base64url")}`;
  for (const [actor, token, key] of [
    ["anon", anon, anon],
    ["authenticated", authenticated, anon],
    ["service_role", service, service],
  ]) {
    // Each request opens a fresh connection; resets restart the gateway, so
    // reusing an earlier HTTP keep-alive socket can fail before reaching it.
    const headers = {
      apikey: key,
      Authorization: `Bearer ${token}`,
      Connection: "close",
    };
    const request = (path, options = {}) =>
      fetch(`http://127.0.0.1:54321/rest/v1/${path}`, {
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
        ...options,
        headers: { ...headers, ...options.headers },
      });
    const control = await request("");
    if (control.status !== 200)
      throw new Error(
        `${actor}: API health/credential positive control failed (${control.status}).`,
      );
    const schema = await control.json();
    if (JSON.stringify(schema).includes("euc."))
      throw new Error("Private schema found in API discovery.");
    const invalid = await request("", {
      headers: {
        Authorization: `Bearer ${token.slice(0, token.lastIndexOf(".") + 1)}invalid`,
      },
    });
    const invalidBody = await invalid.json();
    if (invalid.status !== 401 || invalidBody.code !== "PGRST301") {
      throw new Error(
        `${actor}: invalid bearer was not rejected by PostgREST; actor verification is unreliable.`,
      );
    }
    for (const method of ["GET", "POST"]) {
      const response = await request("__b2a_probe", {
        method,
        headers: {
          [method === "GET" ? "Accept-Profile" : "Content-Profile"]: "euc",
          "Content-Type": "application/json",
        },
        ...(method === "POST" ? { body: "{}" } : {}),
      });
      const body = await response.json();
      if (response.status !== 406 || body.code !== "PGRST106")
        throw new Error(
          `${actor} ${method}: expected schema exclusion (406/PGRST106), got ${response.status}/${body.code}.`,
        );
    }
    console.log(
      `PASS: ${actor} API positive control=200; invalid bearer=401/PGRST301; private GET/POST=406/PGRST106`,
    );
  }
}
async function main() {
  const operation = parseOperation(process.argv.slice(2));
  for (const path of [
    "supabase/.temp/project-ref",
    ".env",
    ".env.local",
    "supabase/.env",
    "supabase/.env.local",
  ]) {
    if (existsSync(join(root, path)))
      throw new Error(`Refusing linked project or dotenv file: ${path}`);
  }
  const config = readFileSync(join(root, "supabase/config.toml"), "utf8");
  if (
    !config.includes(`project_id = "${project}"`) ||
    config.includes("env(") ||
    !config.includes('schemas = ["public"]') ||
    !config.includes('extra_search_path = ["public", "extensions"]')
  )
    throw new Error("Unexpected local project configuration.");
  mkdirSync(env.SUPABASE_HOME, { recursive: true });
  mkdirSync(env.DOCKER_CONFIG, { recursive: true });
  if (cli("--version") !== "2.122.0")
    throw new Error("Supabase CLI must be exactly 2.122.0.");
  try {
    switch (operation) {
      case "preflight":
        preflight();
        break;
      case "start":
        start();
        break;
      case "reset":
        await reset();
        break;
      case "test":
        securityTest();
        break;
      case "migrate":
        migrate();
        break;
      case "api-start":
        startApi();
        await apiTest();
        break;
      case "api-test":
        await apiTest();
        break;
      case "stop":
        stopOwned();
        console.log("B2a services stopped; named volumes retained.");
        break;
      case "verify":
        try {
          start();
          await reset();
          securityTest(); // Fresh bootstrap/migration baseline.
          startApi();
          await apiTest();
          for (let iteration = 1; iteration <= 2; iteration++) {
            await reset();
            securityTest();
            console.log(`PASS: consecutive reset ${iteration}/2`);
          }
          migrate();
          securityTest();
          await apiTest();
          const images = [
            ...new Set(ownedContainers().map((item) => item.Image)),
          ];
          console.log(
            "Verified images:",
            JSON.stringify(
              JSON.parse(docker("image", "inspect", ...images)).map((item) => ({
                id: item.Id,
                digests: item.RepoDigests,
              })),
            ),
          );
        } finally {
          stopOwned();
        }
        break;
    }
  } catch (error) {
    stopOwned();
    throw error;
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
