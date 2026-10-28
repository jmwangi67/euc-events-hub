import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { privateExamPreviewAllowed } from "./preview-policy";
import { localExamPath } from "./local-files";
import { auditExamBuild } from "./build-audit";
import { syntheticExamImport } from "../../data/fixtures/exam-import";

const env = { NODE_ENV: "development", EUC_PRIVATE_EXAM_PREVIEW: "1" };
const request = (fields: Record<string, string | undefined> = {}) => {
  const headers = new Headers({ host: "127.0.0.1:3001" });
  for (const [name, value] of Object.entries(fields))
    if (value !== undefined) headers.set(name, value);
  return headers;
};
describe("private development review authorization", () => {
  it.each([
    {},
    { NODE_ENV: "development" },
    { NODE_ENV: "test", EUC_PRIVATE_EXAM_PREVIEW: "1" },
    { NODE_ENV: "production", EUC_PRIVATE_EXAM_PREVIEW: "1" },
    { NODE_ENV: "development", EUC_PRIVATE_EXAM_PREVIEW: "true" },
  ])("refuses default, test or production configuration", (settings) =>
    expect(privateExamPreviewAllowed(settings, request())).toBe(false),
  );
  it.each(["localhost:3000", "127.0.0.1:3001", "[::1]:3001"])(
    "permits an explicitly enabled loopback request: %s",
    (host) =>
      expect(privateExamPreviewAllowed(env, request({ host }))).toBe(true),
  );
  it.each([
    { host: "preview.example.test" },
    { host: "localhost.evil.test" },
    { host: "broken[host" },
    { origin: "https://remote.example.test" },
    { "x-forwarded-for": "192.0.2.7" },
    { "x-forwarded-host": "public.example.test" },
  ])("refuses remote or proxied review requests", (fields) =>
    expect(privateExamPreviewAllowed(env, request(fields))).toBe(false),
  );
  it("accepts local development forwarding without authorizing production", () => {
    const headers = request({
      "x-forwarded-for": "::ffff:127.0.0.1",
      "x-forwarded-host": "localhost:3001",
      origin: "http://localhost:3001",
    });
    expect(privateExamPreviewAllowed(env, headers)).toBe(true);
    expect(
      privateExamPreviewAllowed({ ...env, NODE_ENV: "production" }, headers),
    ).toBe(false);
  });
});

const temporary: string[] = [];
async function directory() {
  const root = await mkdtemp(path.join(os.tmpdir(), "euc-invented-exams-"));
  temporary.push(root);
  return root;
}
afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});
describe("private file boundaries and artifact audit", () => {
  it("allows only local exam storage and refuses lexical path escapes", async () => {
    const root = await directory();
    await mkdir(path.join(root, "data/local/exams"), { recursive: true });
    const file = path.join(root, "data/local/exams/invented.json");
    await writeFile(file, "{}");
    expect(await localExamPath(file, false, root)).toBe(file);
    await expect(
      localExamPath("data/fixtures/exams.json", true, root),
    ).rejects.toThrow(/gitignored/);
    await expect(
      localExamPath("data/local/exams/../../outside.json", true, root),
    ).rejects.toThrow(/gitignored/);
  });
  it("does not follow input/output directory symlinks outside private storage", async () => {
    const root = await directory(),
      outside = await directory();
    await mkdir(path.join(root, "data/local/exams"), { recursive: true });
    await writeFile(path.join(outside, "invented.json"), "{}");
    await symlink(
      outside,
      path.join(root, "data/local/exams/redirect"),
      "junction",
    );
    await expect(
      localExamPath("data/local/exams/redirect/invented.json", false, root),
    ).rejects.toThrow(/symlink/);
    await expect(
      localExamPath("data/local/exams/redirect/output.json", true, root),
    ).rejects.toThrow(/symlink/);
  });
  it("rejects redirecting the private storage root itself", async () => {
    const root = await directory(),
      outside = await directory();
    await mkdir(path.join(root, "data/local"), { recursive: true });
    await symlink(outside, path.join(root, "data/local/exams"), "junction");
    await expect(
      localExamPath("data/local/exams/new.json", true, root),
    ).rejects.toThrow(/storage itself/);
  });
  it("detects invented restricted identity markers in build bytes without reporting their values", async () => {
    const root = await directory(),
      dataset = syntheticExamImport();
    await writeFile(
      path.join(root, "safe.js"),
      "export const unrelated = true;",
    );
    expect(await auditExamBuild(dataset, root)).toMatchObject({
      filesScanned: 1,
      violatingFiles: 0,
    });
    await writeFile(
      path.join(root, "unsafe.bin"),
      Buffer.from(dataset.exams[0].id),
    );
    expect(await auditExamBuild(dataset, root)).toMatchObject({
      filesScanned: 2,
      violatingFiles: 1,
    });
  });
  it("detects file-tracing references that could copy private source files into a deployment", async () => {
    const root = await directory();
    await writeFile(
      path.join(root, "route.nft.json"),
      JSON.stringify({ files: ["../data/local/exams/invented.json"] }),
    );
    expect(
      (await auditExamBuild(syntheticExamImport(), root)).violatingFiles,
    ).toBe(1);
  });
});
