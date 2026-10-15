import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("passkeys are enabled consistently across browser auth, login, account, and Supabase config", async () => {
  const [browserClient, login, settings, config] = await Promise.all([
    source("src/lib/supabase/browser.ts"),
    source("src/app/entrar/page.tsx"),
    source("src/components/PasskeySettingsCard.tsx"),
    source("supabase/config.toml"),
  ]);

  assert.match(browserClient, /experimental:\s*\{\s*passkey:\s*true\s*\}/);
  assert.match(login, /supabase\.auth\.signInWithPasskey\(\)/);
  assert.match(login, /Entrar com chave de acesso/);
  assert.match(settings, /supabase\.auth\.registerPasskey\(\)/);
  assert.match(config, /\[auth\.passkey\]\s*\n\s*enabled\s*=\s*true/);
  assert.match(config, /rp_id\s*=\s*"palavrasdouniverso\.com"/);
  assert.match(config, /https:\/\/palavrasdouniverso\.com/);
});
