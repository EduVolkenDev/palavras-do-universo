import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const sourceDir = "/Users/eduardovolken_1/Downloads/lynxes-webp";
const organizedDir = join(sourceDir, "_organized");
const appTargetDir = join(process.cwd(), "public", "assets");

const selected = [
  ["olouco2.webp", "major-00-the-fool.webp", "dark ornate version; stronger brand fit than the pale variant"],
  ["OMAGO3.webp", "major-01-the-magician.webp", "highest-impact night/cosmic magician"],
  ["ASACERDOTISA.webp", "major-02-the-high-priestess.webp", "single available priestess; matches dark oracle tone"],
  ["III-AIMOERATRIZ.webp", "major-03-the-empress.webp", "prettier celestial/pearl version; better brand fit"],
  ["OIMPERADOR.webp", "major-04-the-emperor.webp", "best authority/sovereignty composition"],
  ["VI-OHIEROFANTE.webp", "major-05-the-hierophant.webp", "single available hierophant"],
  ["AMORES-AMANTES1.webp", "major-06-the-lovers.webp", "full dramatic blue lovers version"],
  ["OCARRO3.webp", "major-07-the-chariot.webp", "best motion/energy and strongest frame"],
  ["XI-AFORÇA.webp", "major-08-strength.webp", "canonical strength title; better than custom Luta variants"],
  ["OERMITAO.webp", "major-09-the-hermit.webp", "best dark premium hermit"],
  ["ARODADAFORTUNA.webp", "major-10-wheel-of-fortune.webp", "single available wheel"],
  ["AJUSTIÇA.webp", "major-11-justice.webp", "best justice: balanced, dark, ceremonial"],
  ["OENFORCADO.webp", "major-12-the-hanged-man.webp", "single available hanged man"],
  ["AMORTE2.webp", "major-13-death.webp", "more mature and less game-card-like than purple variant"],
  ["ATEMPERANÇA.webp", "major-14-temperance.webp", "single available temperance"],
  ["ODIABO.webp", "major-15-the-devil.webp", "more symbolic and less cliché than red devil variant"],
  ["ATORRE.webp", "major-16-the-tower.webp", "best tower: dramatic, premium, aligned"],
  ["AESTRELA.webp", "major-17-the-star.webp", "single available star"],
  ["ALUA2.webp", "major-18-the-moon.webp", "best moon: readable, dark, polished"],
  ["OSOL.webp", "major-19-the-sun.webp", "single available sun"],
  ["OJULGAMENTO.webp", "major-20-judgement.webp", "single available judgement"],
  ["OMUNDO.webp", "major-21-the-world.webp", "single available world"],
  ["ASDEPAUS.webp", "wands-ace.webp", "wands suit"],
  ["2DEPAUS.webp", "wands-two.webp", "wands suit"],
  ["3DEPAUS.webp", "wands-three.webp", "wands suit"],
  ["4DEPAUS.webp", "wands-four.webp", "wands suit"],
  ["5DEPAUS.webp", "wands-five.webp", "wands suit"],
  ["6DEPAUS.webp", "wands-six.webp", "wands suit"],
  ["7DEPAUS.webp", "wands-seven.webp", "wands suit"],
  ["8DEPAUS.webp", "wands-eight.webp", "wands suit"],
  ["9DEPAUS.webp", "wands-nine.webp", "wands suit"],
  ["10DEPAUS.webp", "wands-ten.webp", "wands suit"],
  ["PAJEMDEPAUS.webp", "wands-page.webp", "wands court"],
  ["CAVALEIRODEPAUS.webp", "wands-knight.webp", "wands court"],
  ["RAINHADEPAUS.webp", "wands-queen.webp", "wands court"],
  ["REIDEPAUS.webp", "wands-king.webp", "wands court"],
];

