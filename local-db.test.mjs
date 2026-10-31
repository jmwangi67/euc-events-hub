import assert from "node:assert/strict";
import test from "node:test";
import {
  localEnvironment,
  parseOperation,
  validateBindings,
  validateListeners,
} from "./local-db.mjs";

test("local commands reject URLs, linked targets and implicit destructive modes", () => {
  assert.equal(parseOperation(["verify", "--local", "--disposable"]), "verify");
  for (const args of [
    ["reset"],
    ["reset", "--local"],
    ["reset", "--linked"],
    ["migrate", "--local", "--db-url", "postgres://remote"],
    ["start", "--local", "--network-id", "other"],
  ]) {
    assert.throws(() => parseOperation(args));
  }
});
test("subprocess environment drops credentials, contexts and executable overrides", () => {
  const source = {
    PATH: "local-path",
    PGHOST: "remote",
    DATABASE_URL: "secret",
    SUPABASE_ACCESS_TOKEN: "secret",
    DOCKER_CONTEXT: "remote",
    DOCKER_HOST: "tcp://remote:2375",
    NODE_OPTIONS: "--require=other",
    SUPABASE_CLI_BINARY_OVERRIDE: "other",
    HTTPS_PROXY: "remote",
  };
  const env = localEnvironment(source);
  assert.equal(env.PATH, "local-path");
  for (const key of Object.keys(source).filter(
    (key) => !["PATH", "DOCKER_HOST"].includes(key),
  ))
    assert.equal(env[key], undefined);
  assert.match(env.DOCKER_HOST, /^(npipe:|unix:)/);
});
function container(ip = "127.0.0.1") {
  return {
    State: { Running: true, Health: { Status: "healthy" } },
    NetworkSettings: {
      Ports: { "5432/tcp": [{ HostIp: ip, HostPort: "54322" }] },
    },
  };
}
test("effective Docker guard accepts IPv4/IPv6 loopback and rejects wildcard/LAN", () => {
  for (const address of ["127.0.0.1", "::1"])
    validateBindings(container(address), "5432/tcp");
  for (const address of ["0.0.0.0", "::", "192.168.1.4", ""])
    assert.throws(() => validateBindings(container(address), "5432/tcp"));
  const stopped = container();
  stopped.State.Running = false;
  assert.throws(() => validateBindings(stopped, "5432/tcp"));
  const unmapped = container();
  unmapped.NetworkSettings.Ports = {};
  assert.throws(() => validateBindings(unmapped, "5432/tcp"));
  const unhealthy = container();
  unhealthy.State.Health.Status = "unhealthy";
  assert.throws(() => validateBindings(unhealthy, "5432/tcp"));
});
test("host listener guard rejects absent, disagreeing and wildcard listeners", () => {
  const mappings = container().NetworkSettings.Ports["5432/tcp"];
  validateListeners(
    [{ LocalAddress: "127.0.0.1", LocalPort: 54322 }],
    mappings,
  );
  for (const listeners of [
    [],
    [{ LocalAddress: "::1", LocalPort: 54322 }],
    [{ LocalAddress: "0.0.0.0", LocalPort: 54322 }],
    [
      { LocalAddress: "127.0.0.1", LocalPort: 54322 },
      { LocalAddress: "::", LocalPort: 54321 },
    ],
  ])
    assert.throws(() => validateListeners(listeners, mappings));
});
