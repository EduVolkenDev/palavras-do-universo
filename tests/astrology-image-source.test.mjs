import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("astrology image source resolver rejects missing and blank assets", async () => {
  const implementation = await source("src/lib/astrology/image-source.ts");

  assert.match(implementation, /typeof source !== "string"/);
  assert.match(implementation, /normalized\.length > 0 \? normalized : null/);
});

test("astrology map components route artwork through the guarded image", async () => {
  const components = [
    "AstrologyBirthProfileCard.tsx",
    "AstrologyChartExperience.tsx",
    "AstrologyDailyLume.tsx",
    "AstrologyDailySky.tsx",
  ];

  for (const component of components) {
    const implementation = await source(`src/components/astrology/${component}`);
    assert.match(implementation, /import Image from "\.\/AstrologyImage"/);
    assert.doesNotMatch(implementation, /from "next\/image"/);
  }

  const guardedImage = await source("src/components/astrology/AstrologyImage.tsx");
  assert.match(guardedImage, /if \(!safeSource\) return null/);
  assert.match(guardedImage, /<Image \{\.\.\.props\} src=\{safeSource\} alt=\{alt\} \/>/);
});
