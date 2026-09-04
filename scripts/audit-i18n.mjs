#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const translationsPath = path.join(srcRoot, "lib/i18n/translations.ts");

const source = fs.readFileSync(translationsPath, "utf8");
const translationKeys = new Set(
  [...source.matchAll(/^\s+"((?:[^"\\]|\\.)+)":/gm)].map((match) =>
    match[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
  )
);

const ignorePathFragments = [
  "/app/api/",
  // These routes/components are intentionally localized through a complete
  // locale copy object or are owner-only operational surfaces, not catalog UI.
  "/app/clareza-urgente/page.tsx",
  "/components/admin/",
  "/components/marketing/ClarezaUrgenteCampaign.tsx",
  "/lib/i18n/translations.ts",
  "/lib/i18n/oracle.ts",
  "/lib/tarot/fallback.ts",
  "/components/FeedbackDialog.tsx",
  "/components/LumeGuide.tsx",
  "/lib/lume/",
];

const translatablePropertyNames = new Set([
  "alt",
  "archetype",
  "bestFor",
  "bio",
  "body",
  "cadence",
  "category",
  "cta",
  "description",
  "headline",
  "hint",
  "intro",
  "label",
  "notFor",
  "placeholder",
  "priceSummary",
  "promise",
  "responseTime",
  "text",
  "title",
  "transformation",
  "visualAlt",
]);

const translatableArrayPropertyNames = new Set([
  "features",
  "languages",
  "modalities",
  "sections",
  "specialties",
]);

const visibleAttributeNames = new Set([
  "aria-label",
  "placeholder",
  "title",
]);

const allowedLiteralValues = new Set([
  "Palavras do Universo",
  "Lume",
  "PT",
  "EN",
  "ID",
  "CVV",
]);

const reports = [];

function report(kind, file, node, message) {
  const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(
    node.getStart()
  );
  reports.push({
    kind,
    file: path.relative(root, file),
    line: line + 1,
    column: character + 1,
    message,
  });
}

function isMeaningfulText(value) {
  const text = normalizeText(value);
  if (!text) return false;
  if (allowedLiteralValues.has(text)) return false;
  if (/^https?:\/\/|^\/[a-z0-9-]+\/?$/i.test(text)) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return false;
  if (/^—?\s*R\$\s*[\d.,]+(?:\/mês)?$/i.test(text)) return false;
  if (/^\d+\s*,\s*CVV$/i.test(text)) return false;
  if (/^[A-Z0-9_-]{3,}$/.test(text)) return false;
  if (/^[\d\s.,:;!?()[\]#/@+–—-]+$/.test(text)) return false;
  return /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(text);
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getStringValue(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  return null;
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return null;
}

function hasTranslation(value) {
  if (!isMeaningfulText(value)) return true;
  return translationKeys.has(normalizeText(value));
}

function hasI18nIgnoreAncestor(node) {
  let current = node.parent;
  while (current) {
    if (ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) {
      const opening = ts.isJsxElement(current) ? current.openingElement : current;
      const attrs = opening.attributes.properties;
      if (
        attrs.some(
          (attr) =>
            ts.isJsxAttribute(attr) &&
            attr.name.getText(current.getSourceFile()) === "data-i18n-ignore"
        )
      ) {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
}

function isInTranslatedExpression(node) {
  let current = node.parent;
  while (current) {
    if (
      ts.isCallExpression(current) &&
      ts.isIdentifier(current.expression) &&
      current.expression.text === "t"
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function isInLocaleConditional(node) {
  let current = node.parent;
  while (current) {
    if (
      ts.isConditionalExpression(current) &&
      /locale|isEn|isEnglish/.test(current.condition.getText(current.getSourceFile()))
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function isInMetadataDeclaration(node) {
  let current = node.parent;
  while (current) {
    if (
      ts.isVariableDeclaration(current) &&
      ts.isIdentifier(current.name) &&
      current.name.text === "metadata"
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function shouldSkipFile(file) {
  const normalized = file.split(path.sep).join("/");
  return ignorePathFragments.some((fragment) => normalized.endsWith(fragment) || normalized.includes(fragment));
}

function auditFile(file) {
  if (shouldSkipFile(file)) return;

  const text = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "t" &&
      node.arguments.length > 0
    ) {
      const value = getStringValue(node.arguments[0]);
      if (value && !hasTranslation(value)) {
        report("missing-t-key", file, node.arguments[0], `Missing EN translation for t("${normalizeText(value)}")`);
      }
    }

    if (ts.isJsxText(node)) {
      const value = normalizeText(node.getText(sourceFile));
      if (
        isMeaningfulText(value) &&
        !hasI18nIgnoreAncestor(node) &&
        !isInLocaleConditional(node) &&
        !hasTranslation(value)
      ) {
        report("hardcoded-jsx-text", file, node, `Visible JSX text is not translated: "${value}"`);
      }
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (
        visibleAttributeNames.has(name) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer) &&
        isMeaningfulText(node.initializer.text) &&
        !hasI18nIgnoreAncestor(node) &&
        !hasTranslation(node.initializer.text)
      ) {
        report("hardcoded-attribute", file, node.initializer, `Visible attribute ${name} is not translated: "${normalizeText(node.initializer.text)}"`);
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const key = propertyNameText(node.name);
      const value = getStringValue(node.initializer);
      if (
        key &&
        translatablePropertyNames.has(key) &&
        value &&
        !isInMetadataDeclaration(node) &&
        !isInTranslatedExpression(node.initializer) &&
        !isInLocaleConditional(node.initializer) &&
        !hasTranslation(value)
      ) {
        report("missing-catalog-key", file, node.initializer, `Translatable property "${key}" has no EN translation: "${normalizeText(value)}"`);
      }

      if (
        key &&
        translatableArrayPropertyNames.has(key) &&
        !isInMetadataDeclaration(node) &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        for (const element of node.initializer.elements) {
          const arrayValue = getStringValue(element);
          if (
            arrayValue &&
            !isInLocaleConditional(element) &&
            !hasTranslation(arrayValue)
          ) {
            report("missing-array-key", file, element, `Translatable array "${key}" has no EN translation: "${normalizeText(arrayValue)}"`);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "node_modules") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) auditFile(fullPath);
  }
}

walk(srcRoot);

const dailyMessageRoutePath = path.join(srcRoot, "app/api/daily-message/route.ts");
const dailyMessageRoute = fs.readFileSync(dailyMessageRoutePath, "utf8");
if (
  dailyMessageRoute.includes("today: day") ||
  !dailyMessageRoute.includes("today: localizeZonedDay(day, locale)")
) {
  reports.push({
    kind: "api-locale-leak",
    file: path.relative(root, dailyMessageRoutePath),
    line: 1,
    column: 1,
    message: "Daily message API must localize today.label before returning it.",
  });
}

reports.sort((a, b) => `${a.file}:${a.line}:${a.column}`.localeCompare(`${b.file}:${b.line}:${b.column}`));

if (reports.length) {
  console.error(`i18n audit failed with ${reports.length} issue(s):`);
  for (const item of reports) {
    console.error(`${item.file}:${item.line}:${item.column} [${item.kind}] ${item.message}`);
  }
  process.exit(1);
}

console.log("i18n audit passed: translated keys, visible JSX text, attributes, and known catalogs are covered.");
