import { supabase } from "./supabaseClient";

/**
 * Everything the roster app needs to persist (team members, conditions,
 * monthly overrides, the adhoc/audit log) is stored as JSON blobs in a
 * single `kv_store` table: { key text primary key, value jsonb, updated_at }.
 *
 * This keeps the backend dead simple (one table, no migrations as the app
 * evolves) while still giving every team member a shared, synced view of
 * the roster from any device/browser.
 *
 * If Supabase isn't configured (no .env values), all functions silently
 * no-op / return null so the app keeps working with local-only state.
 */

const TEAM_MEMBERS_KEY = "team_members";
const CONDITIONS_KEY = "conditions";
const monthKey = (year, month, suffix) => `${suffix}_${year}_${String(month).padStart(2, "0")}`;

export const isBackendConfigured = () => !!supabase;

async function kvGet(key) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("kv_store")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error(`[store] failed to load "${key}"`, error);
    return null;
  }
  return data ? data.value : null;
}

async function kvSet(key, value) {
  if (!supabase) return;
  const { error } = await supabase
    .from("kv_store")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) console.error(`[store] failed to save "${key}"`, error);
}

// ---- Team members ----
export const loadTeamMembers = () => kvGet(TEAM_MEMBERS_KEY);
export const saveTeamMembers = (members) => kvSet(TEAM_MEMBERS_KEY, members);

// ---- Conditions (scheduling rules) ----
export const loadConditions = () => kvGet(CONDITIONS_KEY);
export const saveConditions = (conditions) => kvSet(CONDITIONS_KEY, conditions);

// ---- Per-month manual overrides + adhoc log ----
export async function loadMonthData(year, month) {
  const [overrides, adhocList] = await Promise.all([
    kvGet(monthKey(year, month, "overrides")),
    kvGet(monthKey(year, month, "adhoc")),
  ]);
  return {
    overrides: overrides || {},
    adhocList: adhocList || [],
  };
}

export const saveMonthOverrides = (year, month, overrides) =>
  kvSet(monthKey(year, month, "overrides"), overrides);

export const saveMonthAdhocList = (year, month, adhocList) =>
  kvSet(monthKey(year, month, "adhoc"), adhocList);

// ---- Audit log of PIN changes / logins (optional, append-only) ----
export async function logAuditEvent(event) {
  if (!supabase) return;
  const { error } = await supabase.from("audit_log").insert({
    event_type: event.type,
    member_name: event.memberName || null,
    detail: event.detail || null,
  });
  if (error) console.error("[store] failed to write audit_log", error);
}
