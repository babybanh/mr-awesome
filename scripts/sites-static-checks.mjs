import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, "dist");
const sourceRoots = [
  path.join(repoRoot, "index.html"),
  path.join(repoRoot, "src"),
];
const textExtensions = new Set([".css", ".html", ".js", ".json", ".svg", ".txt"]);
const sourceExtensions = new Set([".css", ".html", ".ts"]);
const assetPattern = /["'`](\/assets\/[^"'`)>\s?#]+)(?:[?#][^"'`)>\s]*)?["'`]/g;
const forbiddenBuiltText = [/vercel\.app/i, /\bvercel\b/i];

async function walkFiles(entry, extensions) {
  const entryStat = await stat(entry);
  if (entryStat.isFile()) {
    return extensions.has(path.extname(entry)) ? [entry] : [];
  }

  const files = [];
  const children = await readdir(entry, { withFileTypes: true });
  for (const child of children) {
    if (child.name === "node_modules" || child.name === "dist") continue;
    const childPath = path.join(entry, child.name);
    if (child.isDirectory()) {
      files.push(...await walkFiles(childPath, extensions));
    } else if (child.isFile() && extensions.has(path.extname(child.name))) {
      files.push(childPath);
    }
  }
  return files;
}

async function collectAssetReferences() {
  const files = [];
  for (const sourceRoot of sourceRoots) {
    files.push(...await walkFiles(sourceRoot, sourceExtensions));
  }

  const references = new Set();
  for (const file of files) {
    const contents = await readFile(file, "utf8");
    for (const match of contents.matchAll(assetPattern)) {
      references.add(match[1]);
    }
  }
  return [...references].sort();
}

async function assertBuiltFilesDoNotReferenceVercel() {
  const files = await walkFiles(distDir, textExtensions);
  const offenders = [];

  for (const file of files) {
    const contents = await readFile(file, "utf8");
    for (const pattern of forbiddenBuiltText) {
      if (pattern.test(contents)) {
        offenders.push(path.relative(repoRoot, file));
        break;
      }
    }
  }

  if (offenders.length > 0) {
    throw new Error(`Built files reference Vercel: ${offenders.join(", ")}`);
  }
}

function assertDistAssetExists(assetPath) {
  const resolved = path.join(distDir, assetPath.slice(1));
  if (!existsSync(resolved)) {
    throw new Error(`Missing built asset for ${assetPath}: ${path.relative(repoRoot, resolved)}`);
  }
}

async function main() {
  if (!existsSync(path.join(distDir, "index.html"))) {
    throw new Error("dist/index.html is missing. Run npm run build first.");
  }

  const references = await collectAssetReferences();
  for (const reference of references) {
    assertDistAssetExists(reference);
  }
  await assertBuiltFilesDoNotReferenceVercel();

  console.log(`ok: dist/index.html exists`);
  console.log(`ok: ${references.length} hard-coded /assets references exist in dist`);
  console.log("ok: built HTML, JS, CSS, JSON, SVG, and text files do not reference Vercel");
  console.log("sites static checks passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