const alternates = [
  ["olouco1.webp", "major-00-the-fool-alt-light.webp"],
  ["OMAGO.webp", "major-01-the-magician-alt-green.webp"],
  ["III-AIMPERATRIZ.webp", "major-03-the-empress-alt-green.webp"],
  ["IV-OIMPERADOR.webp", "major-04-the-emperor-alt-narrow.webp"],
  ["IV-OIMPERADOR copy.webp", "major-04-the-emperor-alt-narrow-2.webp"],
  ["AMORES-AMANTES.webp", "major-06-the-lovers-alt-narrow.webp"],
  ["VII-OCARRO.webp", "major-07-the-chariot-alt-cart.webp"],
  ["VII-OCARRO2.webp", "major-07-the-chariot-alt-brown.webp"],
  ["VIII-AJUSTICA.webp", "major-11-justice-alt-silver.webp"],
  ["ALUA.webp", "major-18-the-moon-alt-narrow.webp"],
  ["XVIII-ALUA.webp", "major-18-the-moon-alt-pearl.webp"],
  ["XIII-AMORTE.webp", "major-13-death-alt-purple.webp"],
  ["XVI-ATORRE.webp", "major-16-the-tower-alt-purple.webp"],
  ["XV-ODIABO.webp", "major-15-the-devil-alt-red.webp"],
  ["HERMITAO.webp", "major-09-the-hermit-alt-green.webp"],
  ["HERMITA02.webp", "major-09-the-hermit-alt-sacred-one.webp"],
];

const customOrOffSystem = [
  ["ALUTA.webp", "custom-a-luta-narrow.webp"],
  ["ALUTA1.webp", "custom-a-luta-blue.webp"],
  ["VIII-AACEITACAO.webp", "custom-a-aceitacao.webp"],
  ["X-ACONSCIENCIA.webp", "custom-a-consciencia.webp"],
  ["XI-ONAOEU.webp", "custom-o-nao-eu.webp"],
  ["XIX-ACRIATIVIDADE.webp", "custom-a-criatividade.webp"],
];

function copySet(entries, folderName) {
  const target = join(organizedDir, folderName);
  mkdirSync(target, { recursive: true });

  return entries.map(([source, destination, note]) => {
    const sourcePath = join(sourceDir, source);
    const organizedPath = join(target, destination);
    copyFileSync(sourcePath, organizedPath);

    return {
      source,
      destination,
      note: note ?? "",
    };
  });
}

mkdirSync(appTargetDir, { recursive: true });
for (const folder of ["selected-canonical", "alternates", "custom-or-off-system"]) {
  rmSync(join(organizedDir, folder), { force: true, recursive: true });
}

const selectedManifest = copySet(selected, "selected-canonical");
for (const [source, destination] of selected) {
  copyFileSync(join(sourceDir, source), join(appTargetDir, destination));
}

const alternateManifest = copySet(alternates, "alternates");
const customManifest = copySet(customOrOffSystem, "custom-or-off-system");

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceDir,
  organizedDir,
  appTargetDir,
  counts: {
    selected: selectedManifest.length,
    alternates: alternateManifest.length,
    customOrOffSystem: customManifest.length,
  },
  selected: selectedManifest,
  alternates: alternateManifest,
  customOrOffSystem: customManifest,
};

writeFileSync(
  join(organizedDir, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

writeFileSync(
  join(organizedDir, "README.md"),
  [
    "# Lynxes Tarot Asset Organization",
    "",
    "Original files were not moved or deleted.",
    "",
    "- `selected-canonical/`: chosen files with app-ready names.",
    "- `alternates/`: duplicate variants kept for review.",
    "- `custom-or-off-system/`: beautiful but not part of the standard 78-card mapping.",
    "",
    `Selected for app: ${selectedManifest.length}`,
    `Alternates: ${alternateManifest.length}`,
    `Custom/off-system: ${customManifest.length}`,
    "",
    "The selected files were also copied into `public/assets`.",
  ].join("\n")
);

console.log(JSON.stringify(manifest.counts, null, 2));
console.log(`Organized folder: ${organizedDir}`);
console.log(`App target: ${appTargetDir}`);
