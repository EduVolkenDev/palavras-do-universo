import { access, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const visualStates = [
  "welcome",
  "guide",
  "listening",
  "reflective",
  "oracle",
  "care",
  "invite",
  "grounding",
];

const assets = visualStates.map((state) =>
  path.join(projectRoot, "public", "assets", `lume-${state}.webp`)
);

const failures = [];

for (const asset of assets) {
  try {
    await access(asset);
    const details = await stat(asset);
    if (!details.isFile() || details.size === 0) {
      failures.push(`${path.relative(projectRoot, asset)} is empty or not a file`);
    }
  } catch {
    failures.push(`${path.relative(projectRoot, asset)} is missing`);
  }
}

if (failures.length) {
  console.error("Lume asset validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${assets.length} Lume visual assets.`);
}
