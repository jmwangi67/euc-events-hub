import { mkdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

/** Local tooling only. Resolve symlinks and prevent source/output paths escaping private storage. */
export async function localExamPath(
  candidate: string,
  writing = false,
  root = process.cwd(),
) {
  const privateRoot = path.resolve(root, "data/local/exams");
  const target = path.resolve(root, candidate);
  const inside = (base: string, file: string) =>
    file.startsWith(base + path.sep);
  if (!inside(privateRoot, target))
    throw new Error("Exam files must be under gitignored data/local/exams/.");
  await mkdir(privateRoot, { recursive: true });
  // These paths belong only to guarded local review/CLI operations. They must
  // never cause the bundler to copy project/private files into a deployment.
  const realRoot = await realpath(/* turbopackIgnore: true */ privateRoot);
  if (
    path.relative(
      await realpath(/* turbopackIgnore: true */ root),
      realRoot,
    ) !== path.join("data", "local", "exams")
  )
    throw new Error(
      "Private storage itself must not be redirected through symlinks.",
    );
  let ancestor = target;
  while (true) {
    try {
      await stat(/* turbopackIgnore: true */ ancestor);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor)
        throw new Error("Private file parent is unavailable.");
      ancestor = parent;
    }
  }
  const resolvedAncestor = await realpath(/* turbopackIgnore: true */ ancestor);
  if (resolvedAncestor !== realRoot && !inside(realRoot, resolvedAncestor))
    throw new Error("Private exam paths must not escape through symlinks.");
  if (writing) {
    await mkdir(path.dirname(target), { recursive: true });
    const realParent = await realpath(
      /* turbopackIgnore: true */ path.dirname(target),
    );
    if (realParent !== realRoot && !inside(realRoot, realParent))
      throw new Error("Output parent escapes private storage.");
  } else if (!(await stat(/* turbopackIgnore: true */ target)).isFile())
    throw new Error("Exam input must be a regular file.");
  return target;
}
