// Reads image files from src/app/assets and writes a .ts module per file into
// src/app/assets/base64, exporting the image as a base64 data URI. Run before
// dev/build so imports like `../assets/base64/explainImage` are always fresh.
const fs = require("fs");
const path = require("path");

const ASSETS_DIR = path.resolve(__dirname, "../src/app/assets");
const OUT_DIR = path.join(ASSETS_DIR, "base64");

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function toCamelCase(name) {
  const parts = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return parts
    .map((part, i) =>
      i === 0
        ? part[0].toLowerCase() + part.slice(1)
        : part[0].toUpperCase() + part.slice(1)
    )
    .join("");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs
  .readdirSync(ASSETS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .filter((entry) => MIME_TYPES[path.extname(entry.name).toLowerCase()]);

for (const entry of files) {
  const ext = path.extname(entry.name).toLowerCase();
  const mime = MIME_TYPES[ext];
  const varName = toCamelCase(path.basename(entry.name, ext));
  const base64 = fs.readFileSync(path.join(ASSETS_DIR, entry.name)).toString("base64");
  const content = `const ${varName} = "data:${mime};base64,${base64}";\n\nexport default ${varName};\n`;
  fs.writeFileSync(path.join(OUT_DIR, `${varName}.ts`), content);
  console.log(`generated base64 asset: ${varName}.ts`);
}
