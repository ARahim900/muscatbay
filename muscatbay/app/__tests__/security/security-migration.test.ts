import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
    resolve(process.cwd(), "sql/migrations/20260901_invitation_only_security_and_rls.sql"),
    "utf8",
);

describe("invitation-only RLS migration", () => {
    it("contains a server-side identity hook with no client grant", () => {
        expect(migration).toContain("function public.mb_before_user_created(event jsonb)");
        expect(migration).toContain("to supabase_auth_admin");
        expect(migration).toContain("from public, anon, authenticated");
        expect(migration).not.toMatch(/grant execute on function public\.mb_before_user_created\(jsonb\) to authenticated/i);
        expect(migration).toContain("raise exception 'Dashboard access is invitation only'");
        expect(migration).toContain("invitation_row.role");
        expect(migration).toContain("invitation_row.module_scope");
    });

    it("creates explicit policies without an authenticated FOR ALL policy", () => {
        expect(migration).toContain("create policy mb_select");
        expect(migration).toContain("create policy mb_insert");
        expect(migration).toContain("create policy mb_update");
        expect(migration).toContain("create policy mb_delete");
        expect(migration).not.toMatch(/create policy[^;]+for all to authenticated/is);
    });

    it.each([
        "water_daily_consumption",
        "electricity_readings",
        "stp_operations",
        "master_assets_register",
        "contractor_contracts",
        "fire_safety_equipment",
        "ge_ppm_findings",
        "operational_alert_incidents",
    ])("includes the app relation %s in the reviewed inventory", (table) => {
        expect(migration).toContain(`('${table}',`);
    });

    it("fails closed for unlisted tables, foreign tables and definer RPCs", () => {
        expect(migration).toContain("mb_security_inventory");
        expect(migration).toContain("revoke all on table public.%I from public, anon, authenticated");
        expect(migration).toContain("relation.relkind = 'f'");
        expect(migration).toContain("revoke execute on function %s from public, anon, authenticated");
    });

    it("keeps server-owned alert incidents read-only for browser roles", () => {
        expect(migration).toContain("relation_row.access_class = 'operational'");
        expect(migration).toContain("revoke insert, update, delete on table public.%I from authenticated");
    });

    it("enforces the approved Google Drive contract-link shape at the database boundary", () => {
        expect(migration).toContain("contractor_contract_pdf_url_approved");
        expect(migration).toContain("^https://drive[.]google[.]com/file/d/");
    });

    it("scopes contractor reads through the profile module assignment", () => {
        expect(migration).toContain("function public.mb_can_read_module(requested_module text)");
        expect(migration).toContain("p.module_scope ? requested_module");
        expect(migration).toContain("public.mb_can_read_module(%L)");
    });

    it("denies identities that do not have an explicit profile role", () => {
        expect(migration).toMatch(/function public\.mb_current_user_role\(\)[\s\S]*select p\.role[\s\S]*where p\.id = \(select auth\.uid\(\)\)/);
        expect(migration).not.toMatch(/coalesce\([\s\S]{0,160}'viewer'/i);
        expect(migration).toContain("public.mb_current_user_role() is distinct from 'admin'");
    });

    it("pins every newly defined security-definer function search path", () => {
        const definitions = [...migration.matchAll(/create or replace function public\.(mb_[a-z_]+|handle_new_user)[\s\S]*?\$function\$;/g)];
        expect(definitions.length).toBeGreaterThanOrEqual(5);
        for (const definition of definitions) {
            expect(definition[0]).toContain("set search_path = ''");
        }
    });
});
