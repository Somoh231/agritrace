import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nextDir = path.join(root, ".next");

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

const nftFiles = walk(path.join(nextDir, "server")).filter((p) => p.endsWith(".nft.json"));

let created = 0;
for (const nftPath of nftFiles) {
  let json;
  try {
    json = JSON.parse(fs.readFileSync(nftPath, "utf8"));
  } catch {
    continue;
  }
  const list = Array.isArray(json?.files) ? json.files : [];
  const baseDir = path.dirname(nftPath);

  for (const rel of list) {
    if (typeof rel !== "string") continue;
    if (!rel.endsWith("page_client-reference-manifest.js")) continue;
    const abs = path.resolve(baseDir, rel);
    if (isFile(abs)) continue;

    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(
      abs,
      "globalThis.__RSC_MANIFEST=(globalThis.__RSC_MANIFEST||{});\n",
      "utf8",
    );
    created += 1;
  }
}

if (created) {
  // eslint-disable-next-line no-console
  console.log(`[postbuild] created ${created} missing client reference manifests`);
}

