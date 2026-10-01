#!/usr/bin/env node
/**
 * cleanup-duplicate-entitlements.mjs
 *
 * Reports (and optionally merges) duplicate purchase entitlements in
 * public.user_entitlements -- rows sharing (user_id, product_key,
 * source='purchase'). Duplicates are the footprint of the webhook x
 * /api/checkout/confirm race fixed by
 * supabase/migrations/20260926070000_purchase_entitlement_race_fix.sql.
 *
 * DEFAULT MODE IS DRY-RUN: nothing is written. Pass --apply to merge the
 * groups that are provably race artifacts (every duplicate row carries the
 * SAME checkout_session_id in metadata). Ambiguous groups (rows disagreeing
 * on checkout_session_id, or missing it) are NEVER merged automatically --
 * they are reported for manual review.
 *
 * Usage:
 *   node scripts/cleanup-duplicate-entitlements.mjs            # dry-run report
 *   node scripts/cleanup-duplicate-entitlements.mjs --apply    # merge safe groups
 *
 * Env (via .env.local or environment):
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

function loadDotenv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
}

loadDotenv(".env.local");

const APPLY = process.argv.includes("--apply");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing Supabase credentials: set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(2);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function sessionOf(row) {
  const md = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return typeof md.checkout_session_id === "string" ? md.checkout_session_id : null;
}

const { data: rows, error } = await admin
  .from("user_entitlements")
  .select("id,user_id,product_key,source,status,usage_limit,usage_count,consumed_at,created_at,metadata")
  .eq("source", "purchase")
  .order("created_at", { ascending: true });

if (error) {
  console.error("Could not read user_entitlements:", error.message);
  process.exit(1);
}

const groups = new Map();
for (const row of rows ?? []) {
  const key = `${row.user_id}::${row.product_key}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

let dupGroups = 0;
let safeGroups = 0;
let ambiguousGroups = 0;

for (const [key, members] of groups) {
  if (members.length < 2) continue;
  dupGroups++;

  const sessions = new Set(members.map(sessionOf));
  const onlySession = sessions.size === 1 ? [...sessions][0] : null;
  const provable = onlySession !== null;

  console.log(`\n--- duplicate group: ${key} (${members.length} rows)`);
  for (const m of members) {
    console.log(
      `  id=${m.id} status=${m.status} usage_limit=${m.usage_limit} usage_count=${m.usage_count} ` +
        `created_at=${m.created_at} session=${sessionOf(m) ?? "(missing)"}`
    );
  }

  if (!provable) {
    ambiguousGroups++;
    console.log("  => AMBIGUOUS: rows disagree on (or lack) checkout_session_id. Manual review required; NOT merged.");
    continue;
  }

  safeGroups++;
  // Keep the richest row (highest usage_limit, tie -> oldest), mirroring the migration.
  const sorted = [...members].sort(
    (a, b) => (b.usage_limit ?? 0) - (a.usage_limit ?? 0) ||
      new Date(a.created_at) - new Date(b.created_at)
  );
  const keep = sorted[0];
  const drop = sorted.slice(1);
  console.log(`  => SAFE race artifact (session ${sessionOf(keep)}). Would keep ${keep.id}, delete ${drop.length} row(s).`);

  if (APPLY) {
    // Mirror the migration's merge semantics: never resurrect a consumed use.
    // Update the kept row BEFORE deleting the others: if the delete fails,
    // the group still looks like a duplicate on rerun; if we deleted first,
    // a failed update would leave a silently under-counted single row.
    const maxCount = Math.max(...members.map((m) => m.usage_count ?? 0));
    const limit = keep.usage_limit ?? 0;
    const memberConsumedAt = members
      .map((m) => m.consumed_at)
      .filter((v) => typeof v === "string" && v.length > 0)
      .sort()[0];
    const { error: updError } = await admin
      .from("user_entitlements")
      .update({
        usage_count: maxCount,
        consumed_at:
          maxCount >= limit && limit > 0
            ? keep.consumed_at ?? memberConsumedAt ?? new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", keep.id);
    if (updError) {
      console.error(`  !! failed to reconcile kept row ${keep.id}: ${updError.message}`);
      process.exit(1);
    }
    const { error: delError } = await admin
      .from("user_entitlements")
      .delete()
      .in("id", drop.map((d) => d.id));
    if (delError) {
      console.error(`  !! failed to merge group ${key}: ${delError.message}`);
      process.exit(1);
    }
    console.log(`  => merged (kept ${keep.id} with usage_count=${maxCount}).`);
  }
}

console.log(`\nSummary: ${dupGroups} duplicate group(s) | ${safeGroups} safe to merge | ${ambiguousGroups} ambiguous.`);
if (!APPLY) {
  console.log("Dry-run only: nothing was written. Re-run with --apply to merge the safe groups.");
} else {
  console.log("Apply mode: safe groups merged. Ambiguous groups (if any) were left untouched.");
}
