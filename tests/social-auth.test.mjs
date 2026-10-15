import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("social sign-in uses the secure callback for Google and Apple", async () => {
  const login = await readFile(path.join(root, "src/app/entrar/page.tsx"), "utf8");

  assert.match(login, /type OAuthProvider = "google" \| "apple"/);
  assert.match(login, /supabase\.auth\.signInWithOAuth\(/);
  assert.match(login, /redirectTo: buildAuthCallbackUrl\(window\.location\.origin, getNextPath\(\)\)/);
  assert.match(login, /handleOAuthSignIn\("google"\)/);
  assert.match(login, /handleOAuthSignIn\("apple"\)/);
  assert.match(login, /Continuar com Google/);
  assert.match(login, /Continuar com Apple/);
});
